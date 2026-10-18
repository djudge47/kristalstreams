import { ProxyAgent } from 'undici';

// Fixie's generated URL may use HTTP port 80. Use the documented TLS
// proxy endpoint instead, so proxy credentials and CONNECT metadata are
// encrypted as well as the HTTPS request inside the tunnel.
export function fixieProxyUrl(value) {
  if (typeof value !== 'string' || !value.trim() || /\s/.test(value.trim())) {
    throw new Error('Invalid Fixie configuration');
  }
  const url = new URL(value.trim());
  if (!['http:', 'https:'].includes(url.protocol)
      || !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.usefixie\.com$/i.test(url.hostname)
      || !url.username || !url.password || url.pathname !== '/'
      || url.search || url.hash
      || (url.protocol === 'http:' && url.port && url.port !== '80')
      || (url.protocol === 'https:' && url.port && url.port !== '443')) {
    throw new Error('Invalid Fixie configuration');
  }
  // Validate escaped credentials before handing them to the HTTP client.
  if (/[\x00-\x20\x7f]/.test(decodeURIComponent(url.username) + decodeURIComponent(url.password))) {
    throw new Error('Invalid Fixie configuration');
  }
  url.protocol = 'https:';
  url.port = '443';
  return url;
}

export function createFixieDispatcher(value, Agent = ProxyAgent) {
  const url = fixieProxyUrl(value);
  return new Agent({
    uri: url.href,
    // These defaults must remain strict on both TLS connections.
    requestTls: { rejectUnauthorized: true },
    proxyTls: { rejectUnauthorized: true },
    connectTimeout: 10000,
  });
}
