import type { SupabaseClient } from '@supabase/supabase-js';

export interface CrmPaymentSummary {
  id: string;
  customer_id: string;
  amount: number;
  payment_method: string;
  payment_status: string;
  paid_at: string;
}

export function loadCrmPayments(client: SupabaseClient): Promise<{
  data: CrmPaymentSummary[] | null;
  error: { message: string } | null;
}>;
export function latestReceivedPayments(payments: CrmPaymentSummary[]): Map<string, CrmPaymentSummary>;
export function receivedPaymentDate(value: string): string;
