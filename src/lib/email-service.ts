import { supabase } from './supabase';

const SUPPORT_EMAIL = 'support@kristalstream.com';

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

const getReadableEmailError = (error: unknown, data?: unknown): string => {
  if (data && typeof data === 'object' && 'error' in data) {
    const message = String((data as { error?: unknown }).error || '').trim();
    if (message) return message;
  }

  if (error && typeof error === 'object') {
    const message = String((error as { message?: unknown }).message || '').trim();
    if (message) {
      if (/401|403|unauthorized|jwt|authorization/i.test(message)) {
        return 'Email function authorization failed. The resend-email function still requires JWT verification or the deployed function is not using the latest settings.';
      }
      return message;
    }
  }

  if (typeof error === 'string' && error.trim()) {
    return error;
  }

  return 'Failed to send email. Check the Supabase Edge Function logs for details.';
};

const sendEmailViaEdgeFunction = async (
  type: 'contact' | 'support' | 'welcome' | 'newsletter',
  to: string,
  data: Record<string, string>
): Promise<EmailResult> => {
  try {
    const { data: result, error } = await supabase.functions.invoke('resend-email', {
      body: { type, to, data },
    });

    if (error || !result?.success) {
      const message = getReadableEmailError(error, result);
      console.error('Email function error:', { error, result, message });
      return { success: false, error: message };
    }

    return { success: true };
  } catch (error) {
    const message = getReadableEmailError(error);
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
