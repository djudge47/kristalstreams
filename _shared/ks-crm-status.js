const time = value => typeof value === 'string' && Number.isFinite(Date.parse(value)) ? Date.parse(value) : 0;
export const isTrialCustomer = customer => customer.trial === true || customer.payment_status === 'trial';
export const isPreviewPaidCustomer = customer => customer.source === 'roomba_preview_paid' || customer.payment_status === 'preview_test';
export const isBillingExcluded = customer => isTrialCustomer(customer) || isPreviewPaidCustomer(customer);
export const isUnpaidCustomer = customer => !isBillingExcluded(customer) && customer.payment_status !== 'paid';
export const isBillingOverdue = (customer, now = Date.now()) => !isBillingExcluded(customer)
  && (customer.account_status === 'expired' || (time(customer.renewal_at) > 0 && time(customer.renewal_at) < now)
    || (time(customer.expiration_at) > 0 && time(customer.expiration_at) < now));
export const isDueWithin = (customer, days, now = Date.now()) => !isBillingExcluded(customer)
  && time(customer.renewal_at) > now && time(customer.renewal_at) <= now + days * 86400000;
export function trialBadge(customer, now = Date.now()) {
  const expiry = time(customer.expiration_at);
  return !expiry ? 'Trial · expiry unknown' : expiry <= now ? 'Trial expired' : 'Trial active';
}
export function displayedAccountStatus(customer, now = Date.now()) {
  if (isBillingExcluded(customer) && time(customer.expiration_at) > 0 && time(customer.expiration_at) <= now) return 'expired';
  return customer.account_status;
}
