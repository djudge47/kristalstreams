import { getPlan } from './ks-payment-validation.js';
import { paidOrderSnapshot } from './ks-preview-paid-orders.js';
import { buildPaidPlanMapping } from './ks-roomba-plan-mapping.js';
import { createRoombaCrmHandler } from './ks-roomba-crm.js';
import { createAdminRoombaHandler } from './ks-roomba-admin.js';
import { createRoombaPreviewHandler } from './ks-roomba-preview.js';

export function buildTrialUpgradeReview(order, setup, packages, checkedAt, adminId) {
  const plan = getPlan(order?.tier, order?.connections);
  if (order.userId !== adminId || order.testMode !== true || order.providerActivated !== false
    || order.orderStatus !== 'awaiting_activation' || order.amountCents !== plan.cents || order.currency !== 'usd') throw new Error('owned_test_order_required');
  if (setup?.status !== 'linked' || setup.packageId !== '1' || setup.connections !== 1
    || !/^[A-Za-z0-9_.-]{3,64}$/.test(setup.username || '') || !/^[1-9]\d{0,14}$/.test(setup.lineId || '')
    || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(setup.customerId || '') || !Number.isFinite(Date.parse(setup.expiresAt))) throw new Error('linked_trial_required');
  const mapping = buildPaidPlanMapping({ schemaVersion:1, readOnly:true, checkedAt, packages });
  const selected = mapping.entries.find(item => item.tier === plan.tier && item.connections === plan.connections);
  return {
    draftOnly: true, providerActionSent: false, paymentTestMode: true, credentialsPolicy: 'keep_existing',
    payment: { sessionId: order.sessionId, userId: order.userId, tier: plan.tier, connections: plan.connections, amountCents: plan.cents, currency:'usd' },
    existing: { customerId: setup.customerId, lineId: setup.lineId, username: setup.username, savedExpiresAt: setup.expiresAt },
    proposed: { packageId: selected.provider.id, packageName: selected.provider.name,
      duration: `${selected.provider.duration.count} ${selected.provider.duration.unit}`, credits: selected.provider.credits,
      connections: plan.connections, bouquetCount: selected.provider.bouquetIds.length, packageFingerprint: selected.provider.fingerprint },
    packagesCheckedAt: checkedAt, requiresCurrentLineCheck: true,
  };
}

export function createPreviewTrialUpgradeHandler({ createClient, env = process.env, packagesHandler, savedSetupHandler } = {}) {
  const options = { auth: { persistSession: false, autoRefreshToken: false } };
  const readPackages = packagesHandler || createAdminRoombaHandler({ createClient, env, dataKind:'packages', accountHandler:createRoombaPreviewHandler({env,readAction:'packages'}) });
  const readSetup = savedSetupHandler || createRoombaCrmHandler({ createClient, env });
  const invoke = async (handler, headers) => {
    let status, body;
    await handler({method:'GET',headers}, {setHeader(){},status(code){status=code;return this;},json(value){body=value;return this;}});
    return {status,body};
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
      return res.status(200).json({review});
    }catch{return res.status(503).json({error:'The trial upgrade could not be prepared. No service was changed and no credits were spent.'});}
  };
}
