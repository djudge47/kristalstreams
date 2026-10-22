import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { reviewServiceBatch, serviceSyncApi, syncUuid } from '../../../_shared/ks-crm-service-sync-client.js';
import type { ServiceSyncBatch, ServiceValues } from '../../../_shared/ks-crm-service-sync-client.js';

const storageKey='ks.crm.service-sync.batch.v1';
const savedReference=()=>{try{const id=sessionStorage.getItem(storageKey);return syncUuid(id)?id:'';}catch{return '';}};
const remember=(id:string)=>{try{sessionStorage.setItem(storageKey,id);}catch{/* The server still retains the review. */}};
const show=(key:string,value:ServiceValues[keyof ServiceValues])=>value===null?'Not recorded':typeof value==='boolean'?value?'Yes':'No':key==='expiration_at'&&typeof value==='string'
  ?new Date(value).toLocaleString('en-US',{timeZone:'America/New_York',year:'numeric',month:'short',day:'numeric',hour:'numeric',minute:'2-digit',second:'2-digit',timeZoneName:'short'}):String(value);
const labels:Record<keyof ServiceValues,string>={package_name:'Package',connections_allowed:'Connections',expiration_at:'Service expiration',account_status:'Service status',trial:'Trial'};
const reasons:Record<string,string>={crm_changed:'CRM record changed; prepare a fresh review.',package_unverified:'The current XUI package could not be identified.',
  trial_classification_changed:'Trial classification changed; review separately.',protected_preview_account:'Protected Preview setup; left unchanged.',read_failed:'XUI details could not be verified.'};

