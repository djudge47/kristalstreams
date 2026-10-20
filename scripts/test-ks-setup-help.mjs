import assert from 'node:assert/strict';
import { readSetupHelpOrders, setupHelpDetails } from '../_shared/ks-setup-help.js';
const owner='00000000-0000-4000-8000-000000000001';
const other='00000000-0000-4000-8000-000000000002';
const order={reference:'cs_test_setupHelp1',tier:'bronze',interval:'monthly',connections:1,amountCents:2000,currency:'usd',recordedAt:'2026-10-17T12:00:00Z',status:'awaiting_activation',testMode:true,providerActivated:false};
const payload={accountId:owner,mode:'read-only',testMode:true,orders:[order],checkedAt:'2026-10-17T13:00:00Z'};
let checks=0;async function check(name,fn){await fn();checks++;console.log(`PASS: ${name}`);}
await check('owned response becomes bounded whitelisted support context without credentials',()=>{
 const {orders,checkedAt}=readSetupHelpOrders({...payload,password:'SECRET_PASSWORD',orders:[{...order,password:'SECRET_PASSWORD',apiKey:'SECRET_KEY',action:'create_line',email:'PRIVATE_EMAIL',userId:other}]},owner);
 assert.deepEqual(orders,[{...order,recordedAt:'2026-10-17T12:00:00.000Z'}]);assert.equal(checkedAt,'2026-10-17T13:00:00.000Z');
 const output=JSON.stringify(orders);for(const value of['SECRET_PASSWORD','SECRET_KEY','PRIVATE_EMAIL',other,'create_line'])assert.ok(!output.includes(value));
});
await check('another displayed account and mismatched response modes cannot supply context',()=>{
 for(const change of[{accountId:other},{mode:'write'},{testMode:false},{checkedAt:'bad'},{orders:null}])assert.throws(()=>readSetupHelpOrders({...payload,...change},owner));
 for(const accountId of[other,'invalid',null])assert.throws(()=>readSetupHelpOrders(payload,accountId));
});
await check('empty results stay empty; multiple real entries stay distinct and no order is invented',()=>{
 assert.deepEqual(readSetupHelpOrders({...payload,orders:[]},owner).orders,[]);
 const second={...order,reference:'cs_test_setupHelp2',tier:'silver',interval:'3 months',connections:2,amountCents:7500};
 const result=readSetupHelpOrders({...payload,orders:[order,second]},owner);assert.equal(result.orders.length,2);assert.equal(result.orders[1].reference,second.reference);
 assert.throws(()=>readSetupHelpOrders({...payload,orders:[order,order]},owner));assert.throws(()=>readSetupHelpOrders({...payload,orders:Array(6).fill(order)},owner));
});
await check('forged status, malformed identifiers and bad plan or financial fields are rejected',()=>{
 for(const change of[{reference:'cs_live_unrelated'},{reference:'cs_test_x\nother'},{reference:'cs_test_'+ 'x'.repeat(201)},{tier:'__proto__'},{tier:'gold',interval:'monthly'},{connections:0},{connections:1.5},{connections:6},{amountCents:0},{amountCents:NaN},{amountCents:1.5},{currency:'eur'},{recordedAt:'bad'},{status:'active'},{testMode:false},{providerActivated:true}])assert.throws(()=>readSetupHelpOrders({...payload,orders:[{...order,...change}]},owner));
});
await check('ticket context preserves original reference, plan, allowance and timestamps with an explicit test label',()=>{
 const safe=readSetupHelpOrders(payload,owner);const text=setupHelpDetails(safe.orders[0],safe.checkedAt);
 for(const expected of['Order reference: cs_test_setupHelp1','Plan: Bronze / monthly','Connections ordered: 1','Test amount: 20.00 USD','Payment recorded: 2026-10-17T12:00:00.000Z','Details checked: 2026-10-17T13:00:00.000Z','Saved setup status: awaiting activation','No real charge or streaming activation was made.'])assert.ok(text.includes(expected));
 assert.ok(!text.includes('password'));assert.ok(!text.includes('new expiry'));assert.throws(()=>setupHelpDetails({...order,status:'active'},safe.checkedAt));assert.throws(()=>setupHelpDetails(order,'bad'));
});
console.log(`${checks} setup-help context checks passed. No requests, ticket inserts, emails, payments or provider operations.`);
