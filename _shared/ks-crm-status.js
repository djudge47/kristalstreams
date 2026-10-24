const time = value => typeof value === 'string' && Number.isFinite(Date.parse(value)) ? Date.parse(value) : 0;
export const isTrialCustomer = customer => customer.trial === true || customer.payment_status === 'trial';
export const isPreviewPaidCustomer = customer => customer.source === 'roomba_preview_paid' || customer.payment_status === 'preview_test';
export const isPersonalCustomer = customer => customer.payment_status === 'personal';
export const isBillingExcluded = customer => isTrialCustomer(customer) || isPreviewPaidCustomer(customer) || isPersonalCustomer(customer);
export const isLegacyPaidCustomer = customer => !isBillingExcluded(customer) && customer.payment_status === 'legacy_paid';
export const billingRenewalAt = customer => isLegacyPaidCustomer(customer) ? customer.expiration_at : customer.renewal_at;
export const customerPaymentLabel = customer => isPersonalCustomer(customer) ? 'Personal · provider credits'
  : isPreviewPaidCustomer(customer) ? 'Preview · no real charge' : isTrialCustomer(customer) ? 'Trial · no payment due'
    : isLegacyPaidCustomer(customer) ? 'Paid under old pricing'
      : customer.payment_status === 'unpaid' ? 'No payment recorded' : customer.payment_status || 'No payment recorded';
export const isUnpaidCustomer = customer => !isBillingExcluded(customer) && !['paid', 'legacy_paid'].includes(customer.payment_status);
export const isBillingOverdue = (customer, now = Date.now()) => !isBillingExcluded(customer)
  && (customer.account_status === 'expired' || (time(billingRenewalAt(customer)) > 0 && time(billingRenewalAt(customer)) < now)
    || (time(customer.expiration_at) > 0 && time(customer.expiration_at) < now));
export const isDueWithin = (customer, days, now = Date.now()) => !isBillingExcluded(customer)
  && time(billingRenewalAt(customer)) > now && time(billingRenewalAt(customer)) <= now + days * 86400000;
export function trialBadge(customer, now = Date.now()) {
  const expiry = time(customer.expiration_at);
  return !expiry ? 'Trial · expiry unknown' : expiry <= now ? 'Trial expired' : 'Trial active';
}
export function displayedAccountStatus(customer, now = Date.now()) {
  if (isBillingExcluded(customer) && time(customer.expiration_at) > 0 && time(customer.expiration_at) <= now) return 'expired';
  return customer.account_status;
}
