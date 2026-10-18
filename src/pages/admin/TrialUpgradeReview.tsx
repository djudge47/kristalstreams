import React, { useEffect, useRef, useState } from 'react';
import { ClipboardCheck, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

type UpgradeReview = {
  draftOnly:true; providerActionSent:false; paymentTestMode:true; credentialsPolicy:'keep_existing';
  existing:{customerId:string;lineId:string;username:string;savedExpiresAt:string};
  proposed:{packageId:string;packageName:string;duration:string;credits:number;connections:number;bouquetCount:number};
  packagesCheckedAt:string;requiresCurrentLineCheck:false;
  execution:{enabled:false;reason:'trial_conversion_unverified'};
  currentTrial:{checkedAt:string;expiresAt:string;creditsAvailable:number;bouquetCount:number;identityVerified:true;resellerVerified:true;channelGroupsUnchanged:true;sufficientCredits:true};
};

const TrialUpgradeReview:React.FC<{sessionId:string}>=({sessionId})=>{
  const [review,setReview]=useState<UpgradeReview|null>(null);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState('');
  const pending=useRef<AbortController|null>(null);
  const busy=useRef(false);
  useEffect(()=>()=>{pending.current?.abort();pending.current=null;},[]);
  const prepare=async()=>{
    if(busy.current)return;
    busy.current=true;const controller=new AbortController();pending.current=controller;
    const timeout=window.setTimeout(()=>controller.abort(),50000);
    setLoading(true);setError('');setReview(null);
    try{
      const {data,error:authError}=await supabase.auth.getSession();
      if(authError||!data.session?.access_token)throw new Error('Please sign in again to your admin account.');
      const response=await fetch(`/api/ks-preview-trial-upgrade?sessionId=${encodeURIComponent(sessionId)}`,{method:'GET',cache:'no-store',signal:controller.signal,headers:{Authorization:`Bearer ${data.session.access_token}`,Accept:'application/json'}});
      const payload=await response.json().catch(()=>null);
      if(controller.signal.aborted||pending.current!==controller)return;
      if(!response.ok)throw new Error(payload?.error||'The upgrade review is unavailable.');
      const draft=payload?.review;
      if(draft?.draftOnly!==true||draft.providerActionSent!==false||draft.paymentTestMode!==true||draft.credentialsPolicy!=='keep_existing'||draft.requiresCurrentLineCheck!==false||draft.execution?.enabled!==false||draft.execution.reason!=='trial_conversion_unverified'||draft.currentTrial?.identityVerified!==true||draft.currentTrial.resellerVerified!==true||draft.currentTrial.channelGroupsUnchanged!==true||draft.currentTrial.sufficientCredits!==true||!draft.existing||!draft.proposed)throw new Error('The upgrade review could not be verified.');
      setReview(draft as UpgradeReview);
    }catch(failure){if(pending.current===controller)setError(controller.signal.aborted?'The package check took too long. Try again.':failure instanceof Error?failure.message:'The upgrade review is unavailable.');}
    finally{window.clearTimeout(timeout);busy.current=false;if(pending.current===controller){pending.current=null;setLoading(false);}}
  };
  return <div className="mt-5 border-t border-white/10 pt-4">
    <button type="button" onClick={prepare} disabled={loading} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200 hover:bg-red-500/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-red-400 disabled:opacity-60">{loading?<Loader2 className="h-4 w-4 animate-spin" aria-hidden="true"/>:<ClipboardCheck className="h-4 w-4" aria-hidden="true"/>}{loading?'Preparing review...':review?'Refresh trial upgrade review':'Review trial upgrade'}</button>
    {error&&<p role="alert" className="mt-3 text-sm leading-6 text-amber-200">{error}</p>}
    <div role="status" aria-live="polite" className="sr-only">{loading?'Checking the saved trial, current Roomba line, account and paid packages.':review?'Current trial verified. Upgrade remains unavailable pending Roomba conversion instructions.':''}</div>
    {review&&<div className="mt-4 rounded-xl border border-red-400/20 bg-gray-900 p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-red-300">Current trial checked · Review only</p>
      <h4 className="mt-2 break-all text-lg font-bold text-white">{review.existing.username}</h4>
      <p className="mt-1 text-xs text-gray-500">Verified Roomba line {review.existing.lineId}</p>
      <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div className="col-span-2"><dt className="text-gray-500">Proposed paid package</dt><dd className="mt-1 font-semibold text-white">{review.proposed.packageName}</dd></div>
        <div><dt className="text-gray-500">Service duration</dt><dd className="mt-1 text-white">{review.proposed.duration}</dd></div>
        <div><dt className="text-gray-500">Provider cost</dt><dd className="mt-1 font-semibold text-amber-300">{review.proposed.credits} Roomba credit{review.proposed.credits===1?'':'s'}</dd></div>
        <div><dt className="text-gray-500">Connections</dt><dd className="mt-1 text-white">{review.proposed.connections}</dd></div>
        <div><dt className="text-gray-500">Included channel groups</dt><dd className="mt-1 text-white">{review.proposed.bouquetCount}</dd></div>
        <div><dt className="text-gray-500">Available credits</dt><dd className="mt-1 text-white">{review.currentTrial.creditsAvailable}</dd></div>
        <div><dt className="text-gray-500">Current trial ends</dt><dd className="mt-1 text-white">{new Date(review.currentTrial.expiresAt).toLocaleString()}</dd></div>
      </dl>
      <p className="mt-4 text-sm font-medium text-emerald-300">Current line, reseller, expiry and channel groups match.</p>
      <p className="mt-2 text-xs leading-5 text-gray-400">The planned upgrade will keep the existing streaming login. This check discards password fields from Roomba's response and does not store or change them. Roomba must confirm how a trial converts to paid service while retaining its login and how the final expiration is set.</p>
      <div className="mt-4 rounded-lg border border-amber-400/30 bg-amber-500/10 p-3"><p className="text-sm font-semibold text-amber-200">Upgrade unavailable — waiting for Roomba's conversion instructions.</p><p className="mt-1 text-xs leading-5 text-amber-100/80">The supplied API guide verifies paid renewals but explicitly leaves trial-to-paid conversion unverified. This check cannot activate service.</p></div>
      <p className="mt-3 rounded-lg bg-amber-500/10 p-3 text-xs leading-5 text-amber-200">This review spends no credits. Applying a paid upgrade would use real Roomba credits, even when the Stripe payment is a test.</p>
      <p className="mt-3 text-xs text-gray-500">Line checked {new Date(review.currentTrial.checkedAt).toLocaleString()}. Packages checked {new Date(review.packagesCheckedAt).toLocaleString()}. No activation request has been sent.</p>
    </div>}
  </div>;
};
export default TrialUpgradeReview;
