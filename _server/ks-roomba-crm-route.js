import { createRoombaCrmHandler } from './ks-roomba-crm.js';
import { createCustomerStatusHandler } from './ks-roomba-customer-status.js';
import { createRenewalTestApprovalHandler } from './ks-crm-renewal-test-approval.js';
import { createLiveRenewalHttpHandler } from './ks-crm-renewal-live-http.js';

// Share the existing CRM function so the deployment remains at 12 functions.
// The saved-receipt handler and its POST behavior are unchanged.
export function createRoombaCrmRoute(settings = {}) {
  const saved = createRoombaCrmHandler(settings);
  const status = createCustomerStatusHandler(settings);
  const renewal = createCustomerStatusHandler({ ...settings, reviewRenewal: true });
  const requestedOrder = createCustomerStatusHandler({ ...settings, reviewRenewal: true, reviewRequestedOrder: true });
  const testApproval = createRenewalTestApprovalHandler(settings);
  const liveRenewal = createLiveRenewalHttpHandler(settings);
  return (req, res) => {
    if (req.query?.view === 'customer-status') return status(req, res);
    if (req.query?.view === 'customer-renewal') return renewal(req, res);
    if (req.query?.view === 'customer-renewal-order') return requestedOrder(req, res);
    if (req.query?.view === 'renewal-test-approval') return testApproval(req, res);
    if (['renewal-live-readiness','renewal-live-review','renewal-live-execute','renewal-live-status'].includes(req.query?.view)) return liveRenewal(req, res);
    if (req.query?.view !== undefined) {
      res.setHeader('Cache-Control', 'private, no-store');
      return res.status(400).json({ error: 'Unknown CRM view.' });
    }
    return saved(req, res);
  };
}
