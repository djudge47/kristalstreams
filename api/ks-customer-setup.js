import { createClient } from '@supabase/supabase-js';
import { createCustomerSetupHandler } from '../_server/ks-customer-setup.js';
import { createCustomerSetupRouter, createStreamingLoginHandler } from '../_server/ks-streaming-login.js';
import { createCustomerCrmHandler } from '../_server/ks-customer-crm.js';

export default createCustomerSetupRouter({ statusHandler: createCustomerSetupHandler({ createClient }),
  crmHandler: createCustomerCrmHandler({ createClient }),
  availabilityHandler: createStreamingLoginHandler({ createClient }),
  revealHandler: createStreamingLoginHandler({ createClient, reveal: true }),
});
