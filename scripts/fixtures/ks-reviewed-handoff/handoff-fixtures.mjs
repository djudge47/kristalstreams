import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { fixture, json, literal, reserveReview, prepareAttempt, adminId } from './fixtures.mjs';

export async function installPrototype(admin,{pglitePreflight=false}={}) {
 let sql=await readFile(new URL('prototype.sql',import.meta.url),'utf8');
 if(pglitePreflight) {
  const start=sql.indexOf('-- BEGIN NATIVE SAFETY GUARD');
  const end=sql.indexOf('-- END NATIVE SAFETY GUARD')+'-- END NATIVE SAFETY GUARD'.length;
  assert.ok(start>=0&&end>start);
  sql=sql.slice(0,start)+sql.slice(end);
 }
 await admin.request(sql);
}
export async function makeHandoff(admin,worker,options={}) {
 const f=await fixture(admin,options);
 const claim=await json(worker,reserveReview(f));f.claim=claim.claim_id;
 const binding={sessionId:f.session,ownerId:f.owner,intentId:f.payment,tier:'bronze',connections:1,
  amountCents:2000,resellerId:f.reseller,packageFingerprint:f.fingerprint};
 f.bindingHash=createHash('sha256').update(JSON.stringify(binding)).digest('hex');
 await prepareAttempt(admin,f);
 f.approval=randomUUID(); f.approvalHash=createHash('sha256').update(f.approval).digest('hex');
 f.balance=options.balance??'100000000';
 if(options.capture!==false) await json(worker,capture(f));
 return f;
}
export const capture=(f,{balance=f.balance,evidence="clock_timestamp()",expiry="clock_timestamp()+interval '1 minute'",operation='new_line',approver=adminId}={})=>
 `public.ks_proto_capture_approval(${literal(f.approval)},${literal(f.claim)},${literal(f.attempt)},${literal(approver)},
 ${literal(f.approvalHash)},${literal(balance)}::bigint,${evidence},${expiry},${literal(operation)})`;
export const transfer=f=>`public.ks_proto_transfer(${literal(f.approval)},${literal(f.token)})`;
export const settle=f=>`public.ks_proto_complete(${literal(f.claim)},${literal(f.attempt)},${literal(f.token)},${literal(f.username)})`;
export const handoffSummary=(admin,f)=>json(admin,`jsonb_build_object(
 'handoffs',(select count(*) from public.ks_proto_reservation_handoffs where claim_id=${literal(f.claim)}),
 'audits',(select count(*) from public.ks_setup_review_completions where claim_id=${literal(f.claim)}),
 'reviewQueue',(select fulfillment_status from public.ks_setup_order_queue where checkout_session_id=${literal(f.session)}),
 'oldBalance',(select balance_units::text from public.ks_setup_review_claims where claim_id=${literal(f.claim)}),
 'freshBalance',(select balance_units::text from public.ks_proto_reservation_handoffs where claim_id=${literal(f.claim)}))`);
export const insertJournal=f=>`insert into public.ks_proto_reservation_handoffs(claim_id,attempt_id,approval_id,user_id,
 reseller_id,utc_day,cost_units,balance_units,before_reserved,before_spent)
 select c.claim_id,${literal(f.attempt)},${literal(f.approval)},c.user_id,c.reseller_id,c.utc_day,c.cost_units,
 p.balance_units,b.reserved_units,b.spent_units from public.ks_setup_review_claims c
 join public.ks_proto_execution_approvals p on p.approval_id=${literal(f.approval)}
 join public.ks_setup_review_budgets b on b.reseller_id=c.reseller_id and b.utc_day=c.utc_day where c.claim_id=${literal(f.claim)}`;
