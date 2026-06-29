import React from 'react';
import { useEffect } from 'react';

const Privacy: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen py-12 bg-dark-300">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-8">Privacy Policy</h1>
          
          <div className="prose prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Introduction</h2>
              <p className="text-gray-300">
                At Kristal Streams, we take your privacy seriously. This Privacy Policy explains how we collect, use, 
                disclose, and safeguard your information when you use our streaming service. Please read this privacy 
                policy carefully. By using our service, you consent to the practices described in this policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Information We Collect</h2>
              <div className="space-y-4">
                <h3 className="text-xl font-medium text-white">Personal Information</h3>
                <ul className="list-disc pl-6 text-gray-300 space-y-2">
                  <li>Email address</li>
                  <li>Full name</li>
                  <li>Billing information</li>
                  <li>Account preferences</li>
                  <li>Viewing history</li>
                </ul>

                <h3 className="text-xl font-medium text-white">Usage Information</h3>
                <ul className="list-disc pl-6 text-gray-300 space-y-2">
                  <li>Device information (type, model, operating system)</li>
                  <li>IP address</li>
                  <li>Browser type</li>
                  <li>Viewing preferences and habits</li>
                  <li>Time spent watching content</li>
                  <li>Search queries</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">How We Use Your Information</h2>
              <ul className="list-disc pl-6 text-gray-300 space-y-2">
                <li>To provide and maintain our service</li>
                <li>To process your payments and subscriptions</li>
                <li>To personalize your streaming experience</li>
                <li>To communicate with you about service updates</li>
                <li>To prevent fraud and abuse</li>
                <li>To comply with legal obligations</li>
                <li>To improve our service based on usage patterns</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Information Sharing</h2>
              <p className="text-gray-300">
                We do not sell, trade, or rent your personal information to third parties. We may share your 
                information in the following circumstances:
              </p>
              <ul className="list-disc pl-6 text-gray-300 space-y-2 mt-4">
                <li>With service providers who assist in operating our platform</li>
                <li>To comply with legal requirements</li>
                <li>To protect our rights and safety</li>
                <li>With your consent</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Data Security</h2>
              <p className="text-gray-300">
                We implement appropriate technical and organizational measures to protect your personal information, 
                including encryption, secure servers, and regular security assessments. However, no method of 
                transmission over the Internet is 100% secure.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Your Rights</h2>
              <ul className="list-disc pl-6 text-gray-300 space-y-2">
                <li>Access your personal information</li>
                <li>Correct inaccurate information</li>
                <li>Request deletion of your information</li>
                <li>Object to processing of your information</li>
                <li>Withdraw consent</li>
                <li>Data portability</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Cookies and Tracking</h2>
              <p className="text-gray-300">
                We use cookies and similar tracking technologies to enhance your experience. You can control cookie 
                settings through your browser preferences.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Children's Privacy</h2>
              <p className="text-gray-300">
                Our service is not intended for children under 13. We do not knowingly collect personal information 
                from children under 13.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Changes to Privacy Policy</h2>
              <p className="text-gray-300">
                We may update this privacy policy from time to time. We will notify you of any changes by posting 
                the new policy on this page and updating the effective date.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Contact Us</h2>
              <p className="text-gray-300">
                If you have questions about this Privacy Policy, please{' '}
                <a href="/support" className="text-primary hover:text-primary/80">
                  contact our support team
                </a>
                {' '}or email us at{' '}
                <span className="text-primary">privacy@kristalstreams.com</span>
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

export default Privacy;