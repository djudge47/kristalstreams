import assert from 'node:assert/strict';
import { readFile,readdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
const {chromium}=await import(pathToFileURL(process.env.KS_PLAYWRIGHT_MODULE));
const require=createRequire(import.meta.url),provided=require(process.env.KS_CHROMIUM_MODULE),bundled=provided.default??provided;
const owner='44444444-4444-4444-8444-000000000001',other='44444444-4444-4444-8444-000000000002';
const customer='44444444-4444-4444-8444-000000000010';
const service={customerId:customer,username:'fictional_history',name:'Fictional Customer',packageName:'Later service package',connections:4,expiresAt:'2028-04-25T10:02:00Z',savedStatus:'active',legacyPaid:true,updatedAt:'2026-10-25T10:03:00Z'};
const website={id:'cs_live_BrowserHistory',customerId:customer,source:'website_checkout',method:'stripe_checkout',amountCents:15000,months:6,connections:3,paidAt:'2026-10-25T10:00:00.000000Z',renewalCompletedAt:'2026-10-25T10:02:00Z',renewalExpiresAt:'2027-04-25T10:02:00Z'};
const payments=[website,...Array.from({length:52},(_,n)=>({id:`55555555-5555-4555-8555-${String(n+1).padStart(12,'0')}`,customerId:customer,method:'manual_paypal',amountCents:9500,months:12,connections:1,paidAt:new Date(Date.parse(website.paidAt)-(n+1)*60000).toISOString()}))];
const result=await build({stdin:{contents:`import React from'react';import{createRoot}from'react-dom/client';import{MemoryRouter}from'react-router-dom';import Status from'status-component';
createRoot(document.getElementById('root')).render(<MemoryRouter><main className="mx-auto max-w-5xl p-4"><Status accountId="${owner}"/><button id="switch" className="min-h-12 p-4" onClick={()=>{globalThis.__owner='${other}';globalThis.__listeners.forEach(f=>f('SIGNED_IN',{user:{id:'${other}'}}));}}>Switch fixture account</button></main></MemoryRouter>);`,resolveDir:process.cwd(),loader:'jsx'},
  bundle:true,write:false,format:'iife',platform:'browser',jsx:'automatic',define:{'process.env.NODE_ENV':'"production"'},plugins:[{name:'offline-status',setup(b){
    b.onResolve({filter:/^status-component$/},()=>({path:resolve('src/components/CustomerCrmService.tsx')}));
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
      const request=route.request(),url=new URL(request.url());if(url.origin!=='http://payment-history.invalid')return route.abort();
      if(url.pathname==='/')return route.fulfill({contentType:'text/html',body:html});
      assert.equal(url.pathname,'/api/ks-customer-setup');assert.equal(request.method(),'GET');
      if(mode==='failure')return route.fulfill({status:503,contentType:'application/json',body:'{"error":"The saved renewal could not be checked."}'});
      assert.equal(url.searchParams.get('view'),'crm-service');
      const before=url.searchParams.get('beforeId'),index=before?payments.findIndex(p=>p.id===before)+1:0;
      if(before)assert.ok(index>0);const items=payments.slice(index,index+20),last=items.at(-1);
      return route.fulfill({contentType:'application/json',body:JSON.stringify({accountId:owner,checkedAt:'2026-10-25T11:00:00Z',services:[service],payments:items,nextCursor:index+20<payments.length?{paidAt:last.paidAt,id:last.id}:null})});
    });
    const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));await page.goto('http://payment-history.invalid/');
    await page.getByRole('heading',{name:'Your streaming service',exact:true}).waitFor();
    await page.getByText('Website checkout',{exact:false}).waitFor();
    assert.equal(await page.getByText('Payment reference for support',{exact:true}).count(),20);
    const text=await page.locator('body').innerText();assert.ok(text.includes('Payment recorded'));assert.ok(text.includes('Renewal completed'));assert.ok(text.includes('Expiry recorded for this renewal'));assert.ok(text.includes('2027'));assert.ok(text.includes('2028'));
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
    const older=page.getByRole('button',{name:'Load older payments',exact:true});assert.ok((await older.boundingBox()).height>=44);
    passed++;console.log(`PASS: ${width}px merged payment history distinguishes recorded website money and historical expiry from current service`);
    await older.click();await page.getByRole('button',{name:'Newer payments',exact:true}).waitFor();
    assert.equal(await page.getByText('Payment reference for support',{exact:true}).count(),20);assert.equal(await page.getByText('Website checkout',{exact:false}).count(),0);
    await older.click();await page.waitForFunction(()=>document.querySelectorAll('summary').length===13);
    assert.equal(await page.getByText('Payment reference for support',{exact:true}).count(),13);assert.equal(await older.count(),0);
    await page.getByRole('button',{name:'Newer payments',exact:true}).click();await older.waitFor();
    assert.equal(await page.getByText('Payment reference for support',{exact:true}).count(),20);
    await page.getByRole('button',{name:'Newer payments',exact:true}).click();await page.getByText('Website checkout',{exact:false}).waitFor();assert.equal(await page.getByRole('button',{name:'Newer payments',exact:true}).count(),0);
    passed++;console.log(`PASS: ${width}px older and newer pages replace the list, stay bounded and recover the original receipt`);
    mode='failure';await page.getByRole('button',{name:'Refresh service details',exact:true}).click();await page.getByRole('alert').waitFor();assert.equal(await page.getByText('Payment reference for support',{exact:true}).count(),0);assert.ok((await page.getByRole('alert').innerText()).includes('do not pay again'));
    mode='renewed';await page.getByRole('button',{name:'Refresh service details',exact:true}).click();await page.getByText('Website checkout',{exact:false}).waitFor();
    passed++;console.log(`PASS: ${width}px failed history refresh cannot claim a missing payment and retry reloads the bounded latest page`);
    await page.locator('#switch').click();await page.getByRole('link',{name:'Sign in again',exact:true}).waitFor();assert.equal(await page.getByText('Payment reference for support',{exact:true}).count(),0);assert.deepEqual(errors,[]);
    passed++;console.log(`PASS: ${width}px account switching clears all payment, renewal and service details`);await context.close();
  }
  console.log(`${passed} actual merged payment-history browser journeys passed. All Auth/HTTP intercepted; no provider, email or payment requests.`);
}finally{await browser.close();}
