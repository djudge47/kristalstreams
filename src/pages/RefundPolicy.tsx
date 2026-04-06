import React from 'react';
import { useEffect } from 'react';
import { Shield, Clock, CreditCard, AlertCircle, CheckCircle, Mail } from 'lucide-react';

const RefundPolicy: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen py-32 bg-dark-300">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center mb-8">
            <Shield className="text-primary w-8 h-8 mr-4" />
            <h1 className="text-3xl font-bold text-white">Refund Policy</h1>
          </div>
          
          <div className="bg-dark-100 rounded-xl p-8 border border-gray-800 mb-8">
            <div className="flex items-start mb-6">
              <CheckCircle className="text-green-500 w-6 h-6 mr-3 mt-1" />
              <div>
                <h2 className="text-xl font-semibold text-white mb-2">Our Commitment to You</h2>
                <p className="text-gray-300">
                  At Kristal Streams, we stand behind our service quality. We offer a fair and transparent 
                  refund policy to ensure your satisfaction with our streaming services.
                </p>
              </div>
            </div>
          </div>

          <div className="prose prose-invert max-w-none space-y-8">
            <section className="bg-dark-100 rounded-xl p-8 border border-gray-800">
              <div className="flex items-center mb-4">
                <Clock className="text-primary w-6 h-6 mr-3" />
                <h2 className="text-2xl font-semibold text-white">Free Trial Period</h2>
              </div>
              <div className="space-y-4 text-gray-300">
                <p>
                  <strong className="text-white">36-Hour Free Trial:</strong> All new customers receive a 36-hour free trial 
                  to test our service quality and compatibility with their devices.
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>No credit card required for trial activation</li>
                  <li>Full access to all Premium plan features</li>
                  <li>Cancel anytime during trial period with no charges</li>
                  <li>Automatic conversion to paid plan after trial expires</li>
                </ul>
              </div>
            </section>

            <section className="bg-dark-100 rounded-xl p-8 border border-gray-800">
              <div className="flex items-center mb-4">
                <CreditCard className="text-primary w-6 h-6 mr-3" />
                <h2 className="text-2xl font-semibold text-white">Refund Eligibility</h2>
              </div>
              <div className="space-y-6 text-gray-300">
                <div>
                  <h3 className="text-lg font-medium text-white mb-3">Eligible for Full Refund:</h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><strong>Service Outages:</strong> Extended service interruptions lasting more than 24 hours</li>
                    <li><strong>Technical Issues:</strong> Persistent streaming problems that cannot be resolved by our support team</li>
                    <li><strong>Billing Errors:</strong> Incorrect charges or duplicate payments</li>
                    <li><strong>Service Cancellation:</strong> Requests made within 7 days of initial subscription</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-white mb-3">Partial Refund Eligibility:</h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><strong>Mid-cycle Cancellation:</strong> Prorated refund for unused portion of subscription period</li>
                    <li><strong>Downgrade Requests:</strong> Credit applied to account for plan differences</li>
                    <li><strong>Service Disruptions:</strong> Credits for documented service interruptions</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="bg-dark-100 rounded-xl p-8 border border-gray-800">
              <div className="flex items-center mb-4">
                <AlertCircle className="text-yellow-500 w-6 h-6 mr-3" />
                <h2 className="text-2xl font-semibold text-white">Non-Refundable Situations</h2>
              </div>
              <div className="space-y-4 text-gray-300">
                <p>Refunds will not be provided in the following circumstances:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Internet Connectivity Issues:</strong> Problems related to customer's internet service provider</li>
                  <li><strong>Device Compatibility:</strong> Issues with unsupported or outdated devices</li>
                  <li><strong>User Error:</strong> Incorrect setup or configuration by the customer</li>
                  <li><strong>Content Preferences:</strong> Dissatisfaction with available channel lineup</li>
                  <li><strong>Geographic Restrictions:</strong> Content limitations based on location</li>
                  <li><strong>Violation of Terms:</strong> Account suspension due to terms of service violations</li>
                  <li><strong>Completed Service Period:</strong> Requests made after subscription period has ended</li>
                </ul>
              </div>
            </section>

            <section className="bg-dark-100 rounded-xl p-8 border border-gray-800">
              <h2 className="text-2xl font-semibold text-white mb-4">Refund Process</h2>
              <div className="space-y-6 text-gray-300">
                <div>
                  <h3 className="text-lg font-medium text-white mb-3">How to Request a Refund:</h3>
                  <ol className="list-decimal pl-6 space-y-2">
                    <li>Contact our support team via email or support ticket</li>
                    <li>Provide your account information and reason for refund request</li>
                    <li>Allow our team to attempt to resolve any technical issues</li>
                    <li>If resolution is not possible, refund will be processed</li>
                  </ol>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-white mb-3">Processing Timeline:</h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><strong>Review Period:</strong> 1-3 business days for request evaluation</li>
                    <li><strong>Approval Notification:</strong> Email confirmation of refund approval</li>
                    <li><strong>Processing Time:</strong> 5-10 business days for refund to appear</li>
                    <li><strong>Payment Method:</strong> Refunds issued to original payment method</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="bg-dark-100 rounded-xl p-8 border border-gray-800">
              <h2 className="text-2xl font-semibold text-white mb-4">Special Circumstances</h2>
              <div className="space-y-4 text-gray-300">
                <div>
                  <h3 className="text-lg font-medium text-white mb-2">Annual Subscriptions</h3>
                  <p>
                    Annual subscribers may receive prorated refunds for the unused portion of their subscription 
                    if cancellation occurs within the first 30 days of service.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-white mb-2">Gift Subscriptions</h3>
                  <p>
                    Gift subscriptions follow the same refund policy. Refunds will be issued to the original purchaser 
                    unless otherwise specified.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-white mb-2">Promotional Offers</h3>
                  <p>
                    Subscriptions purchased with promotional discounts are eligible for refunds based on the 
                    actual amount paid, not the regular subscription price.
                  </p>
                </div>
              </div>
            </section>

            <section className="bg-dark-100 rounded-xl p-8 border border-gray-800">
              <div className="flex items-center mb-4">
                <Mail className="text-primary w-6 h-6 mr-3" />
                <h2 className="text-2xl font-semibold text-white">Contact Information</h2>
              </div>
              <div className="space-y-4 text-gray-300">
                <p>
                  For refund requests or questions about our refund policy, please contact our support team:
                </p>
                <div className="bg-dark-200 rounded-lg p-4">
                  <ul className="space-y-2">
                    <li><strong className="text-white">Email:</strong> support@kristalstreams.com</li>
                    <li><strong className="text-white">Phone:</strong> 1-800-KRISTAL (1-800-574-7825)</li>
                    <li><strong className="text-white">Support Hours:</strong> 24/7 Customer Support</li>
                    <li><strong className="text-white">Response Time:</strong> Within 24 hours</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="bg-dark-100 rounded-xl p-8 border border-gray-800">
              <h2 className="text-2xl font-semibold text-white mb-4">Policy Updates</h2>
              <div className="text-gray-300 space-y-4">
                <p>
                  Kristal Streams reserves the right to modify this refund policy at any time. Changes will be 
                  effective immediately upon posting on our website. Continued use of our services after policy 
                  changes constitutes acceptance of the updated terms.
                </p>
                <p>
                  <strong className="text-white">Last Updated:</strong> {new Date().toLocaleDateString()}
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RefundPolicy;