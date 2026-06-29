function toHttps(url) {
  return url
    .replace('http://', 'https://')
    .replace(':80/', '/')
    .replace(':80"', '"');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'Missing url' });
  }

  try {
    const httpsUrl = toHttps(url);
    
    // Fetch without following redirects to get the CDN URL
    const response = await fetch(httpsUrl, { redirect: 'manual' });
    
    if (response.status >= 300 && response.status < 400) {
      let location = response.headers.get('location');
      if (location) {
        return res.status(200).json({ url: toHttps(location) });
      }
    }
    
    return res.status(200).json({ url: httpsUrl });
  } catch (error) {
    return res.status(200).json({ url: toHttps(url), error: error.message });
  }
}
