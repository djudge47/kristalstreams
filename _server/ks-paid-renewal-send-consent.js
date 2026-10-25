import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
const purpose='ks-paid-renewal-send-consent/v1';
const uuid=v=>typeof v==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(v);
const fields=['purpose','actorId','ownerId','reference','operationId','approvalId','quoteFingerprint','costUnits','consentId','issuedAt','expiresAt'];
const confirmations=input=>input?.creditSpendConfirmed===true&&input.preserveChannelsConfirmed===true
  &&input.serviceChangesConfirmed===true&&input.executionRequested===true;
// Trusted-server primitive only. No HTTP issuance route, env/key fallback,
// provider write or execution flag is supplied here. A quote approval is not
// this separate explicit consent, and neither alone authorizes dispatch.
export function createPaidRenewalSendConsent({key,now}={}){
  if(!Buffer.isBuffer(key)||key.length!==32||typeof now!=='function')throw Error('dedicated_paid_renewal_send_key_required');
  const secret=Buffer.from(key),sign=s=>createHmac('sha256',secret).update(`${purpose}\0${s}`).digest('hex');
  const clock=()=>{const at=now();if(!Number.isSafeInteger(at))throw Error('paid_renewal_send_clock_required');return at;};
  function identify(token,{actorId,operationId}={}){
    if(!uuid(actorId)||!uuid(operationId)||typeof token!=='string'||token.length>1800)throw Error('paid_renewal_send_consent_required');
    const [encoded,signature,extra]=token.split('.');
    if(extra!==undefined||!/^[A-Za-z0-9_-]+$/.test(encoded||'')||!/^[a-f0-9]{64}$/.test(signature||'')
      ||!timingSafeEqual(Buffer.from(signature),Buffer.from(sign(encoded))))throw Error('paid_renewal_send_consent_required');
    let p;try{p=JSON.parse(Buffer.from(encoded,'base64url').toString('utf8'));}catch{throw Error('paid_renewal_send_consent_required');}
    if(!p||Object.keys(p).length!==fields.length||fields.some(f=>!Object.hasOwn(p,f))||p.purpose!==purpose
      ||![p.actorId,p.ownerId,p.operationId,p.approvalId,p.consentId].every(uuid)||p.actorId!==actorId||p.operationId!==operationId
      ||!/^cs_live_[A-Za-z0-9]+$/.test(p.reference||'')||!/^[a-f0-9]{64}$/.test(p.quoteFingerprint||'')
      ||!/^[1-9]\d{0,12}$/.test(p.costUnits||'')||BigInt(p.costUnits)>1000000000000n
      ||![p.issuedAt,p.expiresAt].every(v=>typeof v==='string'&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString()===v)
      ||Date.parse(p.expiresAt)!==Date.parse(p.issuedAt)+300000||Date.parse(p.issuedAt)>clock())throw Error('paid_renewal_send_consent_changed');
    return Object.freeze(p);
  }
  return Object.freeze({identify,
    issue(input){
      const at=clock();if(!confirmations(input))throw Error('explicit_paid_renewal_send_consent_required');
      const p={purpose,...Object.fromEntries(fields.slice(1,8).map(f=>[f,input[f]])),consentId:randomUUID(),issuedAt:new Date(at).toISOString(),expiresAt:new Date(at+300000).toISOString()};
      const encoded=Buffer.from(JSON.stringify(p)).toString('base64url'),token=`${encoded}.${sign(encoded)}`;
      identify(token,input);return Object.freeze({token,operationId:p.operationId,consentId:p.consentId,expiresAt:p.expiresAt,mayDispatch:false});
    },
    verify(token,input){const p=identify(token,input);if(!confirmations(input)||Date.parse(p.expiresAt)<=clock())throw Error('fresh_paid_renewal_send_consent_required');return p;}
  });
}
