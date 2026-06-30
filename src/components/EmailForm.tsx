import React, { useState } from 'react';
import { Send, Loader, CheckCircle, AlertCircle, Mail } from 'lucide-react';
import { sendContactEmail, validateEmail, emailRateLimit, EmailData } from '../lib/email-service';

interface EmailFormProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  template?: 'contact' | 'support' | 'newsletter';
  title?: string;
  description?: string;
  showNameField?: boolean;
  showSubjectField?: boolean;
  placeholder?: {
    name?: string;
    email?: string;
    subject?: string;
    message?: string;
  };
}

const EmailForm: React.FC<EmailFormProps> = ({
  onSuccess,
  onError,
  template = 'contact',
  title = 'Send us a message',
  description = 'We\'ll get back to you as soon as possible.',
  showNameField = true,
  showSubjectField = true,
  placeholder = {}
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (status !== 'idle') {
      setStatus('idle');
      setErrorMessage('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus('idle');
    setErrorMessage('');

    try {
      if (!validateEmail(formData.email)) {
        throw new Error('Please enter a valid email address');
      }

      if (showNameField && !formData.name.trim()) {
        throw new Error('Please enter your name');
      }

      if (showSubjectField && !formData.subject.trim()) {
        throw new Error('Please enter a subject');
      }

      if (!formData.message.trim()) {
        throw new Error('Please enter a message');
      }

      const identifier = formData.email;
      if (!emailRateLimit.canSend(identifier)) {
        const remainingTime = Math.ceil(emailRateLimit.getRemainingTime(identifier) / 1000);
        throw new Error(`Too many attempts. Please wait ${remainingTime} seconds before trying again.`);
      }

      const emailData: EmailData = {
        to_email: formData.email,
        from_name: formData.name || 'Website User',
        from_email: formData.email,
        subject: formData.subject || 'Contact Form Submission',
        message: formData.message,
        reply_to: formData.email
      };

      const success = await sendContactEmail(emailData);

      if (success) {
        setStatus('success');
        setFormData({ name: '', email: '', subject: '', message: '' });
        onSuccess?.();
      } else {
        throw new Error('Failed to send email. Please try again later.');
      }

    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      setStatus('error');
      setErrorMessage(message);
      onError?.(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-dark-100 rounded-xl p-8 border border-gray-800">
      <div className="flex items-center mb-6">
        <Mail className="text-primary w-6 h-6 mr-3" />
        <div>
          <h2 className="text-xl font-semibold text-white">{title}</h2>
          <p className="text-gray-400 text-sm">{description}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {showNameField && (
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
              Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder={placeholder.name || 'Your full name'}
              className="w-full bg-dark-200 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-colors duration-200"
              required
            />
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
            Email Address *
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder={placeholder.email || 'your.email@example.com'}
            className="w-full bg-dark-200 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-colors duration-200"
            required
          />
        </div>

        {showSubjectField && (
          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-gray-300 mb-2">
              Subject *
            </label>
            <input
              type="text"
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleInputChange}
              placeholder={placeholder.subject || 'What is this about?'}
              className="w-full bg-dark-200 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-colors duration-200"
              required
            />
          </div>
        )}

        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2">
            Message *
          </label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleInputChange}
            placeholder={placeholder.message || 'Tell us how we can help you...'}
            rows={6}
            className="w-full bg-dark-200 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-colors duration-200 resize-none"
            required
          />
        </div>

        {status === 'success' && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 flex items-start">
            <CheckCircle className="text-green-500 w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-green-500 font-medium">Message sent successfully!</p>
              <p className="text-green-400 text-sm mt-1">We'll get back to you within 24 hours.</p>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start">
            <AlertCircle className="text-red-500 w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-500 font-medium">Failed to send message</p>
              <p className="text-red-400 text-sm mt-1">{errorMessage}</p>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary hover:bg-red-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center"
        >
          {loading ? (
            <>
              <Loader className="w-5 h-5 mr-2 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="w-5 h-5 mr-2" />
              Send Message
            </>
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-gray-500 text-sm">
          Our support team will respond within 24 hours at{' '}
          <span className="text-primary font-medium">
            support@kristalstream.com
          </span>
        </p>
      </div>
    </div>
  );
};

export default EmailForm;