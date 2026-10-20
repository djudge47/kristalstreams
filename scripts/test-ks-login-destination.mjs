import assert from 'node:assert/strict';
import { loginDestination } from '../src/lib/loginDestination.ts';

for (const destination of ['/admin', '/admin/roomba', '/admin/setup?order=fixture#review', '/client/account', '/free-trial', '/dashboard']) {
  assert.equal(loginDestination(destination), destination);
}
console.log('PASS: requested Admin/customer pages and the existing free-trial return are preserved');
for (const destination of [undefined, null, {}, 12, '', '/login', '/register', '/administrator',
  'https://example.test', '//example.test/admin', '/\\example.test/admin', 'javascript:alert(1)',
  '/admin/../../login', '/admin\n', '/client\t', '/%2f%2fexample.test']) {
  assert.equal(loginDestination(destination), '/dashboard');
}
console.log('PASS: missing, unrelated, external and malformed destinations return to Dashboard');
console.log('Login routing checks passed. No authentication, payment or provider request was made.');
