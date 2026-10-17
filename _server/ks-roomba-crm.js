const options = { auth: { persistSession: false, autoRefreshToken: false } };
const slot = 'preview_trial_activation_v1';
const columns = 'slot,admin_id,reseller_id,package_id,username,state,result,updated_at,crm_customer_id,crm_linked_at';
const uuid = value => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

// The receipt and CRM are the only dependencies. This module has no provider transport.
export function trialSnapshot(receipt, customer, now = Date.now()) {
  if (!receipt) return null;
  const result = receipt.result;
  const validDate = value => typeof value === 'string' && Number.isFinite(Date.parse(value));
  if (receipt.state !== 'succeeded') return { status: 'needs_review' };
  if (receipt.package_id !== '1' || !/^[A-Za-z0-9_.-]{3,64}$/.test(receipt.username)
    || result?.username !== receipt.username || result.trial !== true || result.connections !== 1
    || !/^[1-9]\d{0,14}$/.test(String(result.lineId)) || !validDate(result.expiresAt)
    || !validDate(receipt.updated_at)) throw new Error('invalid_receipt');
  const linked = receipt.crm_customer_id !== null && receipt.crm_customer_id !== undefined;
  const match = linked && uuid(receipt.crm_customer_id) && customer?.id === receipt.crm_customer_id
    && String(customer.external_id) === String(result.lineId) && customer.username === receipt.username;
  return {
    status: linked ? match ? 'linked' : 'conflict' : 'unlinked',
    username: receipt.username, lineId: String(result.lineId), packageId: '1', packageName: 'Trial',
    resellerId: /^[1-9]\d{0,14}$/.test(String(receipt.reseller_id ?? '')) ? String(receipt.reseller_id) : null,
    duration: '36 hours', connections: 1, expiresAt: result.expiresAt,
    access: Date.parse(result.expiresAt) <= now ? 'expired' : 'within_trial_period',
    recordedAt: receipt.updated_at,
    customerId: match ? receipt.crm_customer_id : null,
    linkedAt: match && validDate(receipt.crm_linked_at) ? receipt.crm_linked_at : null,
  };
}

export function createRoombaCrmHandler({ createClient, env = process.env, now = Date.now } = {}) {
  return async function handler(req, res) {
    res.setHeader('Cache-Control', 'private, no-store');
    const reply = (code, body) => res.status(code).json(body);
    if (env.VERCEL_ENV !== 'preview') return reply(404, { error: 'This setup link is available in Preview only.' });
    if (!['GET', 'POST'].includes(req.method)) { res.setHeader('Allow', 'GET, POST'); return reply(405, { error: 'Method not allowed.' }); }
    try {
      const token = typeof req.headers?.authorization === 'string' && /^Bearer ([^\s]+)$/i.exec(req.headers.authorization)?.[1];
      if (!token) return reply(401, { error: 'Please sign in to your admin account.' });
      if (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY || !env.SUPABASE_SERVICE_ROLE_KEY) return reply(503, { error: 'CRM setup verification is unavailable.' });
      const auth = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, options);
      const { data, error } = await auth.auth.getUser(token);
      const user = data?.user;
      if (error || !user?.id) return reply(401, { error: 'Please sign in again to your admin account.' });
      if (user.is_anonymous || !user.email_confirmed_at || user.email?.trim().toLowerCase() !== 'djudge47@gmail.com') return reply(403, { error: 'Only the Kristal Streams administrator can use this setup link.' });
      const admin = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, options);
      const load = async () => {
        const { data: receipt, error: readError } = await admin.from('ks_roomba_trial_attempts').select(columns).eq('slot', slot).maybeSingle();
        if (readError) throw new Error('storage_unavailable');
        if (receipt && receipt.admin_id !== user.id) return { forbidden: true };
        let customer = null;
        if (receipt?.crm_customer_id) {
          const { data: row, error: customerError } = await admin.from('iptv_customers')
            .select('id,external_id,username').eq('id', receipt.crm_customer_id).maybeSingle();
          if (customerError) throw new Error('storage_unavailable');
          customer = row;
        }
        return { snapshot: trialSnapshot(receipt, customer, now()) };
      };
      const current = await load();
      if (current.forbidden) return reply(403, { error: 'This setup belongs to another administrator.' });
      if (req.method === 'GET') return reply(200, { setup: current.snapshot, trialCreationEnabled: env.ROOMBA_TRIAL_CREATE_ENABLED === 'true' });
      if (req.body?.confirmed !== true) return reply(400, { error: 'Confirm adding the saved trial to the CRM.' });
      if (!current.snapshot || !['linked', 'unlinked'].includes(current.snapshot.status)) return reply(409, { error: 'A verified trial without a customer conflict is required. No CRM record was changed.' });
      const { data: linked, error: linkError } = await admin.rpc('ks_link_roomba_trial_to_crm', { p_admin_id: user.id });
      if (linkError || linked?.ok !== true || !uuid(linked.customerId)) {
        // RPC transaction is atomic; retrying it cannot create duplicate customer/activity rows.
        return reply(linkError?.code === 'P0001' || linkError?.code === '23505' ? 409 : 503, {
          error: linkError?.code === 'P0001' || linkError?.code === '23505'
            ? 'The saved trial conflicts with a CRM customer. No existing customer was overwritten.'
            : 'The CRM link could not be confirmed. Check saved setup again before continuing.',
        });
      }
      const refreshed = await load();
      if (refreshed.snapshot?.status !== 'linked' || refreshed.snapshot.customerId !== linked.customerId) throw new Error('link_unverified');
      return reply(200, { setup: refreshed.snapshot, replayed: linked.replayed === true, trialCreationEnabled: env.ROOMBA_TRIAL_CREATE_ENABLED === 'true' });
    } catch {
      return reply(503, { error: 'The saved setup could not be verified. No provider action was sent.' });
    }
  };
}
