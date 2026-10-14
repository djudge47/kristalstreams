import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';
import { handleOrderNotification, authorizeOrderBackend } from './handler.js';

const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const admin = createClient(Deno.env.get('SUPABASE_URL') || '', serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

Deno.serve((req) => handleOrderNotification(req, {
  admin,
  authorize: (request: Request) => authorizeOrderBackend(request, {
    serviceKey, supabaseUrl: Deno.env.get('SUPABASE_URL') || '', createClient,
  }),
  serviceKey,
  resendKey: Deno.env.get('RESEND_API_KEY') || '',
}));
