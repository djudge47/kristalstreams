import assert from 'node:assert/strict';
import { readFile, mkdtemp, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { bulkCustomerSnapshot, compareBulkLine, runBulkXuiCheck } from '../_shared/ks-crm-bulk-check.js';
import { createRoombaCrmRoute } from '../_server/ks-roomba-crm-route.js';

const start = Date.parse('2026-10-22T08:00:00Z');
const customers = Array.from({ length: 20 }, (_, i) => ({
  id: `11111111-1111-4111-8111-${String(i + 1).padStart(12, '0')}`, external_id: 900001 + i,
  username: `fictional_${i + 1}`, package_name: '6 Months + 3 Connections', connections_allowed: 3,
  expiration_at: '2027-04-22T08:00:00Z', account_status: 'active', trial: false,
  iptv_password: 'SECRET-password', xui_line_url: 'SECRET-url', notes: 'SECRET-notes',
}));
const pkg = { id: '77', name: customers[0].package_name, maxConnections: 3,
  paid: { count: 6, unit: 'months', credits: 15 }, trial: null, bouquets: [1,60,63], issues: [] };
const env = { VERCEL_ENV: 'preview', VITE_SUPABASE_URL: 'https://wftfxerblhlsxiijtfbo.supabase.co',
  VITE_SUPABASE_ANON_KEY: 'fictional-anon', SUPABASE_SERVICE_ROLE_KEY: 'fictional-service', ROOMBA_PREVIEW_SECRET: 'fictional-preview' };
function fixture(patch = {}) {
  let clock = start;
  const calls = { requests: [], provider: [], selects: [], auth: 0, waits: [] };
  const state = { user: { id: customers[0].id, email: 'djudge47@gmail.com', email_confirmed_at: '2026-01-01T00:00:00Z' }, packages: [pkg], ...patch };
  const route = createRoombaCrmRoute({ env: { ...env, ...state.env }, now: () => clock,
    createClient(url, key) {
      assert.equal(url, env.VITE_SUPABASE_URL);
      if (key === env.VITE_SUPABASE_ANON_KEY) return { auth: { async getUser(token) {
        calls.auth++; assert.equal(token, 'fictional-token'); return { data: { user: state.user }, error: null };
      } } };
      assert.equal(key, env.SUPABASE_SERVICE_ROLE_KEY);
      return { from(table) { assert.equal(table, 'iptv_customers'); let id;
        return { select(columns) { assert.equal(columns, 'id,external_id,username'); calls.selects.push(columns); return this; },
          eq(column, value) { assert.equal(column, 'id'); id = value; return this; },
          async maybeSingle() { const c = customers.find(item => item.id === id); return { data: c && { id: c.id, external_id: c.external_id, username: state.changedIdentity ? 'changed_name' : c.username }, error: null }; },
        };
      } };
    },
    readFactory: action => async (req, res) => {
      assert.equal(req.method, 'GET'); calls.provider.push(action);
      let body;
      if (action.readAction === 'user_info') body = { status: 'connected', account: { id: '88', credits: '53', password: 'SECRET-account' } };
      else if (action.readAction === 'packages') body = { status: 'packages_ready', packages: state.packages };
      else {
        assert.equal(action.readAction, 'get_line'); const c = customers.find(c => String(c.external_id) === action.lineId);
        body = { status: 'line_ready', line: { id: action.lineId, username: c.username, resellerId: '88', packageId: '77',
          expiresAt: c.expiration_at, connections: 3, trial: false, enabled: true, adminEnabled: true, bouquetIds: [1,60,63], password: 'SECRET-line', ...state.line } };
      }
      res.status(200).json({ transport: 'fixie', mode: 'read-only', databaseWrites: false, ...body });
    },
  });
  async function request(url, options) {
    calls.requests.push({ url, method: options.method, time: clock });
    const query = Object.fromEntries(new URL(url, 'https://fixture.invalid').searchParams);
    const res = { headers: {}, setHeader(k,v) { this.headers[k] = v; }, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
    await route({ method: options.method, query, headers: { authorization: options.headers?.Authorization } }, res);
    assert.ok(!JSON.stringify(res.body).includes('SECRET'));
    return { ok: res.code === 200, status: res.code, json: async () => res.body };
  }
  return { state, calls, request, options: { customers, fetchImpl: request, now: () => clock,
    getToken: async () => 'fictional-token', wait: async (ms, signal) => { if (signal?.aborted) throw new DOMException('stopped','AbortError'); calls.waits.push(ms); clock += ms; } } };
}
let checks = 0;
const test = async (name, run) => { await run(); checks++; console.log(`PASS: ${name}`); };
await test('all 20 accounts traverse the real authenticated route, in order, without writes or truncation', async () => {
  const f = fixture(), events = [];
  const result = await runBulkXuiCheck({ ...f.options, onProgress: p => events.push(p) });
  assert.equal(result.complete, true); assert.equal(result.rows.length, 20); assert.ok(result.rows.every(row => row.status === 'match'));
  assert.equal(f.calls.auth, 20); assert.equal(f.calls.requests.length, 20); assert.equal(f.calls.provider.length, 60);
  assert.ok(f.calls.requests.every(req => req.method === 'GET' && req.url.startsWith('/api/ks-roomba-crm?view=customer-comparison&customerId=')));
  for (let i = 1; i < f.calls.requests.length; i++) assert.ok(f.calls.requests[i].time - f.calls.requests[i-1].time >= 30000);
  assert.equal(events.at(-1).state, 'complete'); assert.equal(events.at(-1).completed, 20);
  assert.ok(!JSON.stringify(result).includes('SECRET')); assert.ok(!JSON.stringify(events).includes('fictional-token'));
});
await test('snapshots exclude legacy credentials and validate every identity before any request', async () => {
  const snapshot = bulkCustomerSnapshot(customers); assert.ok(!JSON.stringify(snapshot).includes('SECRET'));
  for (const list of [[], [...customers, customers[0]], [{...customers[0],external_id:-1}], [{...customers[0],username:'bad name'}], [{...customers[0],id:'invalid'}], Array(1001).fill(customers[0])]) {
    const f=fixture(); await assert.rejects(runBulkXuiCheck({...f.options,customers:list})); assert.equal(f.calls.requests.length,0);
  }
});
await test('missing catalog membership and saved expiration stay unverified instead of guessed', async () => {
  const f=fixture({packages:[{...pkg,id:'78'}]}); const r=await runBulkXuiCheck({...f.options,customers:[{...customers[0],expiration_at:null}]});
  assert.equal(r.rows[0].status,'review'); assert.equal(r.rows[0].fields[0].provider,null); assert.equal(r.rows[0].fields[0].status,'unverified');
  assert.equal(r.rows[0].fields[2].saved,null); assert.equal(r.rows[0].fields[2].status,'unverified');
});
await test('differences and disabled/expired service are reported while paying status stays untouched', async () => {
  const f=fixture({line:{connections:2,trial:true,enabled:false,expiresAt:'2026-10-10T10:44:00Z'}});
  const r=await runBulkXuiCheck({...f.options,customers:[customers[0]]}); assert.equal(r.rows[0].status,'review');
  assert.equal(r.rows[0].fields.find(f=>f.name==='Service status').provider,'expired');
  assert.equal(r.rows[0].fields.filter(f=>f.status==='different').length,4);
  assert.ok(!JSON.stringify(r).includes('payment_status'));
});
await test('server rejects wrong reseller and identity, production, writes, and unconfirmed/non-admin callers', async () => {
  for(const patch of [{line:{resellerId:'99'}},{line:{username:'wrong_name'}},{changedIdentity:true},{env:{VERCEL_ENV:'production'}},{user:null},
    {user:{id:customers[0].id,email:'someone@example.invalid',email_confirmed_at:'2026-01-01T00:00:00Z'}},
    {user:{id:customers[0].id,email:'djudge47@gmail.com',email_confirmed_at:null}}]) {
    const f=fixture(patch),res=await f.request(`/api/ks-roomba-crm?view=customer-comparison&customerId=${customers[0].id}`,{method:'GET',headers:{Authorization:'Bearer fictional-token'}});
    assert.equal(res.ok,false); assert.ok(!JSON.stringify(await res.json()).includes('SECRET'));
  }
  const f=fixture(),r=await f.request(`/api/ks-roomba-crm?view=customer-comparison&customerId=${customers[0].id}`,{method:'POST'});
  assert.equal(r.status,405); assert.equal(f.calls.auth,0); assert.equal(f.calls.provider.length,0);
});
await test('authorization failure stops the batch and does not claim unchecked accounts completed', async () => {
  const f=fixture(),events=[]; const r=await runBulkXuiCheck({...f.options,fetchImpl:async()=>({ok:false,status:401,json:async()=>({error:'SECRET'})}),onProgress:p=>events.push(p)});
  assert.equal(r.complete,false); assert.equal(r.rows.length,0); assert.equal(events.at(-1).state,'stopped'); assert.equal(events.at(-1).total,20);
  assert.ok(!JSON.stringify(events).includes('SECRET'));
});
await test('429 retries are bounded and rate-limited accounts are explicitly reported', async () => {
  const f=fixture();let n=0; const r=await runBulkXuiCheck({...f.options,customers:customers.slice(0,2),fetchImpl:async(url,opts)=>{
    if(n++<3)return{ok:false,status:429,json:async()=>({retryAfterSeconds:1e9,error:'SECRET'})};return f.request(url,opts);
  }});
  assert.equal(n,4); assert.equal(r.complete,true); assert.equal(r.rows[0].status,'failed'); assert.equal(r.rows[1].status,'match');
  assert.ok(f.calls.waits.every(ms=>ms<=60000));
});
await test('stop interrupts waiting and fetches, preserves completed rows, and performs no more requests', async () => {
  for(const during of ['waiting','fetch']) {
    const f=fixture(),control=new AbortController();let n=0;
    const r=await runBulkXuiCheck({...f.options,signal:control.signal,
      fetchImpl:async(url,opts)=>{n++;if(during==='fetch'){control.abort();throw new DOMException('stopped','AbortError');}return f.request(url,opts);},
      wait:async()=>{control.abort();throw new DOMException('stopped','AbortError');}});
    assert.equal(r.complete,false);assert.equal(n,1);assert.equal(r.rows.length,during==='waiting'?1:0);
  }
});
await test('network failures and malformed responses produce fixed errors without leaking bodies', async () => {
  for(const fetchImpl of [async()=>{throw Error('SECRET-network');},async()=>({ok:true,status:200,json:async()=>({error:'SECRET-response'})})]) {
    const f=fixture(),r=await runBulkXuiCheck({...f.options,customers:[customers[0]],fetchImpl});
    assert.equal(r.rows[0].status,'failed');assert.ok(!JSON.stringify(r).includes('SECRET'));
  }
});
await test('client rejects stale, mismatched, malformed and write-capable results', async () => {
  const f=fixture(),response=await f.request(`/api/ks-roomba-crm?view=customer-comparison&customerId=${customers[0].id}`,{method:'GET',headers:{Authorization:'Bearer fictional-token'}}),payload=await response.json();
  for(const patch of [{mode:'write'},{databaseWrites:true},{line:{...payload.line,lineId:'999'}},{line:{...payload.line,checkedAt:'2020-01-01T00:00:00Z'}},{line:{...payload.line,expiresAt:'2027-04-22 08:00:00'}},{line:{...payload.line,trial:'0'}}]) assert.throws(()=>compareBulkLine(customers[0],{...payload,...patch},start));
  assert.equal(compareBulkLine({...customers[0],expiration_at:'2027-04-22T04:00:00-04:00'},payload,start).status,'match');
});
await test('actual React component renders click-only controls and comparison rows without credentials', async () => {
  const directory=await mkdtemp(join(process.cwd(),'node_modules','.ks-bulk-'));
  try {
    const f=fixture(),result=await runBulkXuiCheck({...f.options,customers:[customers[0]]});
    const reactPath=pathToFileURL(import.meta.resolve('react').replace('file://','')).href;
    const built=await build({entryPoints:['src/pages/admin/BulkXuiCheck.tsx'],bundle:true,write:false,format:'esm',platform:'node',jsx:'automatic',external:['react/jsx-runtime','lucide-react'],plugins:[{name:'fixture',setup(b){
      b.onResolve({filter:/^file:/},args=>({path:args.path,external:true}));
      b.onResolve({filter:/^react$/},()=>({path:'hooks',namespace:'fixture'}));
      b.onResolve({filter:/\/lib\/supabase$/},()=>({path:'auth',namespace:'fixture'}));
      b.onLoad({filter:/.*/,namespace:'fixture'},args=>({loader:'js',contents:args.path==='hooks'
        ? `import React from ${JSON.stringify(reactPath)};export default React;export const useMemo=f=>f();export const useState=initial=>[globalThis.__bulkStates.shift()??initial,()=>{}];export const useEffect=()=>{};export const useRef=()=>({current:null});`
        : `export const supabase=new Proxy({}, {get(){throw Error('No auth or live request during rendering');}});`}));
    }}]});
    const path=join(directory,'view.mjs');await writeFile(path,built.outputFiles[0].text);const {default:View}=await import(pathToFileURL(path));
    globalThis.__bulkStates=[{state:'complete',completed:1,total:1,username:'',rows:result.rows},false,''];
    const markup=renderToStaticMarkup(React.createElement(View,{customers:[customers[0]],loading:false}));
    assert.ok(markup.includes('Check all XUI accounts'));assert.ok(markup.includes('Comparison finished'));assert.ok(markup.includes('Saved CRM'));assert.ok(markup.includes('Matches'));
    assert.ok(markup.includes('no credits are spent'));assert.ok(!markup.includes('SECRET'));assert.ok(!markup.includes('Save changes'));
    const source=await readFile(new URL('../src/pages/admin/CRMOperationsCenter.tsx',import.meta.url),'utf8');assert.ok(source.includes('<BulkXuiCheck customers={customers} loading={loading} />'));
  } finally {delete globalThis.__bulkStates;await rm(directory,{recursive:true,force:true});}
});
console.log(`${checks} bulk comparison checks passed. Synthetic data only; no live provider requests or database writes.`);
