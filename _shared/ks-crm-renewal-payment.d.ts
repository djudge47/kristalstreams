export interface RenewalPaymentInput { customerId:string;months:number;connections:number;amountCents:number;paidAt:string;method:string;reference:string;adjustmentReason:string; }
export interface RenewalPaymentReceipt extends RenewalPaymentInput { receiptId:string;paymentId:string;catalogCents:number;recordedAt:string;serviceUpdated:false; }
export const paymentMethods:Readonly<Record<string,string>>;
export function paymentMethodLabel(v:string):string;
export function paymentUuid(v:unknown):boolean;
export function amountToCents(v:string):number|null;
export function validPaymentInput(v:unknown,now?:number):boolean;
export function validateRenewalPayment(v:unknown):RenewalPaymentReceipt;
export function renewalPaymentApi(options:{getToken:()=>Promise<string|null>;fetchImpl?:typeof fetch}):(action:'record'|'status',receiptId:string,input?:RenewalPaymentInput)=>Promise<RenewalPaymentReceipt>;
