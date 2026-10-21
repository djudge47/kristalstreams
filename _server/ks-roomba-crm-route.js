import { createRoombaCrmHandler } from './ks-roomba-crm.js';
import { createCustomerStatusHandler } from './ks-roomba-customer-status.js';

// Share the existing CRM function so the deployment remains at 12 functions.
// The saved-receipt handler and its POST behavior are unchanged.
export function createRoombaCrmRoute(settings = {}) {
  const saved = createRoombaCrmHandler(settings);
  const status = createCustomerStatusHandler(settings);
  const renewal = createCustomerStatusHandler({ ...settings, reviewRenewal: true });
  return (req, res) => {
    if (req.query?.view === 'customer-status') return status(req, res);
    if (req.query?.view === 'customer-renewal') return renewal(req, res);
    if (req.query?.view !== undefined) {
      res.setHeader('Cache-Control', 'private, no-store');
      return res.status(400).json({ error: 'Unknown CRM view.' });
    }
    return saved(req, res);
  };
}
