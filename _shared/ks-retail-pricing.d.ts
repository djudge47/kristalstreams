export interface RetailPrice { months: number; connections: number; totalCents: number; monthlyCents: number }
interface RetailPlan { readonly months: number; readonly aliases: readonly string[]; readonly interval: string; readonly days: number; readonly prices: readonly number[] }
export const retailPlans: Readonly<Record<string, RetailPlan>>;
export function getRetailPrice(months: number, connections: number): RetailPrice | null;
export function getCustomerRetailPrice(customer: { trial?: boolean; source?: string; payment_status?: string | null; package_name: string | null; connections_allowed: number; monthly_price: number | string | null }): RetailPrice | null;
