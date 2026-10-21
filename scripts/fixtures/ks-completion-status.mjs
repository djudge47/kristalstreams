export const completionOwner='00000000-0000-4000-8000-000000000001';
export function completionFixture(now=Date.parse('2026-10-20T05:00:00Z')){
  const reference='cs_test_CompletionStatus',attemptId='00000000-0000-4000-8000-000000000003',customerId='00000000-0000-4000-8000-000000000004';
  const completedAt=new Date(now-86400000).toISOString(),expiresAt=new Date(now+30*86400000).toISOString();
  const receipt={checkout_session_id:reference,payment_intent_id:'pi_CompletionStatus',user_id:completionOwner,livemode:false,tier:'bronze',connections:1,duration_days:30,amount_cents:2000,currency:'usd',activated:false,expires_at:null,recorded_at:completedAt};
  const row={attempt_id:attemptId,checkout_session_id:reference,user_id:completionOwner,crm_customer_id:customerId,completed_at:completedAt,receipt,
    attempt:{attempt_id:attemptId,checkout_session_id:reference,user_id:completionOwner,payment_intent_id:receipt.payment_intent_id,state:'credentials_ready',provider_line_id:'900001',provider_expires_at:expiresAt,package_months:1,connections:1},
    login:{attempt_id:attemptId,checkout_session_id:reference,user_id:completionOwner},
    customer:{id:customerId,external_id:900001,source:'roomba_preview_paid',trial:false,connections_allowed:1,expiration_at:expiresAt}};
  return {now,owner:completionOwner,reference,receipt,row,expiresAt};
}
