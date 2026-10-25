import {useCallback,useEffect,useRef,useState} from 'react';
import {Link} from 'react-router-dom';
import {supabase} from '../lib/supabase';
import {readCustomerCrm,savedServiceLabel,type CustomerCrmSnapshot,type PaymentCursor} from '../../_shared/ks-customer-crm.js';
import {paymentMethodLabel} from '../../_shared/ks-crm-renewal-payment.js';

const date=(value:string|null)=>value?new Date(value).toLocaleString('en-US',{timeZone:'America/New_York',month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit',timeZoneName:'short'}):'Not recorded';
const money=(cents:number)=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(cents/100);

export type CustomerServiceState={accountId:string;status:'loading'|'linked'|'unlinked'|'unavailable'|'hidden'|'signed_out'};

export default function CustomerCrmService({accountId,onServiceStateChange,view='service'}:{accountId:string;onServiceStateChange?:(state:CustomerServiceState)=>void;view?:'service'|'connections'}) {
  const [snapshot,setSnapshot]=useState<CustomerCrmSnapshot|null>(null);
  const [paymentPages,setPaymentPages]=useState<Array<PaymentCursor|null>>([null]);
  const [loading,setLoading]=useState(true),[error,setError]=useState(''),[hidden,setHidden]=useState(false),[signedOut,setSignedOut]=useState(false);
  const request=useRef<AbortController|null>(null);
  const load=useCallback(async(cursor:PaymentCursor|null=null,direction:'first'|'next'|'previous'='first')=>{
    if(request.current)return;
    const controller=new AbortController();request.current=controller;
    const timeout=window.setTimeout(()=>controller.abort(),20000);
    setLoading(true);setError('');if(!cursor)setSnapshot(null);
    try{
      const {data,error:authError}=await supabase.auth.getSession();
      if(controller.signal.aborted||request.current!==controller)return;
      if(authError||!data.session?.access_token||data.session.user.id!==accountId){setSignedOut(true);setSnapshot(null);return;}
      const query=new URLSearchParams({view:'crm-service',...(cursor?{beforeAt:cursor.paidAt,beforeId:cursor.id}:{})});
      const response=await fetch(`/api/ks-customer-setup?${query}`,{method:'GET',cache:'no-store',signal:controller.signal,
        headers:{Authorization:`Bearer ${data.session.access_token}`,Accept:'application/json'}});
      if(controller.signal.aborted||request.current!==controller)return;
      if(response.status===404){setHidden(true);setSnapshot(null);return;}
      if(response.status===401){setSignedOut(true);setSnapshot(null);return;}
      if(response.status===403)setSnapshot(null);
      const payload=await response.json().catch(()=>null);
      if(controller.signal.aborted||request.current!==controller)return;
      if(!response.ok)throw Error('Your saved service and payment details could not be checked. Please try again or contact support.');
      const next=readCustomerCrm(payload,accountId);
      setPaymentPages(previous=>direction==='next'?[...previous,cursor]:direction==='previous'?previous.slice(0,-1):[null]);
      // Each page replaces the previous list rather than growing the phone page.
      setSnapshot(next);
    }catch{
      if(request.current===controller)setError(controller.signal.aborted?'The check took too long. Please try again.':'Your saved service and payment details could not be checked. Please try again or contact support.');
    }finally{window.clearTimeout(timeout);if(request.current===controller){request.current=null;setLoading(false);}}
  },[accountId]);
  useEffect(()=>{
    setSnapshot(null);setPaymentPages([null]);setError('');setHidden(false);setSignedOut(false);void load();
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,session)=>{
      if(session?.user?.id!==accountId){request.current?.abort();request.current=null;setSnapshot(null);setPaymentPages([null]);setSignedOut(true);setLoading(false);}
    });
    return()=>{request.current?.abort();request.current=null;subscription.unsubscribe();};
  },[accountId,load]);
  const serviceStatus:CustomerServiceState['status']=signedOut?'signed_out':hidden?'hidden':snapshot?.accountId===accountId
    ?snapshot.services.length?'linked':'unlinked':error?'unavailable':'loading';
  useEffect(()=>{onServiceStateChange?.({accountId,status:serviceStatus});},[accountId,serviceStatus,onServiceStateChange]);
  const connectionsOnly=view==='connections';
  if(hidden)return connectionsOnly?<section className="rounded-xl border border-gray-700 p-4 text-sm text-gray-300">Your saved connection allowance is unavailable here. Contact support to check your streaming service.</section>:null;
  return <section aria-labelledby={connectionsOnly?"crm-connections-heading":"crm-service-heading"} className="mb-8 rounded-2xl border border-cyan-400/20 bg-dark-100 p-5 sm:p-7">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 id={connectionsOnly?"crm-connections-heading":"crm-service-heading"} className="text-2xl font-bold text-white">{connectionsOnly?"Your connection allowance":"Your streaming service"}</h2>
      {!signedOut&&<button type="button" disabled={loading} onClick={()=>void load()} className="min-h-11 rounded-xl border border-gray-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{loading?'Checking…':'Refresh service details'}</button>}</div>
    <div role="status" aria-live="polite">{loading&&<p className="mt-4 text-sm text-gray-400">Checking your saved service details…</p>}</div>
    {signedOut&&<p className="mt-4 text-gray-300">Your account session changed. <Link to="/login" className="text-primary underline">Sign in again</Link> to see your own records.</p>}
    {error&&<div role="alert" className="mt-4 rounded-xl border border-amber-500/30 p-4 text-sm text-amber-200"><p>{connectionsOnly?"Your saved connection allowance could not be checked. Please try again or contact support.":error}</p>{!connectionsOnly&&<p className="mt-2">If you already paid, please do not pay again while we check your records.</p>}</div>}
    {snapshot?.accountId===accountId&&<>
      {snapshot.services.length===0?<p className="mt-4 text-gray-300">Your streaming account has not been linked to this website login yet. This does not mean your service is inactive or your payment is missing. Contact support to verify the connection.</p>:<>
        <p className="mt-3 text-sm text-gray-400">{connectionsOnly?"The saved allowance is the number of simultaneous streams your service permits. Current usage is unavailable here.":"Saved service records, separate from your website plan. This is not a live playback or online-status check."}</p>
        <div className="mt-5 space-y-5">{snapshot.services.map(service=><article key={service.customerId} className="rounded-xl border border-gray-700 bg-dark-200 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="min-w-0 break-words text-lg font-semibold text-white">{service.name||service.username}</h3><span className="rounded-full bg-cyan-500/10 px-3 py-1 text-sm text-cyan-200">{savedServiceLabel(service)}</span></div>
          <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-3"><div><dt className="text-gray-400">Package</dt><dd className="mt-1 break-words text-white">{service.packageName||'Contact support'}</dd></div><div><dt className="text-gray-400">Connections allowed</dt><dd className="mt-1 text-white">{service.connections}</dd></div><div><dt className="text-gray-400">Saved service expiration</dt><dd className="mt-1 text-white">{date(service.expiresAt)}</dd></div></dl>
          <p className="mt-4 text-xs text-gray-500">Service record updated {date(service.updatedAt)}.</p>
          {!connectionsOnly&&<>
          <h4 className="mt-6 border-t border-gray-700 pt-5 font-semibold text-white">Payment history</h4>
          {service.legacyPaid&&<p className="mt-2 text-sm text-cyan-200">Your earlier service term was confirmed as paid under old pricing. Only recorded amounts and received dates are listed below.</p>}
          <div className="mt-3 space-y-3">{snapshot.payments.filter(p=>p.customerId===service.customerId).map(payment=><div key={payment.id} className="rounded-xl border border-gray-700 p-4">
            <div className="flex flex-wrap justify-between gap-2"><p className="font-semibold text-emerald-300">{money(payment.amountCents)} · {payment.source==='website_checkout'?'Website checkout':paymentMethodLabel(payment.method||'')}</p><p className="text-sm text-gray-300">{payment.source==='website_checkout'?'Payment recorded':'Received'} {date(payment.paidAt)}</p></div>
            {payment.months!==null&&<p className="mt-2 text-sm text-gray-300">Requested package: {payment.months} months · {payment.connections} connection{payment.connections===1?'':'s'}</p>}
            {payment.source==='website_checkout'?<div className="mt-2 text-xs leading-5 text-gray-300"><p>Renewal completed {date(payment.renewalCompletedAt||null)}.</p><p>Expiry recorded for this renewal: {date(payment.renewalExpiresAt||null)}.</p><p className="mt-1 text-gray-400">Your current saved service details are shown above and may include later changes.</p></div>:<p className="mt-2 text-xs text-gray-400">Payment recorded. This receipt alone does not confirm a service extension.</p>}
            <details className="mt-2 text-xs text-gray-500"><summary className="cursor-pointer">Payment reference for support</summary><p className="mt-2 break-all">{payment.id}</p></details>
          </div>)}</div>
          {!snapshot.payments.some(p=>p.customerId===service.customerId)&&<p className="mt-3 text-sm text-gray-400">No payment amounts are listed on this page. Older records may be available below. Contact support if you need a receipt.</p>}
          </>}
        </article>)}</div>
        {!connectionsOnly&&paymentPages.length>1&&<button type="button" disabled={loading} onClick={()=>void load(paymentPages[paymentPages.length-2]??null,'previous')} className="mr-3 mt-5 min-h-11 rounded-xl border border-gray-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Newer payments</button>}
        {!connectionsOnly&&snapshot.nextCursor&&<button type="button" disabled={loading} onClick={()=>void load(snapshot.nextCursor,'next')} className="mt-5 min-h-11 rounded-xl border border-gray-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Load older payments</button>}
        <p className="mt-4 text-xs text-gray-500">Records checked {date(snapshot.checkedAt)}.</p>
      </>}
      {!connectionsOnly&&<Link to="/client/support/new" className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-primary px-5 py-2 font-semibold text-white">Get account help</Link>}
    </>}
  </section>;
}
