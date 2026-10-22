interface CrmStatusInput {
  trial: boolean;
  source?: string;
  payment_status: string | null;
  account_status: string;
  renewal_at: string | null;
  expiration_at: string | null;
}
export function isTrialCustomer(customer: CrmStatusInput): boolean;
export function isUnpaidCustomer(customer: CrmStatusInput): boolean;
export function isBillingOverdue(customer: CrmStatusInput, now?: number): boolean;
export function isDueWithin(customer: CrmStatusInput, days: number, now?: number): boolean;
export function trialBadge(customer: CrmStatusInput, now?: number): string;
export function displayedAccountStatus(customer: CrmStatusInput, now?: number): string;

export function isPreviewPaidCustomer(customer: CrmStatusInput): boolean;
export function isBillingExcluded(customer: CrmStatusInput): boolean;

export function isPersonalCustomer(customer: CrmStatusInput): boolean;
