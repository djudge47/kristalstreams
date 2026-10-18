import { paidOrderSnapshot } from './ks-preview-paid-orders.js';
import { buildPaidPlanMapping } from './ks-roomba-plan-mapping.js';
import { createAdminRoombaHandler } from './ks-roomba-admin.js';
import { createRoombaPreviewHandler } from './ks-roomba-preview.js';
import { runPaidSetupSafetyChecks } from './ks-new-paid-simulation.js';

export function createPreviewNewPaidSetupHandler({ createClient, env = process.env, packagesHandler, now = Date.now } = {}) {
  const options = { auth: { persistSession: false, autoRefreshToken: false } };
  const catalogReader = packagesHandler || createAdminRoombaHandler({ createClient, env, dataKind: 'packages',
    accountHandler: createRoombaPreviewHandler({ env, readAction: 'packages' }) });
  return async function handler(req, res) {
    res.setHeader('Cache-Control', 'private, no-store'); res.setHeader('Vary', 'Authorization');
    if (env.VERCEL_ENV !== 'preview') return res.status(404).json({ error: 'New-customer setup simulation is available in Preview only.' });
    if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return res.status(405).json({ error: 'Live activation is disabled. This route only runs simulations.' }); }
    const token = typeof req.headers?.authorization === 'string' && /^Bearer ([^\s]+)$/i.exec(req.headers.authorization)?.[1];
    if (!token) return res.status(401).json({ error: 'Please sign in to your admin account.' });
    const sessionId = req.query?.sessionId;
    if (typeof sessionId !== 'string' || sessionId.length > 200 || !/^cs_(test_|live_)?[A-Za-z0-9]+$/.test(sessionId)) return res.status(400).json({ error: 'Choose a saved test payment as the plan template.' });
    if (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY || !env.SUPABASE_SERVICE_ROLE_KEY) return res.status(503).json({ error: 'Simulation review is unavailable.' });
    try {
      const auth = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, options);
      const { data, error } = await auth.auth.getUser(token);
      const user = data?.user;
      if (error || !user?.id) return res.status(401).json({ error: 'Please sign in again to your admin account.' });
      if (user.is_anonymous || !user.email_confirmed_at || user.email?.trim().toLowerCase() !== 'djudge47@gmail.com') return res.status(403).json({ error: 'Only the Kristal Streams administrator can use this simulation.' });
      const admin = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, options);
      const { data: rows, error: readError } = await admin.rpc('ks_list_preview_paid_orders');
      if (readError) throw new Error('storage_unavailable');
      const order = paidOrderSnapshot(rows).find(row => row.sessionId === sessionId && row.userId === user.id);
      if (!order) return res.status(409).json({ error: 'Choose a pending sandbox payment owned by your signed-in account. No customer was selected for activation.' });
      let code, body;
      await catalogReader({ method: 'GET', headers: { authorization: `Bearer ${token}` } }, {
        setHeader() {}, status(value) { code = value; return this; }, json(value) { body = value; return this; },
      });
      if (code !== 200 || body?.status !== 'packages_ready' || body.mode !== 'read-only' || body.databaseWrites !== false || body.transport !== 'fixie') {
        if (code === 429) { res.setHeader('Retry-After', '30'); return res.status(429).json({ error: 'Wait briefly before checking the packages again.' }); }
        throw new Error('catalog_unavailable');
      }
      if (!Number.isFinite(Date.parse(body.checkedAt)) || Math.abs(Date.parse(body.checkedAt) - now()) > 65000) throw new Error('stale_catalog');
      const mapping = buildPaidPlanMapping({ schemaVersion: 1, readOnly: true, checkedAt: body.checkedAt, packages: body.packages });
      const entry = mapping.entries.find(row => row.tier === order.tier && row.connections === order.connections);
      const pkg = body.packages.find(row => row.id === entry.provider.id);
      const checks = await runPaidSetupSafetyChecks(entry, pkg);
      return res.status(200).json({ report: { simulationOnly: true, liveExecutionEnabled: false, realProviderWrites: 0, realCreditsSpent: 0,
        databaseWrites: false, realMessagesSent: 0, source: 'saved_test_order_plan_template', existingTrialUnchanged: true,
        plan: { tier: entry.tier, connections: entry.connections, interval: entry.interval, amountCents: entry.customerPriceCents,
          providerMonths: entry.provider.duration.count, expectedProviderCredits: entry.provider.credits, bouquetCount: entry.provider.bouquetIds.length },
        catalogCheckedAt: body.checkedAt, checks,
        liveGate: 'durable_storage_secure_login_handoff_and_separate_spending_approval_required' } });
    } catch {
      return res.status(503).json({ error: 'The new-customer simulation could not be verified. No provider action, CRM change or message was sent.' });
    }
  };
}
