import {loadAdminWebsitePayments,comparePaymentOrder} from './ks-admin-payment-history.js';
const paymentColumns = 'id,customer_id,amount,payment_method,payment_status,paid_at,period_end';
const pageSize = 200;

// Read every page so a customer's receipt cannot disappear behind the global
// recent-payments limit. This uses the signed-in client's existing RLS access.
export async function loadCrmPayments(client,{website=false,fetchImpl=globalThis.fetch}={}) {
  if(website){
    try{
      const initial=await client.auth.getSession(),actor=initial.data?.session?.user?.id;
      if(initial.error||!actor)throw Error('unavailable');
      const [manual,online]=await Promise.all([loadCrmPayments(client),loadAdminWebsitePayments(client,{fetchImpl})]);
      const current=await client.auth.getSession();
      if(manual.error||online.error||current.error||current.data?.session?.user?.id!==actor)throw Error('unavailable');
      const unique=new Map([...manual.data,...online.data].map(p=>[p.id,p]));
      return{data:[...unique.values()].sort(comparePaymentOrder),error:null};
    }catch{return{data:null,error:{message:'Payment details could not be loaded. Refresh to try again.'}};}
  }
  const payments = [];
  try {
    for (let offset = 0; ; offset += pageSize) {
      const result = await client.from('iptv_payments').select(paymentColumns)
        .order('paid_at', { ascending: false }).order('id', { ascending: false })
        .range(offset, offset + pageSize - 1);
      if (result.error || !Array.isArray(result.data)) {
        return { data: null, error: { message: 'Payment details could not be loaded. Refresh to try again.' } };
      }
      payments.push(...result.data);
      if (result.data.length < pageSize) return { data: payments, error: null };
    }
  } catch {
    return { data: null, error: { message: 'Payment details could not be loaded. Refresh to try again.' } };
  }
}

export function isReceivedPayment(payment) {
  const amount = Number(payment.amount);
  return (payment.source==='website_checkout'?payment.payment_status==='recorded':payment.payment_status === 'paid') && Number.isFinite(amount) && amount > 0
    && Number.isFinite(Date.parse(payment.paid_at));
}

export function latestReceivedPayments(payments) {
  const latest = new Map();
  for (const payment of payments) {
    if (!isReceivedPayment(payment)) continue;
    const previous = latest.get(payment.customer_id);
    if (!previous || comparePaymentOrder(payment,previous)<0) {
      latest.set(payment.customer_id, payment);
    }
  }
  return latest;
}

export function receivedPaymentDate(value) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York', month: 'short', day: 'numeric', year: 'numeric',
  }).format(new Date(value));
}

export function receivedPaymentDateTime(value) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York', month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
  }).format(new Date(value));
}

export function recordedPaymentMonthTotal(payments,now=Date.now()){
  const month=new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',year:'numeric',month:'2-digit'}),current=month.format(now);
  return payments.filter(p=>isReceivedPayment(p)&&Date.parse(p.paid_at)<=now&&month.format(new Date(p.paid_at))===current)
    .reduce((cents,p)=>cents+Math.round(Number(p.amount)*100),0)/100;
}
