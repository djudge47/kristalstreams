import { createClient } from '@supabase/supabase-js';
import { createCustomerStatusHandler } from '../_server/ks-roomba-customer-status.js';

export const maxDuration = 60;
export default createCustomerStatusHandler({ createClient });
