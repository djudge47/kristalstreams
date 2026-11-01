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

const plans = {
  bronze: { name: 'Bronze', months: 1, prices: [20, 35, 50, 65, 80] },
  silver: { name: 'Silver', months: 3, prices: [45, 75, 110, 140, 175] },
  gold: { name: 'Gold', months: 6, prices: [60, 105, 150, 195, 240] },
  platinum: { name: 'Platinum', months: 12, prices: [95, 165, 235, 305, 375] },
} as const;


// Approved customer setup knowledge. Keep synchronized with the website's Get App instructions.
const setupKnowledge = `
KRISTAL STREAMS INSTALLATION AND DEVICE HELP — APPROVED:
Customers already on the Kristal Streams homepage should select the main "Get App" button. Do not tell them to locate a browser, manually type a separate /download-app URL, enter a Downloader code, use GitHub, find a third-party APK mirror, or search an app store for the Kristal Streams APK. The intended APK filename is kristalstreams.apk. The download is offered through the Kristal Streams website. Only install from the official site.

Firestick / Fire TV (Android-based): From the Kristal Streams homepage choose Get App, open the downloaded APK in Downloads or a file manager, allow installation from the app that opened it when Fire TV asks, finish installation, open Kristal Streams, and sign in with the issued service credentials. If the download cannot be opened, ask the customer to contact support; some Fire TV browsers block APKs. Fire TV models using Vega OS cannot install Android APKs. Do not uninstall a working version without saving the credentials.

ONN / Google TV / Android TV: On the Kristal Streams homepage select Get App. Open the APK download in Downloads or a file manager; grant the installing app permission if Android requests it, install, launch Kristal Streams, and sign in. If "App not installed" appears, check storage and whether an existing or differently signed version is installed; preserve customer login details.

Android phones and tablets: Tap Get App on the Kristal Streams homepage, open the downloaded APK from notifications or Downloads, allow install from that source if prompted, install, open and sign in. Apple iPhones and iPads cannot install Android APK files.

Samsung Tizen / LG webOS smart televisions: Do NOT try to install the Android APK on the television. Instead open the TV's official app store, look for a compatible IPTV player (for example, IPTV Smarters / Smarters Player Lite if available in that region), install it, select an Xtream Codes-compatible login if the player supports it, then enter the server URL, username and password supplied for the customer's Kristal Streams service. The third-party IPTV player is not the Kristal Streams Android app. Contact support if a compatible player is unavailable.

Website and other browsers: Users can use browser-based services where supported; APK installation is only for compatible Android-derived devices. For Live TV, Movies and Series, open the corresponding section after sign-in. For missing channels, buffering, expired credentials, playback failures or account-invalid errors, collect device type and error details and refer account-specific changes to support.

Safety and accuracy: Never guess a customer's username, password, server address, service status, or pricing. Do not promise all browsers and devices support direct APK installation. Distinguish visiting the homepage and pressing Get App from using another external APK source. For further help link to /support or /client/support.
`;

const systemPrompt = `You are the customer support assistant for Kristal Streams.

Use this current information:
${setupKnowledge}
- The service advertises movies, series, sports, PPV, international content, and broad entertainment access.
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
Be concise, accurate, and helpful. Never invent content, account details, or billing status. For account-specific issues, direct the customer to the support ticket page.`;

function getConnectionCount(text: string): number | null {
  const matches = [
    { count: 1, pattern: /\b(1|one)\b/ },
    { count: 2, pattern: /\b(2|two)\b/ },
    { count: 3, pattern: /\b(3|three)\b/ },
    { count: 4, pattern: /\b(4|four)\b/ },
    { count: 5, pattern: /\b(5|five)\b/ },
  ];

  for (const item of matches) {
    if (item.pattern.test(text)) return item.count;
  }

  return null;
}

function getPricingResponse(message: string): string | null {
  const text = message.toLowerCase();
  if (!/(price|pricing|plan|cost|how much|subscription|connection)/.test(text)) return null;

  const planKey = (Object.keys(plans) as Array<keyof typeof plans>).find((key) => text.includes(key));
  const connections = getConnectionCount(text);

  if (planKey && connections) {
    const plan = plans[planKey];
    const price = plan.prices[connections - 1];
    return `${plan.name} is $${price} for ${plan.months} month${plan.months === 1 ? '' : 's'} with ${connections} connection${connections === 1 ? '' : 's'}. View or select the plan at /pricing.`;
  }

  if (planKey) {
    const plan = plans[planKey];
    return `${plan.name} is a ${plan.months}-month plan. Prices are: 1 connection $${plan.prices[0]}, 2 $${plan.prices[1]}, 3 $${plan.prices[2]}, 4 $${plan.prices[3]}, and 5 $${plan.prices[4]}.`;
  }

  return `Kristal Streams plans:\n\n• Bronze — 1 month, starting at $20\n• Silver — 3 months, starting at $45\n• Gold — 6 months, starting at $60\n• Platinum — 12 months, starting at $95\n\nEach plan offers 1 to 5 connection options and the same broad entertainment lineup. View every option at /pricing.`;
}

function fallbackResponse(message: string): string {
  const text = message.toLowerCase();
  const pricingResponse = getPricingResponse(message);
  if (pricingResponse) return pricingResponse;

  if (/(buffer|freez|lag|slow|loading)/.test(text)) {
    return `Try these steps:\n\n1. Restart the streaming device and router.\n2. Close other bandwidth-heavy apps.\n3. Run the speed test at /support/speed-test.\n4. Try a lower quality setting.\n\nHD generally needs at least 5 Mbps and 4K at least 25 Mbps.`;
  }

  if (/(login|password|sign in|account)/.test(text)) {
    return `Check the email address and password, then use the password-reset option at /login if needed. For account-specific help, create a ticket at /client/support.`;
  }

  if (/(device|setup|install|roku|fire|android|iphone|ipad|samsung|lg|windows|mac)/.test(text)) {
    return `For Firestick, ONN, Android TV or Android phones, select Get App on the Kristal Streams homepage, open the downloaded kristalstreams.apk, allow installation when prompted, install and sign in. Samsung/LG smart TVs cannot install Android APKs; use a compatible IPTV player from the TV's official app store and your supplied service credentials. For detailed device-specific help visit /download-app or contact /client/support. Never use third-party APK download sites.`;
  }

  if (/(content|movie|series|sport|ppv|watch)/.test(text)) {
    return `Kristal Streams offers movies, series, sports, PPV, international content, and broad entertainment access. Availability can vary. See /pricing or contact support for a specific content question.`;
  }

  if (/(trial|test service)/.test(text)) {
    return `A 36-hour free trial is available at /free-trial so you can test playback and device compatibility.`;
  }

  return `I can help with plans, setup, buffering, login, content questions, and the free trial. Visit /support for guides or /client/support to create a ticket.`;
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

    const pricingResponse = getPricingResponse(message);
    if (pricingResponse) {
      return new Response(JSON.stringify({ message: pricingResponse }), {
        status: 200,
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
