import { createClient } from '@supabase/supabase-js';
import { createAdminRoombaHandler } from '../_server/ks-roomba-admin.js';
import { createActivityProbeHandler } from '../_server/ks-roomba-activity-probe.js';

const account = createAdminRoombaHandler({ createClient });
const activity = createActivityProbeHandler({ createClient, authorize: account });
export default (req, res) => req.query?.view === 'activity-support' ? activity(req, res) : account(req, res);
