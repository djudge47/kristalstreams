import assert from 'node:assert/strict';
import { getRetailPrice, getCustomerRetailPrice, retailPlans } from '../_shared/ks-retail-pricing.js';
import { getPlan, validateOrder, validatePaidSession } from '../_server/ks-payment-validation.js';
import { build } from 'esbuild';
import { mkdtemp,writeFile,rm } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
let checks=0;
function check(name,fn){fn();checks++;console.log('PASS: '+name);}
const published={1:[20,35,50,65,80],3:[45,75,110,140,175],6:[60,105,150,195,240],12:[95,165,235,305,375]};
check('all 20 published totals match website, checkout validation and monthly equivalents',()=>{
  for(const p of Object.values(retailPlans))for(let c=1;c<=5;c++){
    const price=getRetailPrice(p.months,c);assert.equal(price.totalCents,published[p.months][c-1]*100);
    assert.equal(price.monthlyCents,Math.round(price.totalCents/p.months));
    for(const name of p.aliases){const order=getPlan(name,c);assert.equal(order.cents,price.totalCents);
      assert.equal(validateOrder({plan:name,connections:c,interval:p.interval,price:price.totalCents/100}).cents,price.totalCents);}
  }
});
const customer={package_name:'6 Months + 3 Connections',connections_allowed:3,monthly_price:25,payment_status:'unpaid',last_payment_at:null,trial:false,source:'manual'};
check('six-month total is $150, monthly equivalent $25; deriving a price cannot mark a customer paid',()=>{
  const before=structuredClone(customer);assert.deepEqual(getCustomerRetailPrice(customer),{months:6,connections:3,totalCents:15000,monthlyCents:2500});
  assert.deepEqual(customer,before);assert.equal(getCustomerRetailPrice({...customer,monthly_price:0}).totalCents,15000);
});
check('saved custom rates survive display; unknown or mismatched packages are not guessed',()=>{
  assert.equal(getCustomerRetailPrice({...customer,monthly_price:20}).totalCents,12000);
  for(const patch of [{package_name:null},{package_name:'Gold'},{connections_allowed:4},{package_name:'36 months + 3 connections'}])assert.equal(getCustomerRetailPrice({...customer,...patch}),null);
  for(const dimensions of [[0,3],[6,6],[6,0],[6,1.5],['6',3],[6,'3']])assert.equal(getRetailPrice(...dimensions),null);
});
check('trials and preview payments cannot become customer revenue from a catalog price',()=>{
  for(const patch of [{trial:true},{payment_status:'trial'},{payment_status:'preview_test'},{source:'roomba_preview_trial'},{source:'roomba_preview_paid'}])assert.equal(getCustomerRetailPrice({...customer,...patch}),null);
});
check('provider credits and a selected catalog price cannot be treated as a paid customer receipt',()=>{
  assert.throws(()=>validateOrder({plan:'gold',connections:3,interval:'6 months',price:15}));
  assert.throws(()=>validatePaidSession({status:'complete',mode:'payment',payment_status:'unpaid',livemode:true},true));
});
const directory=await mkdtemp(join(process.cwd(),'node_modules','.ks-retail-chart-'));
try{
  const built=await build({entryPoints:['src/components/PricingPlans.tsx'],bundle:true,write:false,platform:'node',format:'esm',jsx:'automatic',packages:'external'});
  const file=join(directory,'chart.mjs');await writeFile(file,built.outputFiles[0].text);
  const {default:PricingPlans}=await import(pathToFileURL(file).href);
  const markup=renderToStaticMarkup(React.createElement(MemoryRouter,null,React.createElement(PricingPlans)));
  check('actual public pricing chart renders all four unchanged plan names and all 20 total prices',()=>{
    for(const name of ['Bronze','Silver','Gold','Platinum'])assert.ok(markup.includes(name));
    for(const p of Object.values(retailPlans))for(const cents of p.prices)assert.ok(markup.includes('$'+cents/100));
    assert.equal((markup.match(/Connection/g)||[]).length,20);
  });
}finally{await rm(directory,{recursive:true,force:true});}
console.log(`${checks} retail pricing checks passed. No live payments, provider requests or database writes.`);
