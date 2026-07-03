import http from 'node:http';
import https from 'node:https';

const SOURCE_HOST = 'live.roomba.tv';
const SOURCE_IP = '172.110.220.61';
const MAX_REDIRECTS = 3;

function encodeTarget(value) {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function decodeTarget(value) {
  return Buffer.from(String(value || ''), 'base64url').toString('utf8');
}

function isAllowedTarget(target) {
  return (
    (target.protocol === 'http:' || target.protocol === 'https:') &&
    (target.hostname === SOURCE_HOST || target.hostname === SOURCE_IP)
  );
}

function proxyUrl(rawUrl) {
  return `/api/stream-proxy?url=${encodeURIComponent(encodeTarget(rawUrl))}`;
}

function rewriteUri(value, baseUrl) {
  const absolute = new URL(value, baseUrl);
  if (!isAllowedTarget(absolute)) return value;
  return proxyUrl(absolute.toString());
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

function requestUpstream(target, method, range, userAgent, redirects = 0) {
  return new Promise((resolve, reject) => {
    if (!isAllowedTarget(target)) {
      reject(new Error('Stream host is not allowed'));
      return;
    }

    const isHttps = target.protocol === 'https:';
    const transport = isHttps ? https : http;
    const connectHost = target.hostname === SOURCE_HOST ? SOURCE_IP : target.hostname;

    const headers = {
      Host: target.host,
      Accept: '*/*',
      'Accept-Encoding': 'identity',
      'User-Agent': userAgent || 'Mozilla/5.0',
      Connection: 'close',
    };

    if (range) headers.Range = range;

    const request = transport.request(
      {
        protocol: target.protocol,
        hostname: connectHost,
        port: target.port || (isHttps ? 443 : 80),
        path: `${target.pathname}${target.search}`,
        method,
        headers,
        servername: isHttps ? target.hostname : undefined,
      },
      (response) => {
        const status = response.statusCode || 502;
        const location = response.headers.location;

        if (status >= 300 && status < 400 && location && redirects < MAX_REDIRECTS) {
          response.resume();
          try {
            const nextTarget = new URL(location, target);
            requestUpstream(nextTarget, method, range, userAgent, redirects + 1)
              .then(resolve)
              .catch(reject);
          } catch (error) {
            reject(error);
          }
          return;
        }

        resolve({ response, finalUrl: target.toString() });
      }
    );

    request.setTimeout(20000, () => {
      request.destroy(new Error('Upstream timeout'));
    });

    request.on('error', reject);
    request.end();
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let target;
  try {
    target = new URL(decodeTarget(req.query.url));
    if (!isAllowedTarget(target)) throw new Error('Invalid stream target');
  } catch {
    return res.status(400).json({ error: 'Invalid stream URL' });
  }

  try {
    const { response, finalUrl } = await requestUpstream(
      target,
      req.method,
      req.headers.range,
      req.headers['user-agent']
    );

    const status = response.statusCode || 502;
    if (status < 200 || status >= 300) {
      response.resume();
      return res.status(status).json({ error: 'Upstream stream request failed' });
    }

    const contentType = String(response.headers['content-type'] || '');
    const isPlaylist =
      contentType.includes('mpegurl') ||
      contentType.includes('m3u8') ||
      new URL(finalUrl).pathname.toLowerCase().endsWith('.m3u8');

    if (isPlaylist) {
      const chunks = [];
      let total = 0;

      for await (const chunk of response) {
        total += chunk.length;
        if (total > 5 * 1024 * 1024) {
          throw new Error('Playlist is too large');
        }
        chunks.push(chunk);
      }

      const playlist = Buffer.concat(chunks).toString('utf8');
      const rewritten = rewritePlaylist(playlist, finalUrl);
      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      return res.status(status).send(rewritten);
    }

    const contentRange = response.headers['content-range'];
    const acceptRanges = response.headers['accept-ranges'];
    const contentLength = response.headers['content-length'];

    if (contentType) res.setHeader('Content-Type', contentType);
    if (contentRange) res.setHeader('Content-Range', contentRange);
    if (acceptRanges) res.setHeader('Accept-Ranges', acceptRanges);
    if (contentLength) res.setHeader('Content-Length', contentLength);

    res.status(status);

    if (req.method === 'HEAD') {
      response.resume();
      return res.end();
    }

    response.on('error', () => res.destroy());
    return response.pipe(res);
  } catch {
    return res.status(502).json({ error: 'Stream unavailable' });
  }
}
