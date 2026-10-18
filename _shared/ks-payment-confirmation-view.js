const unavailable=()=>new Error('Your payment status needs attention. Check your dashboard or contact support; do not pay again.');

// Presentation only: readiness comes from the authenticated confirmation API's
// separately verified completion result, never from payment/website activation.
export function paymentConfirmationView(payload,reference){
  if(typeof reference!=='string'||!/^cs_(test_|live_)?[A-Za-z0-9]+$/.test(reference)
    ||payload?.ok!==true||typeof payload.test_mode!=='boolean'||typeof payload.activated!=='boolean'
    ||(payload.receipt_reference!==undefined&&payload.receipt_reference!==reference)
    ||payload.test_mode!==reference.startsWith('cs_test_')
    ||(payload.provider_activated!==undefined&&typeof payload.provider_activated!=='boolean')
    ||!['awaiting_activation','setup_complete','requires_review',undefined].includes(payload.order_status))throw unavailable();
  const test=payload.test_mode,provider=payload.provider_activated===true;
  if((test&&payload.activated)||(provider&&payload.order_status!=='setup_complete')
    ||(payload.order_status==='setup_complete'&&!provider))throw unavailable();
  if(provider){
    // The current verified completion path is Preview-only. Do not infer live
    // readiness until its owner/expiry/completion contract has been integrated.
    if(!test)throw unavailable();
    return {kind:'ready',title:'Streaming setup confirmed',
      message:'Your test payment did not charge your card. Streaming setup is confirmed for this order. Open your dashboard for your saved setup and login details.'};
  }
  if(payload.order_status==='requires_review')return {kind:'review',title:'Payment recorded — setup needs attention',
    message:test?'Your test payment is saved and did not charge your card. Streaming setup needs review. Check your dashboard or contact support; do not pay again.'
      :'Your payment is saved. Streaming setup needs review. Check your dashboard or contact support; do not pay again.'};
  if(test)return {kind:'test',title:'Test payment confirmed',
    message:payload.order_status==='awaiting_activation'
      ?'Your test payment is saved and did not charge your card. Streaming setup is pending confirmation. Check your dashboard for setup status.'
      :'Your test payment is saved and did not charge your card. Check your dashboard for streaming setup status.'};
  if(payload.activated||payload.order_status==='awaiting_activation')return {kind:'pending',title:'Payment received',
    message:'Your payment is confirmed. Check your dashboard for streaming setup status and login details. Please do not pay again for this order.'};
  throw unavailable();
}
