import { createClient } from '@supabase/supabase-js';
import { createPreviewPaidOrdersHandler, createPreviewPaidOrdersRouter } from '../_server/ks-preview-paid-orders.js';
import { createPreviewNewPaidSetupHandler } from '../_server/ks-preview-new-paid-setup.js';
export const maxDuration = 60;
export default createPreviewPaidOrdersRouter({
  listHandler: createPreviewPaidOrdersHandler({ createClient }),
  simulationHandler: createPreviewNewPaidSetupHandler({ createClient }),
});
