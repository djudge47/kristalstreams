import { createClient } from '@supabase/supabase-js';
import { createPreviewTrialUpgradeHandler } from '../_server/ks-preview-trial-upgrade.js';
export const maxDuration = 60;
export default createPreviewTrialUpgradeHandler({createClient});
