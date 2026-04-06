import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatRequest {
  message: string;
  sessionId: string;
  userId?: string;
  conversationHistory?: ChatMessage[];
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { message, conversationHistory = [] }: ChatRequest = await req.json();

    console.log('Received message:', message);

    if (!message || typeof message !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const response = await generateAIResponse(message, conversationHistory);
    console.log('Generated response:', response);

    return new Response(
      JSON.stringify({ message: response }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error in ai-chat function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: 'I apologize, but I\'m having trouble processing your request. Please try again or contact support.'
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});

async function generateAIResponse(message: string, history: ChatMessage[]): Promise<string> {
  const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY');

  console.log('GROQ_API_KEY available:', GROQ_API_KEY ? 'Yes' : 'No');

  if (!GROQ_API_KEY || GROQ_API_KEY === 'your_groq_api_key') {
    console.log('Using fallback responses - GROQ_API_KEY not configured');
    return await getFallbackResponse(message);
  }

  const systemPrompt = `You are a helpful customer support assistant for Kristal Streams, an IPTV streaming service. \n\nKnowledge Base:\n- Subscription Plans:\n  * Basic Plan: $9.99/month - 100+ channels, SD quality\n  * Premium Plan: $19.99/month - 500+ channels, HD quality\n  * Ultimate Plan: $29.99/month - All channels, 4K quality, up to 5 devices\n  * View plans at: /pricing\n\n- Channel Categories: Sports, Movies, News, Entertainment, Kids, Documentary, Music, International\n- Full channel list available at: /channel-list\n\n- Common Issues:\n  * Buffering: Check internet speed (5 Mbps minimum for HD), restart router, lower quality\n  * Login: Verify email, reset password at /login, clear cache\n  * Device Setup: Support for Smart TVs, Mobile (iOS/Android), Computers, Roku, Fire TV, Apple TV\n  * Quality: Auto (recommended), SD (3 Mbps), HD (5 Mbps), 4K (25 Mbps)\n\n- Support Resources:\n  * Speed test: /support/speed-test\n  * Help center: /support\n  * Create ticket: /client/support\n  * System status: /support/status\n  * Account management: /client/account\n  * Subscription management: /client/subscription\n\n- Policies:\n  * 7-day money-back guarantee\n  * Cancel anytime at /client/subscription\n  * No partial month refunds\n  * Data saved for 90 days after cancellation\n  * View refund policy: /refund-policy\n\nBe helpful, concise, and provide specific links when relevant. If you don't know something, direct users to create a support ticket at /client/support.`;

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...history.slice(-10),
    { role: 'user', content: message }
  ];

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-70b-versatile',
        messages: messages,
        temperature: 0.7,
        max_tokens: 500,
        top_p: 1,
        stream: false
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq API error:', response.status, errorText);
      console.log('Falling back to basic responses');
      return getFallbackResponse(message);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error calling Groq API:', error);
    console.log('Falling back to basic responses');
    return getFallbackResponse(message);
  }
}

