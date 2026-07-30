const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://wftfxerblhlsxiijtfbo.supabase.co';
const EMAIL_FUNCTION_URL = `${SUPABASE_URL.replace(/\/$/, '')}/functions/v1/resend-email`;

const SUPPORT_EMAIL = 'support@kristalstream.com';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export interface EmailData {
  to_email: string;
  to_name?: string;
  from_name?: string;
  from_email?: string;
  subject: string;
  message: string;
  reply_to?: string;
}

export interface SupportEmailData {
  user_name: string;
  user_email: string;
  subject: string;
  message: string;
  priority?: 'low' | 'normal' | 'high';
  category?: string;
}

export interface WelcomeEmailData {
  user_name: string;
  user_email: string;
  subscription_plan?: string;
}

export interface NewsletterEmailData {
  email: string;
  name?: string;
}

export interface EmailResult {
  success: boolean;
  error?: string;
}

const getReadableEmailError = (status: number, result: unknown): string => {
  if (result && typeof result === 'object' && 'error' in result) {
    const error = String((result as { error?: unknown }).error || '').trim();
    if (error) return error;
  }

  if (status === 401 || status === 403) {
    return 'Email function authorization failed. Check the Supabase anon key and function JWT settings.';
  }

  if (status === 404) {
    return 'Email function not found. Check that the Supabase Edge Function is named resend-email and deployed.';
  }

  if (status >= 500) {
    return 'Email service is temporarily unavailable. Check the Supabase Edge Function logs.';
  }

  return 'Failed to send email. Check the Supabase Edge Function logs for details.';
};

const sendEmailViaEdgeFunction = async (
  type: 'contact' | 'support' | 'welcome' | 'newsletter',
  to: string,
  data: Record<string, string>
): Promise<EmailResult> => {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (SUPABASE_ANON_KEY) {
      headers.apikey = SUPABASE_ANON_KEY;
      headers.Authorization = `Bearer ${SUPABASE_ANON_KEY}`;
    }

    const response = await fetch(EMAIL_FUNCTION_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({ type, to, data }),
    });

    const result = await response.json().catch(() => null);

    if (!response.ok || !result?.success) {
      const message = getReadableEmailError(response.status, result);
      console.error('Email function error:', { status: response.status, result, message });
      return { success: false, error: message };
    }

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to reach the email service.';
    console.error('Error invoking email function:', error);
    return { success: false, error: message };
  }
};

export const sendContactEmail = async (emailData: EmailData): Promise<EmailResult> => {
  const data = {
    from_name: emailData.from_name || 'Website Contact',
    from_email: emailData.from_email || emailData.to_email,
    subject: emailData.subject,
    message: emailData.message,
    reply_to: emailData.reply_to || emailData.from_email || emailData.to_email,
  };

  return await sendEmailViaEdgeFunction('contact', SUPPORT_EMAIL, data);
};

export const sendSupportEmail = async (supportData: SupportEmailData): Promise<EmailResult> => {
  const data = {
    user_name: supportData.user_name,
    user_email: supportData.user_email,
    subject: supportData.subject,
    message: supportData.message,
    priority: supportData.priority || 'normal',
    category: supportData.category || 'General',
    reply_to: supportData.user_email,
  };

  return await sendEmailViaEdgeFunction('support', SUPPORT_EMAIL, data);
};

export const sendWelcomeEmail = async (welcomeData: WelcomeEmailData): Promise<EmailResult> => {
  const data = {
    user_name: welcomeData.user_name,
    subscription_plan: welcomeData.subscription_plan || 'Premium',
    support_email: SUPPORT_EMAIL,
    website_url: window.location.origin,
  };

  return await sendEmailViaEdgeFunction('welcome', welcomeData.user_email, data);
};

export const sendNewsletterConfirmation = async (newsletterData: NewsletterEmailData): Promise<EmailResult> => {
  const data = {
    user_name: newsletterData.name || 'Subscriber',
    website_url: window.location.origin,
  };

  return await sendEmailViaEdgeFunction('newsletter', newsletterData.email, data);
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

class EmailRateLimit {
  private attempts: Map<string, number[]> = new Map();
  private readonly maxAttempts = 5;
  private readonly timeWindow = 60000;

  canSend(identifier: string): boolean {
    const now = Date.now();
    const userAttempts = this.attempts.get(identifier) || [];

    const recentAttempts = userAttempts.filter(time => now - time < this.timeWindow);

    if (recentAttempts.length >= this.maxAttempts) {
      return false;
    }

    recentAttempts.push(now);
    this.attempts.set(identifier, recentAttempts);

    return true;
  }

  getRemainingTime(identifier: string): number {
    const userAttempts = this.attempts.get(identifier) || [];
    if (userAttempts.length === 0) return 0;

    const oldestAttempt = Math.min(...userAttempts);
    const remainingTime = this.timeWindow - (Date.now() - oldestAttempt);

    return Math.max(0, remainingTime);
  }
}

export const emailRateLimit = new EmailRateLimit();
