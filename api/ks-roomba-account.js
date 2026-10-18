import { createClient } from '@supabase/supabase-js';
import { createAdminRoombaHandler } from '../_server/ks-roomba-admin.js';

export default createAdminRoombaHandler({ createClient });
