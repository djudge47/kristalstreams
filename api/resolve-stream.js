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
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return res.status(400).json({ error: 'Invalid url' });
    }

    return res.status(200).json({ url: parsed.toString() });
  } catch {
    return res.status(400).json({ error: 'Invalid url' });
  }
}
