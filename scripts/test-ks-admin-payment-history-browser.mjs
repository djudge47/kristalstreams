import assert from 'node:assert/strict';
import { readFile,readdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
const {chromium}=await import(pathToFileURL(process.env.KS_PLAYWRIGHT_MODULE));
const require=createRequire(import.meta.url),provided=require(process.env.KS_CHROMIUM_MODULE),bundled=provided.default??provided;
const customer='44444444-4444-4444-8444-000000000010';
const website={id:'cs_live_BrowserAdminHistory',customer_id:customer,source:'website_checkout',payment_method:'stripe_checkout',payment_status:'recorded',amount:125,amount_cents:12500,months:6,connections:3,paid_at:'2026-10-25T10:00:00Z',renewal_completed_at:'2026-10-25T10:02:00Z',renewal_expires_at:'2027-04-25T10:02:00Z'};
const payments=[website,...Array.from({length:52},(_,n)=>({id:`55555555-5555-4555-8555-${String(n+1).padStart(12,'0')}`,customer_id:customer,payment_method:'manual_paypal',payment_status:n===0?'refunded':n===1?'pending':'paid',amount:n===2?0:95,paid_at:new Date(Date.parse(website.paid_at)-(n+1)*60000).toISOString()}))];
const result=await build({stdin:{contents:`import React,{useState} from'react';import{createRoot}from'react-dom/client';import History from'history-component';
function App(){const[data,setData]=useState(globalThis.__payments),[error,setError]=useState(null),[who,setWho]=useState('first');return <main className="mx-auto max-w-2xl p-4"><History key={who} payments={data} loading={false} error={error}/><button id="fail" className="min-h-12 p-4" onClick={()=>setError('fictional failure')}>Fail fixture refresh</button><button id="recover" className="min-h-12 p-4" onClick={()=>setError(null)}>Recover fixture refresh</button><button id="switch" className="min-h-12 p-4" onClick={()=>{setWho('second');setData([{...globalThis.__payments[1],id:'55555555-5555-4555-8555-000000001000',amount:42.37}]);}}>Switch fixture customer</button></main>}createRoot(document.getElementById('root')).render(<App/>);`,resolveDir:process.cwd(),loader:'jsx'},
 bundle:true,write:false,format:'iife',platform:'browser',jsx:'automatic',define:{'process.env.NODE_ENV':'"production"'},plugins:[{name:'offline-history',setup(b){b.onResolve({filter:/^history-component$/},()=>({path:resolve('src/pages/admin/AdminPaymentHistory.tsx')}));}}]});
const css=await readFile(`dist/assets/${(await readdir('dist/assets')).find(x=>x.endsWith('.css'))}`,'utf8');
const html=`<!doctype html><html><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style><body class="bg-dark-300 text-white"><div id="root"></div><script>${result.outputFiles[0].text}</script></body></html>`;
const browser=await chromium.launch({executablePath:process.env.KS_BROWSER_EXECUTABLE??await bundled.executablePath(),headless:true,args:bundled.args.filter(x=>!['--single-process','--disable-web-security','--allow-running-insecure-content'].includes(x))});
let passed=0;
try{
  for(const width of[390,1280]){
    const context=await browser.newContext({viewport:{width,height:844},isMobile:width===390,hasTouch:width===390});const errors=[];
    await context.addInitScript(payments=>{globalThis.__payments=payments;},payments);
    await context.route('**/*',route=>new URL(route.request().url()).origin==='http://admin-payment-history.invalid'?route.fulfill({contentType:'text/html',body:html}):route.abort());
    const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));await page.goto('http://admin-payment-history.invalid/');
    await page.getByRole('list',{name:'Customer payment history'}).waitFor();assert.equal(await page.locator('li').count(),20);assert.ok((await page.locator('body').innerText()).includes('$125.00'));
    assert.ok((await page.locator('body').innerText()).includes('refunded'));assert.ok((await page.locator('body').innerText()).includes('pending'));assert.ok((await page.locator('body').innerText()).includes('$0.00'));
    assert.ok((await page.locator('body').innerText()).includes('Expiry recorded for this renewal'));assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
    passed++;console.log(`PASS: ${width}px admin history retains legacy zero/refunded/pending records and labels historical website amounts`);
    const older=page.getByRole('button',{name:'Older payments',exact:true}),newer=page.getByRole('button',{name:'Newer payments',exact:true});assert.ok((await older.boundingBox()).height>=44);
    await older.click();await page.getByText('Page 2 of 3',{exact:true}).waitFor();assert.equal(await page.locator('li').count(),20);assert.ok(!(await page.locator('body').innerText()).includes('$125.00'));
    await older.click();await page.getByText('Page 3 of 3',{exact:true}).waitFor();assert.equal(await page.locator('li').count(),13);assert.equal(await older.isDisabled(),true);
    await newer.click();await newer.click();await page.getByText('Page 1 of 3',{exact:true}).waitFor();assert.equal(await page.locator('li').count(),20);
    passed++;console.log(`PASS: ${width}px admin payment pages remain bounded and older/newer navigation restores the original records`);
    await page.locator('#fail').click();await page.getByRole('alert').waitFor();assert.equal(await page.locator('li').count(),0);assert.ok((await page.getByRole('alert').innerText()).includes('could not be checked'));
    await page.locator('#recover').click();await page.getByRole('list',{name:'Customer payment history'}).waitFor();assert.equal(await page.locator('li').count(),20);
    passed++;console.log(`PASS: ${width}px unavailable payment history shows an error rather than a missing-payment claim and recovers`);
    await older.click();await page.getByText('Page 2 of 3',{exact:true}).waitFor();await page.locator('#switch').click();await page.getByText('Page 1 of 1',{exact:true}).waitFor();assert.equal(await page.locator('li').count(),1);assert.ok((await page.locator('body').innerText()).includes('$42.37'));assert.ok(!(await page.locator('body').innerText()).includes('$125.00'));assert.deepEqual(errors,[]);
    passed++;console.log(`PASS: ${width}px changing customers clears the previous receipt page`);await context.close();
  }
  console.log(`${passed} actual administrator payment-history browser journeys passed. All Auth/HTTP intercepted; no provider, email or payment requests.`);
}finally{await browser.close();}