const BulkCrmServiceSync:React.FC<{customerIds:string[];loading:boolean;onApplied:()=>Promise<void>}> = ({customerIds,loading,onApplied})=>{
  const identityKey=useMemo(()=>[...customerIds].sort().join(','),[customerIds]);
  const [batch,setBatch]=useState<ServiceSyncBatch|null>(null);
  const [reference,setReference]=useState(savedReference);
  const [phase,setPhase]=useState<'idle'|'reviewing'|'loading'|'applying'>('idle');
  const [message,setMessage]=useState('');const [error,setError]=useState('');
  const [confirmed,setConfirmed]=useState(false);const [unknown,setUnknown]=useState(false);const [clock,setClock]=useState(Date.now());
  const active=useRef<AbortController|null>(null);
  useEffect(()=>()=>{active.current?.abort();active.current=null;},[]);
  useEffect(()=>{
    if(active.current&&phase!=='applying'){active.current.abort();active.current=null;setPhase('idle');setMessage('Account selection changed. Load the saved review to check its status.');}
    setConfirmed(false);
    // Selection is used only when starting a new batch. The server owns all
    // before/after values and detects subsequent CRM edits before applying.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[identityKey]);
  useEffect(()=>{
    if(!batch)return;const timer=window.setTimeout(()=>setClock(Date.now()),Math.max(0,Date.parse(batch.expiresAt)-Date.now())+20);
    return()=>window.clearTimeout(timer);
  },[batch]);
  const getToken=async()=>{const{data,error:authError}=await supabase.auth.getSession();return authError?null:data.session?.access_token??null;};
  const execute=async(kind:'new'|'load'|'resume'|'apply')=>{
    if(active.current)return;
    if(kind==='apply'&&(!confirmed||unknown||batch?.state!=='review_ready'))return;
    const controller=new AbortController();active.current=controller;
    const nextPhase=kind==='apply'?'applying':kind==='load'?'loading':'reviewing';
    setPhase(nextPhase);setError('');setConfirmed(false);setClock(Date.now());
    const api=serviceSyncApi({getToken,signal:controller.signal});
    let batchId=reference;
    try{
      let current:ServiceSyncBatch;
      if(kind==='new'){
        if(unknown||!customerIds.length||customerIds.length>200||!customerIds.every(syncUuid)||new Set(customerIds).size!==customerIds.length)throw Error('Load 1 to 200 distinct CRM accounts first.');
        batchId=crypto.randomUUID();remember(batchId);setReference(batchId);setBatch(null);
        current=await api('create',batchId,{customerIds});
      }else{
        if(!syncUuid(batchId))throw Error('No saved review is available in this browser tab.');
        current=kind==='apply'?await api('apply',batchId,{confirmed:true}):await api('status',batchId);
      }
      if(active.current!==controller)return;
      setBatch(current);setUnknown(false);
      if(kind==='new'||kind==='resume'){
        current=await reviewServiceBatch({batch:current,api,signal:controller.signal,
          onBatch:value=>{if(active.current===controller)setBatch(value);},onProgress:value=>{if(active.current===controller)setMessage(value);}});
      }
      if(active.current!==controller)return;
      setBatch(current);
      setMessage(current.state==='applied'?`${current.appliedCount} CRM records updated. The saved result is retained.`
        :current.state==='review_ready'?'Review ready. Approve the proposed service details below, then apply them together.'
          :'Saved review loaded. Resume to check the remaining accounts.');
      if(current.state==='applied')void onApplied().catch(()=>setError('The update is saved. Refresh the CRM list to see it.'));
    }catch(failure){
      if(active.current===controller){
        if(kind==='apply'&&failure instanceof Error&&'code' in failure&&typeof failure.code==='string'&&['sync_crm_conflict','sync_review_expired','sync_review_incomplete'].includes(failure.code)){setUnknown(false);setError(failure.message);}
        else if(kind==='apply'){setUnknown(true);setError('Check the saved result before trying another update. The request may already have completed.');}
        else if(controller.signal.aborted)setMessage('Review paused. Load the saved review to resume.');
        else setError(failure instanceof Error?failure.message:'The bulk review could not finish. Load the saved review to resume.');
      }
    }finally{if(active.current===controller){active.current=null;setPhase('idle');}}
  };
  const items=batch?.items??[],ready=items.filter(i=>i.state==='ready'),pending=items.filter(i=>i.state==='pending').length;
  const skipped=items.filter(i=>i.state==='blocked'||i.state==='failed').length,matched=items.filter(i=>i.state==='matched').length;
  const expired=Boolean(batch&&Date.parse(batch.expiresAt)<=clock),busy=phase!=='idle';
  const button='inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300 disabled:opacity-50';
  return <section aria-labelledby="bulk-sync-title" className="rounded-2xl border border-cyan-400/30 bg-gray-900 p-5 sm:p-6">
    <p className="text-xs font-semibold uppercase tracking-widest text-cyan-300">XUI → CRM · Private Preview</p>
    <h2 id="bulk-sync-title" className="mt-2 text-xl font-bold text-white">Review and update CRM accounts together</h2>
    <p className="mt-2 max-w-4xl text-sm leading-6 text-gray-300">Prepare one review for all {customerIds.length} saved accounts, then apply the eligible corrections with one button. Updates cover packages, connection limits, service expiration and service status.</p>
    <p className="mt-2 text-sm text-cyan-200">Payments, prices, billing renewal dates, customer notes and passwords stay unchanged. This never renews XUI service or spends credits.</p>
    <p className="mt-2 text-xs text-gray-400">Up to 200 accounts per batch. Checks run about 30 seconds apart; allow roughly {Math.max(1,Math.ceil(customerIds.length/2))} minutes. Reviews are saved and can be resumed. Approve within two hours of starting.</p>
    <div className="mt-4 flex flex-wrap gap-2">
      <button type="button" disabled={busy||loading||unknown||!customerIds.length||customerIds.length>200} onClick={()=>void execute('new')} className={`${button} border-cyan-400/40 bg-cyan-500/10 text-cyan-100`}>
        {phase==='reviewing'?<Loader2 className="h-4 w-4 animate-spin" aria-hidden="true"/>:<RefreshCw className="h-4 w-4" aria-hidden="true"/>}Prepare bulk CRM update
      </button>
      {reference&&<button type="button" disabled={busy} onClick={()=>void execute('load')} className={`${button} border-gray-600 text-gray-200`}>{unknown?'Check saved result':'Load saved review'}</button>}
      {batch?.state==='reviewing'&&!expired&&<button type="button" disabled={busy||unknown} onClick={()=>void execute('resume')} className={`${button} border-gray-600 text-gray-200`}>Resume remaining checks</button>}
      {phase==='reviewing'&&<button type="button" onClick={()=>active.current?.abort()} className={`${button} border-gray-600 text-gray-200`}>Pause review</button>}
    </div>
    {error&&<p role="alert" className="mt-4 rounded-lg border border-amber-400/30 p-3 text-sm text-amber-200">{error}</p>}
    <div role="status" aria-live="polite" className="mt-4 text-sm text-gray-200">{message}{batch&&<p className="mt-2">{batch.total-pending} of {batch.total} checked · {batch.state==='applied'?`${batch.appliedCount} applied`:`${ready.length} proposed updates`} · {matched} already match · {skipped} left unchanged</p>}</div>
    {batch&&expired&&batch.state!=='applied'&&<p className="mt-3 text-sm text-amber-200">This review expired. Prepare a fresh bulk update.</p>}
    {batch?.state==='review_ready'&&ready.length>0&&!expired&&!unknown&&<div className="mt-5 rounded-xl border border-cyan-400/30 p-4">
      <label className="flex items-start gap-3 text-sm text-gray-200"><input type="checkbox" checked={confirmed} disabled={busy} onChange={e=>setConfirmed(e.target.checked)} className="mt-1 h-4 w-4 accent-cyan-400"/>I approve updating the {ready.length} CRM records with the proposed XUI service details shown below. Billing and XUI service will remain unchanged.</label>
      <button type="button" disabled={busy||!confirmed} onClick={()=>void execute('apply')} className={`${button} mt-4 border-cyan-400 bg-cyan-600 text-white`}>{phase==='applying'?'Applying CRM updates…':`Apply ${ready.length} CRM updates`}</button>
    </div>}
    {batch?.state==='applied'&&<p className="mt-4 rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-200">Saved: {batch.appliedCount} CRM records updated together. No provider change or credit spend.</p>}
    {items.length>0&&<div className="mt-5 max-h-[34rem] space-y-2 overflow-y-auto">{items.map(item=><details key={item.customerId} className="rounded-xl border border-gray-700 bg-gray-950/60 p-3">
      <summary className="cursor-pointer text-sm text-white"><span className="font-semibold">{item.username}</span><span className="ml-2 text-gray-400">Panel {item.panelId}</span><span className={`ml-3 ${item.state==='ready'?'text-cyan-200':item.state==='matched'?'text-green-300':'text-amber-200'}`}>{item.state==='ready'?(batch?.state==='applied'?'Updated in CRM':'Proposed update'):item.state==='matched'?'Already matches':item.state==='pending'?'Waiting to check':'Left unchanged'}</span></summary>
      {item.reason&&<p className="mt-3 text-sm text-amber-200">{reasons[item.reason]??'Review this account separately.'}</p>}
      {item.after&&<div className="mt-3 overflow-x-auto"><table className="w-full text-left text-xs"><caption className="sr-only">Proposed CRM correction for {item.username}</caption><thead><tr className="text-gray-400"><th scope="col" className="p-2">Detail</th><th scope="col" className="p-2">Saved CRM</th><th scope="col" className="p-2">Proposed from XUI</th></tr></thead><tbody>{(Object.keys(labels) as (keyof ServiceValues)[]).map(key=><tr key={key} className="border-t border-gray-800 text-gray-200"><th scope="row" className="p-2 font-medium">{labels[key]}</th><td className="p-2">{show(key,item.before[key])}</td><td className={`p-2 ${item.before[key]!==item.after?.[key]?'text-cyan-200':''}`}>{show(key,item.after![key])}</td></tr>)}</tbody></table></div>}
    </details>)}</div>}
  </section>;
};
export default BulkCrmServiceSync;
