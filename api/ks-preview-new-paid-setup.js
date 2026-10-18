import { createClient } from '@supabase/supabase-js';
import { createPreviewNewPaidSetupHandler } from '../_server/ks-preview-new-paid-setup.js';
export const maxDuration = 60;
export default createPreviewNewPaidSetupHandler({ createClient });
