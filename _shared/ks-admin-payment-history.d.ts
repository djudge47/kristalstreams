import type {SupabaseClient} from '@supabase/supabase-js';
import type {CrmPaymentSummary} from './ks-crm-payment-summary.js';
export function websiteReceiptId(value:unknown):boolean;
export function comparePaymentOrder(a:CrmPaymentSummary,b:CrmPaymentSummary):number;
export function readAdminWebsitePayments(value:unknown,actorId:string,lookahead?:boolean):{accountId:string;checkedAt:string;payments:CrmPaymentSummary[];nextCursor:{paidAt:string;id:string}|null};
export function loadAdminWebsitePayments(client:SupabaseClient,options?:{fetchImpl?:typeof fetch}):Promise<{data:CrmPaymentSummary[]|null;error:{message:string}|null}>;
export function paymentDateLabel(payment:CrmPaymentSummary):'Recorded'|'Received';
export function adminPaymentMethod(payment:CrmPaymentSummary):string|null;
