import assert from 'node:assert/strict';
import { mkdtemp,writeFile,rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { join,basename } from 'node:path';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';

const require=createRequire(import.meta.url),reactPath=require.resolve('react');
const directory=await mkdtemp(join(process.cwd(),'node_modules','.ks-completion-screens-'));
try{
  const output=await build({entryPoints:{payment:'src/pages/PaymentSuccess.tsx',ticket:'src/pages/client/NewTicket.tsx'},outdir:directory,outExtension:{'.js':'.mjs'},bundle:true,write:false,format:'esm',platform:'node',jsx:'automatic',external:['react/jsx-runtime','react-dom','react-router-dom','lucide-react'],plugins:[{name:'completion-screen-fixture',setup(builder){
    builder.onResolve({filter:/^react$/},()=>({path:'hooks',namespace:'fixture'}));
    builder.onResolve({filter:/\/lib\/supabase$/},()=>({path:'auth',namespace:'fixture'}));
    builder.onLoad({filter:/.*/,namespace:'fixture'},args=>({contents:args.path==='hooks'
      ? `import React from ${JSON.stringify(reactPath)};export default React;export const useState=initial=>[globalThis.__ksStates.shift(),()=>{}];export const useEffect=()=>{};export const useCallback=f=>f;export const useRef=()=>({current:null});`
      : `export const supabase=new Proxy({}, {get(){throw Error('No auth, ticket write or network permitted');}});`,loader:'js'}));
    builder.onResolve({filter:new RegExp('^'+reactPath.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'$')},()=>({path:reactPath,external:true}));
  }}]});
  for(const file of output.outputFiles)await writeFile(join(directory,basename(file.path)),file.text);
  const {default:Payment}=await import(pathToFileURL(join(directory,'payment.mjs')).href);
  const {default:Ticket}=await import(pathToFileURL(join(directory,'ticket.mjs')).href);
  const render=(Component,state)=>renderToStaticMarkup(React.createElement(StaticRouter,{location:{pathname:'/client/support/new',state}},React.createElement(Component)));
  for(const kind of ['ready','expired']){
    globalThis.__ksStates=[kind,kind==='ready'?'Streaming setup confirmed':'Service period ended','Saved payment. Do not pay again.',0];
    const markup=render(Payment);
    assert.equal(markup.includes('text-amber-400'),kind==='expired');assert.equal(markup.includes('Contact Support'),kind==='expired');assert.ok(markup.includes('Go to Dashboard'));
    console.log(`PASS: actual payment screen renders ${kind} with appropriate status and support action`);
  }
  const base={reference:'cs_test_ScreenFixture',tier:'bronze',interval:'monthly',connections:1,amountCents:2000,currency:'usd',recordedAt:'2026-10-19T00:00:00Z',status:'awaiting_activation',testMode:true,providerActivated:false};
  for(const kind of ['test-pending','test-complete','test-expired','live-review']){
    const order={...base,...(kind==='test-complete'?{status:'setup_complete',providerActivated:true,expiresAt:'2026-11-19T00:00:00Z'}:kind==='test-expired'?{status:'setup_expired',expiresAt:'2026-10-19T12:00:00Z'}:kind==='live-review'?{reference:'cs_live_ScreenFixture',status:'requires_review',testMode:false}:{})};
    globalThis.__ksStates=['Streaming setup help','Help with my saved order.','Streaming','normal',false,null,{kind:'ready',accountId:'00000000-0000-4000-8000-000000000001',orders:[order],checkedAt:'2026-10-20T00:00:00Z'},order.reference];
    const markup=render(Ticket,{setupHelp:true});
    assert.equal(markup.includes('Preview · Test payment'),order.testMode);assert.equal(markup.includes('Paid amount'),!order.testMode);assert.equal(markup.includes('did not charge your card'),order.testMode);
    assert.equal(markup.includes('Setup confirmed'),kind==='test-complete');assert.equal(markup.includes('Service period ended'),kind==='test-expired');assert.equal(markup.includes('Saved service expiry'),kind==='test-complete'||kind==='test-expired');
    assert.ok(!markup.includes('No real charge or streaming activation'));assert.ok(markup.includes('Nothing is sent until you choose Create Ticket'));
    console.log(`PASS: actual support form renders ${kind} with accurate payment/setup context`);
  }
  console.log('6 completion-screen render checks passed. No browser, auth, ticket submission or external request.');
}finally{delete globalThis.__ksStates;await rm(directory,{recursive:true,force:true});}
