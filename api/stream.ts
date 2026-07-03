import { createClient } from '@supabase/supabase-js';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import * as http from 'node:http';
import * as https from 'node:https';
import type { IncomingHttpHeaders, IncomingMessage, RequestOptions } from 'node:http';

export const config = {
  maxDuration: 60,
};

type ProxyPayload = {
  url: string;
  channelId: string;
  expiresAt: number;
};

type VercelRequestLike = {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  query: Record<string, string | string[] | undefined>;
};

type VercelResponseLike = {
  status: (code: number) => VercelResponseLike;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string) => void;
  end: (body?: string | Buffer) => void;
  on: (event: string, listener: () => void) => void;
};

type UpstreamResult = {
  response: IncomingMessage;
  finalUrl: URL;
};

const TOKEN_LIFETIME_MS = 10 * 60 * 1000;
const UPSTREAM_TIMEOUT_MS = 25_000;
const MAX_PLAYLIST_BYTES = 5 * 1024 * 1024;
const MAX_REDIRECTS = 5;

function firstQueryValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function getAuthorizationHeader(req: VercelRequestLike): string | undefined {
  const value = req.headers.authorization;
  return Array.isArray(value) ? value[0] : value;
}

function deriveEncryptionKey(secret: string): Buffer {
  return createHash('sha256').update(secret).digest();
}

function encryptPayload(payload: ProxyPayload, secret: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', deriveEncryptionKey(secret), iv);
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(payload), 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]).toString('base64url');
}

function decryptPayload(token: string, secret: string): ProxyPayload {
  const packed = Buffer.from(token, 'base64url');
  if (packed.length < 29) throw new Error('Invalid stream token');

  const iv = packed.subarray(0, 12);
  const authTag = packed.subarray(12, 28);
  const encrypted = packed.subarray(28);
  const decipher = createDecipheriv('aes-256-gcm', deriveEncryptionKey(secret), iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]).toString('utf8');

  const payload = JSON.parse(decrypted) as ProxyPayload;
  if (!payload.url || !payload.channelId || payload.expiresAt < Date.now()) {
    throw new Error('Expired or invalid stream token');
  }

  return payload;
}

function decodeSource(value: string): string {
  try {
    return Buffer.from(value, 'base64url').toString('utf8');
  } catch {
    throw new Error('Invalid stream source');
  }
}

function isBlockedHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (host === 'localhost' || host === '::1' || host.endsWith('.local')) return true;
  if (host.startsWith('127.') || host.startsWith('10.') || host.startsWith('192.168.')) return true;

  const match = host.match(/^172\.(\d+)\./);
  if (match) {
    const secondOctet = Number(match[1]);
    if (secondOctet >= 16 && secondOctet <= 31) return true;
  }

  return false;
}

function validateUpstreamUrl(value: string): URL {
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('Unsupported stream protocol');
  }
  if (isBlockedHost(url.hostname)) {
    throw new Error('Blocked stream host');
  }
  return url;
}

function makeRelayUrl(targetUrl: string, channelId: string, secret: string): string {
  const token = encryptPayload(
    {
      url: targetUrl,
      channelId,
      expiresAt: Date.now() + TOKEN_LIFETIME_MS,
    },
    secret,
  );

  return `/api/stream?token=${encodeURIComponent(token)}`;
}

function rewritePlaylist(
  playlist: string,
  baseUrl: string,
  channelId: string,
  secret: string,
): string {
  return playlist
    .split(/\r?\n/)
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return line;

      if (trimmed.startsWith('#')) {
        return line.replace(/URI="([^"]+)"/g, (_match, uri: string) => {
          const absoluteUrl = new URL(uri, baseUrl).toString();
          return `URI="${makeRelayUrl(absoluteUrl, channelId, secret)}"`;
        });
      }

      const absoluteUrl = new URL(trimmed, baseUrl).toString();
      return makeRelayUrl(absoluteUrl, channelId, secret);
    })
    .join('\n');
}

