import { createClient } from '@supabase/supabase-js';
import { createAdminRoombaHandler } from '../_server/ks-roomba-admin.js';
import { createRoombaPreviewHandler } from '../_server/ks-roomba-preview.js';

export default createAdminRoombaHandler({
  createClient, dataKind: 'packages',
  accountHandler: createRoombaPreviewHandler({ readAction: 'packages' }),
});
