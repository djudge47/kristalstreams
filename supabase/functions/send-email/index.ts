import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface EmailRequest {
  type: 'contact' | 'support' | 'welcome' | 'reset' | 'newsletter';
  to: string;
  data: Record<string, string>;
}

const emailTemplates = {
  contact: {
    subject: (data: Record<string, string>) => `New Contact - ${data.subject}`,
    html: (data: Record<string, string>) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f9f9f9;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #e50914; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
      <h1 style="color: white; margin: 0;">Kristal Streams</h1>
      <p style="color: white; margin: 5px 0 0 0;">New Contact Form Submission</p>
    </div>
    
    <div style="background-color: white; padding: 30px; border-radius: 0 0 8px 8px;">
      <h2 style="color: #333; margin-top: 0;">Contact Details</h2>
      
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 10px 0; font-weight: bold; color: #666;">Name:</td>
          <td style="padding: 10px 0; color: #333;">${data.from_name}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; font-weight: bold; color: #666;">Email:</td>
          <td style="padding: 10px 0; color: #333;">${data.from_email}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; font-weight: bold; color: #666;">Subject:</td>
          <td style="padding: 10px 0; color: #333;">${data.subject}</td>
        </tr>
      </table>
      
      <div style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #f0f0f0;">
        <h3 style="color: #333; margin-bottom: 10px;">Message:</h3>
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; color: #333; line-height: 1.6;">
          ${data.message}
        </div>
      </div>
      
      <div style="margin-top: 30px; padding: 15px; background-color: #f0f0f0; border-radius: 5px;">
        <p style="margin: 0; color: #666; font-size: 14px;">
          <strong>Reply To:</strong> <a href="mailto:${data.reply_to || data.from_email}" style="color: #e50914;">${data.reply_to || data.from_email}</a>
        </p>
      </div>
    </div>
    
    <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
      <p style="margin: 0;">Sent from Kristal Streams Contact Form</p>
      <p style="margin: 5px 0 0 0;">© 2024 Kristal Streams. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `,
  },
  support: {
    subject: (data: Record<string, string>) => `[${data.priority || 'NORMAL'}] Support - ${data.subject}`,
    html: (data: Record<string, string>) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f9f9f9;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #e50914; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
      <h1 style="color: white; margin: 0;">Kristal Streams Support</h1>
      <p style="color: white; margin: 5px 0 0 0;">New Support Ticket</p>
    </div>
    
    <div style="background-color: white; padding: 30px; border-radius: 0 0 8px 8px;">
      <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin-bottom: 20px;">
        <p style="margin: 0; color: #856404; font-weight: bold;">Priority: ${data.priority || 'NORMAL'}</p>
      </div>
      
      <h2 style="color: #333; margin-top: 0;">Ticket Information</h2>
      
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 10px 0; font-weight: bold; color: #666; width: 30%;">Customer:</td>
          <td style="padding: 10px 0; color: #333;">${data.user_name}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; font-weight: bold; color: #666;">Email:</td>
          <td style="padding: 10px 0; color: #333;">${data.user_email}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; font-weight: bold; color: #666;">Category:</td>
          <td style="padding: 10px 0; color: #333;">${data.category || 'General'}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; font-weight: bold; color: #666;">Subject:</td>
          <td style="padding: 10px 0; color: #333;">${data.subject}</td>
        </tr>
      </table>
      
      <div style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #f0f0f0;">
        <h3 style="color: #333; margin-bottom: 10px;">Issue Description:</h3>
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; color: #333; line-height: 1.6;">
          ${data.message}
        </div>
      </div>
      
      <div style="margin-top: 30px; padding: 15px; background-color: #e7f3ff; border-left: 4px solid #2196F3; border-radius: 5px;">
        <p style="margin: 0; color: #0d47a1; font-size: 14px;">
          <strong>📧 Reply directly to this email to respond to the customer</strong>
        </p>
      </div>
    </div>
    
    <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
      <p style="margin: 0;">Kristal Streams Support System</p>
      <p style="margin: 5px 0 0 0;">© 2024 Kristal Streams. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `,
  },
  welcome: {
    subject: () => "Welcome to Kristal Streams! 🎉",
    html: (data: Record<string, string>) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f9f9f9;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #e50914; padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
      <h1 style="color: white; margin: 0; font-size: 32px;">Welcome to Kristal Streams! 🎉</h1>
      <p style="color: white; margin: 10px 0 0 0; font-size: 18px;">Your premium streaming journey starts now</p>
    </div>
    
    <div style="background-color: white; padding: 40px 30px; border-radius: 0 0 8px 8px;">
      <p style="font-size: 18px; color: #333; margin: 0 0 20px 0;">Hi ${data.user_name},</p>
      
      <p style="color: #666; line-height: 1.6; margin: 0 0 20px 0;">
        Thank you for choosing Kristal Streams! Your <strong style="color: #e50914;">${data.subscription_plan || 'Premium'}</strong> subscription is now active and ready to use.
      </p>
      
      <div style="background-color: #f9f9f9; padding: 25px; border-radius: 8px; margin: 30px 0;">
        <h2 style="color: #333; margin: 0 0 20px 0; font-size: 20px;">🚀 Getting Started</h2>
        
        <div style="margin-bottom: 15px;">
          <span style="color: #e50914; font-size: 20px; margin-right: 10px;">✨</span>
          <span style="color: #333; font-size: 16px;">Browse 500+ live TV channels</span>
        </div>
        
        <div style="margin-bottom: 15px;">
          <span style="color: #e50914; font-size: 20px; margin-right: 10px;">📱</span>
          <span style="color: #333; font-size: 16px;">Download apps for all your devices</span>
        </div>
        
        <div style="margin-bottom: 15px;">
          <span style="color: #e50914; font-size: 20px; margin-right: 10px;">📺</span>
          <span style="color: #333; font-size: 16px;">Watch on up to 3 devices simultaneously</span>
        </div>
        
        <div>
          <span style="color: #e50914; font-size: 20px; margin-right: 10px;">🎬</span>
          <span style="color: #333; font-size: 16px;">Enjoy HD & 4K streaming quality</span>
        </div>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${data.website_url || 'https://kristalstreams.com'}/channel-list" style="display: inline-block; background-color: #e50914; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">Browse Channels</a>
      </div>
      
      <div style="border-top: 2px solid #f0f0f0; padding-top: 25px; margin-top: 30px;">
        <h3 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Need Help?</h3>
        <p style="color: #666; line-height: 1.6; margin: 0 0 10px 0;">
          Our support team is here 24/7:
        </p>
        <p style="color: #666; margin: 0;">
          📧 Email: <a href="mailto:${data.support_email || 'support@kristalstreams.com'}" style="color: #e50914; text-decoration: none;">${data.support_email || 'support@kristalstreams.com'}</a><br>
          💬 Live Chat available on our website
        </p>
      </div>
      
      <p style="color: #666; line-height: 1.6; margin: 30px 0 0 0;">
        Enjoy your streaming experience!
      </p>
      
      <p style="color: #666; margin: 10px 0 0 0;">
        Best regards,<br>
        <strong style="color: #333;">The Kristal Streams Team</strong>
      </p>
    </div>
    
    <div style="text-align: center; padding: 30px 20px; color: #999; font-size: 12px;">
      <p style="margin: 0;">© 2024 Kristal Streams. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `,
  },
  newsletter: {
    subject: () => "Thanks for subscribing to Kristal Streams! 📬",
    html: (data: Record<string, string>) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f9f9f9;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #e50914; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0;">
      <h1 style="color: white; margin: 0; font-size: 28px;">Thanks for Subscribing! 📬</h1>
    </div>
    
    <div style="background-color: white; padding: 40px 30px; border-radius: 0 0 8px 8px;">
      <p style="font-size: 16px; color: #333; margin: 0 0 20px 0;">Hi there!</p>
      
      <p style="color: #666; line-height: 1.6; margin: 0 0 20px 0;">
        Thank you for subscribing to the Kristal Streams newsletter! You'll now receive:
      </p>
      
      <div style="background-color: #f9f9f9; padding: 25px; border-radius: 8px; margin: 25px 0;">
        <div style="margin-bottom: 15px;">
          <span style="color: #e50914; font-size: 20px; margin-right: 10px;">✨</span>
          <span style="color: #333; font-size: 16px;">Exclusive streaming tips and tricks</span>
        </div>
        
        <div style="margin-bottom: 15px;">
          <span style="color: #e50914; font-size: 20px; margin-right: 10px;">🎬</span>
          <span style="color: #333; font-size: 16px;">New channel announcements</span>
        </div>
        
        <div style="margin-bottom: 15px;">
          <span style="color: #e50914; font-size: 20px; margin-right: 10px;">🎁</span>
          <span style="color: #333; font-size: 16px;">Special promotions and offers</span>
        </div>
        
        <div>
          <span style="color: #e50914; font-size: 20px; margin-right: 10px;">📺</span>
          <span style="color: #333; font-size: 16px;">Upcoming live events and sports</span>
        </div>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${data.website_url || 'https://kristalstreams.com'}" style="display: inline-block; background-color: #e50914; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">Visit Kristal Streams</a>
      </div>
      
      <p style="color: #666; line-height: 1.6; margin: 25px 0 0 0;">
        Looking forward to keeping you entertained!
      </p>
      
      <p style="color: #666; margin: 10px 0 0 0;">
        Best regards,<br>
        <strong style="color: #333;">The Kristal Streams Team</strong>
      </p>
    </div>
    
    <div style="text-align: center; padding: 30px 20px; color: #999; font-size: 12px;">
      <p style="margin: 0 0 10px 0;">You can unsubscribe at any time by clicking the link in our emails.</p>
      <p style="margin: 0;">© 2024 Kristal Streams. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `,
  },
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const { type, to, data }: EmailRequest = await req.json();

    if (!type || !to || !data) {
      throw new Error("Missing required fields: type, to, or data");
    }

    const template = emailTemplates[type];
    if (!template) {
      throw new Error(`Unknown email type: ${type}`);
    }

    const subject = template.subject(data);
    const html = template.html(data);

    const emailData = {
      from: "Kristal Streams <noreply@kristalstreams.com>",
      to: [to],
      subject: subject,
      html: html,
      reply_to: data.reply_to || undefined,
    };

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify(emailData),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Resend API error: ${error}`);
    }

    const result = await response.json();

    return new Response(
      JSON.stringify({ success: true, data: result }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
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