function getHeader(headers: IncomingHttpHeaders, name: string): string {
  const value = headers[name.toLowerCase()];
  if (Array.isArray(value)) return value[0] || '';
  return value ? String(value) : '';
}

function isPlaylistResponse(url: URL, contentType: string): boolean {
  return (
    url.pathname.toLowerCase().endsWith('.m3u8') ||
    contentType.includes('mpegurl') ||
    contentType.includes('m3u8')
  );
}

function requestUpstream(
  upstreamUrl: URL,
  headers: Record<string, string>,
  redirectCount = 0,
): Promise<UpstreamResult> {
  return new Promise((resolve, reject) => {
    const validatedUrl = validateUpstreamUrl(upstreamUrl.toString());
    const client = validatedUrl.protocol === 'https:' ? https : http;

    const options: RequestOptions = {
      protocol: validatedUrl.protocol,
      hostname: validatedUrl.hostname,
      port: validatedUrl.port || undefined,
      method: 'GET',
      path: `${validatedUrl.pathname}${validatedUrl.search}`,
      headers,
      family: 4,
    };

    const upstreamRequest = client.request(options, (response) => {
      const statusCode = response.statusCode || 0;
      const location = getHeader(response.headers, 'location');

      if ([301, 302, 303, 307, 308].includes(statusCode) && location) {
        response.resume();

        if (redirectCount >= MAX_REDIRECTS) {
          reject(new Error('The stream provider redirected too many times.'));
          return;
        }

        const redirectedUrl = validateUpstreamUrl(new URL(location, validatedUrl).toString());
        requestUpstream(redirectedUrl, headers, redirectCount + 1).then(resolve).catch(reject);
        return;
      }

      resolve({ response, finalUrl: validatedUrl });
    });

    upstreamRequest.setTimeout(UPSTREAM_TIMEOUT_MS, () => {
      const timeoutError = Object.assign(
        new Error(`The stream provider did not respond within ${UPSTREAM_TIMEOUT_MS / 1000} seconds.`),
        { code: 'ETIMEDOUT' },
      );
      upstreamRequest.destroy(timeoutError);
    });

    upstreamRequest.on('error', reject);
    upstreamRequest.end();
  });
}

function readResponseBody(response: IncomingMessage, maxBytes: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let totalBytes = 0;

    response.on('data', (chunk: Buffer | string) => {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      totalBytes += buffer.length;

      if (totalBytes > maxBytes) {
        response.destroy();
        reject(new Error('The provider returned an unexpectedly large playlist.'));
        return;
      }

      chunks.push(buffer);
    });

    response.on('end', () => resolve(Buffer.concat(chunks)));
    response.on('error', reject);
  });
}

function pipeResponse(response: IncomingMessage, res: VercelResponseLike): Promise<void> {
  return new Promise((resolve, reject) => {
    response.on('error', reject);
    res.on('finish', resolve);
    res.on('close', resolve);
    response.pipe(res as never);
  });
}

function describeNetworkError(error: unknown): string {
  if (!(error instanceof Error)) return 'Unable to connect to the stream provider.';

  const codedError = error as Error & { code?: string; cause?: { code?: string; message?: string } };
  const code = codedError.code || codedError.cause?.code;
  const causeMessage = codedError.cause?.message;
  const detail = causeMessage || codedError.message;

  if (code === 'ENOTFOUND') return `Provider address could not be found (${code}).`;
  if (code === 'ECONNREFUSED') return `Provider refused the connection (${code}).`;
  if (code === 'ETIMEDOUT' || code === 'ESOCKETTIMEDOUT') return `Provider connection timed out (${code}).`;
  if (code === 'ECONNRESET') return `Provider reset the connection (${code}).`;
  if (code === 'EHOSTUNREACH' || code === 'ENETUNREACH') return `Provider network is unreachable (${code}).`;

  return code ? `Provider connection failed (${code}): ${detail}` : detail;
}

