export const paymentMethods = Object.freeze({cash:'Cash',cash_app:'Cash App',zelle:'Zelle',paypal:'PayPal',venmo:'Venmo',bank_transfer:'Bank transfer',card_external:'Card payment received elsewhere',other:'Other'});
export const paymentMethodLabel=value=>typeof value==='string'?(paymentMethods[value.replace(/^manual_/, '')]||value):'Not recorded';
export const paymentUuid=v=>typeof v==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(v);
export function amountToCents(value){
  if(typeof value!=='string'||!/^\d{1,5}(?:\.\d{1,2})?$/.test(value.trim()))return null;
  const [dollars,fraction='']=value.trim().split('.'),cents=Number(dollars)*100+Number(fraction.padEnd(2,'0'));
  return Number.isSafeInteger(cents)&&cents>0&&cents<=1000000?cents:null;
}
export function validPaymentInput(value,now=Date.now()){
  return Boolean(value&&paymentUuid(value.customerId)&&[1,3,6,12].includes(value.months)
    &&Number.isInteger(value.connections)&&value.connections>=1&&value.connections<=5
    &&Number.isInteger(value.amountCents)&&value.amountCents>=1&&value.amountCents<=1000000
    &&typeof value.paidAt==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value.paidAt)
    &&Number.isFinite(Date.parse(value.paidAt))&&new Date(value.paidAt).toISOString()===value.paidAt
    &&Date.parse(value.paidAt)>=Date.parse('2000-01-01T00:00:00Z')&&Date.parse(value.paidAt)<=now+300000
    &&Object.hasOwn(paymentMethods,value.method)&&typeof value.reference==='string'&&value.reference.length<=120&&!/[\u0000-\u001f]/.test(value.reference)
    &&typeof value.adjustmentReason==='string'&&value.adjustmentReason.length<=300&&!/[\u0000-\u001f]/.test(value.adjustmentReason));
}
export function validateRenewalPayment(value){
  if(!value||!paymentUuid(value.receiptId)||!paymentUuid(value.paymentId)||!paymentUuid(value.customerId)
    ||!validPaymentInput(value)||!Number.isInteger(value.catalogCents)||value.catalogCents<1
    ||typeof value.recordedAt!=='string'||!Number.isFinite(Date.parse(value.recordedAt))||value.serviceUpdated!==false)
    throw Error('The saved payment receipt could not be verified.');
  return {receiptId:value.receiptId,paymentId:value.paymentId,customerId:value.customerId,months:value.months,connections:value.connections,
    catalogCents:value.catalogCents,amountCents:value.amountCents,paidAt:value.paidAt,method:value.method,reference:value.reference,adjustmentReason:value.adjustmentReason,recordedAt:value.recordedAt,serviceUpdated:false};
}
export function renewalPaymentApi({getToken,fetchImpl=fetch}){
  return async(action,receiptId,input)=>{
    const token=await getToken();if(!token)throw Error('Sign in to your admin account again.');
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),25000);
    try{
      const query='/api/ks-roomba-crm?view=renewal-payment';
      const response=await fetchImpl(action==='status'?query+'&receiptId='+encodeURIComponent(receiptId):query,
        {method:action==='status'?'GET':'POST',headers:{Authorization:`Bearer ${token}`,...(action==='status'?{}:{'Content-Type':'application/json'})},cache:'no-store',signal:controller.signal,
          ...(action==='status'?{}:{body:JSON.stringify({receiptId,input,confirmed:true})})});
      const payload=await response.json();
      if(!response.ok){const error=Error(payload?.error||'The payment could not be verified.');error.status=response.status;error.code=payload?.code;throw error;}
      if(payload?.mode!=='crm-renewal-payment'||payload.providerWrites!==false||payload.creditsSpent!==false)throw Error('The payment receipt could not be verified.');
      const receipt=validateRenewalPayment(payload.receipt);if(receipt.receiptId!==receiptId)throw Error('The payment reference changed. Check its saved result.');return receipt;
    }finally{clearTimeout(timer);}
  };
}
