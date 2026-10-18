import { createClient } from '@supabase/supabase-js';
import { createCustomerSetupHandler } from '../_server/ks-customer-setup.js';

export default createCustomerSetupHandler({ createClient });
