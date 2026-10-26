import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';

export const androidRelease = Object.freeze({ versionCode: 2026102001, bytes: 84593786,
  sha256: '47e4658b604479d9fad04a1876e92de500d6f0808dc67300a20df3ac0699ccd7' });
const digest = b => createHash('sha256').update(b).digest('hex');
const fail = () => { throw Error('Approved Android installer integrity check failed.'); };
const integer = n => Number.isSafeInteger(n);
function slice(base, spec) {
  if (!Array.isArray(spec) || spec.length < 2 || !integer(spec[0]) || !integer(spec[1])
    || spec[0] < 0 || spec[1] < 0 || spec[0] + spec[1] > base.length) fail();
  return base.subarray(spec[0], spec[0] + spec[1]);
}
function patch(base, op, spec) {
  if (!integer(spec[2]) || spec[2] < 0 || spec[2] > 128 * 1024 * 1024
    || !Array.isArray(op.controls) || op.controls.length > 100000) fail();
  const diff = Buffer.from(op.diff, 'base64'), extra = Buffer.from(op.extra, 'base64'), out = Buffer.alloc(spec[2]);
  let old = 0, target = 0, d = 0, e = 0;
  for (const control of op.controls) {
    if (!Array.isArray(control) || control.length !== 3 || !control.every(integer)) fail();
    const [add, literal, seek] = control;
    if (add < 0 || literal < 0 || target + add + literal > out.length || d + add > diff.length || e + literal > extra.length) fail();
    for (let i = 0; i < add; i++) out[target + i] = (diff[d + i] + (base[old + i] ?? 0)) & 255;
    old += add; target += add; d += add;
    extra.copy(out, target, e, e + literal); e += literal; target += literal; old += seek;
    if (!integer(old)) fail();
  }
  if (target !== out.length || d !== diff.length || e !== extra.length) fail();
  return out;
}

// Release packaging only. This lossless representation recovers the exact
// owner-supplied signed APK from the preserved repository binary. No APK ZIP
// is rebuilt, patched for behavior, re-signed or fetched at build time.
export function materializeAndroidRelease(base, encoded) {
  const release = JSON.parse(gunzipSync(Buffer.from(encoded.trim(), 'base64'), { maxOutputLength: 128 * 1024 * 1024 }));
  if (release.version !== 1 || release.versionCode !== androidRelease.versionCode
    || release.outputSha256 !== androidRelease.sha256 || release.outputBytes !== androidRelease.bytes
    || release.sourceSha256 !== '6efaa7c1ffbea0334ac8df8fd3b4071b1f09b93e4a5c823ec077a1ba7de1ba19'
    || digest(base) !== release.sourceSha256 || !Array.isArray(release.ops) || release.ops.length > 20000) fail();
  const chunks = []; let bytes = 0;
  for (const op of release.ops) {
    let chunk;
    if (Object.hasOwn(op, 'literal')) chunk = Buffer.from(op.literal, 'base64');
    else if (Object.hasOwn(op, 'copy')) chunk = slice(base, op.copy);
    else if (Object.hasOwn(op, 'patch')) chunk = patch(slice(base, op.patch), op, op.patch);
    else fail();
    bytes += chunk.length; if (bytes > androidRelease.bytes) fail(); chunks.push(chunk);
  }
  const apk = Buffer.concat(chunks);
  if (apk.length !== androidRelease.bytes || digest(apk) !== androidRelease.sha256) fail();
  return apk;
}
export async function loadApprovedAndroidApk() {
  const [base, encoded] = await Promise.all([
    readFile(new URL('../public/downloads/KristalStreams.apk', import.meta.url)),
    readFile(new URL('./releases/KristalStreams-2026102001.release.b64', import.meta.url), 'utf8'),
  ]);
  return materializeAndroidRelease(base, encoded);
}
