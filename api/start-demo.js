import { createClient } from '@supabase/supabase-js';
import { createTrialHandler } from '../_server/ks-trials.js';

export default createTrialHandler({ createClient });
