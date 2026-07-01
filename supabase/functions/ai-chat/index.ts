import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

type ChatMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

type ChatRequest = {
  message: string;
  conversationHistory?: ChatMessage[];
};

const systemPrompt = `You are the customer support assistant for Kristal Streams.

Use this current information:
- The service advertises 21,000+ live channels plus movies, series, sports, PPV, and international content.
- All paid plans include the same broad content lineup. Prices change by duration and connection count.
- Bronze: 1 month. 1 connection $20, 2 $35, 3 $50, 4 $65, 5 $80.
- Silver: 3 months. 1 connection $45, 2 $75, 3 $110, 4 $140, 5 $175.
- Gold: 6 months. 1 connection $60, 2 $105, 3 $150, 4 $195, 5 $240.
- Platinum: 12 months. 1 connection $95, 2 $165, 3 $235, 4 $305, 5 $375.
- A 36-hour free trial is available.
- Plans: /pricing
- Free trial: /free-trial
- Login: /login
- Device help: /support/devices
- Speed test: /support/speed-test
- Support center: /support
- Create a ticket: /client/support
- Account: /client/account
- Subscription: /client/subscription
- Refund policy: /refund-policy

For buffering, recommend checking speed, restarting the router and device, closing bandwidth-heavy apps, and testing a lower quality.
For HD recommend at least 5 Mbps; for 4K recommend at least 25 Mbps.
Be concise, accurate, and helpful. Never invent channels, account details, or billing status. For account-specific issues, direct the customer to the support ticket page.`;

function fallbackResponse(message: string): string {
  const text = message.toLowerCase();

  if (/(price|pricing|plan|cost|subscription)/.test(text)) {
    return `Kristal Streams plans:\n\n• Bronze — 1 month, starting at $20\n• Silver — 3 months, starting at $45\n• Gold — 6 months, starting at $60\n• Platinum — 12 months, starting at $95\n\nEach plan offers 1 to 5 connection options and the same broad 21,000+ channel lineup. View every option at /pricing.`;
  }

  if (/(buffer|freez|lag|slow|loading)/.test(text)) {
    return `Try these steps:\n\n1. Restart the streaming device and router.\n2. Close other bandwidth-heavy apps.\n3. Run the speed test at /support/speed-test.\n4. Try a lower quality setting.\n\nHD generally needs at least 5 Mbps and 4K at least 25 Mbps.`;
  }

  if (/(login|password|sign in|account)/.test(text)) {
    return `Check the email address and password, then use the password-reset option at /login if needed. For account-specific help, create a ticket at /client/support.`;
  }

  if (/(device|setup|install|roku|fire|android|iphone|ipad|samsung|lg|windows|mac)/.test(text)) {
    return `Setup guides are available for Smart TVs, mobile devices, computers, Roku, Fire TV, and other supported devices at /support/devices.`;
  }

  if (/(channel|epg|guide|watch)/.test(text)) {
    return `Kristal Streams advertises 21,000+ live channels across sports, movies, news, entertainment, and international categories. Availability can vary. See /pricing or contact support for a specific channel question.`;
  }

  if (/(trial|test service)/.test(text)) {
    return `A 36-hour free trial is available at /free-trial so you can test playback and device compatibility.`;
  }

  return `I can help with plans, setup, buffering, login, channel questions, and the free trial. Visit /support for guides or /client/support to create a ticket.`;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { message, conversationHistory = [] }: ChatRequest = await req.json();
    if (!message || typeof message !== 'string') {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiKey = Deno.env.get('GROQ_API_KEY');
    if (!apiKey || apiKey === 'your_groq_api_key') {
      return new Response(JSON.stringify({ message: fallbackResponse(message) }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          ...conversationHistory.slice(-10),
          { role: 'user', content: message },
        ],
        temperature: 0.4,
        max_tokens: 500,
        stream: false,
      }),
    });

    if (!response.ok) {
      console.error('Groq API error:', response.status, await response.text());
      return new Response(JSON.stringify({ message: fallbackResponse(message) }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const answer = data?.choices?.[0]?.message?.content || fallbackResponse(message);
    return new Response(JSON.stringify({ message: answer }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in ai-chat function:', error);
    return new Response(JSON.stringify({ message: 'Please try again or contact support at /client/support.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
