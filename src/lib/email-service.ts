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

const extractErrorFromObject = (value: unknown): string => {
  if (!value || typeof value !== 'object') return '';

  const candidate = value as {
    error?: unknown;
    message?: unknown;
    msg?: unknown;
    details?: unknown;
    description?: unknown;
  };

  const possibleMessages = [
    candidate.error,
    candidate.message,
    candidate.msg,
    candidate.details,
    candidate.description,
  ];

  for (const item of possibleMessages) {
    if (typeof item === 'string' && item.trim()) return item.trim();
  }

  return '';
};

const getResponseBodyMessage = async (response: Response): Promise<string> => {
  try {
    const clone = response.clone();
    const text = await clone.text();
    if (!text.trim()) return '';

    try {
      const parsed = JSON.parse(text);
      return extractErrorFromObject(parsed) || text;
    } catch {
      return text;
    }
  } catch {
    return '';
  }
};

const getReadableEmailError = async (error: unknown, data?: unknown): Promise<string> => {
  const dataMessage = extractErrorFromObject(data);
  if (dataMessage) return dataMessage;

  if (error && typeof error === 'object') {
    const functionError = error as { message?: unknown; context?: unknown };

    if (functionError.context instanceof Response) {
      const bodyMessage = await getResponseBodyMessage(functionError.context);
      if (bodyMessage) return bodyMessage;
    }

    const message = typeof functionError.message === 'string' ? functionError.message.trim() : '';
    if (message) {
      if (/401|403|unauthorized|jwt|authorization/i.test(message)) {
        return 'Email function authorization failed. The resend-email function still requires JWT verification or the deployed function is not using the latest settings.';
      }

      if (/non-2xx/i.test(message)) {
        return 'The resend-email function is running, but it returned an error. Open Supabase Edge Function logs for resend-email to see the exact backend error.';
      }

      return message;
    }
  }

  if (typeof error === 'string' && error.trim()) {
    return error;
  }

  return 'Failed to send email. Check the Supabase Edge Function logs for details.';
};

const saveContactTicket = async (emailData: EmailData): Promise<void> => {
  const customerEmail = emailData.from_email || emailData.reply_to || emailData.to_email;
  const customerName = emailData.from_name || emailData.to_name || 'Website Visitor';

  const { error } = await supabase.from('support_tickets').insert({
    source: 'contact_form',
    customer_name: customerName,
    customer_email: customerEmail,
    subject: emailData.subject || 'Contact Form Submission',
    message: emailData.message || '',
    status: 'open',
    priority: 'normal',
    category: 'Website Contact',
    reply_to: emailData.reply_to || customerEmail,
    raw_payload: {
      to_email: emailData.to_email,
      to_name: emailData.to_name,
      from_name: emailData.from_name,
      from_email: emailData.from_email,
      subject: emailData.subject,
      message: emailData.message,
      reply_to: emailData.reply_to,
    },
  });

  if (error) {
    console.error('Support ticket save failed:', error);
  }
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
      const message = await getReadableEmailError(error, result);
      console.error('Email function error:', { error, result, message });
      return { success: false, error: message };
    }

    return { success: true };
  } catch (error) {
    const message = await getReadableEmailError(error);
    console.error('Error invoking email function:', error);
    return { success: false, error: message };
  }
};

type AutoReply = {
  category: string;
  priority: 'normal' | 'high';
  subject: string;
  message: string;
};

const includesAny = (text: string, terms: string[]) => terms.some(term => text.includes(term));

