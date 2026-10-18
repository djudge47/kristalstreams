import { createClient } from '@supabase/supabase-js';
import { createRoombaTrialHandler } from '../_server/ks-roomba-trial.js';

export const config = { api: { bodyParser: { sizeLimit: '8kb' } } };
export const maxDuration = 60;
export default createRoombaTrialHandler({ createClient });
