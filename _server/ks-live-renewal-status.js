import { getPlan } from './ks-payment-validation.js';
const uuid=value=>typeof value==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
const reference=value=>typeof value==='string'&&/^cs_live_[A-Za-z0-9]{1,192}$/.test(value);
const date=value=>typeof value==='string'&&Number.isFinite(Date.parse(value));
const unavailable=()=>new Error('verified_owner_renewal_status_unavailable');
// This private, SELECT-only RPC returns no provider identity, keys or credentials.
// A missing historical proof remains review; storage failure never means pending.
export async function loadLiveRenewalCompletions(admin,ownerId,orders,now=Date.now()){
  if(!uuid(ownerId)||!Array.isArray(orders)||orders.length<1||orders.length>5||!Number.isSafeInteger(now))throw unavailable();
  const expected=new Map();
  for(const order of orders){
    const plan=getPlan(order?.tier,order?.connections);
    if(!reference(order.checkout_session_id)||expected.has(order.checkout_session_id)||order.user_id!==ownerId||order.livemode!==true
      ||order.activated!==false||order.expires_at!==null||order.amount_cents!==plan.cents||order.duration_days!==plan.days||order.currency!=='usd'||!date(order.recorded_at))throw unavailable();
    expected.set(order.checkout_session_id,order);
  }
  const {data,error}=await admin.rpc('ks_owner_paid_renewal_completions',{p_user:ownerId,p_sessions:[...expected.keys()]});
  if(error||!Array.isArray(data)||data.length>expected.size)throw unavailable();
  const result=new Map();
  for(const row of data){
    const order=expected.get(row?.reference);
    if(!order||result.has(row.reference)||row.accountId!==ownerId||row.status!=='renewal_complete'
      ||row.testMode!==false||row.providerActivated!==false||row.renewalCompleted!==true
      ||row.tier!==order.tier||row.connections!==order.connections||row.durationDays!==order.duration_days
      ||row.amountCents!==order.amount_cents||row.currency!==order.currency||!date(row.recordedAt)||Date.parse(row.recordedAt)!==Date.parse(order.recorded_at)
      ||!date(row.completedAt)||!date(row.expiresAt)||Date.parse(row.completedAt)<Date.parse(order.recorded_at)
      ||Date.parse(row.completedAt)>now+60000||Date.parse(row.expiresAt)<=Date.parse(row.completedAt))throw unavailable();
    result.set(row.reference,{status:'renewal_complete',providerActivated:false,renewalCompleted:true,
      expiresAt:new Date(row.expiresAt).toISOString(),completedAt:new Date(row.completedAt).toISOString()});
  }
  return result;
}
