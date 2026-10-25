import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { build } from 'esbuild';
import { checkoutAttemptKey } from '../src/lib/checkoutAttempt.ts';

const directory=await mkdtemp(join(process.cwd(),'node_modules','.ks-checkout-client-'));
const original={window:globalThis.window,fetch:globalThis.fetch,fixture:globalThis.__ksCheckoutClient,log:console.error};
const owner=randomUUID();let count=0,serial=0;
function storage(){const items=new Map();return{get length(){return items.size;},key:n=>[...items.keys()][n]??null,
  getItem:key=>items.get(key)??null,setItem:(key,value)=>items.set(key,value),removeItem:key=>items.delete(key)};}
async function fixture({enabled=true,live=true,key,session=true}={}){
  const calls=[],store=storage(),prefix=live?'cs_live_':'cs_test_';
  const state={reference:`${prefix}ClientFixture`,fail:false};
  globalThis.window={sessionStorage:store,location:{href:'https://example.invalid/checkout'}};
  globalThis.__ksCheckoutClient={auth:{getSession:async()=>({data:{session:session?{access_token:'fictional-client-token',user:{id:owner}}:null}})}};
  globalThis.fetch=async(url,config)=>{
    assert.equal(url,'/api/checkout');assert.equal(config.method,'POST');
    assert.equal(config.headers.Authorization,'Bearer fictional-client-token');calls.push(JSON.parse(config.body));
    return state.fail?Response.json({error:'Fictional backend outage; do not pay again.'},{status:503})
      :Response.json({url:'https://checkout.stripe.com/c/pay/fixture',reference:state.reference});
  };
  const result=await build({entryPoints:['src/lib/stripe.ts'],bundle:true,write:false,platform:'node',format:'esm',
    define:{'import.meta.env.VITE_KS_CHECKOUT_INTENT_ENABLED':JSON.stringify(enabled?'true':'false'),
      'import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY':JSON.stringify(key??`pk_${live?'live':'test'}_FictionalFixture`)},
    plugins:[{name:'offline-checkout-adapters',setup(builder){
      builder.onResolve({filter:/^@stripe\/stripe-js$/},()=>({path:'stripe',namespace:'fixture'}));
      builder.onResolve({filter:/^\.\/supabase$/},()=>({path:'auth',namespace:'fixture'}));
      builder.onLoad({filter:/.*/,namespace:'fixture'},({path})=>({loader:'js',contents:path==='stripe'
        ?'export const loadStripe=()=>null;':'export const supabase=globalThis.__ksCheckoutClient;'}));
    }}]});
  const path=join(directory,`client-${++serial}.mjs`);await writeFile(path,result.outputFiles[0].text);
  const api=await import(pathToFileURL(path).href);
  return{calls,store,state,run:kind=>api.createCheckoutSession('gold',150,'6 months',3,kind)};
}
const check=async(label,fn)=>{await fn();count++;console.log(`PASS: ${label}`);};
try{
  console.error=()=>{};
  await check('actual live client sends its selected purpose and reuses the saved request/reference',async()=>{
    const f=await fixture();await f.run('renewal');await f.run('renewal');
    assert.equal(f.calls.length,2);assert.equal(f.calls[0].purchaseKind,'renewal');assert.equal(f.calls[0].connections,3);
    assert.equal(f.calls[1].checkoutRequestId,f.calls[0].checkoutRequestId);assert.equal(f.calls[1].checkoutReference,f.state.reference);
    assert.ok(f.store.getItem(checkoutAttemptKey(owner,'gold',150,'6 months',3,'renewal',true)));
    assert.equal(window.location.href,'https://checkout.stripe.com/c/pay/fixture');
  });
  await check('actual Preview client preserves a pre-existing v1 request instead of replacing it',async()=>{
    const f=await fixture({live:false}),key=checkoutAttemptKey(owner,'gold',150,'6 months',3,'new_service'),id=randomUUID();
    f.store.setItem(key,JSON.stringify({requestId:id,reference:f.state.reference}));await f.run('new_service');
    assert.equal(f.calls[0].checkoutRequestId,id);assert.equal(f.calls[0].checkoutReference,f.state.reference);
  });
  await check('a backend failure retains the original request and does not navigate to payment',async()=>{
    const f=await fixture();f.state.fail=true;await assert.rejects(()=>f.run('renewal'),/do not pay again/);
    const id=f.calls[0].checkoutRequestId;assert.equal(window.location.href,'https://example.invalid/checkout');
    f.state.fail=false;await f.run('renewal');assert.equal(f.calls[1].checkoutRequestId,id);
  });
  await check('a wrong-mode or changed server reference cannot replace the saved checkout or navigate',async()=>{
    const f=await fixture();f.state.reference='cs_test_WrongMode';await assert.rejects(()=>f.run('renewal'));
    assert.equal(window.location.href,'https://example.invalid/checkout');const id=f.calls[0].checkoutRequestId;
    f.state.reference='cs_live_First';await f.run('renewal');window.location.href='https://example.invalid/checkout';
    f.state.reference='cs_live_Changed';await assert.rejects(()=>f.run('renewal'));
    assert.equal(f.calls[2].checkoutRequestId,id);assert.equal(f.calls[2].checkoutReference,'cs_live_First');
    assert.equal(window.location.href,'https://example.invalid/checkout');
  });
  await check('disabled intent capture retains the existing legacy request shape',async()=>{
    const f=await fixture({enabled:false});await f.run();assert.deepEqual(f.calls[0],{plan:'gold',price:150,interval:'6 months',connections:3});
    assert.equal(f.store.length,0);
  });
  await check('missing identity, explicit purpose, public-key mode or storage stops before any checkout request',async()=>{
    for(const options of [{session:false},{key:'invalid'},{}]){
      const f=await fixture(options);await assert.rejects(()=>f.run(options.session===false||options.key?'renewal':undefined));assert.equal(f.calls.length,0);
    }
    const f=await fixture();window.sessionStorage={...f.store,setItem:()=>{throw Error('fictional storage unavailable');}};
    await assert.rejects(()=>f.run('renewal'),/storage unavailable/);assert.equal(f.calls.length,0);
  });
  console.log(`${count} actual checkout-client checks passed with intercepted Auth/HTTP and fictional keys. No external requests.`);
}finally{
  console.error=original.log;
  for(const [name,value] of [['window',original.window],['fetch',original.fetch],['__ksCheckoutClient',original.fixture]]){
    if(value===undefined)delete globalThis[name];else globalThis[name]=value;
  }
  await rm(directory,{recursive:true,force:true});
}
