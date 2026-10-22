import {useEffect,useRef,useState} from 'react';
import {supabase} from '../../lib/supabase';
import {readPortalLink,type PortalLink} from '../../../_shared/ks-customer-crm.js';

type Customer={id:string;external_id:number;username:string;customer_name:string|null};
export default function CustomerPortalLink({customer,onClose}:{customer:Customer;onClose:()=>void}) {
  const [email,setEmail]=useState(''),[review,setReview]=useState<PortalLink|null>(null),[confirmed,setConfirmed]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const request=useRef<AbortController|null>(null);
  useEffect(()=>()=>{request.current?.abort();request.current=null;},[]);
  const submit=async(save=false)=>{
    if(request.current||save&&(!review||!confirmed))return;
    const controller=new AbortController();request.current=controller;setBusy(true);setError('');
    const timeout=window.setTimeout(()=>controller.abort(),20000);
    try{
      const {data,error:authError}=await supabase.auth.getSession();
      if(controller.signal.aborted||request.current!==controller)return;
      if(authError||!data.session?.access_token)throw Error('Sign in to your administrator account again.');
      const response=await fetch('/api/ks-roomba-crm?view=portal-link',{method:'POST',cache:'no-store',signal:controller.signal,
        headers:{Authorization:`Bearer ${data.session.access_token}`,'Content-Type':'application/json'},
        body:JSON.stringify(save?{action:'link',review,confirmed:true}:{action:'review',customerId:customer.id,email:email.trim().toLowerCase()})});
      const payload=await response.json().catch(()=>null);
      if(controller.signal.aborted||request.current!==controller)return;
      if(!response.ok)throw Error(payload?.error||'The link result could not be verified. Review the same account again before saving.');
      const next=readPortalLink(payload?.review,customer.id);
      if(next.panelId!==customer.external_id||next.username!==customer.username)throw Error('The service identity changed. Close this form and refresh the customer record.');
      setReview(next);setConfirmed(false);
    }catch(failure){if(request.current===controller){setReview(null);setConfirmed(false);setError(failure instanceof Error?failure.message:'The account link could not be verified. Review it again.');}}
    finally{window.clearTimeout(timeout);if(request.current===controller){request.current=null;setBusy(false);}}
  };
  return <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4"><section role="dialog" aria-modal="true" aria-labelledby="portal-link-heading" className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-gray-700 bg-gray-900 p-5 sm:p-7">
    <h2 id="portal-link-heading" className="text-xl font-bold text-white">Link website account</h2>
    <p className="mt-2 text-gray-300">{customer.customer_name||customer.username} · Panel ID {customer.external_id}</p>
    <p className="mt-3 text-sm leading-6 text-gray-400">This lets the verified website account see this service record and its recorded payments. Verify ownership with the customer before saving.</p>
    <form className="mt-5" onSubmit={event=>{event.preventDefault();void submit();}}>
      <label className="block text-sm text-gray-300">Website account email<input type="email" required maxLength={254} autoComplete="off" disabled={busy} value={email} onChange={event=>{setEmail(event.target.value);setReview(null);setConfirmed(false);}} className="mt-2 min-h-11 w-full rounded-xl border border-gray-600 bg-gray-950 px-3 text-white" /></label>
      <button type="submit" disabled={busy||!email.trim()} className="mt-3 min-h-11 rounded-xl border border-cyan-500/40 px-4 py-2 font-semibold text-cyan-200 disabled:opacity-50">{busy?'Checking…':'Review website account'}</button>
    </form>
    {error&&<p role="alert" className="mt-4 text-sm text-amber-200">{error}</p>}
    {review&&<div className="mt-5 rounded-xl border border-gray-700 p-4 text-sm text-gray-300">
      <p className="font-semibold text-white">{review.email}</p><p className="mt-2">Email confirmed · streaming account {review.username}</p>
      <p className="mt-2 break-all text-xs text-gray-500">Website account reference: {review.userId}</p>
      {review.linked?<p role="status" className="mt-4 font-semibold text-emerald-300">Website account linked. Service and payments have not been changed.</p>:<>
        <label className="mt-4 flex items-start gap-3"><input type="checkbox" checked={confirmed} disabled={busy} onChange={e=>setConfirmed(e.target.checked)} className="mt-1" /><span>I verified that this website account owns this streaming service and should see its payment history.</span></label>
        <button type="button" disabled={busy||!confirmed} onClick={()=>void submit(true)} className="mt-4 min-h-11 rounded-xl bg-cyan-600 px-4 py-2 font-semibold text-white disabled:opacity-50">Save verified account link</button>
      </>}
    </div>}
    <button type="button" disabled={busy} onClick={onClose} className="mt-5 min-h-11 rounded-xl border border-gray-600 px-4 py-2 text-gray-200 disabled:opacity-50">Close</button>
  </section></div>;
}
