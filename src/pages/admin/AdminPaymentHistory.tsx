import {useState} from 'react';
import {adminPaymentMethod,paymentDateLabel,comparePaymentOrder} from '../../../_shared/ks-admin-payment-history.js';
import {receivedPaymentDateTime,type CrmPaymentSummary} from '../../../_shared/ks-crm-payment-summary.js';
import {paymentMethodLabel} from '../../../_shared/ks-crm-renewal-payment.js';
const stamp=(v:string|null|undefined)=>v&&Number.isFinite(Date.parse(v))?receivedPaymentDateTime(v):'Not recorded';
const money=(v:number)=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(v);
export default function AdminPaymentHistory({payments,loading,error}:{payments:CrmPaymentSummary[];loading:boolean;error:string|null}){
  const [page,setPage]=useState(0),size=20,ordered=[...payments].sort(comparePaymentOrder),last=Math.max(0,Math.ceil(ordered.length/size)-1),current=Math.min(page,last);
  if(loading)return <p role="status" className="rounded-xl border border-gray-800 p-4 text-sm text-gray-400">Loading payment history…</p>;
  if(error)return <p role="alert" className="rounded-xl border border-amber-500/30 p-4 text-sm text-amber-200">Payment history could not be checked. Refresh the customer workspace before making a payment decision.</p>;
  return <div><p className="mb-3 text-xs leading-5 text-gray-400">Website dates show when the payment was recorded. Amounts and renewal expiries are historical records; this is not a net balance or live service check.</p>
    {!ordered.length?<p className="p-4 text-sm text-gray-400">No payment records found.</p>:<>
      <ul aria-label="Customer payment history" className="space-y-3">{ordered.slice(current*size,(current+1)*size).map(p=><li key={p.id} className="min-w-0 rounded-xl border border-gray-700 bg-gray-950 p-3">
        <div className="flex flex-wrap justify-between gap-2"><p className="font-semibold text-green-300">{money(Number(p.amount))}</p><p className="text-xs text-gray-400">{paymentDateLabel(p)} {stamp(p.paid_at)}</p></div>
        <p className="mt-2 text-xs text-gray-400">{adminPaymentMethod(p)||paymentMethodLabel(p.payment_method)} · {p.payment_status}</p>
        {p.source==='website_checkout'?<p className="mt-2 text-xs leading-5 text-gray-300">Renewal completed {stamp(p.renewal_completed_at)}.<br/>Expiry recorded for this renewal: {stamp(p.renewal_expires_at)}.</p>:p.period_end&&<p className="mt-2 text-xs text-gray-400">Saved service period ends {stamp(p.period_end)}.</p>}
        <details className="mt-2 text-xs text-gray-500"><summary className="cursor-pointer">Payment reference</summary><p className="mt-2 break-all">{p.id}</p></details>
      </li>)}</ul>
      <div className="mt-4 flex flex-wrap items-center gap-3"><button type="button" disabled={current===0} onClick={()=>setPage(current-1)} className="min-h-11 rounded-xl border border-gray-600 px-4 py-2 text-sm text-white disabled:opacity-40">Newer payments</button><span className="text-xs text-gray-400" role="status">Page {current+1} of {last+1}</span><button type="button" disabled={current===last} onClick={()=>setPage(current+1)} className="min-h-11 rounded-xl border border-gray-600 px-4 py-2 text-sm text-white disabled:opacity-40">Older payments</button></div>
    </>}
  </div>;
}