export default async function handler(req: VercelRequestLike, res: VercelResponseLike) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Range, Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    res.status(503).json({ error: 'Supabase is not configured for this deployment.' });
    return;
  }

  const authorization = getAuthorizationHeader(req);
  if (!authorization?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const accessToken = authorization.slice('Bearer '.length).trim();
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });

  const { data: userData, error: userError } = await supabase.auth.getUser(accessToken);
  if (userError || !userData.user) {
    res.status(401).json({ error: 'Your session has expired. Please sign in again.' });
    return;
  }

  const proxySecret = `${userData.user.id}:${accessToken}`;

  try {
    const encryptedToken = firstQueryValue(req.query.token);
    const encodedSource = firstQueryValue(req.query.source);
    let channelId = firstQueryValue(req.query.channel);
    let upstreamUrl: URL;

    if (encryptedToken) {
      const payload = decryptPayload(encryptedToken, proxySecret);
      channelId = payload.channelId;
      upstreamUrl = validateUpstreamUrl(payload.url);
    } else if (encodedSource) {
      const source = decodeSource(encodedSource);
      upstreamUrl = validateUpstreamUrl(source);

      const { data: channel, error: channelError } = await supabase
        .from('channels')
        .select('id')
        .eq('stream_url', source)
        .single();

      if (channelError || !channel?.id) {
        res.status(404).json({ error: 'Channel not found or unavailable' });
        return;
      }

      channelId = String(channel.id);
    } else {
      if (!channelId) {
        res.status(400).json({ error: 'A channel ID is required' });
        return;
      }

      const { data: channel, error: channelError } = await supabase
        .from('channels')
        .select('id, stream_url')
        .eq('id', channelId)
        .single();

      if (channelError || !channel?.stream_url) {
        res.status(404).json({ error: 'Channel not found or unavailable' });
        return;
      }

      upstreamUrl = validateUpstreamUrl(channel.stream_url);
    }

    if (!channelId) {
      res.status(400).json({ error: 'Invalid channel request' });
      return;
    }

    if (encryptedToken) {
      const { data: channel, error: channelError } = await supabase
        .from('channels')
        .select('id')
        .eq('id', channelId)
        .single();

      if (channelError || !channel) {
        res.status(404).json({ error: 'Channel not found or unavailable' });
        return;
      }
    }

    const rangeHeader = req.headers.range;
    const upstreamHeaders: Record<string, string> = {
      Accept: 'application/vnd.apple.mpegurl, application/x-mpegURL, video/*, audio/*, */*',
      Connection: 'close',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/149 Safari/537.36',
    };

    if (typeof rangeHeader === 'string') {
      upstreamHeaders.Range = rangeHeader;
    }

    const { response: upstream, finalUrl } = await requestUpstream(upstreamUrl, upstreamHeaders);
    const statusCode = upstream.statusCode || 502;
    const contentType = getHeader(upstream.headers, 'content-type').toLowerCase();

    if (statusCode < 200 || statusCode >= 300) {
      upstream.resume();
      res.status(statusCode).json({
        error: `The stream provider returned HTTP ${statusCode}.`,
      });
      return;
    }

    if (isPlaylistResponse(finalUrl, contentType)) {
      const playlist = (await readResponseBody(upstream, MAX_PLAYLIST_BYTES)).toString('utf8');
      const rewrittenPlaylist = rewritePlaylist(
        playlist,
        finalUrl.toString(),
        String(channelId),
        proxySecret,
      );

      res.status(200);
      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      res.setHeader('Cache-Control', 'private, no-store, max-age=0');
      res.end(rewrittenPlaylist);
      return;
    }

    res.status(statusCode);
    res.setHeader('Content-Type', getHeader(upstream.headers, 'content-type') || 'application/octet-stream');
    res.setHeader('Cache-Control', 'private, no-store, max-age=0');

    for (const header of ['accept-ranges', 'content-range', 'content-length', 'etag', 'last-modified']) {
      const value = getHeader(upstream.headers, header);
      if (value) res.setHeader(header, value);
    }

    await pipeResponse(upstream, res);
  } catch (error) {
    const message = describeNetworkError(error);
    const status = message.toLowerCase().includes('expired') ? 401 : 502;
    res.status(status).json({ error: message });
  }
}
