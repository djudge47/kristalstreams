import { createClient } from '@supabase/supabase-js';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { Readable } from 'node:stream';

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
  on: (event: string, listener: () => void) => void;
};

type VercelResponseLike = {
  status: (code: number) => VercelResponseLike;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string) => void;
  end: (body?: string | Buffer) => void;
  on: (event: string, listener: () => void) => void;
};

const TOKEN_LIFETIME_MS = 10 * 60 * 1000;
const UPSTREAM_TIMEOUT_MS = 25_000;

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

function isPlaylistResponse(url: URL, contentType: string): boolean {
  return (
    url.pathname.toLowerCase().endsWith('.m3u8') ||
    contentType.includes('mpegurl') ||
    contentType.includes('m3u8')
  );
}

async function pipeBody(upstreamBody: ReadableStream<Uint8Array>, res: VercelResponseLike): Promise<void> {
  const nodeStream = Readable.fromWeb(upstreamBody as never);

  await new Promise<void>((resolve, reject) => {
    nodeStream.on('error', reject);
    res.on('finish', resolve);
    res.on('close', resolve);
    nodeStream.pipe(res as never);
  });
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
  const proxySecret = process.env.STREAM_PROXY_SECRET;

  if (!supabaseUrl || !supabaseAnonKey || !proxySecret) {
    res.status(503).json({
      error: 'The secure stream relay is not configured yet.',
    });
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

  try {
    const encryptedToken = firstQueryValue(req.query.token);
    let channelId = firstQueryValue(req.query.channel);
    let upstreamUrl: URL;

    if (encryptedToken) {
      const payload = decryptPayload(encryptedToken, proxySecret);
      channelId = payload.channelId;
      upstreamUrl = validateUpstreamUrl(payload.url);
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

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
    const rangeHeader = req.headers.range;
    const upstreamHeaders: Record<string, string> = {
      Accept: 'application/vnd.apple.mpegurl, application/x-mpegURL, video/*, audio/*, */*',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/149 Safari/537.36',
    };

    if (typeof rangeHeader === 'string') {
      upstreamHeaders.Range = rangeHeader;
    }

    let upstream: Response;
    try {
      upstream = await fetch(upstreamUrl, {
        method: 'GET',
        headers: upstreamHeaders,
        redirect: 'follow',
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    const finalUrl = validateUpstreamUrl(upstream.url || upstreamUrl.toString());
    const contentType = (upstream.headers.get('content-type') || '').toLowerCase();

    if (!upstream.ok && upstream.status !== 206) {
      res.status(upstream.status || 502).json({
        error: `The stream provider returned ${upstream.status || 'an error'}.`,
      });
      return;
    }

    if (isPlaylistResponse(finalUrl, contentType)) {
      const playlist = await upstream.text();
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

    res.status(upstream.status);
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/octet-stream');
    res.setHeader('Cache-Control', 'private, no-store, max-age=0');

    for (const header of ['accept-ranges', 'content-range', 'etag', 'last-modified']) {
      const value = upstream.headers.get(header);
      if (value) res.setHeader(header, value);
    }

    if (!upstream.body) {
      res.end();
      return;
    }

    await pipeBody(upstream.body, res);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to load the stream';
    const status = message.toLowerCase().includes('expired') ? 401 : 502;
    res.status(status).json({ error: message });
  }
}
