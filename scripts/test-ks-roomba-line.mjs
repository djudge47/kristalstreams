import assert from 'node:assert/strict';
import { createRoombaPreviewHandler } from '../_server/ks-roomba-preview.js';
import { readLineJson } from '../_server/ks-roomba-account-reader.js';
import { normalizeProviderLine, verifyCurrentTrial } from '../_server/ks-roomba-line-snapshot.js';

const raw = { id:'999001',username:'synthetic_trial',member_id:'888',package_id:'1',exp_date:'1792324800',max_connections:'1',is_trial:'1',enabled:'1',admin_enabled:'1',bouquet:'[14,13]',password:'SECRET_PASSWORD',api_key:'SECRET_KEY',reseller_notes:'PRIVATE_NOTES' };
const env={VERCEL_ENV:'preview',ROOMBA_PREVIEW_SECRET:'fake-private-secret',ROOMBA_API_KEY:'SECRET_KEY',ROOMBA_API_URL:'https://cdn.rooomba.tv/WDXTMHmN/',FIXIE_URL:'https://fixie:fake-proxy-secret@test-proxy.usefixie.com'};
const response=()=>({headers:{},setHeader(k,v){this.headers[k]=v;},status(code){this.code=code;return this;},json(body){this.body=body;return this;}});
async function request(patch={}) {
  const calls=[];let proxies=0;
  const h=createRoombaPreviewHandler({env:{...env,...patch.env},readAction:'get_line',lineId:raw.id,
    dispatcherFactory:()=>{proxies++;return{dispatch(){},async close(){}};},
    fetchImpl:async(url,options)=>{calls.push({url,options});if(patch.failure)throw new Error('SECRET_KEY');return patch.response||Response.json({status:'STATUS_SUCCESS',data:{...raw,...patch.line}});}});
  const res=response();await h({method:patch.method||'GET',headers:{authorization:patch.auth===undefined?`Bearer ${env.ROOMBA_PREVIEW_SECRET}`:patch.auth},query:{id:'666',lineId:'666',action:'edit_line',url:'http://evil.invalid',password:'SECRET_PASSWORD'}},res);
  const text=JSON.stringify(res.body);for(const secret of['SECRET_KEY','SECRET_PASSWORD','PRIVATE_NOTES','fake-proxy-secret'])assert.ok(!text.includes(secret));
  return{res,calls,proxies};
}
let checks=0;async function check(name,fn){await fn();checks++;console.log(`PASS: ${name}`);}
await check('line reader is Preview-only, authenticated and GET-only before opening a proxy',async()=>{
  for(const patch of[{env:{VERCEL_ENV:'production'}},{env:{VERCEL_ENV:'development'}},{env:{VERCEL_ENV:undefined}},{auth:''},{auth:'Bearer wrong'},{method:'POST'},{method:'DELETE'}]){
    const{res,calls,proxies}=await request(patch);assert.ok(res.code>=400);assert.equal(calls.length,0);assert.equal(proxies,0);
  }
  for(const lineId of[undefined,1,'0','1&action=edit_line','1234567890123456',['1']])assert.throws(()=>createRoombaPreviewHandler({readAction:'get_line',lineId}));
});
await check('fixed get_line uses the server-selected ID, HTTPS and Fixie; caller overrides are ignored',async()=>{
  const{res,calls}=await request();assert.equal(res.code,200);assert.equal(calls.length,1);
  const{url,options}=calls[0];assert.equal(url.origin,'https://cdn.rooomba.tv');assert.equal(url.pathname,'/WDXTMHmN/');
  assert.deepEqual([...url.searchParams.keys()].sort(),['action','api_key','id']);assert.equal(url.searchParams.get('action'),'get_line');assert.equal(url.searchParams.get('id'),raw.id);
  assert.equal(options.method,'GET');assert.equal(options.body,undefined);assert.equal(options.redirect,'manual');assert.ok(options.dispatcher);assert.ok(options.signal);
  assert.equal(res.body.mode,'read-only');assert.equal(res.body.databaseWrites,false);assert.equal(res.body.line.password,undefined);
  assert.deepEqual(res.body.line.bouquetIds,[13,14]);assert.equal(res.body.line.packageId,'1');
});
await check('streamed line reader discards passwords and retains bounded package and bouquet fields',async()=>{
  const payload=await readLineJson(Response.json({status:'STATUS_SUCCESS',data:raw,permissions:'ignored'}));
  assert.equal(payload.data.password,undefined);assert.equal(payload.data.api_key,undefined);assert.equal(payload.data.reseller_notes,undefined);
  assert.equal(payload.data.bouquet,'[14,13]');assert.equal(payload.data.package_id,'1');
  const large=await readLineJson(Response.json({status:'STATUS_SUCCESS',data:{...raw,password:'x'.repeat(100000),bouquet:JSON.stringify(Array.from({length:2000},(_,i)=>i+100000))}}));
  assert.equal(normalizeProviderLine(large).bouquetIds.length,2000);assert.equal(large.data.password,undefined);
  const oversized=await readLineJson(Response.json({status:'STATUS_SUCCESS',data:{...raw,bouquet:'x'.repeat(65537)}}));assert.equal(oversized.data.bouquet,null);
});
await check('wrong line, incomplete flags, malformed selections and failed markers never pass a line read',async()=>{
  for(const line of[{id:'666'},{member_id:null},{package_id:null},{max_connections:1.5},{is_trial:'maybe'},{enabled:null},{admin_enabled:2},{exp_date:'NaN'},{exp_date:'999999999999'},{username:'SECRET_KEY'},{bouquet:'[13,13]'},{bouquet:'[0]'},{bouquet:'[true]'},{bouquet:'["13.1"]'},{bouquet:'[]'},{bouquet:null},{bouquet:'[13,]'}])assert.equal((await request({line})).res.code,502);
  for(const payload of[{status:'STATUS_ERROR',data:raw},{status:'STATUS_SUCCESS',error:'bad',data:raw},{data:raw},{status:'STATUS_SUCCESS',data:[]}])assert.equal((await request({response:Response.json(payload)})).res.code,502);
});
await check('redirects, HTTP configuration, transport and malformed trailing JSON stay blocked without retries',async()=>{
  for(const patch of[{response:new Response('',{status:302,headers:{Location:'https://evil.invalid'}})},{response:new Response('forbidden SECRET_KEY',{status:403})},{response:new Response(JSON.stringify({status:'STATUS_SUCCESS',data:raw})+'trailing')},{response:new Response('<html>SECRET_KEY</html>')},{failure:true}]){
    const{res,calls}=await request(patch);assert.equal(res.code,502);assert.equal(calls.length,1);
  }
  const result=await request({env:{ROOMBA_API_URL:'http://cdn.rooomba.tv/WDXTMHmN/',ROOMBA_ALLOW_INSECURE_HTTP:'true'}});assert.equal(result.calls.length,0);
});
const line=normalizeProviderLine({status:'STATUS_SUCCESS',data:raw});
const checkedAt='2026-10-17T14:00:00Z';const now=Date.parse(checkedAt);
const review={existing:{lineId:raw.id,username:raw.username,resellerId:'888',savedExpiresAt:line.expiresAt},proposed:{credits:1,packageId:'2'}};
const account={id:'888',username:'synthetic_reseller',credits:'25'};
const packages=[{id:'1',bouquets:[13,14]},{id:'2',bouquets:[14,13]}];
await check('current trial check binds the saved reseller, line, login, expiry, allowance and exact group set',async()=>{
  const verified=verifyCurrentTrial(review,account,line,packages,checkedAt,now);assert.equal(verified.resellerVerified,true);assert.equal(verified.creditsAvailable,25);assert.equal(verified.sufficientCredits,true);assert.equal(verified.channelGroupsUnchanged,true);
  for(const change of[{id:'666'},{resellerId:'777'},{username:'other_trial'},{packageId:'2'},{trial:false},{connections:2},{enabled:false},{adminEnabled:false},{expiresAt:'2026-10-19T12:00:00Z'}])assert.throws(()=>verifyCurrentTrial(review,account,{...line,...change},packages,checkedAt,now));
  assert.throws(()=>verifyCurrentTrial(review,{...account,id:'777'},{...line,resellerId:'777'},packages,checkedAt,now));
  for(const selection of[[13],[13,14,15],null])assert.throws(()=>verifyCurrentTrial(review,account,{...line,bouquetIds:selection},packages,checkedAt,now));
  assert.throws(()=>verifyCurrentTrial(review,account,line,[packages[0],{id:'2',bouquets:[13]}],checkedAt,now));
});
await check('expired trials, insufficient or unreadable credits and stale checks require attention',async()=>{
  assert.throws(()=>verifyCurrentTrial(review,account,line,packages,checkedAt,Date.parse(line.expiresAt)+1),/trial_expired/);
  for(const credits of[0,'0.5','NaN',null,-1,Infinity,'1e2',' 69 '])assert.throws(()=>verifyCurrentTrial(review,{...account,credits},line,packages,checkedAt,now));
  assert.throws(()=>verifyCurrentTrial(review,account,line,packages,'bad',now),/stale_line_check/);
  assert.throws(()=>verifyCurrentTrial(review,account,line,packages,new Date(now-61000).toISOString(),now),/stale_line_check/);
});
console.log(`${checks} current-line checks passed. Synthetic responses only; no real provider requests, writes or credit spending.`);
