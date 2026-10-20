import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { checkoutOrigin } from '../_server/ks-payments.js';
import { checkoutParameters } from '../_server/ks-checkout-intent.js';
import { getPlan } from '../_server/ks-payment-validation.js';

const names = ['VERCEL_ENV', 'VERCEL_URL', 'VERCEL_BRANCH_URL'];
const previous = Object.fromEntries(names.map(name => [name, process.env[name]]));
const branch = 'ks-git-private-test-team.vercel.app';
const deployment = 'ks-immutable-test-team.vercel.app';
let passed = 0;
function check(name, fn) { fn(); passed++; console.log(`PASS: ${name}`); }
const request = origin => ({ headers: { origin } });
try {
  process.env.VERCEL_ENV = 'preview';
  process.env.VERCEL_URL = deployment;
  process.env.VERCEL_BRANCH_URL = branch;
  check('branch checkout returns to the signed-in branch instead of the immutable deployment', () => {
    assert.equal(checkoutOrigin(request(`https://${branch}`)), `https://${branch}`);
  });
  check('an immutable deployment keeps its own signed-in origin', () => {
    assert.equal(checkoutOrigin(request(`https://${deployment}`)), `https://${deployment}`);
  });
  check('server callers default to the configured branch address', () => {
    assert.equal(checkoutOrigin({ headers: {} }), `https://${branch}`);
  });
  check('arbitrary origins and return URL tricks cannot change the destination', () => {
    for (const origin of [
      'https://evil.example', 'https://other.vercel.app', 'https://kristalstream.com',
      `http://${branch}`, `https://${branch}:443`, `https://${branch}/`,
      `https://${branch}@evil.example`, `https://${branch}.evil.example`,
      `https://${branch}?next=evil`, `https://${branch}#evil`,
      `https://${branch},https://evil.example`, `https://${branch}\r\nX-Test: evil`,
      'null', '', null, [`https://${branch}`],
    ]) assert.throws(() => checkoutOrigin(request(origin)), error => error.status === 400);
  });
  check('Host, forwarded host, referrer and body fields cannot override configured origins', () => {
    assert.equal(checkoutOrigin({ headers: { host: 'evil.example', 'x-forwarded-host': 'evil.example', referer: 'https://evil.example' }, body: { origin: 'https://evil.example', returnUrl: 'https://evil.example' } }), `https://${branch}`);
  });
  check('a missing branch variable still preserves an explicitly known deployment', () => {
    delete process.env.VERCEL_BRANCH_URL;
    assert.equal(checkoutOrigin(request(`https://${deployment}`)), `https://${deployment}`);
    assert.equal(checkoutOrigin(), `https://${deployment}`);
    assert.throws(() => checkoutOrigin(request(`https://${branch}`)), error => error.status === 400);
    process.env.VERCEL_BRANCH_URL = branch;
  });
  check('invalid or missing Preview configuration fails before constructing a return URL', () => {
    for (const value of ['evil.example', 'https://ks.vercel.app', 'ks.vercel.app/path', 'ks.vercel.app:443', 'ks..vercel.app', 'ks.vercel.app\n']) {
      process.env.VERCEL_BRANCH_URL = value;
      assert.throws(() => checkoutOrigin(), error => error.status === 503);
    }
    delete process.env.VERCEL_BRANCH_URL;
    delete process.env.VERCEL_URL;
    assert.throws(() => checkoutOrigin(), error => error.status === 503);
  });
  check('production keeps its existing canonical destination despite Preview or caller values', () => {
    process.env.VERCEL_ENV = 'production';
    process.env.VERCEL_BRANCH_URL = branch;
    process.env.VERCEL_URL = deployment;
    assert.equal(checkoutOrigin(request('https://evil.example')), 'https://kristalstream.com');
  });
  check('local development keeps its existing destination', () => {
    process.env.VERCEL_ENV = 'development';
    assert.equal(checkoutOrigin(), 'http://127.0.0.1:5174');
  });
  const source = await readFile(new URL('../api/checkout.js', import.meta.url), 'utf8');
  check('Checkout uses the validated request origin for both success and cancellation', () => {
    assert.match(source, /const origin = checkoutOrigin\(req\);/);
    assert.match(source, /checkoutParameters\(\{[\s\S]*origin, suffix/);
    const params = checkoutParameters({ order: getPlan('bronze', 1), userId: 'fixture', email: 'fixture@example.invalid', origin: `https://${branch}`, suffix: 'abcdefgh' });
    assert.equal(params.success_url, `https://${branch}/payment-success?session_id={CHECKOUT_SESSION_ID}`);
    assert.equal(params.cancel_url, `https://${branch}/pricing?payment=cancelled`);
  });
} finally {
  for (const name of names) {
    if (previous[name] === undefined) delete process.env[name];
    else process.env[name] = previous[name];
  }
}
console.log(`${passed} checkout return checks passed. No Stripe request, charge, email or account change was made.`);
