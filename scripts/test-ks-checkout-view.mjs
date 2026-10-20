import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server.js';

// Test initial rendered controls with payment/network modules replaced by a
// fixture. This is not evidence of browser interaction or deployed checkout.
const directory = await mkdtemp(join(process.cwd(), 'node_modules', '.ks-checkout-view-'));
try {
  for (const enabled of [false, true]) {
    const result = await build({ entryPoints: ['src/pages/pricing/CheckoutPage.tsx'], bundle: true, write: false,
      format: 'esm', platform: 'node', jsx: 'automatic', external: ['react','react-dom','react-router-dom','lucide-react'],
      plugins: [{ name: 'payment-fixture', setup(builder) {
        builder.onResolve({ filter: /\/lib\/stripe$/ }, () => ({ path: 'payment-fixture', namespace: 'fixture' }));
        builder.onLoad({ filter: /.*/, namespace: 'fixture' }, () => ({ contents:
          `export const checkoutIntentEnabled=${enabled};export const createCheckoutSession=()=>{throw Error('No payment request permitted');};`, loader: 'js' }));
      } }],
    });
    const filename=join(directory,`checkout-${enabled}.mjs`);await writeFile(filename,result.outputFiles[0].text);
    const { default: Checkout }=await import(pathToFileURL(filename).href);
    const markup=renderToStaticMarkup(React.createElement(StaticRouter,{location:{pathname:'/checkout',state:{plan:'bronze',price:20,interval:'monthly',connections:1}}},React.createElement(Checkout)));
    assert.ok(markup.includes('Review your order'));assert.ok(markup.includes('$20.00'));
    if(enabled){
      assert.ok(markup.includes('<legend'));assert.equal((markup.match(/name="purchaseKind"/g)||[]).length,3);
      assert.ok(!markup.includes('checked=""'));assert.ok(markup.includes('disabled=""'));
      for(const label of ['New streaming service','Renew or upgrade my service','Help with my account'])assert.ok(markup.includes(label));
    }else{assert.ok(!markup.includes('name="purchaseKind"'));assert.ok(!markup.includes('disabled=""'));}
    console.log(`PASS: ${enabled?'enabled checkout requires an explicit service choice':'disabled checkout preserves its existing controls'}`);
  }
  console.log('2 initial-render checks passed. No browser, Stripe or Supabase request.');
}finally{await rm(directory,{recursive:true,force:true});}
