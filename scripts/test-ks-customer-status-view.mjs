import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';

// Render the actual component with a supplied server result. Effects are inert;
// this proves displayed copy, not a deployed browser or authenticated API flow.
const require=createRequire(import.meta.url),reactPath=require.resolve('react');
const directory=await mkdtemp(join(process.cwd(),'node_modules','.ks-customer-status-'));
try{
  const result=await build({entryPoints:['src/components/CustomerSetupStatus.tsx'],bundle:true,write:false,format:'esm',platform:'node',jsx:'automatic',external:['react/jsx-runtime','react-dom','react-router-dom','lucide-react'],plugins:[{name:'status-fixture',setup(builder){
    builder.onResolve({filter:/^react$/},()=>({path:'hooks',namespace:'fixture'}));
    builder.onResolve({filter:/\/lib\/supabase$/},()=>({path:'auth',namespace:'fixture'}));
    builder.onLoad({filter:/.*/,namespace:'fixture'},args=>({contents:args.path==='hooks'
      ? `import React from ${JSON.stringify(reactPath)};export default React;export const useState=()=>[globalThis.__ksStatusView,()=>{}];export const useEffect=()=>{};export const useCallback=f=>f;export const useRef=()=>({current:null});`
      : `export const supabase=new Proxy({}, {get(){throw Error('No auth or network permitted');}});`,loader:'js'}));
    builder.onResolve({filter:new RegExp('^'+reactPath.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'$')},()=>({path:reactPath,external:true}));
  }}]});
  const filename=join(directory,'status.mjs');await writeFile(filename,result.outputFiles[0].text);
  const {default:Status}=await import(pathToFileURL(filename).href);
  const base={reference:'cs_live_FictionalView',tier:'bronze',interval:'monthly',connections:1,amountCents:2000,currency:'usd',recordedAt:'2026-10-20T00:00:00Z',status:'awaiting_activation',testMode:false,providerActivated:false};
  for(const kind of['live-pending','live-review','test-pending','test-complete','test-expired','mixed']){
    const test=kind.startsWith('test')||kind==='mixed';
    const order={...base,...(test?{reference:'cs_test_FictionalView',testMode:true}:{}),
      ...(kind==='live-review'?{status:'requires_review'}:kind==='test-complete'||kind==='mixed'?{status:'setup_complete',providerActivated:true,expiresAt:'2026-11-20T00:00:00Z'}:kind==='test-expired'?{status:'setup_expired',expiresAt:'2026-10-19T00:00:00Z'}:{})};
    const orders=kind==='mixed'?[order,{...base,reference:'cs_test_PendingView',testMode:true}]:[order];
    globalThis.__ksStatusView={kind:'ready',orders,checkedAt:'2026-10-20T00:00:00Z'};
    const markup=renderToStaticMarkup(React.createElement(StaticRouter,{},React.createElement(Status,{accountId:'00000000-0000-4000-8000-000000000001'})));
    assert.ok(markup.includes('do not pay again'));assert.equal(markup.includes('This test payment did not charge your card'),test);
    assert.equal(markup.includes('Preview · Test payment'),test);assert.equal(markup.includes('Paid amount'),!test);
    assert.equal(markup.includes('setup needs attention'),kind==='live-review');
    assert.equal(markup.includes('Saved setup confirmed'),kind==='test-complete'||kind==='mixed');
    assert.equal(markup.includes('Saved service expiry'),['test-complete','test-expired','mixed'].includes(kind));
    assert.equal(markup.includes('Service period ended'),kind==='test-expired');
    if(kind==='mixed'){assert.ok(markup.includes('Your streaming orders'));assert.ok(markup.includes('Streaming setup pending'));assert.equal((markup.match(/<article/g)||[]).length,2);}
    console.log(`PASS: actual customer status component renders ${kind} with per-order setup state`);
  }
  console.log('6 initial-render checks passed. No browser or external request.');

}finally{delete globalThis.__ksStatusView;await rm(directory,{recursive:true,force:true});}
