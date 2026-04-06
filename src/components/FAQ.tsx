import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface FAQItem {
  question: string;
  answer: string;
}

const faqItems: FAQItem[] = [
  {
    question: 'What is Kristal Streams?',
    answer: 'Kristal Streams is a premium streaming service that provides access to thousands of live TV channels, movies, and TV shows from around the world. Our service offers high-quality streaming, multiple device support, and a vast selection of content.'
  },
  {
    question: 'What devices can I use to watch?',
    answer: 'You can watch Kristal Streams on multiple devices including Smart TVs, smartphones, tablets, computers, and streaming devices like Amazon Fire Stick and Roku. The number of simultaneous connections depends on your subscription plan.'
  },
  {
    question: 'Do you offer a free trial?',
    answer: 'Yes, we offer a 36-hour free trial so you can experience our service before subscribing. During the trial, you\'ll have access to all features available in our Premium plan.'
  },
  {
    question: 'What channels are included?',
    answer: 'We offer thousands of channels including sports, movies, news, entertainment, and international channels. The exact channel lineup depends on your subscription plan, with Premium and Ultimate plans offering the most comprehensive selection.'
  },
  {
    question: 'What\'s the streaming quality like?',
    answer: 'We offer HD and 4K quality streams (where available) with minimal buffering. The actual streaming quality will depend on your internet connection speed and the source quality of the content.'
  },
  {
    question: 'Do you offer EPG (TV Guide)?',
    answer: 'Yes, we provide a comprehensive Electronic Program Guide (EPG) for most channels. This allows you to see what\'s currently playing and what\'s coming up next, making it easy to plan your viewing.'
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards and PayPal. All transactions are secure and encrypted for your protection.'
  },
  {
    question: 'How many devices can I watch on simultaneously?',
    answer: 'The number of simultaneous connections depends on your subscription plan. Basic plans start with 1 connection, while Premium and Ultimate plans allow up to 4 concurrent streams.'
  },
  {
    question: 'Can I cancel my subscription anytime?',
    answer: 'Yes, you can cancel your subscription at any time. There are no long-term contracts or cancellation fees. Your service will continue until the end of your current billing period.'
  },
  {
    question: 'Is my connection secure?',
    answer: 'Yes, we use industry-standard encryption to protect your data and streaming content. All connections are secured using SSL/TLS encryption.'
  }
];

const FAQ: React.FC = () => {
  const navigate = useNavigate();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleQuestion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const handleContactSupport = () => {
    navigate('/support', { state: { scrollToContact: true } });
  };

  return (
    <section id="faq" className="py-20 bg-dark-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gradient bg-gradient-to-r from-white to-gray-300 mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Find answers to common questions about our streaming service.
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          {faqItems.map((item, index) => (
            <div key={index} className="mb-4">
              <button
                onClick={() => toggleQuestion(index)}
                className={`w-full flex justify-between items-center p-5 text-left rounded-lg transition-colors duration-200 ${
                  openIndex === index
                    ? 'bg-primary text-white'
                    : 'bg-dark-100 text-gray-300 hover:bg-dark-300'
                }`}
              >
                <span className="text-lg font-medium">{item.question}</span>
                {openIndex === index ? (
                  <ChevronUp className="w-5 h-5 flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 flex-shrink-0" />
                )}
              </button>
              {openIndex === index && (
                <div className="bg-dark-100 p-5 rounded-b-lg border-t border-gray-800 animate-fadeIn">
                  <p className="text-gray-400 leading-relaxed">{item.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-400 mb-6">Still have questions? We're here to help.</p>
          <button 
            onClick={handleContactSupport}
            className="bg-primary hover:bg-red-700 text-white px-6 py-3 rounded-md text-lg font-medium transition-colors duration-200"
          >
            Contact Support
          </button>
        </div>
      </div>
    </section>
  );
};

export default FAQ;