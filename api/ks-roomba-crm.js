import { createClient } from '@supabase/supabase-js';
import { createRoombaCrmRoute } from '../_server/ks-roomba-crm-route.js';

export const config = { api: { bodyParser: { sizeLimit: '2kb' } } };
export const maxDuration = 60;
export default createRoombaCrmRoute({ createClient });
