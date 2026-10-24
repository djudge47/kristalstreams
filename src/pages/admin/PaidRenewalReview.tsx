import { X } from 'lucide-react';
import type { RenewalPaymentReceipt } from '../../../_shared/ks-crm-renewal-payment.js';
import { paymentMethodLabel } from '../../../_shared/ks-crm-renewal-payment.js';
import { receivedPaymentDate } from '../../../_shared/ks-crm-payment-summary.js';
import RequestedRenewalReview from './RequestedRenewalReview';

interface Props {
  customer: { id: string; external_id: number; username: string; customer_name: string | null; connections_allowed: number };
  receipt: RenewalPaymentReceipt;
  onClose: () => void;
}

const dollars = (cents: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);

export default function PaidRenewalReview({ customer, receipt, onClose }: Props) {
  const sameCustomer = receipt.customerId === customer.id;
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 sm:items-center sm:p-4">
    <section role="dialog" aria-modal="true" aria-labelledby="paid-renewal-review-title" className="max-h-[94vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl border border-gray-700 bg-gray-900 p-5 text-gray-200 sm:rounded-3xl sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div><h2 id="paid-renewal-review-title" className="text-xl font-bold text-white">New renewal review</h2><p className="mt-1 text-sm text-gray-400">{customer.customer_name || customer.username} · {customer.username}</p></div>
        <button type="button" onClick={onClose} aria-label="Close new renewal review" className="rounded-lg p-2 text-gray-300"><X className="h-5 w-5" /></button>
      </div>
      {!sameCustomer ? <p role="alert" className="mt-4 text-sm text-amber-200">This payment belongs to a different customer. Close this review and check the saved payment.</p> : <>
        <div className="mt-4 rounded-xl border border-green-500/25 bg-green-500/5 p-4 text-sm">
          <p className="font-semibold text-green-300">Recorded payment: {dollars(receipt.amountCents)} · {paymentMethodLabel(receipt.method)}</p>
          <p className="mt-1">Received {receivedPaymentDate(receipt.paidAt)}</p>
          <p className="mt-1">Payment selection: {receipt.months} months · {receipt.connections} connection{receipt.connections === 1 ? '' : 's'}</p>
          <p className="mt-1 text-xs text-gray-400">Website price when recorded: {dollars(receipt.catalogCents)}</p>
          {receipt.amountCents !== receipt.catalogCents && <p role="note" className="mt-2 text-xs text-amber-200">The received amount differs from that price. Review the payment arrangement before approving service.{receipt.adjustmentReason ? ` Recorded reason: ${receipt.adjustmentReason}` : ''}</p>}
          <p className="mt-2 break-all text-xs text-gray-400">Payment receipt: {receipt.receiptId}</p>
        </div>
        <p className="mt-4 text-sm text-cyan-200">The saved package selection is ready below. Nothing is submitted automatically. Closing this review leaves the payment in History and keeps current service as it is.</p>
        <RequestedRenewalReview key={receipt.receiptId} customerId={customer.id} panelId={customer.external_id} username={customer.username} currentConnections={customer.connections_allowed} initialOrder={{ months: receipt.months, connections: receipt.connections }} />
      </>}
      <button type="button" onClick={onClose} className="mt-5 w-full rounded-xl border border-gray-600 px-4 py-3 text-sm font-semibold">Close review</button>
    </section>
  </div>;
}
