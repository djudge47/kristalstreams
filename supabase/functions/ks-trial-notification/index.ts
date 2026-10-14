import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';
import { authorizeTrialBackend, handleTrialNotification } from './handler.js';

const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const admin = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
Deno.serve(req => handleTrialNotification(req, {
  admin, serviceKey, resendKey: Deno.env.get('RESEND_API_KEY') || '',
  authorize: (request: Request) => authorizeTrialBackend(request, { serviceKey, supabaseUrl, createClient }),
}));
