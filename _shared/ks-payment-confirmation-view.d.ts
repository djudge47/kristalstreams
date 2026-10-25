export interface PaymentConfirmationView {
  kind:'test'|'pending'|'ready'|'expired'|'review'|'renewed';
  title:string;
  message:string;
}
export function paymentConfirmationView(payload:unknown,reference:string):PaymentConfirmationView;
