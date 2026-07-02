import { Readable } from 'node:stream';

const ALLOWED_HOSTS = new Set(['live.roomba.tv']);

function isAllowedHost(hostname) {
  return ALLOWED_HOSTS.has(hostname) || hostname.endsWith('.roomba.tv');
}

function decodeTarget(value) {
  return Buffer.from(String(value || ''), 'base64url').toString('utf8');
}

function encodeTarget(value) {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function validateTarget(rawUrl) {
  const target = new URL(rawUrl);
  if (!['http:', 'https:'].includes(target.protocol)) {
    throw new Error('Unsupported stream protocol');
  }
  if (!isAllowedHost(target.hostname)) {
    throw new Error('Stream host is not allowed');
  }
  return target;
}

function proxyUrl(rawUrl) {
  return `/api/stream-proxy?url=${encodeURIComponent(encodeTarget(rawUrl))}`;
}

function rewriteUri(value, baseUrl) {
  const absolute = new URL(value, baseUrl).toString();
  return proxyUrl(absolute);
}

function rewritePlaylist(text, baseUrl) {
  return text
    .split(/\r?\n/)
    .map((line) => {
      const trimmed = line.trim();

      if (!trimmed) return line;

      if (trimmed.startsWith('#')) {
        return line.replace(/URI="([^"]+)"/g, (_match, uri) => {
          return `URI="${rewriteUri(uri, baseUrl)}"`;
        });
      }

      return rewriteUri(trimmed, baseUrl);
    })
    .join('\n');
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (!['GET', 'HEAD'].includes(req.method)) {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let target;
  try {
    target = validateTarget(decodeTarget(req.query.url));
  } catch (_error) {
    return res.status(400).json({ error: 'Invalid stream URL' });
  }

  const headers = {
    Accept: req.headers.accept || '*/*',
    'User-Agent': req.headers['user-agent'] || 'Mozilla/5.0',
  };

  if (req.headers.range) {
    headers.Range = req.headers.range;
  }

  try {
    const upstream = await fetch(target.toString(), {
      method: req.method,
      headers,
      redirect: 'follow',
    });

    if (!upstream.ok && upstream.status !== 206) {
      return res.status(upstream.status).json({ error: 'Upstream stream request failed' });
    }

    const finalUrl = upstream.url || target.toString();
    const contentType = upstream.headers.get('content-type') || '';
    const isPlaylist =
      contentType.includes('mpegurl') ||
      contentType.includes('m3u8') ||
      new URL(finalUrl).pathname.toLowerCase().endsWith('.m3u8');

    if (isPlaylist) {
      const playlist = await upstream.text();
      const rewritten = rewritePlaylist(playlist, finalUrl);
      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      return res.status(upstream.status).send(rewritten);
    }

    const contentRange = upstream.headers.get('content-range');
    const acceptRanges = upstream.headers.get('accept-ranges');
    const contentLength = upstream.headers.get('content-length');

    if (contentType) res.setHeader('Content-Type', contentType);
    if (contentRange) res.setHeader('Content-Range', contentRange);
    if (acceptRanges) res.setHeader('Accept-Ranges', acceptRanges);
    if (contentLength) res.setHeader('Content-Length', contentLength);

    res.status(upstream.status);

    if (req.method === 'HEAD' || !upstream.body) {
      return res.end();
    }

    return Readable.fromWeb(upstream.body).pipe(res);
  } catch (_error) {
    return res.status(502).json({ error: 'Stream unavailable' });
  }
}
