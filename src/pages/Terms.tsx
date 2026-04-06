import React from 'react';
import { useEffect } from 'react';

const Terms: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen py-32 bg-dark-300">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-8">Terms of Service</h1>
          
          <div className="prose prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-300">
                By accessing and using Kristal Streams, you accept and agree to be bound by the terms and provisions 
                of this agreement. If you do not agree to these terms, do not use our service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">2. Subscription and Billing</h2>
              <ul className="list-disc pl-6 text-gray-300 space-y-2">
                <li>Subscription fees are billed in advance on a monthly or annual basis</li>
                <li>You may cancel your subscription at any time</li>
                <li>No refunds for partial month periods</li>
                <li>Price changes will be notified in advance</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">3. Account Responsibilities</h2>
              <ul className="list-disc pl-6 text-gray-300 space-y-2">
                <li>Maintain accurate account information</li>
                <li>Keep login credentials secure</li>
                <li>Report unauthorized access immediately</li>
                <li>One account per person unless explicitly permitted</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">4. Content Usage Rights</h2>
              <p className="text-gray-300">
                All content provided through Kristal Streams is protected by copyright and other intellectual 
                property laws. Users may not download, copy, or redistribute content without authorization.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">5. Service Availability</h2>
              <p className="text-gray-300">
                While we strive for 100% uptime, we do not guarantee uninterrupted access to our service. 
                Maintenance, updates, and technical issues may cause temporary service interruptions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">6. Prohibited Activities</h2>
              <ul className="list-disc pl-6 text-gray-300 space-y-2">
                <li>Sharing account credentials</li>
                <li>Using VPNs or proxies to circumvent geographic restrictions</li>
                <li>Recording or redistributing content</li>
                <li>Attempting to breach security measures</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">7. Termination</h2>
              <p className="text-gray-300">
                We reserve the right to suspend or terminate accounts that violate these terms or engage in 
                fraudulent activity. Users may terminate their account at any time.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">8. Changes to Terms</h2>
              <p className="text-gray-300">
                We may modify these terms at any time. Continued use of the service after changes constitutes 
                acceptance of the modified terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">9. Contact Information</h2>
              <p className="text-gray-300">
                For questions about these terms, please{' '}
                <a href="/support" className="text-primary hover:text-primary/80">
                  contact our support team
                </a>
                {' '}or email us at{' '}
                <span className="text-primary">legal@kristalstreams.com</span>
              </p>
            </section>

            <footer className="text-gray-400 text-sm">
              Last updated: {new Date().toLocaleDateString()}
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Terms;