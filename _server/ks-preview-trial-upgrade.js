import { getPlan } from './ks-payment-validation.js';
import { paidOrderSnapshot } from './ks-preview-paid-orders.js';
import { buildPaidPlanMapping } from './ks-roomba-plan-mapping.js';
import { createRoombaCrmHandler } from './ks-roomba-crm.js';
import { createAdminRoombaHandler } from './ks-roomba-admin.js';
import { createRoombaPreviewHandler } from './ks-roomba-preview.js';
import { verifyCurrentTrial } from './ks-roomba-line-snapshot.js';

export function buildTrialUpgradeReview(order, setup, packages, checkedAt, adminId) {
  const plan = getPlan(order?.tier, order?.connections);
  if (order.userId !== adminId || order.testMode !== true || order.providerActivated !== false
    || order.orderStatus !== 'awaiting_activation' || order.amountCents !== plan.cents || order.currency !== 'usd') throw new Error('owned_test_order_required');
  if (setup?.status !== 'linked' || setup.packageId !== '1' || setup.connections !== 1
    || !/^[A-Za-z0-9_.-]{3,64}$/.test(setup.username || '') || !/^[1-9]\d{0,14}$/.test(setup.lineId || '') || !/^[1-9]\d{0,14}$/.test(setup.resellerId || '')
    || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(setup.customerId || '') || !Number.isFinite(Date.parse(setup.expiresAt))) throw new Error('linked_trial_required');
  const mapping = buildPaidPlanMapping({ schemaVersion:1, readOnly:true, checkedAt, packages });
  const selected = mapping.entries.find(item => item.tier === plan.tier && item.connections === plan.connections);
  return {
    draftOnly: true, providerActionSent: false, paymentTestMode: true, credentialsPolicy: 'keep_existing',
    payment: { sessionId: order.sessionId, userId: order.userId, tier: plan.tier, connections: plan.connections, amountCents: plan.cents, currency:'usd' },
    existing: { customerId: setup.customerId, lineId: setup.lineId, resellerId: setup.resellerId, username: setup.username, savedExpiresAt: setup.expiresAt },
    proposed: { packageId: selected.provider.id, packageName: selected.provider.name,
      duration: `${selected.provider.duration.count} ${selected.provider.duration.unit}`, credits: selected.provider.credits,
      connections: plan.connections, bouquetCount: selected.provider.bouquetIds.length, packageFingerprint: selected.provider.fingerprint },
    packagesCheckedAt: checkedAt, requiresCurrentLineCheck: true,
    execution: { enabled: false, reason: 'trial_conversion_unverified' },
  };
}