const buildMessageAwareAutoReply = (emailData: EmailData): AutoReply => {
  const customerName = emailData.from_name || emailData.to_name || 'there';
  const subject = emailData.subject || 'Kristal Streams Support';
  const message = emailData.message || '';
  const combined = `${subject} ${message}`.toLowerCase();
  const greeting = `Hi ${customerName},`;
  const closing = `\n\nThank you,\nKristal Streams Support\n${SUPPORT_EMAIL}`;

  if (includesAny(combined, ['bill', 'billing', 'charge', 'charged', 'payment', 'invoice', 'refund', 'cancel', 'cancellation', 'subscription', 'plan'])) {
    return {
      category: 'Billing',
      priority: 'high',
      subject: `Re: ${subject}`,
      message: `${greeting}\n\nThank you for contacting Kristal Streams. I read your message and it looks like your request is related to billing, payment, refund, cancellation, or your subscription.\n\nFor your protection, we do not include private billing details in an automated email. Your request has been placed in our billing queue, and our team will review your account details and follow up with the next step.\n\nIf you were charged unexpectedly, need to update payment information, or want to change/cancel a plan, we will help you get that handled as quickly as possible. Please do not send card numbers or passwords by email.${closing}`,
    };
  }

  if (includesAny(combined, ['login', 'log in', 'sign in', 'signin', 'password', 'reset', 'account', 'access', 'locked', 'can\'t get in', 'cannot get in'])) {
    return {
      category: 'Account Access',
      priority: 'high',
      subject: `Re: ${subject}`,
      message: `${greeting}\n\nThank you for contacting Kristal Streams. I read your message and it looks like you are having trouble signing in or accessing your account.\n\nPlease try these first:\n1. Make sure you are using the same email address you registered with.\n2. Use the password reset option on the login page.\n3. Clear your browser cache or try a private/incognito browser window.\n4. If you are using a saved password, type it manually once to rule out an old saved password.\n\nIf those steps do not fix it, your message is already in our support inbox and we will review it directly. Please do not send your password by email.${closing}`,
    };
  }

  if (includesAny(combined, ['buffer', 'buffering', 'stream', 'streaming', 'freeze', 'freezing', 'lag', 'loading', 'playback', 'video', 'tv', 'firestick', 'fire stick', 'roku', 'device', 'app', 'crash'])) {
    return {
      category: 'Streaming Help',
      priority: 'normal',
      subject: `Re: ${subject}`,
      message: `${greeting}\n\nThank you for contacting Kristal Streams. I read your message and it looks like you are having a streaming, playback, app, or device issue.\n\nPlease try these quick steps:\n1. Restart the device you are watching on.\n2. Restart your router or internet modem.\n3. Close and reopen the Kristal Streams app or browser tab.\n4. If possible, test another device on the same internet connection.\n5. Make sure your internet connection is stable before trying again.\n\nYour message has also been saved in our support inbox, so our team can follow up if the issue continues.${closing}`,
    };
  }

  if (includesAny(combined, ['price', 'pricing', 'package', 'packages', 'channel', 'channels', 'trial', 'free trial', 'service', 'services', 'available'])) {
    return {
      category: 'Sales / Plan Question',
      priority: 'normal',
      subject: `Re: ${subject}`,
      message: `${greeting}\n\nThank you for contacting Kristal Streams. I read your message and it looks like you have a question about our plans, pricing, trial, channels, or service options.\n\nYour message has been received and our team will follow up with the best information for your request. If you are asking about a specific plan or package, we will help point you to the right option.${closing}`,
    };
  }

  return {
    category: 'General Support',
    priority: 'normal',
    subject: `Re: ${subject}`,
    message: `${greeting}\n\nThank you for contacting Kristal Streams. I read your message and it has been sent to our support inbox.\n\nA team member will review your request and follow up with the best next step. We usually respond within 24 hours.\n\nOriginal subject: ${subject}${closing}`,
  };
};

const sendAutomaticCustomerResponse = async (emailData: EmailData): Promise<void> => {
  const customerEmail = emailData.from_email || emailData.reply_to || emailData.to_email;
  const customerName = emailData.from_name || emailData.to_name || 'Customer';

  if (!customerEmail) return;

  const autoReply = buildMessageAwareAutoReply(emailData);

  const responseResult = await sendEmailViaEdgeFunction('support', customerEmail, {
    user_name: customerName,
    user_email: customerEmail,
    subject: autoReply.subject,
    message: autoReply.message,
    priority: autoReply.priority,
    category: `Automatic ${autoReply.category} Response`,
    reply_to: SUPPORT_EMAIL,
  });

  if (!responseResult.success) {
    console.error('Automatic message-aware customer response failed:', responseResult.error);
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

  const emailResult = await sendEmailViaEdgeFunction('contact', SUPPORT_EMAIL, data);

  if (emailResult.success) {
    await saveContactTicket(emailData);
    await sendAutomaticCustomerResponse(emailData);
  }

  return emailResult;
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