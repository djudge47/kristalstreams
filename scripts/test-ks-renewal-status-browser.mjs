import assert from 'node:assert/strict';
import { readFile,readdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
const {chromium}=await import(pathToFileURL(process.env.KS_PLAYWRIGHT_MODULE));
const require=createRequire(import.meta.url),provided=require(process.env.KS_CHROMIUM_MODULE),bundled=provided.default??provided;
const owner='44444444-4444-4444-8444-000000000001',other='44444444-4444-4444-8444-000000000002';
const order={reference:'cs_live_BrowserRenewal',tier:'gold',interval:'6 months',connections:3,amountCents:15000,currency:'usd',recordedAt:'2026-10-25T10:00:00Z',
  status:'renewal_complete',testMode:false,providerActivated:false,renewalCompleted:true,completedAt:'2026-10-25T10:02:00Z',expiresAt:'2027-04-25T10:02:00Z'};
const result=await build({stdin:{contents:`import React from'react';import{createRoot}from'react-dom/client';import{MemoryRouter}from'react-router-dom';import Status from'status-component';
createRoot(document.getElementById('root')).render(<MemoryRouter><main className="mx-auto max-w-5xl p-4"><Status accountId="${owner}"/><button id="switch" className="min-h-12 p-4" onClick={()=>{globalThis.__owner='${other}';globalThis.__listeners.forEach(f=>f('SIGNED_IN',{user:{id:'${other}'}}));}}>Switch fixture account</button></main></MemoryRouter>);`,resolveDir:process.cwd(),loader:'jsx'},
  bundle:true,write:false,format:'iife',platform:'browser',jsx:'automatic',define:{'process.env.NODE_ENV':'"production"'},plugins:[{name:'offline-status',setup(b){
    b.onResolve({filter:/^status-component$/},()=>({path:resolve('src/components/CustomerSetupStatus.tsx')}));
    b.onResolve({filter:/\/lib\/supabase$/},()=>({path:'auth',namespace:'fixture'}));
    b.onLoad({filter:/.*/,namespace:'fixture'},()=>({loader:'js',contents:`
      globalThis.__owner='${owner}'; globalThis.__listeners=[];
      export const supabase={auth:{
        getSession:async()=>({data:{session:{access_token:'fictional',user:{id:globalThis.__owner}}}}),
        onAuthStateChange(f){
          globalThis.__listeners.push(f);
          return {data:{subscription:{unsubscribe(){globalThis.__listeners=globalThis.__listeners.filter(x=>x!==f);}}}};
        }
      }};
`}));
  }}]});
const css=await readFile(`dist/assets/${(await readdir('dist/assets')).find(x=>x.endsWith('.css'))}`,'utf8');
const html=`<!doctype html><html><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style><body class="bg-dark-300 text-white"><div id="root"></div><script>${result.outputFiles[0].text}</script></body></html>`;
const browser=await chromium.launch({executablePath:process.env.KS_BROWSER_EXECUTABLE??await bundled.executablePath(),headless:true,args:bundled.args.filter(x=>!['--single-process','--disable-web-security','--allow-running-insecure-content'].includes(x))});
let passed=0;
try{
  for(const width of[390,1280]){
    const context=await browser.newContext({viewport:{width,height:844},isMobile:width===390,hasTouch:width===390});let mode='renewed';const errors=[];
    await context.route('**/*',route=>{
      const request=route.request(),url=new URL(request.url());if(url.origin!=='http://renewal-status.invalid')return route.abort();
      if(url.pathname==='/')return route.fulfill({contentType:'text/html',body:html});
      assert.equal(url.pathname,'/api/ks-customer-setup');assert.equal(request.method(),'GET');
      if(mode==='failure')return route.fulfill({status:503,contentType:'application/json',body:'{"error":"The saved renewal could not be checked."}'});
      const orders=mode==='mixed'?[order,{reference:'cs_live_Pending',tier:'bronze',interval:'monthly',connections:1,amountCents:2000,currency:'usd',recordedAt:order.recordedAt,status:'awaiting_activation',testMode:false,providerActivated:false}]:[{...order,...(mode==='foreign'?{providerActivated:true}:{})}];
      return route.fulfill({contentType:'application/json',body:JSON.stringify({accountId:owner,mode:'read-only',testMode:false,orders,checkedAt:'2028-01-01T00:00:00Z'})});
    });
    const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));await page.goto('http://renewal-status.invalid/');
    await page.getByRole('heading',{name:'Renewal completed',exact:true}).waitFor();assert.ok((await page.locator('body').innerText()).includes('Expiry recorded for this renewal'));
    assert.ok(!(await page.locator('body').innerText()).includes('Saved setup confirmed'));assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
    const refresh=page.getByRole('button',{name:'Check setup status',exact:true});assert.ok((await refresh.boundingBox()).height>=48);
    passed++;console.log(`PASS: ${width}px completed renewal remains historical after expiry with readable touch controls`);
    mode='mixed';await refresh.click();await page.getByRole('heading',{name:'Your streaming orders',exact:true}).waitFor();assert.equal(await page.locator('article').count(),2);assert.ok((await page.locator('body').innerText()).includes('Streaming setup pending'));
    passed++;console.log(`PASS: ${width}px mixed completed and pending orders keep their own status`);
    mode='failure';await refresh.click();await page.getByRole('alert').waitFor();assert.equal(await page.locator('article').count(),0);assert.ok((await page.getByRole('alert').innerText()).includes('do not pay again'));
    mode='renewed';await refresh.click();await page.getByRole('heading',{name:'Renewal completed',exact:true}).waitFor();
    mode='foreign';await refresh.click();await page.getByRole('alert').waitFor();assert.equal(await page.locator('article').count(),0);
    passed++;console.log(`PASS: ${width}px failed or contradictory responses cannot preserve a success card and retry recovers`);
    mode='renewed';await refresh.click();await page.getByRole('heading',{name:'Renewal completed',exact:true}).waitFor();await page.locator('#switch').click();
    await page.getByRole('link',{name:'Sign in again',exact:true}).waitFor();assert.equal(await page.locator('article').count(),0);assert.deepEqual(errors,[]);
    passed++;console.log(`PASS: ${width}px account switching removes the previous customer's renewal details`);await context.close();
  }
  console.log(`${passed} actual renewal-status browser journeys passed. All Auth/HTTP intercepted; no provider, email or payment requests.`);
}finally{await browser.close();}
