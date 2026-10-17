import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { parser } from 'stream-json/parser.js';

// Stream all JSON for validation, retaining bounded account or package fields.
// Provider permissions, credentials, and other large values are never assembled.
export async function readAccountJson(response, { maxBytes = 64 * 1024 * 1024, dataMode = 'account' } = {}) {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('empty response');
  let size = 0;
  let prefix = Buffer.alloc(0);
  let bodyFormat = 'unknown';
  const startedAt = Date.now();
  const fail = code => Object.assign(new Error('Account response rejected'), { code });
  async function* bytes() {
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (prefix.length < 512) prefix = Buffer.concat([prefix, Buffer.from(value).subarray(0, 512 - prefix.length)]);
        const opening = prefix.toString('utf8').trimStart();
        bodyFormat = !opening ? 'unknown' : opening[0] === '{' ? 'json_object_prefix' : opening[0] === '[' ? 'json_array_prefix' : opening[0] === '<' ? 'markup' : 'other';
        if (bodyFormat === 'markup') throw fail('KS_HTML_RESPONSE');
        if (size > maxBytes) throw fail('KS_RESPONSE_TOO_LARGE');
        if (Date.now() - startedAt > 15000) throw fail('KS_RESPONSE_TIMEOUT');
        yield Buffer.from(value);
      }
    } finally {
      await reader.cancel().catch(() => {});
    }
  }

  const payload = { data: null };
  const stack = [];
  const packageFields = new Set(['id', 'package_name', 'is_trial', 'is_official', 'trial_credits', 'official_credits',
    'trial_duration', 'trial_duration_in', 'official_duration', 'official_duration_in', 'max_connections', 'bouquets']);
  let scalar;
  let tokenCount = 0;
  const target = () => {
    const parent = stack.at(-1);
    if (parent?.role === 'root' && ['status', 'error'].includes(parent.key)) return [payload, parent.key];
    if (parent?.role === 'account' && ['id', 'username', 'credits'].includes(parent.key)) return [payload.data, parent.key];
    if (parent?.role === 'package' && packageFields.has(parent.key)) return [parent.record, parent.key];
    return null;
  };
  const assign = (destination, value) => { if (destination) destination[0][destination[1]] = value; };
  try {
    await pipeline(Readable.from(bytes()), parser.asStream({ packValues: false }), async tokens => {
      for await (const token of tokens) {
        if (++tokenCount % 4096 === 0 && Date.now() - startedAt > 15000) throw fail('KS_RESPONSE_TIMEOUT');
        if (tokenCount > 8000000) throw fail('KS_RESPONSE_COMPLEXITY');
        const parent = stack.at(-1);
        switch (token.name) {
          case 'startObject':
          case 'startArray': {
            if (stack.length >= 64) throw fail('KS_RESPONSE_COMPLEXITY');
            let role = 'ignored';
            let record;
            if (!stack.length && token.name === 'startObject') role = 'root';
            if (parent?.role === 'root' && parent.key === 'data') {
              if (dataMode === 'packages') {
                payload.data = token.name === 'startArray' ? [] : null;
                if (payload.data) role = 'packages';
              } else {
                payload.data = token.name === 'startObject' ? {} : null;
                if (payload.data) role = 'account';
              }
            }
            if (parent?.role === 'packages') {
              if (token.name !== 'startObject' || payload.data.length >= 128) throw fail('KS_RESPONSE_COMPLEXITY');
              record = {};
              payload.data.push(record);
              role = 'package';
            }
            // An object/array in error is still an error; account fields must be scalar.
            assign(target(), parent?.role === 'root' && parent.key === 'error' ? true : null);
            stack.push({ role, key: '', readingKey: false, record });
            break;
          }
          case 'endObject':
          case 'endArray': stack.pop(); break;
          case 'startKey': parent.key = ''; parent.readingKey = true; break;
          case 'endKey': parent.readingKey = false; break;
          case 'startString':
          case 'startNumber':
            if (parent?.role === 'packages') throw fail('KS_RESPONSE_COMPLEXITY');
            scalar = { destination: target(), value: '', oversized: false, number: token.name === 'startNumber', limit: parent?.role === 'package' && parent.key === 'bouquets' ? 65536 : 256 };
            break;
          case 'stringChunk':
          case 'numberChunk':
            if (parent?.readingKey) {
              // All recognized names are short; never retain arbitrary large keys.
              parent.key = (parent.key + token.value).slice(0, 257);
            } else if (scalar?.destination && !scalar.oversized) {
              if (scalar.value.length + token.value.length > scalar.limit) scalar.oversized = true;
              else scalar.value += token.value;
            }
            break;
          case 'endString':
          case 'endNumber':
            assign(scalar?.destination, scalar?.oversized ? (scalar.destination?.[1] === 'error' ? true : null) : scalar?.number ? Number(scalar.value) : scalar?.value);
            if (parent?.role === 'root' && parent.key === 'data') payload.data = null;
            scalar = null;
            break;
          case 'nullValue':
          case 'trueValue':
          case 'falseValue':
            if (parent?.role === 'packages') throw fail('KS_RESPONSE_COMPLEXITY');
            assign(target(), token.value);
            if (parent?.role === 'root' && parent.key === 'data') payload.data = null;
            break;
        }
      }
    });
    return payload;
  } catch (error) {
    // Parser messages can contain input text. Wrap them; callers only emit fixed labels.
    const code = error.code?.startsWith('KS_') ? error.code : 'KS_INVALID_JSON';
    throw Object.assign(new Error('Response read failed', { cause: error }), {
      code, ksResponseDiagnostics: { bodyFormat, receivedBytes: size },
    });
  }
}

export const readPackageJson = (response, options = {}) => readAccountJson(response, { ...options, dataMode: 'packages' });
