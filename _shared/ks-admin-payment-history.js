const uuid=v=>typeof v==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(v);
export const websiteReceiptId=v=>typeof v==='string'&&/^cs_live_[A-Za-z0-9]{1,192}$/.test(v);
const date=v=>typeof v==='string'&&v.length<=40&&Number.isFinite(Date.parse(v));
const time=v=>BigInt(Date.parse(v))*1000n+BigInt((/\.([0-9]{1,6})(?:Z|[+-][0-9]{2}:[0-9]{2})$/.exec(v)?.[1]||'').padEnd(6,'0').slice(3)||'0');
export const comparePaymentOrder=(a,b)=>{const at=date(a.paid_at)?time(a.paid_at):null,bt=date(b.paid_at)?time(b.paid_at):null;return at===null&&bt!==null?1:bt===null&&at!==null?-1:at>bt?-1:at<bt?1:a.id>b.id?-1:a.id<b.id?1:0;};
const unavailable=()=>new Error('Payment details could not be loaded. Refresh to try again.');
export function readAdminWebsitePayments(payload,actorId,lookahead=false){
  if(!uuid(actorId)||payload?.accountId!==actorId||!date(payload.checkedAt)||!Array.isArray(payload.payments)||payload.payments.length>(lookahead?201:200))throw unavailable();
  let previous;const seen=new Set();
  const payments=payload.payments.map(p=>{
    if(!websiteReceiptId(p?.id)||seen.has(p.id)||!uuid(p.customer_id)||p.source!=='website_checkout'||p.payment_method!=='stripe_checkout'||p.payment_status!=='recorded'
      ||!Number.isSafeInteger(p.amount_cents)||p.amount_cents<=0||p.amount_cents>100000000||p.amount!==undefined&&p.amount!==p.amount_cents/100
      ||![1,3,6,12].includes(p.months)||!Number.isInteger(p.connections)||p.connections<1||p.connections>5
      ||!date(p.paid_at)||!date(p.renewal_completed_at)||!date(p.renewal_expires_at)
      ||time(p.renewal_completed_at)<time(p.paid_at)||Date.parse(p.renewal_completed_at)>Date.parse(payload.checkedAt)+60000
      ||Date.parse(p.renewal_expires_at)<=Date.parse(p.renewal_completed_at)||previous&&comparePaymentOrder(previous,p)>=0)throw unavailable();
    seen.add(p.id);previous=p;
    return{id:p.id,customer_id:p.customer_id,amount_cents:p.amount_cents,amount:p.amount_cents/100,payment_method:'stripe_checkout',payment_status:'recorded',paid_at:p.paid_at,
      source:'website_checkout',months:p.months,connections:p.connections,renewal_completed_at:p.renewal_completed_at,renewal_expires_at:p.renewal_expires_at};
  });
  const cursor=payload.nextCursor??null,last=payments.at(-1);
  if(cursor!==null&&(!last||cursor.id!==last.id||cursor.paidAt!==last.paid_at))throw unavailable();
  return{accountId:actorId,checkedAt:payload.checkedAt,payments,nextCursor:cursor};
}
export async function loadAdminWebsitePayments(client,{fetchImpl=globalThis.fetch}={}){
  try{
    const {data,error}=await client.auth.getSession(),session=data?.session,actor=session?.user?.id;
    if(error||!uuid(actor)||!session.access_token)throw unavailable();
    const payments=[];let cursor=null,previous;const seen=new Set();
    for(;;){
      const params=new URLSearchParams({view:'admin-website-payments',...(cursor?{beforeAt:cursor.paidAt,beforeId:cursor.id}:{})});
      const response=await fetchImpl(`/api/ks-preview-paid-orders?${params}`,{method:'GET',cache:'no-store',headers:{Authorization:`Bearer ${session.access_token}`,Accept:'application/json'},signal:AbortSignal.timeout(20000)});
      if(!response.ok)throw unavailable();const page=readAdminWebsitePayments(await response.json(),actor);
      for(const p of page.payments){if(seen.has(p.id)||previous&&comparePaymentOrder(previous,p)>=0)throw unavailable();seen.add(p.id);previous=p;payments.push(p);}
      if(!page.nextCursor)break;if(!page.payments.length)throw unavailable();cursor=page.nextCursor;
    }
    const current=await client.auth.getSession();if(current.error||current.data?.session?.user?.id!==actor)throw unavailable();
    return{data:payments,error:null};
  }catch{return{data:null,error:{message:unavailable().message}};}
}
export const paymentDateLabel=p=>p.source==='website_checkout'?'Recorded':'Received';
export const adminPaymentMethod=p=>p.source==='website_checkout'?'Website checkout':null;
