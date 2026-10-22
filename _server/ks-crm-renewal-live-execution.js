import { buildLiveRenewalEvidence } from './ks-crm-renewal-live-plan.js';
import { creditUnits } from './ks-paid-approval.js';

// Provider adapters must return safe normalized line DTOs, never raw credential
// responses. The authenticated Preview bridge requires separate server release
// and SQL execution gates; this module cannot enable either gate.
function verifyLine(line, plan, now) {
  const expiry = Date.parse(line?.expiresAt), extension = expiry - Date.parse(plan.previousExpiresAt);
  if (line?.id !== plan.lineId || line.username !== plan.username || line.resellerId !== plan.resellerId
    || line.packageId !== plan.packageId || line.connections !== plan.connections || line.trial !== false
    || line.enabled !== true || line.adminEnabled !== true
    || JSON.stringify(line.bouquetIds) !== JSON.stringify(plan.bouquetIds)
    || !Number.isFinite(expiry) || expiry % 1000 || expiry <= now
    || extension < plan.months * 27 * 86400000 || extension > plan.months * 32 * 86400000) throw Error('live_renewal_result_unverified');
  // Gross duration bounds only: actual calendar/DST semantics and credential
  // preservation still require a separately authorized controlled provider test.
  return { customerId: plan.customerId, lineId: line.id, username: line.username,
    resellerId: line.resellerId, packageId: line.packageId, expiresAt: new Date(expiry).toISOString(),
    connections: line.connections, bouquetIds: [...line.bouquetIds], enabled: true, adminEnabled: true, trial: false };
}

export function createLiveRenewalExecutor({ consent, ledger, provider, crm, now } = {}) {
  for (const [adapter, methods] of [[consent,['identify','verify']], [ledger,['enabled','lookup','reserve','begin','stop','verified','complete']],
    [provider,['snapshot','renew','read','account']], [crm,['current']]]) {
    if (methods.some(name => typeof adapter?.[name] !== 'function')) throw Error('live_renewal_adapters_required');
  }
  if (typeof now !== 'function') throw Error('live_renewal_clock_required');
  const clock = () => { const at = now(); if (!Number.isSafeInteger(at)) throw Error('live_renewal_clock_required'); return at; };
  // Fixed responses contain no claim, token, raw provider result or error text.
  const response = (state, receipt, replayed = false) => Object.freeze({ state, operationId: receipt?.operationId ?? null,
    mayDispatch: false, replayed });
  return async function run(input) {
    let receipt;
    try { receipt = consent.identify(input?.token, { actorId: input?.actorId, customerId: input?.customerId }); }
    catch { return response('review_required'); }
    let record;
    try {
      if (await ledger.enabled() !== true) return response('disabled', receipt);
      record = await ledger.lookup(receipt, input.token);
    } catch { return response('check_status', receipt); }
    const replayed = record !== null;
    if (record?.state === 'complete') return response('complete', receipt, true);
    if (record && record.state !== 'provider_verified') return response('reconciliation_required', receipt, true);
    let plan = record?.plan;
    if (!record) {
      let evidence, deadline;
      try {
        // An expired identity is useful only for lookup. Do not even read XUI
        // for an absent attempt with expired consent or missing confirmations.
        if (Date.parse(receipt.expiresAt) <= clock() || input.preserveCurrentSelectionConfirmed !== true
          || input.creditSpendConfirmed !== true) return response('review_required', receipt);
        const customer = await crm.current(receipt.customerId);
        const context = await provider.snapshot(customer);
        const verified = consent.verify(input.token, { ...input, customer, context });
        evidence = buildLiveRenewalEvidence({ ...input, customer, context }, clock());
        plan = evidence.plan;
        deadline = Math.min(Date.parse(verified.expiresAt), Date.parse(plan.checkedAt) + 30000);
        if (deadline <= clock()) return response('review_required', receipt);
      } catch { return response('review_required', receipt); }
      try {
        record = await ledger.reserve(receipt, input.token, plan, new Date(deadline).toISOString());
        // A replayed reservation is never a fresh execution decision, including
        // when another worker won between lookup and reserve. Never stop it.
        if (record.replayed !== false || record.state !== 'reserved') return response('check_status', receipt, true);
        if (await ledger.begin(receipt, record) !== true) return response('reconciliation_required', receipt);
      } catch { return response('check_status', receipt); }
      try {
        // A lost begin acknowledgement never reaches here. Gate/deadline are
        // checked once more after the committed decision, immediately pre-send.
        if (await ledger.enabled() !== true || deadline <= clock() || Date.parse(plan.previousExpiresAt) <= clock()) throw Error('live_renewal_stopped');
        const returned = verifyLine(await provider.renew(plan.lineId, evidence.form()), plan, clock());
        const current = verifyLine(await provider.read(plan.lineId), plan, clock());
        if (current.expiresAt !== returned.expiresAt) throw Error('live_renewal_result_changed');
        const account = await provider.account();
        const balance = creditUnits(account.credits);
        if (String(account.id) !== plan.resellerId || balance !== BigInt(plan.balanceUnits) - BigInt(plan.costUnits)) throw Error('live_renewal_debit_unverified');
        await ledger.verified(receipt, record, current, String(balance));
        record = { ...record, state: 'provider_verified', resultExpiry: current.expiresAt };
      } catch {
        try { await ledger.stop(receipt, record); } catch { /* durable uncertainty stays locked */ }
        return response('reconciliation_required', receipt);
      }
    }
    try {
      // Recovery after expiry is local completion only. A fresh independent line
      // read must still match the saved verified result and original full facts.
      const current = verifyLine(await provider.read(plan.lineId), plan, clock());
      if (Date.parse(current.expiresAt) !== Date.parse(record.resultExpiry)) throw Error('live_renewal_saved_result_changed');
      await ledger.complete(receipt, record, current.expiresAt);
      return response('complete', receipt, replayed);
    } catch { return response('crm_pending', receipt, replayed); }
  };
}
