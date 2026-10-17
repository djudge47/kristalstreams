import { createClient } from '@supabase/supabase-js';
import { createRoombaCrmHandler } from '../_server/ks-roomba-crm.js';

export const config = { api: { bodyParser: { sizeLimit: '1kb' } } };
export default createRoombaCrmHandler({ createClient });
