import { createClient } from '@supabase/supabase-js';
import { createCustomerSetupHandler } from '../_server/ks-customer-setup.js';
import { createCustomerSetupRouter, createStreamingLoginHandler } from '../_server/ks-streaming-login.js';

export default createCustomerSetupRouter({ statusHandler: createCustomerSetupHandler({ createClient }),
  availabilityHandler: createStreamingLoginHandler({ createClient }),
  revealHandler: createStreamingLoginHandler({ createClient, reveal: true }),
});