async function getFallbackResponse(message: string): Promise<string> {
  const lowerMessage = message.toLowerCase();

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  if (lowerMessage.includes('subscription') || lowerMessage.includes('plan') || lowerMessage.includes('pricing') || lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('how much')) {
    return `We offer several subscription plans to fit your needs:\n\n• Basic Plan - $9.99/month: Access to 100+ channels\n• Premium Plan - $19.99/month: Access to 500+ channels + HD quality\n• Ultimate Plan - $29.99/month: All channels + 4K quality + multiple devices\n\nYou can view all our plans and subscribe at /pricing. Would you like to know more about any specific plan?`;
  }

  if (lowerMessage.includes('buffering') || lowerMessage.includes('slow') || lowerMessage.includes('loading') || lowerMessage.includes('lag') || lowerMessage.includes('freezing') || lowerMessage.includes('stuck')) {
    return `I can help with buffering issues! Here are some quick fixes:\n\n1. Check your internet speed (minimum 5 Mbps for HD streaming)\n2. Close other apps or devices using your network\n3. Try lowering the video quality in settings\n4. Restart your router\n5. Clear your browser cache\n\nYou can also run a speed test at /support/speed-test. Is the buffering happening on a specific channel or all channels?`;
  }

  if (lowerMessage.includes('login') || lowerMessage.includes('password') || lowerMessage.includes('sign in') || lowerMessage.includes('log in') || lowerMessage.includes('forgot') || lowerMessage.includes('access') || lowerMessage.includes('account')) {
    return `Having trouble logging in? Here's what you can do:\n\n1. Make sure you're using the correct email address\n2. Try resetting your password at /login\n3. Clear your browser cookies and cache\n4. Check if your subscription is still active\n\nIf you continue to have issues, I can help you create a support ticket at /client/support. Would you like me to direct you there?`;
  }

  if (lowerMessage.includes('device') || lowerMessage.includes('tv') || lowerMessage.includes('mobile') || lowerMessage.includes('setup') || lowerMessage.includes('install') || lowerMessage.includes('download') || lowerMessage.includes('app') || lowerMessage.includes('roku') || lowerMessage.includes('firestick') || lowerMessage.includes('fire tv') || lowerMessage.includes('apple tv') || lowerMessage.includes('android') || lowerMessage.includes('iphone') || lowerMessage.includes('ipad') || lowerMessage.includes('samsung') || lowerMessage.includes('lg tv') || lowerMessage.includes('windows') || lowerMessage.includes('mac')) {

    let deviceSlug = null;

    if (lowerMessage.includes('roku')) deviceSlug = 'roku-setup';
    else if (lowerMessage.includes('fire tv') || lowerMessage.includes('firestick') || lowerMessage.includes('amazon')) deviceSlug = 'amazon-fire-tv-setup';
    else if (lowerMessage.includes('apple tv')) deviceSlug = 'apple-tv-setup';
    else if (lowerMessage.includes('iphone') || lowerMessage.includes('ipad') || lowerMessage.includes('ios')) deviceSlug = 'ios-setup';
    else if (lowerMessage.includes('android tv')) deviceSlug = 'android-tv-setup';
    else if (lowerMessage.includes('android') && (lowerMessage.includes('phone') || lowerMessage.includes('tablet') || lowerMessage.includes('mobile'))) deviceSlug = 'android-mobile-setup';
    else if (lowerMessage.includes('samsung')) deviceSlug = 'samsung-tv-setup';
    else if (lowerMessage.includes('lg')) deviceSlug = 'lg-tv-setup';
    else if (lowerMessage.includes('windows') || lowerMessage.includes('pc')) deviceSlug = 'windows-pc-setup';
    else if (lowerMessage.includes('mac') || lowerMessage.includes('macbook')) deviceSlug = 'mac-setup';

    if (deviceSlug) {
      try {
        const { data, error } = await supabase
          .from('setup_guides')
          .select('title, content, difficulty, estimated_time')
          .eq('slug', deviceSlug)
          .single();

        if (data && !error) {
          const steps = data.content.split('**Step ').slice(1, 4);
          let summary = `Great! Here's how to set up ${data.title.replace(' Setup', '').replace(' Guide', '')}:\n\n`;

          steps.forEach((step, idx) => {
            const stepTitle = step.split('**')[0].trim();
            summary += `**Step ${idx + 1}: ${stepTitle}**\n`;
            const lines = step.split('\n').slice(1, 4);
            lines.forEach(line => {
              if (line.trim()) summary += `${line.trim()}\n`;
            });
            summary += '\n';
          });

          summary += `\nThis is a ${data.difficulty} setup and takes about ${data.estimated_time} minutes.\n\nFor complete detailed instructions, visit: /support/guide/${deviceSlug}`;

          return summary;
        }
      } catch (err) {
        console.error('Error fetching setup guide:', err);
      }
    }

    return `I can help you set up Kristal Streams on your device! We have detailed guides for:\n\n• **Smart TVs**: Samsung, LG, Android TV, Apple TV\n• **Mobile**: iPhone/iPad, Android phones/tablets\n• **Computers**: Windows PC, Mac\n• **Streaming Devices**: Roku, Amazon Fire TV, Apple TV\n\nWhich specific device do you need help with? I can provide step-by-step instructions!\n\nYou can also browse all guides at /support/devices`;
  }

  if (lowerMessage.includes('channel') || lowerMessage.includes('epg') || lowerMessage.includes('guide') || lowerMessage.includes('what') && (lowerMessage.includes('watch') || lowerMessage.includes('available'))) {
    return `We offer over 500 channels across various categories:\n\n• Sports (ESPN, Fox Sports, Sky Sports, etc.)\n• Movies (HBO, Showtime, premium channels)\n• News (CNN, BBC, Fox News, etc.)\n• Entertainment (NBC, ABC, CBS, etc.)\n• International channels in multiple languages\n\nYou can view the complete channel list at /channel-list. Are you looking for a specific channel?`;
  }

  if (lowerMessage.includes('payment') || lowerMessage.includes('billing') || lowerMessage.includes('charge') || lowerMessage.includes('refund') || lowerMessage.includes('money') || lowerMessage.includes('credit card') || lowerMessage.includes('invoice')) {
    return `For billing questions:\n\n• View your subscription and payment history at /client/subscription\n• Update payment methods in your account settings\n• Refund requests are processed within 7 days\n• Contact support at /support for billing disputes\n\nOur refund policy: Full refund within 7 days of purchase. Learn more at /refund-policy.\n\nHow can I help with your billing concern?`;
  }

  if (lowerMessage.includes('cancel') || lowerMessage.includes('unsubscribe') || lowerMessage.includes('stop') || lowerMessage.includes('end subscription')) {
    return `You can cancel your subscription at any time from your account dashboard at /client/subscription.\n\nImportant notes:\n• You'll retain access until the end of your billing period\n• No refund for partial months\n• You can reactivate anytime\n• Your watch history and preferences are saved for 90 days\n\nWould you like help with the cancellation process?`;
  }

  if (lowerMessage.includes('quality') || lowerMessage.includes('hd') || lowerMessage.includes('4k') || lowerMessage.includes('resolution') || lowerMessage.includes('picture') || lowerMessage.includes('video quality')) {
    return `Video quality options:\n\n• Auto: Adjusts based on your connection (recommended)\n• SD (480p): Minimum 3 Mbps required\n• HD (720p/1080p): Minimum 5 Mbps required\n• 4K/UHD: Minimum 25 Mbps required (Premium/Ultimate plans only)\n\nYou can change quality settings in the video player. Having quality issues? Try running a speed test at /support/speed-test.`;
  }

  if (lowerMessage.includes('not working') || lowerMessage.includes('broken') || lowerMessage.includes('error') || lowerMessage.includes('issue') || lowerMessage.includes('problem')) {
    return `I'm sorry you're experiencing issues. Here are some quick troubleshooting steps:\n\n1. Try refreshing the page\n2. Clear your browser cache and cookies\n3. Check your internet connection\n4. Try a different browser or device\n5. Make sure your subscription is active\n\nIf the problem persists, please create a support ticket at /client/support with details about:\n• What you were trying to do\n• What error message you saw (if any)\n• What device you're using\n\nOur support team will help you resolve this quickly!`;
  }

  if (lowerMessage.includes('start') || lowerMessage.includes('begin') || lowerMessage.includes('get started') || lowerMessage.includes('how do i') || lowerMessage.includes('how to')) {
    return `Welcome to Kristal Streams! Here's how to get started:\n\n1. **Choose a Plan**: Visit /pricing to select your subscription\n2. **Create Account**: Sign up at /register\n3. **Set Up Devices**: Configure your devices at /support/device-setup\n4. **Start Watching**: Browse 500+ channels and enjoy!\n\nNeed help with a specific step? Just let me know!\n\nYou can also check out our Getting Started guide at /support/getting-started.`;
  }

  if (lowerMessage.includes('hi') || lowerMessage.includes('hello') || lowerMessage.includes('hey') || lowerMessage.includes('good morning') || lowerMessage.includes('good afternoon') || lowerMessage.includes('good evening')) {
    return `Hello! Welcome to Kristal Streams support. I'm here to help you with:\n\n• Account and subscription questions\n• Streaming issues and troubleshooting\n• Device setup and compatibility\n• Billing and payment inquiries\n• Channel information\n• Technical support\n\nWhat can I help you with today?`;
  }

  if (lowerMessage.includes('thank') || lowerMessage.includes('thanks') || lowerMessage.includes('appreciate')) {
    return `You're very welcome! Is there anything else I can help you with today? I'm always here if you need assistance with streaming, your account, or any other questions.`;
  }

  if (lowerMessage.includes('speed') || lowerMessage.includes('internet') || lowerMessage.includes('connection') || lowerMessage.includes('bandwidth')) {
    return `Internet speed requirements for Kristal Streams:\n\n• SD Quality: Minimum 3 Mbps\n• HD Quality: Minimum 5 Mbps\n• 4K/UHD Quality: Minimum 25 Mbps\n\nFor the best experience, we recommend:\n• Wired (Ethernet) connection when possible\n• Closing other bandwidth-heavy applications\n• Checking for router firmware updates\n\nYou can test your current internet speed at /support/speed-test to see if it meets the requirements!`;
  }

  return `I'd be happy to help you with that! Based on what you've asked, here are some resources that might be useful:\n\n• **Account & Subscriptions**: Manage your plan at /client/subscription\n• **Technical Support**: Visit our help center at /support\n• **Channel List**: Browse all channels at /channel-list\n• **Device Setup**: Get setup guides at /support/device-setup\n• **Contact Support**: Create a ticket at /client/support\n\nCould you tell me more specifically what you need help with? For example:\n- Having streaming issues?\n- Questions about your subscription?\n- Need help setting up a device?\n- Looking for a specific channel?\n\nI'm here to help!`;
}
