const ALLOWED_HOSTS = new Set(['live.roomba.tv']);

function isAllowedHost(hostname) {
  return ALLOWED_HOSTS.has(hostname) || hostname.endsWith('.roomba.tv');
}

function encodeTarget(value) {
  return Buffer.from(value, 'utf8').toString('base64url');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.body || {};
  if (!url) {
    return res.status(400).json({ error: 'Missing url' });
  }

  try {
    const target = new URL(url);

    if (!['http:', 'https:'].includes(target.protocol) || !isAllowedHost(target.hostname)) {
      return res.status(400).json({ error: 'Invalid stream URL' });
    }

    const token = encodeTarget(target.toString());
    return res.status(200).json({
      url: `/api/stream-proxy?url=${encodeURIComponent(token)}`,
    });
  } catch (_error) {
    return res.status(400).json({ error: 'Invalid stream URL' });
  }
}
