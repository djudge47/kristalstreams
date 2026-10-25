import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
assert.ok(process.env.KS_PLAYWRIGHT_MODULE);
const {chromium}=await import(pathToFileURL(process.env.KS_PLAYWRIGHT_MODULE));
const require=createRequire(import.meta.url),provided=process.env.KS_CHROMIUM_MODULE?require(process.env.KS_CHROMIUM_MODULE):null;
const bundled=provided?.default??provided;
const executablePath=process.env.KS_BROWSER_EXECUTABLE??await bundled?.executablePath();assert.ok(executablePath);
const id=n=>`44444444-4444-4444-8444-${String(n).padStart(12,'0')}`,owner=id(900),other=id(901);
const rows=Array.from({length:52},(_,n)=>({customerId:id(n+1),username:`owned_service_${n+1}`,connections:3,expiresAt:null}));
const result=await build({stdin:{contents:`import React,{useState} from 'react';import{createRoot}from'react-dom/client';import{MemoryRouter}from'react-router-dom';import Selection from 'selection-component';
function App(){const[selected,setSelected]=useState();const[,render]=useState(0);return <MemoryRouter><main className="mx-auto max-w-xl p-4"><Selection selected={selected} onChange={setSelected} disabled={false}/><button id="continue" className="min-h-12 border px-4" disabled={!selected}>Review selected service</button><output id="chosen">{selected||''}</output><button id="switch" className="min-h-12 border px-4" onClick={()=>{globalThis.__account={status:'ready',accountId:'${other}'};setSelected(undefined);render(n=>n+1);}}>Switch fixture owner</button></main></MemoryRouter>}createRoot(document.getElementById('root')).render(<App/>);`,resolveDir:process.cwd(),loader:'jsx'},
  bundle:true,write:false,format:'iife',platform:'browser',jsx:'automatic',define:{'process.env.NODE_ENV':'"production"'},
  plugins:[{name:'offline-selection',setup(b){
    b.onResolve({filter:/^selection-component$/},()=>({path:resolve('src/components/CheckoutServiceSelect.tsx')}));
    b.onResolve({filter:/\/useVerifiedWebsiteAccount$/},()=>({path:'account',namespace:'fixture'}));
    b.onResolve({filter:/\/supabase$/},()=>({path:'auth',namespace:'fixture'}));
    b.onLoad({filter:/.*/,namespace:'fixture'},({path})=>({loader:'js',contents:path==='account'
      ?'export const useVerifiedWebsiteAccount=()=>globalThis.__account;'
      :'export const supabase={auth:{getSession:async()=>({data:{session:{access_token:`fixture-${globalThis.__account.accountId}`,user:{id:globalThis.__account.accountId}}},error:null})}};'}));
  }}]});
const cssFile=(await readdir('dist/assets')).find(x=>x.endsWith('.css'));assert.ok(cssFile);
const css=await readFile(`dist/assets/${cssFile}`,'utf8');
const html=`<!doctype html><html><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style><body class="bg-dark-300 text-white"><div id="root"></div><script>${result.outputFiles[0].text}</script></body></html>`;
const browser=await chromium.launch({executablePath,headless:true,args:(bundled?.args??['--no-sandbox','--disable-dev-shm-usage']).filter(x=>!['--single-process','--disable-web-security','--allow-running-insecure-content'].includes(x))});
let passed=0;
try{
  for(const width of [390,1280]){
    const context=await browser.newContext({viewport:{width,height:844},isMobile:width===390,hasTouch:width===390});
    await context.addInitScript(({owner})=>{globalThis.__account={status:'ready',accountId:owner};},{owner});
    let mode='normal';const cursors=[],errors=[];
    await context.route('**/*',async route=>{
      const request=route.request(),url=new URL(request.url());
      if(url.origin!=='http://checkout-fixture.invalid')return route.abort();
      if(url.pathname==='/')return route.fulfill({contentType:'text/html',body:html});
      if(url.pathname!=='/api/ks-customer-setup')return route.abort();
      assert.equal(request.method(),'GET');assert.equal(url.searchParams.get('view'),'checkout-services');
      const who=request.headers().authorization===`Bearer fixture-${other}`?other:owner,after=url.searchParams.get('afterId');cursors.push(after);
      if(mode==='failure')return route.fulfill({status:503,contentType:'application/json',body:'{"error":"fictional read unavailable"}'});
      const services=who===other?[{customerId:id(100),username:'other_owner_service',connections:1,expiresAt:null}]:after?rows.slice(50):rows.slice(0,50);
      return route.fulfill({contentType:'application/json',body:JSON.stringify({accountId:who,checkedAt:'2026-10-25T03:00:00Z',services,nextCursor:who===owner&&!after?rows[49].customerId:null})});
    });
    const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));await page.goto('http://checkout-fixture.invalid/');
    try { await page.waitForSelector('#renewal-service',{timeout:5000}); }
    catch { throw Error(JSON.stringify({errors,body:await page.locator('body').innerText()})); }
    await page.waitForSelector('#renewal-service option[value="'+rows[0].customerId+'"]',{state:'attached'});
    assert.equal(await page.locator('#continue').isDisabled(),true);await page.selectOption('#renewal-service',rows[0].customerId);
    await page.waitForFunction(()=>!document.querySelector('#continue').disabled);assert.equal(await page.locator('#chosen').textContent(),rows[0].customerId);
    const box=await page.locator('#renewal-service').boundingBox();assert.ok(box.height>=44);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
    passed++;console.log(`PASS: ${width}px selector requires an explicit linked choice with a touch-sized control`);
    await page.getByRole('button',{name:'More services',exact:true}).click();
    await page.waitForSelector('#renewal-service option[value="'+rows[50].customerId+'"]',{state:'attached'});
    assert.equal(await page.locator('#continue').isDisabled(),true);assert.equal(await page.locator('#renewal-service option').count(),3);
    assert.ok(cursors.includes(rows[49].customerId));await page.getByRole('button',{name:'Previous services',exact:true}).click();
    await page.waitForSelector('#renewal-service option[value="'+rows[0].customerId+'"]',{state:'attached'});
    passed++;console.log(`PASS: ${width}px service pages replace the list and clear the previous selection`);
    await page.selectOption('#renewal-service',rows[0].customerId);await page.locator('#switch').click();
    await page.waitForSelector('#renewal-service option[value="'+id(100)+'"]',{state:'attached'});
    assert.equal(await page.locator('#continue').isDisabled(),true);assert.equal(await page.locator('#renewal-service option').count(),2);
    assert.ok(!(await page.locator('body').textContent()).includes('owned_service_1'));
    passed++;console.log(`PASS: ${width}px account switching removes the former owner's choices`);
    mode='failure';await page.reload();await page.getByRole('button',{name:'Try again',exact:true}).waitFor();
    assert.equal(await page.locator('#continue').isDisabled(),true);mode='normal';await page.getByRole('button',{name:'Try again',exact:true}).click();
    await page.waitForSelector('#renewal-service option[value="'+rows[0].customerId+'"]',{state:'attached'});assert.equal(await page.locator('#continue').isDisabled(),true);
    assert.deepEqual(errors,[]);passed++;console.log(`PASS: ${width}px service-read failures block checkout and recover without choosing an account`);
    await context.close();
  }
  console.log(`${passed} actual service-selector browser journeys passed. All HTTP/Auth was intercepted; no payment or provider access.`);
}finally{await browser.close();}
