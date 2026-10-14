import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';
import { handleOrderNotification } from './handler.js';

const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const admin = createClient(Deno.env.get('SUPABASE_URL') || '', serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

Deno.serve((req) => handleOrderNotification(req, {
  admin,
  serviceKey,
  resendKey: Deno.env.get('RESEND_API_KEY') || '',
}));
