import { createClient } from '@supabase/supabase-js';
import { createPreviewPaidOrdersHandler, createPreviewPaidOrdersRouter } from '../_server/ks-preview-paid-orders.js';
import { createPreviewNewPaidSetupHandler } from '../_server/ks-preview-new-paid-setup.js';
import { createPaidFoundationHandler } from '../_server/ks-paid-foundation.js';
import { createPaidActivationReviewHandler } from '../_server/ks-paid-activation-review.js';
import { createPaidTestControlHandler } from '../_server/ks-paid-test-control.js';
export const maxDuration = 300;
export default createPreviewPaidOrdersRouter({
  listHandler: createPreviewPaidOrdersHandler({ createClient }),
  simulationHandler: createPreviewNewPaidSetupHandler({ createClient }),
  foundationHandler: createPaidFoundationHandler({ createClient }),
  activationReviewHandler: createPaidActivationReviewHandler({ createClient }),
  paidTestControlHandler: createPaidTestControlHandler({ createClient }),
});
