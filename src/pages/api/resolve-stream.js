export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'Missing url' });
  }

  try {
    // Convert to HTTPS for the initial request
    const httpsUrl = url.replace('http://', 'https://');
    
    // Fetch without following redirects to get the CDN URL
    const response = await fetch(httpsUrl, { redirect: 'manual' });
    
    if (response.status >= 300 && response.status < 400) {
      // Got a redirect - convert the location to HTTPS
      let location = response.headers.get('location');
      if (location) {
        location = location.replace('http://', 'https://');
        return res.status(200).json({ url: location });
      }
    }
    
    // No redirect - the original HTTPS URL works directly
    if (response.ok) {
      return res.status(200).json({ url: httpsUrl });
    }

    return res.status(200).json({ url: httpsUrl });
  } catch (error) {
    // If HTTPS fails, return the original URL as-is
    return res.status(200).json({ url: url.replace('http://', 'https://'), error: error.message });
  }
}
