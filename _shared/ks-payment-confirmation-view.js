const unavailable=()=>new Error('Your payment status needs attention. Check your dashboard or contact support; do not pay again.');

// Presentation only: readiness comes from the authenticated confirmation API's
// separately verified completion result, never from payment/website activation.
export function paymentConfirmationView(payload,reference){
  if(typeof reference!=='string'||!/^cs_(test_|live_)?[A-Za-z0-9]+$/.test(reference)
    ||payload?.ok!==true||typeof payload.test_mode!=='boolean'||typeof payload.activated!=='boolean'
    ||(payload.receipt_reference!==undefined&&payload.receipt_reference!==reference)
    ||payload.test_mode!==reference.startsWith('cs_test_')
    ||(payload.provider_activated!==undefined&&typeof payload.provider_activated!=='boolean')
    ||!['awaiting_activation','setup_complete','setup_expired','requires_review','renewal_complete',undefined].includes(payload.order_status))throw unavailable();
  const test=payload.test_mode,provider=payload.provider_activated===true;
  if((test&&payload.activated)||(provider&&payload.order_status!=='setup_complete')
    ||(payload.order_status==='setup_complete'&&!provider))throw unavailable();
  if(payload.order_status==='renewal_complete'){
    const completed=typeof payload.renewal_completed_at==='string'?Date.parse(payload.renewal_completed_at):NaN;
    const expires=typeof payload.setup_expires_at==='string'?Date.parse(payload.setup_expires_at):NaN;
    const checked=typeof payload.setup_checked_at==='string'?Date.parse(payload.setup_checked_at):NaN;
    if(test||payload.activated!==false||payload.provider_activated!==false||payload.renewal_completed!==true
      ||payload.payment_recorded!==true||!Number.isFinite(completed)||!Number.isFinite(expires)||!Number.isFinite(checked)
      ||completed>checked+60000||expires<=completed)throw unavailable();
    return {kind:'renewed',title:'Renewal completed',message:'Your payment is saved and this renewal was completed. Your dashboard shows the term recorded for this order and your current saved service details. This is not a live playback check. Please do not pay again for this order.'};
  }
  if(payload.renewal_completed!==undefined||payload.renewal_completed_at!==undefined)throw unavailable();
  if(payload.order_status==='setup_complete'||payload.order_status==='setup_expired'){
    const expires=typeof payload.setup_expires_at==='string'?Date.parse(payload.setup_expires_at):NaN;
    const checked=typeof payload.setup_checked_at==='string'?Date.parse(payload.setup_checked_at):NaN;
    if(!test||!Number.isFinite(expires)||!Number.isFinite(checked)
      ||(expires>checked)!==provider)throw unavailable();
    if(payload.order_status==='setup_expired')return {kind:'expired',title:'Service period ended',
      message:'Your test payment is saved and did not charge your card. The saved streaming service period has ended. Contact support about renewal; do not pay again for this order.'};
  }
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
