export interface PaymentConfirmationView {
  kind:'test'|'pending'|'ready'|'review';
  title:string;
  message:string;
}
export function paymentConfirmationView(payload:unknown,reference:string):PaymentConfirmationView;
