import { supabase } from './supabase';

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

const sendEmailViaEdgeFunction = async (
  type: 'contact' | 'support' | 'welcome' | 'newsletter',
  to: string,
  data: Record<string, string>
): Promise<boolean> => {
  try {
    const { data: response, error } = await supabase.functions.invoke('send-email', {
      body: {
        type,
        to,
        data,
      },
    });

    if (error) {
      console.error('Edge function error:', error);
      return false;
    }

    if (!response?.success) {
      console.error('Email sending failed:', response);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error invoking edge function:', error);
    return false;
  }
};

export const sendContactEmail = async (emailData: EmailData): Promise<boolean> => {
  const data = {
    from_name: emailData.from_name || 'Website Contact',
    from_email: emailData.from_email || emailData.to_email,
    subject: emailData.subject,
    message: emailData.message,
    reply_to: emailData.reply_to || emailData.from_email || emailData.to_email,
  };

  return await sendEmailViaEdgeFunction('contact', 'support@kristalstreams.com', data);
};

export const sendSupportEmail = async (supportData: SupportEmailData): Promise<boolean> => {
  const data = {
    user_name: supportData.user_name,
    user_email: supportData.user_email,
    subject: supportData.subject,
    message: supportData.message,
    priority: supportData.priority || 'normal',
    category: supportData.category || 'General',
    reply_to: supportData.user_email,
  };

  return await sendEmailViaEdgeFunction('support', 'support@kristalstreams.com', data);
};

export const sendWelcomeEmail = async (welcomeData: WelcomeEmailData): Promise<boolean> => {
  const data = {
    user_name: welcomeData.user_name,
    subscription_plan: welcomeData.subscription_plan || 'Premium',
    support_email: 'support@kristalstreams.com',
    website_url: window.location.origin,
  };

  return await sendEmailViaEdgeFunction('welcome', welcomeData.user_email, data);
};

export const sendNewsletterConfirmation = async (newsletterData: NewsletterEmailData): Promise<boolean> => {
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
