import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { buildPreservingRenewalPlan } from '../_server/ks-crm-renewal-plan.js';
import { createRenewalApprovalRehearsal } from '../_server/ks-crm-renewal-approval.js';

const clock = Date.parse('2026-10-21T17:00:00Z');
let now = clock, checks = 0;
const key = randomBytes(32);
const source = { customer: { id: randomUUID(), external_id: '9999901', username: 'fictional-renewal' },
  line: { id: '9999901', username: 'fictional-renewal', resellerId: '99997', packageId: '19',
    expiresAt: '2026-11-15T10:00:00Z', connections: 1, trial: false, enabled: true, adminEnabled: true, bouquetIds: [2,13,18,40] },
  account: { id: '99997', credits: 100 }, packages: [{ id: '19', name: '12 Months + 1 Connection', maxConnections: 1,
    trial: null, paid: { count: 12, unit: 'months', credits: 12 }, bouquets: Array.from({length:107},(_,i)=>i+1), issues: [] }],
  checkedAt: new Date(clock).toISOString(), preserveCurrentSelectionConfirmed: true };
const plan = buildPreservingRenewalPlan(source, clock);
const input = { operationId: randomUUID(), approverId: randomUUID(), plan, preserveCurrentSelectionConfirmed: true };
const approval = createRenewalApprovalRehearsal({ kind: 'simulation', key, now: () => now });
const check = (name, fn) => { fn(); checks++; console.log(`PASS: ${name}`); };
check('only explicit simulation configuration with an isolated 32-byte key is accepted', () => {
  for (const config of [{kind:'live',key,now:()=>now},{kind:'simulation',key:Buffer.alloc(31),now:()=>now},{kind:'simulation',key}]) assert.throws(()=>createRenewalApprovalRehearsal(config));
});
const issued = approval.issue(input);
check('approval binds the concrete plan and operation without granting dispatch', () => {
  const verified = approval.verify(issued.token,input);
  assert.equal(verified.fingerprint,plan.fingerprint); assert.equal(verified.approvalId,issued.approvalId);
  assert.equal(verified.mayDispatch,false); assert.equal(verified.simulation,true);
  assert.equal(Date.parse(issued.expiresAt),clock+30000);
});
check('missing explicit preservation review, bad identities and stale/future evidence are rejected', () => {
  for (const patch of [{operationId:'bad'},{approverId:'bad'},{preserveCurrentSelectionConfirmed:false},
    {plan:{...plan,checkedAt:new Date(clock+1).toISOString()}}, {plan:{...plan,checkedAt:new Date(clock-30001).toISOString()}}]) assert.throws(()=>approval.issue({...input,...patch}));
});
check('another operation, approver, evidence time or valid changed selection cannot reuse approval', () => {
  const changed = buildPreservingRenewalPlan({...source,line:{...source.line,bouquetIds:[2,13]}},clock);
  for(const patch of [{operationId:randomUUID()},{approverId:randomUUID()},{plan:changed},{plan:{...plan,checkedAt:new Date(clock-1).toISOString()}}]) assert.throws(()=>approval.verify(issued.token,{...input,...patch}));
});
check('malformed, altered, oversized and differently keyed tokens fail closed', () => {
  const other = createRenewalApprovalRehearsal({kind:'simulation',key:randomBytes(32),now:()=>now});
  for(const token of [null,'',issued.token+'.extra',issued.token.slice(1),'x'.repeat(2049),other.issue(input).token]) assert.throws(()=>approval.verify(token,input));
  const payload = Buffer.from(JSON.stringify({purpose:'one-new-paid-line',simulation:false})).toString('base64url');
  assert.throws(()=>approval.verify(`${payload}.${'0'.repeat(64)}`,input));
});
check('approval expires at its boundary and stale evidence cannot be revived', () => {
  now=clock+30000; assert.throws(()=>approval.verify(issued.token,input));
  now=clock+30001; assert.throws(()=>approval.issue(input)); now=clock;
});
check('the signing key is copied, and no environment secret or network is used', () => {
  key.fill(0); assert.equal(approval.verify(issued.token,input).approvalId,issued.approvalId);
  const saved=globalThis.fetch;globalThis.fetch=()=>{throw Error('external network forbidden')};
  try{assert.equal(approval.verify(approval.issue(input).token,input).mayDispatch,false);}finally{globalThis.fetch=saved;}
});
console.log(`${checks} offline renewal approval checks passed. No authentication endpoint, live capability or provider call exists.`);
