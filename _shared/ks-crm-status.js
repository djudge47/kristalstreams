const time = value => typeof value === 'string' && Number.isFinite(Date.parse(value)) ? Date.parse(value) : 0;
export const isTrialCustomer = customer => customer.trial === true || customer.payment_status === 'trial';
export const isUnpaidCustomer = customer => !isTrialCustomer(customer) && customer.payment_status !== 'paid';
export const isBillingOverdue = (customer, now = Date.now()) => !isTrialCustomer(customer)
  && (customer.account_status === 'expired' || (time(customer.renewal_at) > 0 && time(customer.renewal_at) < now)
    || (time(customer.expiration_at) > 0 && time(customer.expiration_at) < now));
export const isDueWithin = (customer, days, now = Date.now()) => !isTrialCustomer(customer)
  && time(customer.renewal_at) > now && time(customer.renewal_at) <= now + days * 86400000;
export function trialBadge(customer, now = Date.now()) {
  const expiry = time(customer.expiration_at);
  return !expiry ? 'Trial · expiry unknown' : expiry <= now ? 'Trial expired' : 'Trial active';
}
export function displayedAccountStatus(customer, now = Date.now()) {
  if (isTrialCustomer(customer) && time(customer.expiration_at) > 0 && time(customer.expiration_at) <= now) return 'expired';
  return customer.account_status;
}
