import React, { useState, memo, useCallback } from 'react';
import { Mail, Send, Loader, CheckCircle, AlertCircle } from 'lucide-react';
import { sendNewsletterConfirmation, validateEmail, emailRateLimit } from '../lib/email-service';

interface NewsletterSignupProps {
  title?: string;
  description?: string;
  placeholder?: string;
  className?: string;
  compact?: boolean;
}

const NewsletterSignup: React.FC<NewsletterSignupProps> = memo(({
  title = 'Stay Updated',
  description = 'Get the latest news and updates from Kristal Streams',
  placeholder = 'Enter your email address',
  className = '',
  compact = false
}) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus('idle');
    setErrorMessage('');

    try {
      // Validation
      if (!validateEmail(email)) {
        throw new Error('Please enter a valid email address');
      }

      // Rate limiting
      if (!emailRateLimit.canSend(email)) {
        const remainingTime = Math.ceil(emailRateLimit.getRemainingTime(email) / 1000);
        throw new Error(`Too many attempts. Please wait ${remainingTime} seconds.`);
      }

      // Send confirmation email
      const success = await sendNewsletterConfirmation({ email, name: name || 'Subscriber' });

      if (success) {
        setStatus('success');
        setEmail('');
        setName('');
      } else {
        throw new Error('Failed to subscribe. Please try again later.');
      }

    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      setStatus('error');
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  }, [email, name]);

  if (compact) {
    return (
      <div className={`${className}`}>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={placeholder}
            className="flex-1 bg-dark-200 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-primary"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-primary hover:bg-red-700 disabled:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center"
          >
            {loading ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </form>
        
        {status === 'success' && (
          <p className="text-green-500 text-sm mt-2">Successfully subscribed!</p>
        )}
        
        {status === 'error' && (
          <p className="text-red-500 text-sm mt-2">{errorMessage}</p>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-dark-100 rounded-xl p-8 border border-gray-800 ${className}`}>
      <div className="flex items-center mb-6">
        <Mail className="text-primary w-6 h-6 mr-3" />
        <div>
          <h3 className="text-xl font-semibold text-white">{title}</h3>
          <p className="text-gray-400 text-sm">{description}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name (optional)"
            className="w-full bg-dark-200 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-colors duration-200"
          />
        </div>

        <div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-dark-200 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-colors duration-200"
            required
          />
        </div>

        {status === 'success' && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 flex items-start">
            <CheckCircle className="text-green-500 w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-green-500 font-medium">Successfully subscribed!</p>
              <p className="text-green-400 text-sm mt-1">Check your email for confirmation.</p>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start">
            <AlertCircle className="text-red-500 w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-500 font-medium">Subscription failed</p>
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
              Subscribing...
            </>
          ) : (
            <>
              <Send className="w-5 h-5 mr-2" />
              Subscribe to Newsletter
            </>
          )}
        </button>
      </form>

      <p className="text-gray-500 text-xs mt-4 text-center">
        We respect your privacy. Unsubscribe at any time.
      </p>
    </div>
  );
});

NewsletterSignup.displayName = 'NewsletterSignup';

export default NewsletterSignup;