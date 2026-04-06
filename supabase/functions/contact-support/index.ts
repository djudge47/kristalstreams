import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { name, email, subject, message } = await req.json();

    // Create support ticket
    const { data: ticket, error: ticketError } = await supabaseClient
      .from('support_tickets')
      .insert({
        subject,
        description: message,
        category: 'Contact Form',
        priority: 'normal',
        status: 'open'
      })
      .select()
      .single();

    if (ticketError) throw ticketError;

    // Send confirmation email (mock for now)
    console.log(`Support request received from ${name} (${email})`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Your message has been received. We'll get back to you soon.",
        ticketId: ticket.id
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to send message" 
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});