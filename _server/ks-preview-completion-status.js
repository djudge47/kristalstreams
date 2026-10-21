import { getPlan } from './ks-payment-validation.js';

const uuid=value=>typeof value==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
const date=value=>typeof value==='string'&&Number.isFinite(Date.parse(value));
const reference=value=>typeof value==='string'&&/^cs_test_[A-Za-z0-9]{1,180}$/.test(value);
const unavailable=()=>new Error('verified_preview_completion_unavailable');
// Explicit FK hints avoid ambiguous embeds. No envelope, username or password
// is selected. All identity fields below stay server-side.
export const previewCompletionColumns='attempt_id,checkout_session_id,user_id,crm_customer_id,completed_at,'
  +'attempt:ks_preview_provisioning_attempts!ks_preview_paid_fulfillments_attempt_id_fkey!inner(attempt_id,checkout_session_id,user_id,payment_intent_id,state,provider_line_id,provider_expires_at,package_months,connections),'
  +'login:ks_preview_streaming_logins!ks_preview_login_fulfillment_fk!inner(attempt_id,checkout_session_id,user_id),'
  +'receipt:ks_payment_receipts!ks_preview_paid_fulfillments_checkout_session_id_fkey!inner(checkout_session_id,payment_intent_id,user_id,livemode,tier,connections,duration_days,amount_cents,currency,activated,expires_at,recorded_at),'
  +'customer:iptv_customers!ks_preview_paid_fulfillments_crm_customer_id_fkey!inner(id,external_id,source,trial,connections_allowed,expiration_at)';

function expectedOrders(orders,ownerId){
  if(!uuid(ownerId)||!Array.isArray(orders)||orders.length<1||orders.length>5)throw unavailable();
  const expected=new Map();
  for(const order of orders){
    const plan=getPlan(order?.tier,order?.connections);
    if(!reference(order.checkout_session_id)||expected.has(order.checkout_session_id)
      ||order.user_id!==ownerId||order.livemode!==false||order.activated!==false||order.expires_at!==null
      ||order.tier!==plan.tier||order.currency!=='usd'||order.amount_cents!==plan.cents||order.duration_days!==plan.days)throw unavailable();
    expected.set(order.checkout_session_id,order);
  }
  return expected;
}

export function previewCompletionSnapshot(rows,ownerId,orders,now=Date.now()){
  const expected=expectedOrders(orders,ownerId),result=new Map();
  if(!Number.isSafeInteger(now)||!Array.isArray(rows)||rows.length!==expected.size)throw unavailable();
  for(const row of rows){
    const receipt=row?.receipt,attempt=row?.attempt,login=row?.login,customer=row?.customer;
    const order=expected.get(row?.checkout_session_id);
    if(!order||result.has(row.checkout_session_id)||!uuid(row.attempt_id)||!uuid(row.crm_customer_id)
      ||row.user_id!==ownerId||!date(row.completed_at)||Date.parse(row.completed_at)>now+60000
      ||receipt?.checkout_session_id!==order.checkout_session_id||receipt.user_id!==ownerId
      ||receipt.livemode!==false||receipt.activated!==false||receipt.expires_at!==null
      ||receipt.tier!==order.tier||receipt.connections!==order.connections||receipt.duration_days!==order.duration_days
      ||receipt.amount_cents!==order.amount_cents||receipt.currency!=='usd'||!date(receipt.recorded_at)
      ||Date.parse(receipt.recorded_at)>Date.parse(row.completed_at)
      ||typeof receipt.payment_intent_id!=='string'||!/^pi_[A-Za-z0-9]+$/.test(receipt.payment_intent_id)
      ||(order.payment_intent_id!==undefined&&order.payment_intent_id!==receipt.payment_intent_id)
      ||attempt?.attempt_id!==row.attempt_id||attempt.checkout_session_id!==order.checkout_session_id
      ||attempt.user_id!==ownerId||attempt.payment_intent_id!==receipt.payment_intent_id||attempt.state!=='credentials_ready'
      ||attempt.connections!==order.connections||attempt.package_months!==({bronze:1,silver:3,gold:6,platinum:12})[order.tier]
      ||typeof attempt.provider_line_id!=='string'||!/^[1-9][0-9]{0,14}$/.test(attempt.provider_line_id)
      ||!date(attempt.provider_expires_at)||Date.parse(attempt.provider_expires_at)<=Date.parse(row.completed_at)
      ||Date.parse(attempt.provider_expires_at)>Date.parse(row.completed_at)+attempt.package_months*32*86400000
      ||login?.attempt_id!==row.attempt_id||login.checkout_session_id!==order.checkout_session_id||login.user_id!==ownerId
      ||customer?.id!==row.crm_customer_id||String(customer.external_id)!==attempt.provider_line_id
      ||customer.source!=='roomba_preview_paid'||customer.trial!==false||customer.connections_allowed!==order.connections
      ||!date(customer.expiration_at)||Date.parse(customer.expiration_at)!==Date.parse(attempt.provider_expires_at))throw unavailable();
    const active=Date.parse(attempt.provider_expires_at)>now;
    result.set(order.checkout_session_id,{status:active?'setup_complete':'setup_expired',providerActivated:active,
      expiresAt:new Date(attempt.provider_expires_at).toISOString()});
  }
  return result;
}

export async function loadPreviewCompletions(admin,ownerId,orders,now=Date.now()){
  const expected=expectedOrders(orders,ownerId);
  const {data,error}=await admin.from('ks_preview_paid_fulfillments').select(previewCompletionColumns)
    .eq('user_id',ownerId).eq('attempt.user_id',ownerId).eq('login.user_id',ownerId).eq('receipt.user_id',ownerId)
    .eq('receipt.livemode',false).in('checkout_session_id',[...expected.keys()]).limit(expected.size+1);
  if(error)throw unavailable();
  return previewCompletionSnapshot(data,ownerId,orders,now);
}
