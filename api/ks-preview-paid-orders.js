import { createClient } from '@supabase/supabase-js';
import { createPreviewPaidOrdersHandler } from '../_server/ks-preview-paid-orders.js';
export default createPreviewPaidOrdersHandler({ createClient });
