const paymentColumns = 'id,customer_id,amount,payment_method,payment_status,paid_at';
const pageSize = 200;

// Read every page so a customer's receipt cannot disappear behind the global
// recent-payments limit. This uses the signed-in client's existing RLS access.
export async function loadCrmPayments(client) {
  const payments = [];
  try {
    for (let offset = 0; ; offset += pageSize) {
      const result = await client.from('iptv_payments').select(paymentColumns)
        .order('paid_at', { ascending: false }).order('id', { ascending: false })
        .range(offset, offset + pageSize - 1);
      if (result.error || !Array.isArray(result.data)) {
        return { data: null, error: { message: 'Payment details could not be loaded. Refresh to try again.' } };
      }
      payments.push(...result.data);
      if (result.data.length < pageSize) return { data: payments, error: null };
    }
  } catch {
    return { data: null, error: { message: 'Payment details could not be loaded. Refresh to try again.' } };
  }
}

export function latestReceivedPayments(payments) {
  const latest = new Map();
  for (const payment of payments) {
    const amount = Number(payment.amount);
    const paidAt = Date.parse(payment.paid_at);
    if (payment.payment_status !== 'paid' || !Number.isFinite(amount) || amount <= 0 || !Number.isFinite(paidAt)) continue;
    const previous = latest.get(payment.customer_id);
    if (!previous || paidAt > Date.parse(previous.paid_at)
      || (paidAt === Date.parse(previous.paid_at) && payment.id > previous.id)) {
      latest.set(payment.customer_id, payment);
    }
  }
  return latest;
}

export function receivedPaymentDate(value) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York', month: 'short', day: 'numeric', year: 'numeric',
  }).format(new Date(value));
}
