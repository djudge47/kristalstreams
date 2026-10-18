import { validatePaidSession } from './ks-payment-validation.js';
import { verifySettledPaidIntent } from './ks-paid-settlement.js';

const uuid=value=>typeof value==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value);
const unavailable=()=>new Error('reviewed_preview_completion_unavailable');

// Service-only completion adapter. It has no provider/dispatch adapter and no
// API route imports it. The flag is unset; production is always rejected.
export async function completeReviewedPreviewSetup(input,{admin,stripe,env=process.env,now=Date.now()}={}){
  if(env.VERCEL_ENV!=='preview'||env.KS_REVIEWED_PREVIEW_COMPLETION!=='enabled-v1')return {state:'disabled',mayDispatch:false};
  if(!input||Object.keys(input).sort().join(',')!=='attemptId,claimId,claimToken,ownerId,sessionId,username'
    ||!['attemptId','claimId','claimToken','ownerId'].every(key=>uuid(input[key]))
    ||typeof input.sessionId!=='string'||!/^cs_test_[A-Za-z0-9]{1,180}$/.test(input.sessionId)
    ||typeof input.username!=='string'||!/^[A-Za-z0-9_.-]{8,64}$/.test(input.username)||!Number.isSafeInteger(now))throw unavailable();
  try{
    const session=await stripe.checkout.sessions.retrieve(input.sessionId,{expand:['payment_intent.latest_charge']});
    const payment=validatePaidSession(session,false,input.ownerId);verifySettledPaidIntent(session,payment,false);
    if(payment.sessionId!==input.sessionId)throw unavailable();
    const {data:auth,error:authError}=await admin.auth.admin.getUserById(input.ownerId);
    const user=auth?.user;
    if(authError||user?.id!==input.ownerId||user.is_anonymous!==false||typeof user.email!=='string'
      ||!user.email||!Number.isFinite(Date.parse(user.email_confirmed_at))||Date.parse(user.email_confirmed_at)>now)throw unavailable();
    const {data:profile,error:profileError}=await admin.from('profiles').select('id,email').eq('id',input.ownerId).maybeSingle();
    if(profileError||profile?.id!==input.ownerId||typeof profile.email!=='string'
      ||profile.email.toLowerCase()!==user.email.toLowerCase())throw unavailable();
    const {data,error}=await admin.rpc('ks_complete_reviewed_preview_setup',{
      p_claim_id:input.claimId,p_attempt_id:input.attemptId,p_claim_token:input.claimToken,p_user_id:input.ownerId,p_username:input.username,
    });
    if(error||data?.ok!==true||data.state!=='credentials_ready'||data.claim_id!==input.claimId||data.attempt_id!==input.attemptId
      ||data.reference!==input.sessionId||data.account_id!==input.ownerId||data.may_dispatch!==false||typeof data.replayed!=='boolean'
      ||typeof data.expires_at!=='string'||!Number.isFinite(Date.parse(data.expires_at))||Date.parse(data.expires_at)<=now)throw unavailable();
    return {ok:true,state:'credentials_ready',reference:data.reference,expiresAt:data.expires_at,replayed:data.replayed,mayDispatch:false};
  }catch{throw unavailable();}
}
