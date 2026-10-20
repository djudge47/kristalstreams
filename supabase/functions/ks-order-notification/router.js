import { handleOrderNotification } from './handler.js';
import { handlePendingOrderNotification } from './pending-handler.js';

// Protocol selection is not authorization. Both handlers independently verify
// the backend caller and persisted receipt; no client-selected email is used.
export async function routeOrderNotification(req, options) {
  if (req.method !== 'POST') return handleOrderNotification(req, options);
  let body;
  try {
    const raw = await req.clone().text();
    if (raw.length > 4096) return Response.json({ success: false, error: 'Request too large' }, { status: 413 });
    body = JSON.parse(raw);
  } catch { return Response.json({ success: false, error: 'Invalid request' }, { status: 400 }); }
  if (body?.protocol === undefined) return handleOrderNotification(req, options);
  if (body?.protocol !== 'receipt-only-v1' || Object.keys(body).sort().join(',') !== 'protocol,sessionId') {
    return Response.json({ success: false, error: 'Invalid notification protocol' }, { status: 400 });
  }
  return handlePendingOrderNotification(new Request(req.url, {
    method: 'POST', headers: req.headers, body: JSON.stringify({ sessionId: body.sessionId }),
  }), options);
}
