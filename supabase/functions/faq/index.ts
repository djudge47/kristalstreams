import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// FAQ database
const faqs = [
  {
    question: "hello hi hey",
    answer: "Hi there! How can I assist you today?"
  },
  {
    question: "good morning",
    answer: "Good morning! How can I assist you today?"
  },
  {
    question: "good afternoon",
    answer: "Good afternoon! How can I assist you today?"
  },
  {
    question: "good evening",
    answer: "Good evening! How can I assist you today?"
  },
  {
    question: "how are you",
    answer: "I'm doing well, thank you for asking! How can I assist you today?"
  },
  {
    question: "thanks thank you",
    answer: "You're welcome! Let me know if you need anything else."
  },
  {
    question: "bye goodbye",
    answer: "Goodbye! Thanks for chatting with me."
  },
  {
    question: "pricing price cost subscription plans how much",
    answer: "We offer several subscription plans:\n\nBasic Plan: $15/month\n• 1 connection\n• HD streaming\n• Standard channels\n\nStandard Plan: $25/month\n• 2 connections\n• HD streaming\n• Premium channels\n\nPremium Plan: $35/month\n• 3 connections\n• 4K streaming\n• All channels\n\nUltimate Plan: $45/month\n• 4 connections\n• 4K streaming\n• All channels + PPV\n\nAll plans include:\n• No contract required\n• Cancel anytime\n• 36-hour free trial\n\nWould you like to view our detailed pricing page?"
  },
  {
    question: "basic plan",
    answer: "The Basic Plan costs $15/month and includes:\n• Single device streaming\n• HD quality\n• Standard channel package\n• 24/7 support\n\nPerfect for individual viewers. Would you like to start your free trial?"
  },
  {
    question: "standard plan",
    answer: "The Standard Plan costs $25/month and includes:\n• 2 device streaming\n• HD quality\n• Premium channels\n• 24/7 support\n• Enhanced features\n\nGreat for couples or small households. Would you like to view the full plan details?"
  },
  {
    question: "premium plan",
    answer: "The Premium Plan costs $35/month and includes:\n• 3 device streaming\n• 4K Ultra HD quality\n• All channels\n• 24/7 priority support\n• Advanced features\n\nPerfect for families. Would you like to start your free trial?"
  },
  {
    question: "ultimate plan",
    answer: "The Ultimate Plan costs $45/month and includes:\n• 4 device streaming\n• 4K Ultra HD quality\n• All channels + PPV events\n• 24/7 VIP support\n• All premium features\n\nOur most comprehensive package. Would you like to view the full plan comparison?"
  },
  {
    question: "How do I start streaming?",
    answer: "To start streaming on Kristal Streams, simply log in to your account, browse our channel list, and click on any channel to begin watching. Make sure you have a stable internet connection with at least 5 Mbps for HD streaming."
  },
  {
    question: "What devices can I use?",
    answer: "Kristal Streams works on Smart TVs (Samsung, LG, Android TV), mobile devices (iOS/Android), streaming devices (Roku, Fire TV, Apple TV), gaming consoles (PS4, PS5, Xbox), and web browsers. Check our device compatibility guide for specific requirements."
  },
  {
    question: "How many connections are allowed?",
    answer: "The number of connections depends on your subscription tier: Basic (1 connection), Standard (2 connections), Premium (3 connections), and Ultimate (4 connections). You can manage your active connections in your account settings."
  },
  {
    question: "What internet speed do I need?",
    answer: "For optimal streaming quality: SD requires 3+ Mbps, HD needs 5+ Mbps, and 4K streaming requires 25+ Mbps. Use our built-in speed test tool to check your connection."
  },
  {
    question: "How do I change my subscription?",
    answer: "To change your subscription, go to Client Area > Subscription and select your desired plan. Changes take effect immediately, with prorated charges or credits applied to your next bill."
  },
  {
    question: "What payment methods are accepted?",
    answer: "We accept all major credit cards and PayPal. All transactions are secure and encrypted. You can manage your payment methods in the Client Area under Subscription."
  },
  {
    question: "How do I cancel?",
    answer: "You can cancel your subscription anytime through the Client Area > Subscription page. Your service will continue until the end of your current billing period with no additional charges."
  },
  {
    question: "Do you offer a free trial?",
    answer: "Yes! We offer a 36-hour free trial that gives you full access to our Premium plan features. No credit card is required to start your trial."
  },
  {
    question: "How do I reset my password?",
    answer: "To reset your password, go to Client Area > Security and use the password change form. For security, you'll need to enter your current password first."
  },
  {
    question: "What channels are available?",
    answer: "We offer thousands of live TV channels including sports, movies, news, entertainment, and international content. Premium and Ultimate plans include additional premium channels and 4K content."
  },
  {
    question: "How do I get support?",
    answer: "You can get support through our Help Center, create a support ticket in the Client Area > Support section, or check our Knowledge Base for guides and troubleshooting tips."
  },
  {
    question: "Is there an EPG/TV Guide?",
    answer: "Yes, we provide a comprehensive Electronic Program Guide (EPG) for most channels. You can see what's currently playing and what's coming up next to plan your viewing."
  },
  {
    question: "Can I download content?",
    answer: "Currently, we focus on providing high-quality streaming. While downloads aren't available, our adaptive streaming ensures the best quality based on your connection."
  },
  {
    question: "Do you have parental controls?",
    answer: "Yes, you can set up parental controls in your account settings to restrict content based on ratings and categories, ensuring a family-friendly viewing experience."
  }
];

