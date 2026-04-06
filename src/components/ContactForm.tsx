import React from 'react';
import EmailForm from './EmailForm';

interface ContactFormProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

const ContactForm: React.FC<ContactFormProps> = ({ onSuccess, onError }) => {

  return (
    <EmailForm
      template="contact"
      title="Contact Support"
      description="Send us a message and we'll get back to you within 24 hours."
      onSuccess={onSuccess}
      onError={onError}
      placeholder={{
        name: 'Your full name',
        email: 'your.email@example.com',
        subject: 'How can we help you?',
        message: 'Please describe your question or issue in detail...'
      }}
    />
  );
};

export default ContactForm;