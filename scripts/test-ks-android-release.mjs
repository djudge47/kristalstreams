import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { loadApprovedAndroidApk, materializeAndroidRelease, androidRelease } from './ks-android-release.mjs';
const sha = value => createHash('sha256').update(value).digest('hex');
const apk = await loadApprovedAndroidApk();
assert.equal(apk.length, 84593786);
assert.equal(sha(apk), '47e4658b604479d9fad04a1876e92de500d6f0808dc67300a20df3ac0699ccd7');
assert.equal(androidRelease.versionCode, 2026102001);
console.log('PASS: release packaging reproduces the exact owner-supplied signed APK, not the older website installer');
const [base, encoded] = await Promise.all([
  readFile(new URL('../public/downloads/KristalStreams.apk', import.meta.url)),
  readFile(new URL('./releases/KristalStreams-2026102001.release.b64', import.meta.url), 'utf8'),
]);
const corrupt = Buffer.from(base); corrupt[100] ^= 1;
assert.throws(() => materializeAndroidRelease(corrupt, encoded));
assert.throws(() => materializeAndroidRelease(base, 'not-a-release'));
console.log('PASS: a changed source or damaged release stops the build instead of publishing another installer');
if (process.argv.includes('--built')) {
  const built = await readFile(new URL('../dist/downloads/KristalStreams.apk', import.meta.url));
  assert.equal(built.length, androidRelease.bytes); assert.equal(sha(built), androidRelease.sha256);
  console.log('PASS: production build output contains the exact approved APK at the public download path');
}