function findBestMatch(query: string): { question: string; answer: string } | null {
  // Convert query to lowercase for case-insensitive matching
  const normalizedQuery = query.toLowerCase();
  
  // Check for pricing-related queries first
  if (normalizedQuery.includes('price') || 
      normalizedQuery.includes('cost') || 
      normalizedQuery.includes('subscription') || 
      normalizedQuery.includes('plan')) {
    return faqs.find(faq => faq.question.includes('pricing'));
  }
  
  // Check for specific plan queries
  if (normalizedQuery.includes('basic plan')) {
    return faqs.find(faq => faq.question === 'basic plan');
  }
  if (normalizedQuery.includes('standard plan')) {
    return faqs.find(faq => faq.question === 'standard plan');
  }
  if (normalizedQuery.includes('premium plan')) {
    return faqs.find(faq => faq.question === 'premium plan');
  }
  if (normalizedQuery.includes('ultimate plan')) {
    return faqs.find(faq => faq.question === 'ultimate plan');
  }
  
  // Check for greetings
  if (faqs[0].question.split(' ').some(word => normalizedQuery.includes(word))) {
    return faqs[0];
  }
  
  // Check for time-based greetings
  if (normalizedQuery.includes('good morning')) {
    return faqs[1];
  }
  
  if (normalizedQuery.includes('good afternoon')) {
    return faqs[2];
  }
  
  if (normalizedQuery.includes('good evening')) {
    return faqs[3];
  }
  
  // Check for "how are you"
  if (normalizedQuery.includes('how are you')) {
    return faqs[4];
  }
  
  // Check for thanks/thank you
  if (normalizedQuery.includes('thank')) {
    return faqs[5];
  }
  
  // Check for goodbye
  if (normalizedQuery.includes('bye') || normalizedQuery.includes('goodbye')) {
    return faqs[6];
  }
  
  // Try to find an exact match
  const exactMatch = faqs.find(faq => 
    faq.question.toLowerCase().includes(normalizedQuery) ||
    faq.answer.toLowerCase().includes(normalizedQuery)
  );
  
  if (exactMatch) {
    return exactMatch;
  }
  
  // If no exact match, try to find a partial match
  const words = normalizedQuery.split(' ').filter(word => word.length > 3);
  
  for (const faq of faqs) {
    const faqText = (faq.question + ' ' + faq.answer).toLowerCase();
    if (words.some(word => faqText.includes(word))) {
      return faq;
    }
  }
  
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message } = await req.json();
    
    // Find matching FAQ
    const matchingFaq = findBestMatch(message);
    
    let response;
    if (matchingFaq) {
      response = matchingFaq.answer;
      
      // Add pricing page suggestion for pricing-related queries
      if (matchingFaq.question.includes('pricing') || 
          matchingFaq.question.includes('plan')) {
        response += "\n\nWould you like to visit our pricing page for more details?";
      }
    } else {
      response = "I understand you're asking about " + message + ". For the most accurate information, please check our help center or contact our support team for personalized assistance.";
    }

    return new Response(
      JSON.stringify({ response }),
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
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
        response: "I'm having trouble processing your request right now. Please try again later."
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});