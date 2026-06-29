import React from 'react';
import { useEffect } from 'react';
import { Cookie, Shield, Settings, Info, CheckCircle, AlertCircle } from 'lucide-react';

const CookiePolicy: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen py-12 bg-dark-300">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center mb-8">
            <Cookie className="text-primary w-8 h-8 mr-4" />
            <h1 className="text-3xl font-bold text-white">Cookie Policy</h1>
          </div>
          
          <div className="bg-dark-100 rounded-xl p-8 border border-gray-800 mb-8">
            <div className="flex items-start mb-6">
              <Info className="text-blue-500 w-6 h-6 mr-3 mt-1" />
              <div>
                <h2 className="text-xl font-semibold text-white mb-2">About This Policy</h2>
                <p className="text-gray-300">
                  This Cookie Policy explains how Kristal Streams uses cookies and similar technologies 
                  to provide, improve, and protect our services. By using our website and services, 
                  you consent to our use of cookies as described in this policy.
                </p>
              </div>
            </div>
          </div>

          <div className="prose prose-invert max-w-none space-y-8">
            <section className="bg-dark-100 rounded-xl p-8 border border-gray-800">
              <h2 className="text-2xl font-semibold text-white mb-4">What Are Cookies?</h2>
              <div className="space-y-4 text-gray-300">
                <p>
                  Cookies are small text files that are stored on your device (computer, tablet, or mobile) 
                  when you visit a website. They help websites remember information about your visit, 
                  such as your preferred language and other settings.
                </p>
                <p>
                  Cookies make your browsing experience more efficient and can help us provide you with 
                  a more personalized experience. They also help us understand how our website is being 
                  used so we can improve it.
                </p>
              </div>
            </section>

            <section className="bg-dark-100 rounded-xl p-8 border border-gray-800">
              <h2 className="text-2xl font-semibold text-white mb-4">Types of Cookies We Use</h2>
              <div className="space-y-6 text-gray-300">
                <div className="border-l-4 border-green-500 pl-6">
                  <h3 className="text-lg font-medium text-white mb-2">Essential Cookies</h3>
                  <p className="mb-3">
                    These cookies are necessary for the website to function properly. They enable core 
                    functionality such as security, network management, and accessibility.
                  </p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Authentication and login status</li>
                    <li>Security and fraud prevention</li>
                    <li>Load balancing and performance</li>
                    <li>Basic website functionality</li>
                  </ul>
                </div>

                <div className="border-l-4 border-blue-500 pl-6">
                  <h3 className="text-lg font-medium text-white mb-2">Performance Cookies</h3>
                  <p className="mb-3">
                    These cookies help us understand how visitors interact with our website by collecting 
                    and reporting information anonymously.
                  </p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Page load times and performance metrics</li>
                    <li>Error tracking and debugging</li>
                    <li>Usage statistics and analytics</li>
                    <li>A/B testing and optimization</li>
                  </ul>
                </div>

                <div className="border-l-4 border-yellow-500 pl-6">
                  <h3 className="text-lg font-medium text-white mb-2">Functional Cookies</h3>
                  <p className="mb-3">
                    These cookies enable enhanced functionality and personalization, such as remembering 
                    your preferences and settings.
                  </p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Language and region preferences</li>
                    <li>Video quality settings</li>
                    <li>Theme and display preferences</li>
                    <li>Recently viewed content</li>
                  </ul>
                </div>

                <div className="border-l-4 border-purple-500 pl-6">
                  <h3 className="text-lg font-medium text-white mb-2">Marketing Cookies</h3>
                  <p className="mb-3">
                    These cookies are used to deliver advertisements that are relevant to you and your interests.
                  </p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Targeted advertising</li>
                    <li>Social media integration</li>
                    <li>Marketing campaign tracking</li>
                    <li>Cross-site behavioral tracking</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="bg-dark-100 rounded-xl p-8 border border-gray-800">
              <h2 className="text-2xl font-semibold text-white mb-4">Third-Party Cookies</h2>
              <div className="space-y-4 text-gray-300">
                <p>
                  We may also use third-party cookies from trusted partners to enhance your experience:
                </p>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium text-white mb-2">Analytics Services</h3>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>Google Analytics</li>
                      <li>Hotjar (user behavior)</li>
                      <li>Mixpanel (event tracking)</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-white mb-2">Support Services</h3>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>Customer support chat</li>
                      <li>Help desk systems</li>
                      <li>Feedback collection</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-white mb-2">Payment Processing</h3>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>Stripe payment processing</li>
                      <li>PayPal integration</li>
                      <li>Fraud prevention</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-white mb-2">Content Delivery</h3>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>CDN optimization</li>
                      <li>Video streaming</li>
                      <li>Image optimization</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-dark-100 rounded-xl p-8 border border-gray-800">
              <div className="flex items-center mb-4">
                <Settings className="text-primary w-6 h-6 mr-3" />
                <h2 className="text-2xl font-semibold text-white">Managing Your Cookie Preferences</h2>
              </div>
              <div className="space-y-6 text-gray-300">
                <div>
                  <h3 className="text-lg font-medium text-white mb-3">Browser Settings</h3>
                  <p className="mb-4">
                    You can control and manage cookies through your browser settings. Here's how to manage 
                    cookies in popular browsers:
                  </p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-dark-200 rounded-lg p-4">
                      <h4 className="font-medium text-white mb-2">Chrome</h4>
                      <p className="text-sm">Settings → Privacy and Security → Cookies and other site data</p>
                    </div>
                    <div className="bg-dark-200 rounded-lg p-4">
                      <h4 className="font-medium text-white mb-2">Firefox</h4>
                      <p className="text-sm">Options → Privacy & Security → Cookies and Site Data</p>
                    </div>
                    <div className="bg-dark-200 rounded-lg p-4">
                      <h4 className="font-medium text-white mb-2">Safari</h4>
                      <p className="text-sm">Preferences → Privacy → Manage Website Data</p>
                    </div>
                    <div className="bg-dark-200 rounded-lg p-4">
                      <h4 className="font-medium text-white mb-2">Edge</h4>
                      <p className="text-sm">Settings → Cookies and site permissions → Cookies and site data</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-white mb-3">Cookie Consent Management</h3>
                  <p className="mb-4">
                    When you first visit our website, you'll see a cookie consent banner that allows you to:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Accept all cookies for the full website experience</li>
                    <li>Reject non-essential cookies while keeping essential ones</li>
                    <li>Customize your preferences for different cookie categories</li>
                    <li>Change your preferences at any time through our cookie settings</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="bg-dark-100 rounded-xl p-8 border border-gray-800">
              <h2 className="text-2xl font-semibold text-white mb-4">Impact of Disabling Cookies</h2>
              <div className="space-y-4 text-gray-300">
                <div className="flex items-start">
                  <CheckCircle className="text-green-500 w-5 h-5 mr-3 mt-1" />
                  <div>
                    <h3 className="font-medium text-white mb-1">Essential Cookies</h3>
                    <p className="text-sm">Cannot be disabled as they are necessary for basic website functionality.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <AlertCircle className="text-yellow-500 w-5 h-5 mr-3 mt-1" />
                  <div>
                    <h3 className="font-medium text-white mb-1">Performance Cookies</h3>
                    <p className="text-sm">Disabling may affect our ability to improve website performance and user experience.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <AlertCircle className="text-orange-500 w-5 h-5 mr-3 mt-1" />
                  <div>
                    <h3 className="font-medium text-white mb-1">Functional Cookies</h3>
                    <p className="text-sm">May result in loss of personalized features and preferences.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <AlertCircle className="text-red-500 w-5 h-5 mr-3 mt-1" />
                  <div>
                    <h3 className="font-medium text-white mb-1">Marketing Cookies</h3>
                    <p className="text-sm">You may see less relevant advertisements and promotional content.</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-dark-100 rounded-xl p-8 border border-gray-800">
              <h2 className="text-2xl font-semibold text-white mb-4">Data Retention</h2>
              <div className="space-y-4 text-gray-300">
                <p>
                  Different types of cookies have different retention periods:
                </p>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium text-white mb-2">Session Cookies</h3>
                    <p>Deleted when you close your browser session</p>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-white mb-2">Persistent Cookies</h3>
                    <p>Remain on your device for a set period (typically 1-24 months)</p>
                  </div>
                </div>
                <p>
                  You can view and delete individual cookies through your browser's developer tools or 
                  privacy settings at any time.
                </p>
              </div>
            </section>

            <section className="bg-dark-100 rounded-xl p-8 border border-gray-800">
              <h2 className="text-2xl font-semibold text-white mb-4">Contact Information</h2>
              <div className="space-y-4 text-gray-300">
                <p>
                  If you have any questions about our use of cookies or this Cookie Policy, please contact us:
                </p>
                <div className="bg-dark-200 rounded-lg p-4">
                  <ul className="space-y-2">
                    <li><strong className="text-white">Email:</strong> privacy@kristalstreams.com</li>
                    <li><strong className="text-white">Support:</strong> support@kristalstreams.com</li>
                    <li><strong className="text-white">Phone:</strong> 1-800-KRISTAL (1-800-574-7825)</li>
                    <li><strong className="text-white">Address:</strong> Kristal Streams Privacy Team, [Your Address]</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="bg-dark-100 rounded-xl p-8 border border-gray-800">
              <h2 className="text-2xl font-semibold text-white mb-4">Policy Updates</h2>
              <div className="text-gray-300 space-y-4">
                <p>
                  We may update this Cookie Policy from time to time to reflect changes in our practices 
                  or for other operational, legal, or regulatory reasons. We will notify you of any 
                  material changes by posting the updated policy on our website.
                </p>
                <p>
                  <strong className="text-white">Last Updated:</strong> {new Date().toLocaleDateString()}
                </p>
                <p>
                  <strong className="text-white">Effective Date:</strong> {new Date().toLocaleDateString()}
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookiePolicy;