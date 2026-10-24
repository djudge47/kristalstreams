import { createClient } from '@supabase/supabase-js';
import { createRoombaCrmRoute } from '../_server/ks-roomba-crm-route.js';

// Only service-sync accepts a larger identity manifest; the shared route retains
// the original 2 KB ceiling for every existing view.
export const config = { api: { bodyParser: { sizeLimit: '16kb' } } };
export const maxDuration = 60;
export default createRoombaCrmRoute({ createClient });
