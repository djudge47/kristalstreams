import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type EmailType = "contact" | "support" | "welcome" | "newsletter";

interface EmailRequest {
  type: EmailType;
  to: string;
  data: Record<string, string>;
}

const SUPPORT_EMAIL = Deno.env.get("SUPPORT_EMAIL") || "support@kristalstream.com";
const FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL") || "Kristal Streams <noreply@kristalstream.com>";

const escapeHtml = (value = "") =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const buildContactEmail = (data: Record<string, string>) => {
  const subject = `New Contact - ${data.subject || "Website Message"}`;
  const html = `
<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f7f7f7;">
    <div style="max-width:640px;margin:0 auto;padding:24px;">
      <div style="background:#e50914;color:#fff;padding:20px;border-radius:10px 10px 0 0;text-align:center;">
        <h1 style="margin:0;font-size:24px;">Kristal Streams</h1>
        <p style="margin:6px 0 0;">New Contact Form Submission</p>
      </div>
      <div style="background:#fff;padding:28px;border-radius:0 0 10px 10px;color:#222;">
        <p><strong>Name:</strong> ${escapeHtml(data.from_name || "Website Visitor")}</p>
        <p><strong>Email:</strong> ${escapeHtml(data.from_email || data.reply_to || "")}</p>
        <p><strong>Subject:</strong> ${escapeHtml(data.subject || "Contact Form Submission")}</p>
        <hr style="border:none;border-top:1px solid #eee;margin:20px 0;" />
        <p style="font-weight:bold;margin-bottom:8px;">Message:</p>
        <div style="background:#f7f7f7;padding:16px;border-radius:8px;line-height:1.6;white-space:pre-wrap;">${escapeHtml(data.message || "")}</div>
        <p style="margin-top:24px;color:#666;font-size:14px;">
          Reply to: <a href="mailto:${escapeHtml(data.reply_to || data.from_email || "")}" style="color:#e50914;">${escapeHtml(data.reply_to || data.from_email || "")}</a>
        </p>
      </div>
    </div>
  </body>
</html>`;

  return { subject, html };
};

const buildSupportEmail = (data: Record<string, string>) => {
  const subject = `[${data.priority || "NORMAL"}] Support - ${data.subject || "Support Request"}`;
  const html = `
<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f7f7f7;">
    <div style="max-width:640px;margin:0 auto;padding:24px;">
      <div style="background:#e50914;color:#fff;padding:20px;border-radius:10px 10px 0 0;text-align:center;">
        <h1 style="margin:0;font-size:24px;">Kristal Streams Support</h1>
        <p style="margin:6px 0 0;">New Support Ticket</p>
      </div>
      <div style="background:#fff;padding:28px;border-radius:0 0 10px 10px;color:#222;">
        <p><strong>Customer:</strong> ${escapeHtml(data.user_name || "Customer")}</p>
        <p><strong>Email:</strong> ${escapeHtml(data.user_email || data.reply_to || "")}</p>
        <p><strong>Category:</strong> ${escapeHtml(data.category || "General")}</p>
        <p><strong>Subject:</strong> ${escapeHtml(data.subject || "Support Request")}</p>
        <hr style="border:none;border-top:1px solid #eee;margin:20px 0;" />
        <div style="background:#f7f7f7;padding:16px;border-radius:8px;line-height:1.6;white-space:pre-wrap;">${escapeHtml(data.message || "")}</div>
      </div>
    </div>
  </body>
</html>`;

  return { subject, html };
};

const buildNewsletterEmail = (data: Record<string, string>) => ({
  subject: "Thanks for subscribing to Kristal Streams!",
  html: `
<!DOCTYPE html>
<html>
  <body style="font-family:Arial,sans-serif;line-height:1.6;">
    <h2>Thanks for subscribing to Kristal Streams</h2>
    <p>Hi ${escapeHtml(data.user_name || "there")},</p>
    <p>You are now subscribed to updates from Kristal Streams.</p>
  </body>
</html>`,
});

const buildWelcomeEmail = (data: Record<string, string>) => ({
  subject: "Welcome to Kristal Streams!",
  html: `
<!DOCTYPE html>
<html>
  <body style="font-family:Arial,sans-serif;line-height:1.6;">
    <h2>Welcome to Kristal Streams!</h2>
    <p>Hi ${escapeHtml(data.user_name || "there")},</p>
    <p>Your ${escapeHtml(data.subscription_plan || "Premium")} subscription is ready.</p>
    <p>Need help? Contact us at ${escapeHtml(SUPPORT_EMAIL)}.</p>
  </body>
</html>`,
});

const buildEmail = (type: EmailType, data: Record<string, string>) => {
  switch (type) {
    case "contact":
      return buildContactEmail(data);
    case "support":
      return buildSupportEmail(data);
    case "newsletter":
      return buildNewsletterEmail(data);
    case "welcome":
      return buildWelcomeEmail(data);
    default:
      throw new Error(`Unknown email type: ${type}`);
  }
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ success: false, error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY is not configured in Supabase Edge Function secrets");
    }

    const { type, to, data }: EmailRequest = await req.json();

    if (!type || !to || !data) {
      throw new Error("Missing required fields: type, to, or data");
    }

    const { subject, html } = buildEmail(type, data);

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [to],
        subject,
        html,
        reply_to: data.reply_to || data.from_email || data.user_email || undefined,
      }),
    });

    const resendResult = await response.json().catch(async () => ({ error: await response.text() }));

    if (!response.ok) {
      const resendMessage = typeof resendResult?.message === "string"
        ? resendResult.message
        : typeof resendResult?.error === "string"
          ? resendResult.error
          : JSON.stringify(resendResult);
      throw new Error(`Resend API error: ${resendMessage}`);
    }

    return new Response(JSON.stringify({ success: true, data: resendResult }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown email error";
    console.error("Error sending email:", message);

    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
