import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.49.4';
import { createSupportEmailHandler } from './handler.js';

// Public contact requests are limited to the fixed inbox. All other actions
// require a fresh verified identity, revalidated by private database functions.
Deno.serve(createSupportEmailHandler({createClient,env:{
  SUPABASE_URL:Deno.env.get('SUPABASE_URL'),
  SUPABASE_ANON_KEY:Deno.env.get('SUPABASE_ANON_KEY'),
  SUPABASE_SERVICE_ROLE_KEY:Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
  RESEND_API_KEY:Deno.env.get('RESEND_API_KEY'),
  RESEND_FROM_EMAIL:Deno.env.get('RESEND_FROM_EMAIL'),
  SUPPORT_EMAIL:Deno.env.get('SUPPORT_EMAIL'),
}}));
