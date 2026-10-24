import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { parser } from 'stream-json/parser.js';

// Capability diagnostic only: retain no customer values, credentials or sessions.
export async function readActivityProbeJson(response) {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('Missing response');
  let bytes = 0, tokens = 0, status = '', readingStatus = false, oversized = false;
  let dataArray = false, rows = 0;
  const stack = [], fields = new Set(), rootKeys = new Set();
  let errorSeen = false;
  let statusString = false;
  const allowed = new Set(['line_id', 'username', 'stream_id', 'stream_name', 'stream_display_name']);
  const started = Date.now();
  async function* source() {
    try {
      while (true) {
        const chunk = await reader.read();
        if (chunk.done) break;
        bytes += chunk.value.byteLength;
        if (bytes > 1024 * 1024 || Date.now() - started > 15000) throw new Error('Bound exceeded');
        yield Buffer.from(chunk.value);
      }
    } finally { await reader.cancel().catch(() => {}); }
  }
  await pipeline(Readable.from(source()), parser.asStream({ packValues: false }), async stream => {
    for await (const token of stream) {
      if (++tokens > 100000 || stack.length > 32 || Date.now() - started > 15000) throw new Error('Bound exceeded');
      const parent = stack.at(-1);
      if (token.name === 'startKey') { parent.key = ''; parent.readingKey = true; }
      else if (token.name === 'endKey') {
        parent.readingKey = false;
        if (parent.role === 'root') {
          if (rootKeys.has(parent.key)) throw new Error('Duplicate root field');
          rootKeys.add(parent.key);
          if (parent.key === 'error') errorSeen = true;
        }
        if (parent.role === 'row' && allowed.has(parent.key)) fields.add(parent.key);
      } else if (token.name === 'startObject' || token.name === 'startArray') {
        let role = stack.length ? 'ignored' : token.name === 'startObject' ? 'root' : 'ignored';
        if (parent?.role === 'root' && parent.key === 'data') {
          dataArray = token.name === 'startArray'; role = dataArray ? 'data' : 'ignored';
        } else if (parent?.role === 'data') {
          if (token.name !== 'startObject' || ++rows > 1) throw new Error('Unexpected rows');
          role = 'row';
        }
        stack.push({ role, key: '', readingKey: false });
      } else if (token.name === 'endObject' || token.name === 'endArray') stack.pop();
      else if (token.name === 'startString') {
        readingStatus = parent?.role === 'root' && parent.key === 'status';
        if (readingStatus) { status = ''; oversized = false; }
      } else if (token.name === 'stringChunk') {
        if (parent?.readingKey) parent.key = (parent.key + token.value).slice(0, 64);
        else if (readingStatus && !oversized) {
          if (status.length + token.value.length > 64) { status = ''; oversized = true; }
          else status += token.value;
        }
      } else if (token.name === 'endString') { if (readingStatus) statusString = true; readingStatus = false; }
      else if (parent?.role === 'data' && ['startNumber', 'nullValue', 'trueValue', 'falseValue'].includes(token.name)) throw new Error('Unexpected row');
    }
  });
  return { recognized: dataArray && !errorSeen && !oversized && (!rootKeys.has('status') || statusString)
      && (!rootKeys.has('status') || ['STATUS_SUCCESS', 'STATUS_SUCCESS_MULTI'].includes(status)),
    samplePresent: rows === 1, fields: [...fields].sort() };
}
