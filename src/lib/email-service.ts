import { requestSupportMail } from './support-mail';

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

export const sendContactEmail = async (emailData: EmailData): Promise<EmailResult> => requestSupportMail({
  type: 'contact', to: SUPPORT_EMAIL,
  data: {
    from_name: emailData.from_name || 'Website Visitor',
    from_email: (emailData.from_email || emailData.to_email).trim().toLowerCase(),
    subject: emailData.subject, message: emailData.message,
  },
});

const sendEmailViaEdgeFunction = (type: 'support' | 'welcome' | 'newsletter', to: string, data: Record<string,string>) =>
  requestSupportMail({type,to:to.trim().toLowerCase(),data});

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