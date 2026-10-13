import assert from 'node:assert/strict';
import { getPlan, validateOrder, validatePaidSession, applyPaidSession } from '../_server/ks-payment-validation.js';

const userId = '00000000-0000-4000-8000-000000000001';
const valid = {
  id: 'cs_test_receipt1', livemode: false, mode: 'payment', status: 'complete', payment_status: 'paid',
  currency: 'usd', amount_total: 2000, amount_subtotal: 2000, payment_intent: 'pi_receipt1',
  metadata: { user_id: userId, plan: 'bronze', connections: '1', interval: 'monthly', price: '20', duration_days: '30' },
};
let passed = 0;
function check(name, fn) { fn(); passed++; console.log(`PASS: ${name}`); }
check('all 20 tier and connection prices agree with the approved catalog', () => {
  const expected = [
    ['basic', 'monthly', 30, [20,35,50,65,80]],
    ['standard', '3 months', 90, [45,75,110,140,175]],
    ['premium', '6 months', 180, [60,105,150,195,240]],
    ['ultimate', 'yearly', 365, [95,165,235,305,375]],
  ];
  for (const [alias, interval, days, prices] of expected) for (let connections = 1; connections <= 5; connections++) {
    const result = validateOrder({plan: alias, interval, connections, price: prices[connections - 1]});
    assert.equal(result.days, days); assert.equal(result.cents, prices[connections - 1] * 100);
  }
});
check('underpayment for a larger plan is rejected', () => assert.throws(() => validateOrder({plan:'ultimate', connections:5, interval:'yearly', price:20})));
check('wrong duration is rejected', () => assert.throws(() => validateOrder({plan:'standard', connections:1, interval:'yearly', price:45})));
check('missing, fractional and out-of-range connections are rejected', () => { for (const count of [undefined, null, 0, 1.5, 6, 'abc']) assert.throws(() => getPlan('basic',count)); });
check('unknown plan is rejected', () => assert.throws(() => getPlan('adult',1)));
check('paid sandbox session is accepted for its owner', () => assert.equal(validatePaidSession(valid,false,userId).cents,2000));
check('unpaid, incomplete and subscription sessions are rejected', () => {
  for (const change of [{payment_status:'unpaid'}, {status:'open'}, {mode:'subscription'}]) assert.throws(() => validatePaidSession({...valid,...change},false,userId));
});
check('test and live environments cannot be mixed', () => assert.throws(() => validatePaidSession(valid,true,userId)));
check('another account cannot confirm a payment', () => assert.throws(() => validatePaidSession(valid,false,'00000000-0000-4000-8000-000000000002')));
check('mismatched payment amount, currency, metadata and missing intent are rejected', () => {
  for (const change of [{amount_total:1},{amount_subtotal:1},{currency:'eur'},{payment_intent:null},{metadata:{...valid.metadata,connections:'5'}},{metadata:{...valid.metadata,duration_days:'365'}}]) {
    assert.throws(() => validatePaidSession({...valid,...change},false,userId));
  }
});
let calls = 0;
const admin = { rpc: async (name,args) => { calls++; assert.equal(name,'ks_apply_paid_checkout'); assert.equal(args.p_livemode,false); assert.equal(args.p_amount_cents,2000); return { data:{ok:true,test_mode:true,activated:false}, error:null }; } };
await assert.rejects(() => applyPaidSession({...valid,payment_status:'unpaid'},false,userId,admin));
assert.equal(calls,0); passed++; console.log('PASS: rejected payments never reach the database');
const receipt = await applyPaidSession(valid,false,userId,admin);
assert.equal(receipt.activated,false); assert.equal(calls,1); passed++; console.log('PASS: sandbox records use the protected receipt transaction');
await assert.rejects(() => applyPaidSession(valid,false,userId,{rpc:async()=>({data:null,error:{message:'offline'}})}), /do not pay again/);
passed++; console.log('PASS: database failure is reported for retry instead of false success');
console.log(`${passed} payment validation checks passed. No Stripe charges or account changes were made.`);
