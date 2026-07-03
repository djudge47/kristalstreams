function encodeTarget(value) {
  return Buffer.from(value, 'utf8').toString('base64url');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sourceUrl = req.body?.url;
  if (typeof sourceUrl !== 'string' || sourceUrl.length === 0) {
    return res.status(400).json({ error: 'Missing url' });
  }

  try {
    const parsed = new URL(sourceUrl);
    const allowedHost = parsed.hostname === 'live.roomba.tv' || parsed.hostname === '172.110.220.61';

    if ((parsed.protocol !== 'http:' && parsed.protocol !== 'https:') || !allowedHost) {
      return res.status(400).json({ error: 'Invalid url' });
    }

    const token = encodeTarget(parsed.toString());
    return res.status(200).json({
      url: `/api/stream-proxy?url=${encodeURIComponent(token)}`,
    });
  } catch {
    return res.status(400).json({ error: 'Invalid url' });
  }
}
