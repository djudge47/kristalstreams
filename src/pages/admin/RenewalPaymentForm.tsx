import React, {useRef,useState} from 'react';
import {X} from 'lucide-react';
import {supabase} from '../../lib/supabase';
import {getRetailPrice} from '../../../_shared/ks-retail-pricing.js';
import {amountToCents,paymentMethods,paymentUuid,validPaymentInput,renewalPaymentApi} from '../../../_shared/ks-crm-renewal-payment.js';
import type {RenewalPaymentInput,RenewalPaymentReceipt} from '../../../_shared/ks-crm-renewal-payment.js';

interface Pending {receiptId:string;input:RenewalPaymentInput;}
const key=(id:string)=>`ks.crm.renewal-payment.v1.${id}`;
const restore=(customerId:string):Pending|null=>{try{const value=JSON.parse(sessionStorage.getItem(key(customerId))||'null');return paymentUuid(value?.receiptId)&&value?.input?.customerId===customerId&&validPaymentInput(value.input)?value:null;}catch{return null;}};
const dollars=(cents:number)=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(cents/100);
const RenewalPaymentForm:React.FC<{customer:{id:string;username:string;customer_name:string|null;package_name:string|null;connections_allowed:number};onClose:()=>void;onSaved:()=>Promise<void>}> = ({customer,onClose,onSaved})=>{
 const [pending,setPending]=useState<Pending|null>(()=>restore(customer.id));
 const [receipt,setReceipt]=useState<RenewalPaymentReceipt|null>(null);
 const [months,setMonths]=useState(()=>{const match=customer.package_name?.match(/^(1|3|6|12) months?/i);return match?Number(match[1]):1;});
 const [connections,setConnections]=useState(Math.min(5,Math.max(1,customer.connections_allowed)));
 const [amount,setAmount]=useState(''),[paidAt,setPaidAt]=useState(''),[method,setMethod]=useState(''),[reference,setReference]=useState(''),[reason,setReason]=useState('');
 const [rejected,setRejected]=useState(false);
 const [confirmed,setConfirmed]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const lock=useRef(false);const price=getRetailPrice(months,connections),cents=amountToCents(amount),frozen=busy||Boolean(pending)||Boolean(receipt);
 const getToken=async()=>{const{data,error:authError}=await supabase.auth.getSession();return authError?null:data.session?.access_token??null;};
 const send=async(action:'record'|'status',saved:Pending)=>{
  if(lock.current)return;lock.current=true;setBusy(true);setError('');setRejected(false);
  try{const result=await renewalPaymentApi({getToken})(action,saved.receiptId,saved.input);
   if(result.customerId!==customer.id)throw Error('This receipt belongs to a different customer.');
   setReceipt(result);setPending(null);await onSaved().catch(()=>setError('The payment is saved. Refresh the customer list to see its history.'));
  }catch(failure){setRejected(action==='record'&&failure instanceof Error&&'code' in failure&&['payment_price_changed','payment_input_invalid'].includes(String(failure.code)));setError(failure instanceof Error?failure.message:'Check the saved result before retrying this payment.');}
  finally{lock.current=false;setBusy(false);}
 };
 const save=(event:React.FormEvent)=>{
  event.preventDefault();if(lock.current||!confirmed||frozen||!price||cents===null||!paidAt||!method)return;
  const date=new Date(paidAt);if(!Number.isFinite(date.getTime())){setError('Enter the date and time the payment was received.');return;}
  const input:RenewalPaymentInput={customerId:customer.id,months,connections,amountCents:cents,paidAt:date.toISOString(),method,reference:reference.trim(),adjustmentReason:reason.trim()};
  if(!validPaymentInput(input)||(cents!==price.totalCents&&input.adjustmentReason.length<3)){setError('Check the payment date and explain any price difference.');return;}
  const saved={receiptId:crypto.randomUUID(),input};
  // Persist before sending. If storage is blocked, fail before any write.
  try{sessionStorage.setItem(key(customer.id),JSON.stringify(saved));}catch{setError('This browser cannot retain the payment reference. Allow session storage before saving.');return;}
  setPending(saved);setConfirmed(false);void send('record',saved);
 };
 const another=()=>{try{sessionStorage.removeItem(key(customer.id));}catch{setError('The saved reference could not be cleared.');return;}setReceipt(null);setPending(null);setRejected(false);setAmount('');setPaidAt('');setMethod('');setReference('');setReason('');setConfirmed(false);setError('');};
 return <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 sm:items-center sm:p-4"><section role="dialog" aria-modal="true" aria-labelledby="renewal-payment-title" className="max-h-[94vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl border border-gray-700 bg-gray-900 p-5 text-gray-200 sm:rounded-3xl sm:p-6">
  <div className="flex items-start justify-between gap-3"><div><h2 id="renewal-payment-title" className="text-xl font-bold text-white">Record renewal payment</h2><p className="mt-1 text-sm text-gray-400">{customer.customer_name||customer.username} · {customer.username}</p></div><button type="button" disabled={busy} onClick={onClose} aria-label="Close renewal payment form" className="rounded-lg p-2 text-gray-300 disabled:opacity-50"><X className="h-5 w-5"/></button></div>
  <p className="mt-4 rounded-xl border border-cyan-400/20 bg-cyan-500/5 p-3 text-sm text-cyan-200">Record money already received. This does not charge the customer, renew XUI service, change current service dates or connections, or spend credits.</p>
  {error&&<p role="alert" className="mt-4 rounded-xl border border-amber-400/30 p-3 text-sm text-amber-200">{error}</p>}
  {receipt?<div role="status" className="mt-5 space-y-3 rounded-xl border border-green-400/30 p-4"><h3 className="font-semibold text-green-300">Payment saved once</h3><p>{dollars(receipt.amountCents)} received · {paymentMethods[receipt.method]} · {new Date(receipt.paidAt).toLocaleString()}</p><p>Requested renewal: {receipt.months} months · {receipt.connections} connections. Website price: {dollars(receipt.catalogCents)}.</p><p className="text-sm text-cyan-200">XUI service was not renewed by this payment record. Your current service stays as it was.</p><p className="break-all text-xs text-gray-400">Receipt: {receipt.receiptId}</p><div className="flex flex-wrap gap-2"><button type="button" onClick={onClose} className="rounded-xl bg-green-600 px-4 py-3 font-semibold text-white">Done</button><button type="button" onClick={another} className="rounded-xl border border-gray-600 px-4 py-3 text-sm">Record another payment</button></div></div>
  :pending?<div className="mt-5 space-y-3 rounded-xl border border-amber-400/30 p-4"><p>A payment reference is saved for {dollars(pending.input.amountCents)}, {pending.input.months} months and {pending.input.connections} connections. Check its result before making another payment entry.</p><p className="break-all text-xs text-gray-400">Reference: {pending.receiptId}</p><div className="flex flex-wrap gap-2"><button disabled={busy} type="button" onClick={()=>void send('status',pending)} className="rounded-xl bg-cyan-600 px-4 py-3 font-semibold text-white disabled:opacity-50">{busy?'Checking…':'Check saved result'}</button><button disabled={busy} type="button" onClick={()=>void send('record',pending)} className="rounded-xl border border-gray-600 px-4 py-3 text-sm disabled:opacity-50">Retry same saved payment</button>{rejected&&<button disabled={busy} type="button" onClick={another} className="rounded-xl border border-gray-600 px-4 py-3 text-sm">Edit rejected payment</button>}</div></div>
  :<form onSubmit={save} className="mt-5 space-y-4"><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm">Requested months<select value={months} disabled={frozen} onChange={e=>{setMonths(Number(e.target.value));setConfirmed(false);}} className="mt-1.5 w-full rounded-xl border border-gray-600 bg-gray-950 p-3">{[1,3,6,12].map(n=><option key={n} value={n}>{n} month{n===1?'':'s'}</option>)}</select></label><label className="text-sm">Requested connections<select value={connections} disabled={frozen} onChange={e=>{setConnections(Number(e.target.value));setConfirmed(false);}} className="mt-1.5 w-full rounded-xl border border-gray-600 bg-gray-950 p-3">{[1,2,3,4,5].map(n=><option key={n} value={n}>{n} connection{n===1?'':'s'}</option>)}</select></label></div>
  <div className="rounded-xl border border-gray-700 bg-gray-950 p-4"><p className="text-xs text-gray-400">Current website price for this renewal</p><p className="mt-1 text-2xl font-bold text-white">{price?dollars(price.totalCents):'Select a supported plan'}</p><p className="mt-1 text-xs text-gray-400">Full term price in USD. Historical payments retain their original records.</p></div>
  <div className="grid gap-4 sm:grid-cols-2"><label className="text-sm">Amount actually received (USD)<input required type="number" min="0.01" max="10000" step="0.01" value={amount} onChange={e=>{setAmount(e.target.value);setConfirmed(false);}} className="mt-1.5 w-full rounded-xl border border-gray-600 bg-gray-950 p-3" placeholder="Enter received amount"/></label><label className="text-sm">Payment received date and time<input required type="datetime-local" value={paidAt} onChange={e=>{setPaidAt(e.target.value);setConfirmed(false);}} className="mt-1.5 w-full rounded-xl border border-gray-600 bg-gray-950 p-3"/></label><label className="text-sm">Payment method<select required value={method} onChange={e=>{setMethod(e.target.value);setConfirmed(false);}} className="mt-1.5 w-full rounded-xl border border-gray-600 bg-gray-950 p-3"><option value="">Choose method</option>{Object.entries(paymentMethods).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label><label className="text-sm">Payment reference (optional)<input maxLength={120} value={reference} onChange={e=>{setReference(e.target.value);setConfirmed(false);}} className="mt-1.5 w-full rounded-xl border border-gray-600 bg-gray-950 p-3"/></label></div>
  {price&&cents!==null&&cents!==price.totalCents&&<label className="block text-sm">Why does the amount differ from {dollars(price.totalCents)}?<input required minLength={3} maxLength={300} value={reason} onChange={e=>{setReason(e.target.value);setConfirmed(false);}} className="mt-1.5 w-full rounded-xl border border-amber-500/40 bg-gray-950 p-3" placeholder="For example, partial payment or agreed discount"/></label>}
  <label className="flex items-start gap-3 text-sm"><input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)} className="mt-1 h-4 w-4 accent-cyan-400"/>I confirm this payment was received for the selected customer and requested renewal. Saving records the payment only.</label>
  <button type="submit" disabled={!confirmed||cents===null||!paidAt||!method||busy} className="min-h-12 w-full rounded-xl bg-cyan-600 px-4 py-3 font-semibold text-white disabled:opacity-50">Save received payment</button></form>}
 </section></div>;
};
export default RenewalPaymentForm;
