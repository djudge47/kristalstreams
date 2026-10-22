// Published Kristal Streams customer prices, in USD cents for the full term.
// Provider credits are deliberately not part of this catalog.
export const retailPlans = Object.freeze({
  bronze: Object.freeze({ months: 1, aliases: Object.freeze(['bronze', 'basic']), interval: 'monthly', days: 30, prices: Object.freeze([2000, 3500, 5000, 6500, 8000]) }),
  silver: Object.freeze({ months: 3, aliases: Object.freeze(['silver', 'standard']), interval: '3 months', days: 90, prices: Object.freeze([4500, 7500, 11000, 14000, 17500]) }),
  gold: Object.freeze({ months: 6, aliases: Object.freeze(['gold', 'premium']), interval: '6 months', days: 180, prices: Object.freeze([6000, 10500, 15000, 19500, 24000]) }),
  platinum: Object.freeze({ months: 12, aliases: Object.freeze(['platinum', 'ultimate']), interval: 'yearly', days: 365, prices: Object.freeze([9500, 16500, 23500, 30500, 37500]) }),
});
export function getRetailPrice(months, connections) {
  if (!Number.isInteger(months) || !Number.isInteger(connections) || connections < 1 || connections > 5) return null;
  const plan = Object.values(retailPlans).find(plan => plan.months === months);
  if (!plan) return null;
  const totalCents = plan.prices[connections - 1];
  return { months, connections, totalCents, monthlyCents: Math.round(totalCents / months) };
}
export function getCustomerRetailPrice(customer) {
  if (customer.trial || ['trial', 'preview_test', 'personal'].includes(customer.payment_status)
    || ['roomba_preview_trial', 'roomba_preview_paid'].includes(customer.source)) return null;
  const match = typeof customer.package_name === 'string'
    ? customer.package_name.match(/^(1|3|6|12) months? \+ ([1-5]) connections?$/i) : null;
  if (!match || Number(match[2]) !== customer.connections_allowed) return null;
  const price = getRetailPrice(Number(match[1]), Number(match[2]));
  const saved = Number(customer.monthly_price);
  // Retain a recorded custom/previous rate rather than silently repricing a saved account.
  if (Number.isFinite(saved) && saved > 0 && Math.round(saved * 100) !== price.monthlyCents) {
    return { ...price, monthlyCents: Math.round(saved * 100), totalCents: Math.round(saved * 100 * price.months) };
  }
  return price;
}
