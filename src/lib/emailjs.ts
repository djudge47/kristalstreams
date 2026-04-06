// EmailJS Configuration and Service
import emailjs from '@emailjs/browser';

// EmailJS Configuration
const EMAILJS_CONFIG = {
  serviceId: import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_default',
  templateId: import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'template_default',
  publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'your_public_key',
  supportTemplateId: import.meta.env.VITE_EMAILJS_SUPPORT_TEMPLATE_ID || 'template_support',
  welcomeTemplateId: import.meta.env.VITE_EMAILJS_WELCOME_TEMPLATE_ID || 'template_welcome',
  resetPasswordTemplateId: import.meta.env.VITE_EMAILJS_RESET_TEMPLATE_ID || 'template_reset'
};

// Initialize EmailJS
emailjs.init(EMAILJS_CONFIG.publicKey);

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
  priority: 'low' | 'normal' | 'high';
  category: string;
}

export interface WelcomeEmailData {
  user_name: string;
  user_email: string;
  subscription_plan?: string;
}

export interface ResetPasswordEmailData {
  user_name: string;
  user_email: string;
  reset_link: string;
}

// Generic email sending function
export const sendEmail = async (templateId: string, templateParams: any): Promise<boolean> => {
  try {
    const response = await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      templateId,
      templateParams,
      EMAILJS_CONFIG.publicKey
    );

    if (response.status === 200) {
      console.log('Email sent successfully:', response);
      return true;
    } else {
      console.error('Email sending failed:', response);
      return false;
    }
  } catch (error) {
    console.error('Email sending error:', error);
    return false;
  }
};

// Contact form email
export const sendContactEmail = async (emailData: EmailData): Promise<boolean> => {
  const templateParams = {
    to_email: 'support@kristalstreams.com', // Your support email
    from_name: emailData.from_name || 'Website Contact',
    from_email: emailData.from_email || emailData.to_email,
    reply_to: emailData.reply_to || emailData.from_email,
    subject: emailData.subject,
    message: emailData.message,
    user_email: emailData.to_email
  };

  return await sendEmail(EMAILJS_CONFIG.templateId, templateParams);
};

// Support ticket email
export const sendSupportEmail = async (supportData: SupportEmailData): Promise<boolean> => {
  const templateParams = {
    to_email: 'support@kristalstreams.com',
    user_name: supportData.user_name,
    user_email: supportData.user_email,
    subject: `[${supportData.priority.toUpperCase()}] ${supportData.subject}`,
    message: supportData.message,
    category: supportData.category,
    priority: supportData.priority,
    reply_to: supportData.user_email
  };

  return await sendEmail(EMAILJS_CONFIG.supportTemplateId, templateParams);
};

// Welcome email for new users
export const sendWelcomeEmail = async (welcomeData: WelcomeEmailData): Promise<boolean> => {
  const templateParams = {
    to_email: welcomeData.user_email,
    user_name: welcomeData.user_name,
    subscription_plan: welcomeData.subscription_plan || 'Free Trial',
    company_name: 'Kristal Streams',
    support_email: 'support@kristalstreams.com'
  };

  return await sendEmail(EMAILJS_CONFIG.welcomeTemplateId, templateParams);
};

// Password reset email
export const sendPasswordResetEmail = async (resetData: ResetPasswordEmailData): Promise<boolean> => {
  const templateParams = {
    to_email: resetData.user_email,
    user_name: resetData.user_name,
    reset_link: resetData.reset_link,
    company_name: 'Kristal Streams',
    support_email: 'support@kristalstreams.com'
  };

  return await sendEmail(EMAILJS_CONFIG.resetPasswordTemplateId, templateParams);
};

// Newsletter subscription
export const sendNewsletterConfirmation = async (email: string, name: string): Promise<boolean> => {
  const templateParams = {
    to_email: email,
    user_name: name,
    company_name: 'Kristal Streams',
    unsubscribe_link: `${window.location.origin}/unsubscribe?email=${encodeURIComponent(email)}`
  };

  return await sendEmail(EMAILJS_CONFIG.templateId, templateParams);
};

// Email validation
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Rate limiting for email sending
class EmailRateLimit {
  private attempts: Map<string, number[]> = new Map();
  private readonly maxAttempts = 5;
  private readonly timeWindow = 60000; // 1 minute

  canSend(identifier: string): boolean {
    const now = Date.now();
    const userAttempts = this.attempts.get(identifier) || [];
    
    // Remove old attempts outside time window
    const recentAttempts = userAttempts.filter(time => now - time < this.timeWindow);
    
    if (recentAttempts.length >= this.maxAttempts) {
      return false;
    }

    // Add current attempt
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

// Email templates for different purposes
export const EMAIL_TEMPLATES = {
  CONTACT: 'contact_form',
  SUPPORT: 'support_ticket',
  WELCOME: 'welcome_user',
  RESET_PASSWORD: 'reset_password',
  NEWSLETTER: 'newsletter_signup',
  SUBSCRIPTION_CONFIRMATION: 'subscription_confirm',
  PAYMENT_SUCCESS: 'payment_success',
  ACCOUNT_VERIFICATION: 'account_verify'
};

// Email status tracking
export interface EmailStatus {
  id: string;
  status: 'pending' | 'sent' | 'failed' | 'delivered';
  timestamp: number;
  recipient: string;
  template: string;
  error?: string;
}

class EmailStatusTracker {
  private statuses: Map<string, EmailStatus> = new Map();

  track(id: string, recipient: string, template: string): void {
    this.statuses.set(id, {
      id,
      status: 'pending',
      timestamp: Date.now(),
      recipient,
      template
    });
  }

  updateStatus(id: string, status: EmailStatus['status'], error?: string): void {
    const existing = this.statuses.get(id);
    if (existing) {
      existing.status = status;
      existing.error = error;
      this.statuses.set(id, existing);
    }
  }

  getStatus(id: string): EmailStatus | undefined {
    return this.statuses.get(id);
  }

  getAllStatuses(): EmailStatus[] {
    return Array.from(this.statuses.values());
  }
}

export const emailStatusTracker = new EmailStatusTracker();