import type { SupabaseClient } from '@supabase/supabase-js';

export interface CrmPaymentSummary {
  id: string;
  customer_id: string;
  amount: number;
  payment_method: string;
  payment_status: string;
  paid_at: string;
  period_end?:string|null;
  source?: 'website_checkout';
  amount_cents?: number;
  months?: number; connections?: number; renewal_completed_at?: string; renewal_expires_at?: string;
}

export function loadCrmPayments(client: SupabaseClient,options?:{website?:boolean;fetchImpl?:typeof fetch}): Promise<{
  data: CrmPaymentSummary[] | null;
  error: { message: string } | null;
}>;
export function latestReceivedPayments(payments: CrmPaymentSummary[]): Map<string, CrmPaymentSummary>;
export function isReceivedPayment(payment: CrmPaymentSummary): boolean;
export function receivedPaymentDate(value: string): string;
export function receivedPaymentDateTime(value: string): string;

export function recordedPaymentMonthTotal(payments:CrmPaymentSummary[],now?:number):number;