export function createPreviewTrialUpgradeHandler({ createClient, env = process.env, packagesHandler, savedSetupHandler,
  accountHandler, lineHandlerFactory, now = Date.now } = {}) {
  const options = { auth: { persistSession: false, autoRefreshToken: false } };
  const readPackages = packagesHandler || createAdminRoombaHandler({ createClient, env, dataKind:'packages', accountHandler:createRoombaPreviewHandler({env,readAction:'packages'}) });
  const readSetup = savedSetupHandler || createRoombaCrmHandler({ createClient, env });
  const readAccount = accountHandler || createRoombaPreviewHandler({ env });
  const makeLineReader = lineHandlerFactory || (lineId => createRoombaPreviewHandler({ env, readAction: 'get_line', lineId }));
  let selectedLine, readLine, pendingCurrent, retryCurrentAt = 0;
  const invoke = async (handler, headers) => {
    let status, body;
    await handler({method:'GET',headers}, {setHeader(){},status(code){status=code;return this;},json(value){body=value;return this;}});
    return {status,body};
  };
  const current = lineId => {
    // One controlled trial only. No caller can swap the line or its transport.
    if (selectedLine && selectedLine !== lineId) throw new Error('trial_changed');
    if (!readLine) { selectedLine = lineId; readLine = makeLineReader(lineId); }
    if (pendingCurrent) return pendingCurrent;
    if (now() < retryCurrentAt) throw new Error('read_cooldown');
    retryCurrentAt = now() + 30000;
    const headers = { authorization: `Bearer ${env.ROOMBA_PREVIEW_SECRET}` };
    pendingCurrent = Promise.all([invoke(readAccount, headers), invoke(readLine, headers)])
      .then(([account, line]) => {
        for (const [response, status] of [[account, 'connected'], [line, 'line_ready']]) {
          if (response.status !== 200 || response.body?.status !== status || response.body.transport !== 'fixie'
            || response.body.mode !== 'read-only' || response.body.databaseWrites !== false) throw new Error('provider_unavailable');
        }
        return { account: account.body.account, line: line.body.line, checkedAt: new Date(now()).toISOString() };
      }).finally(() => { pendingCurrent = null; });
    return pendingCurrent;
  };
  return async function handler(req,res) {
    res.setHeader('Cache-Control','private, no-store');
    if(env.VERCEL_ENV!=='preview') return res.status(404).json({error:'Upgrade review is available in Preview only.'});
    if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).json({error:'Method not allowed.'});}
    const token=typeof req.headers?.authorization==='string'&&/^Bearer ([^\s]+)$/i.exec(req.headers.authorization)?.[1];
    if(!token)return res.status(401).json({error:'Please sign in to your admin account.'});
    const sessionId=req.query?.sessionId;
    if(typeof sessionId!=='string'||!/^cs_(test_|live_)?[A-Za-z0-9]+$/.test(sessionId))return res.status(400).json({error:'Choose a saved test payment.'});
    if(!env.VITE_SUPABASE_URL||!env.VITE_SUPABASE_ANON_KEY||!env.SUPABASE_SERVICE_ROLE_KEY)return res.status(503).json({error:'Upgrade review is unavailable.'});
    try{
      const auth=createClient(env.VITE_SUPABASE_URL,env.VITE_SUPABASE_ANON_KEY,options);
      const {data,error}=await auth.auth.getUser(token);
      const user=data?.user;
      if(error||!user?.id)return res.status(401).json({error:'Please sign in again to your admin account.'});
      if(user.is_anonymous||!user.email_confirmed_at||user.email?.trim().toLowerCase()!=='djudge47@gmail.com')return res.status(403).json({error:'Only the Kristal Streams administrator can use this review.'});
      const admin=createClient(env.VITE_SUPABASE_URL,env.SUPABASE_SERVICE_ROLE_KEY,options);
      const {data:rows,error:readError}=await admin.rpc('ks_list_preview_paid_orders');
      if(readError)throw new Error('storage_unavailable');
      const order=paidOrderSnapshot(rows).find(item=>item.sessionId===sessionId);
      if(!order||order.userId!==user.id)return res.status(409).json({error:'This controlled review requires a pending test order owned by your signed-in account. No customer line was selected.'});
      const saved=await invoke(readSetup,{authorization:`Bearer ${token}`});
      if(saved.status!==200||saved.body?.setup?.status!=='linked')return res.status(409).json({error:'A verified trial linked to your CRM is required. No service was changed.'});
      const catalog=await invoke(readPackages,{authorization:`Bearer ${token}`});
      if(catalog.status!==200||catalog.body?.status!=='packages_ready')return res.status(catalog.status===429?429:503).json({error:'The provider packages could not be checked. Wait briefly and review again. No service was changed.'});
      const review=buildTrialUpgradeReview(order,saved.body.setup,catalog.body.packages,catalog.body.checkedAt,user.id);
      const provider = await current(review.existing.lineId);
      const currentTrial = verifyCurrentTrial(review, provider.account, provider.line, catalog.body.packages, provider.checkedAt, now());
      return res.status(200).json({review:{...review,requiresCurrentLineCheck:false,currentTrial}});
    }catch(error){
      const conflicts = {
        trial_changed: 'The Roomba line no longer matches the saved trial. Check it in the reseller panel before continuing.',
        trial_expired: 'The saved trial has expired. Conversion of an expired trial also needs confirmation from Roomba.',
        channel_groups_changed: 'The current line and selected packages have different channel groups. Review the selection with Roomba.',
        insufficient_credits: 'The reseller account does not have enough credits for this package.',
      };
      if (error?.message === 'read_cooldown') { res.setHeader('Retry-After','30');return res.status(429).json({error:'Wait 30 seconds before checking the current Roomba line again.'}); }
      if (Object.hasOwn(conflicts,error?.message)) return res.status(409).json({error:`${conflicts[error.message]} No service was changed.`});
      return res.status(503).json({error:'The current trial or reseller account could not be verified. No service was changed and no credits were spent.'});
    }
  };
}
