import React from 'react';
import SupportPage from './SupportPage';
const FAQ: React.FC = () => <SupportPage title="Frequently Asked Questions" description="Quick answers to the most common questions about Kristal Streams."
  sections={[
    { heading: "What is Kristal Streams?", content: "Kristal Streams is a premium IPTV streaming service offering 18,000+ live TV channels, movies, and shows in HD and 4K quality." },
    { heading: "How much does it cost?", content: "We offer multiple plans starting from $20/month for a single connection. Visit our pricing page for full details on all plans." },
    { heading: "What devices are supported?", content: "Kristal Streams works on Smart TVs, Android/iOS phones and tablets, computers (Windows/Mac), Amazon Fire TV, Roku, and gaming consoles." },
    { heading: "Do you offer a free trial?", content: "Yes! We offer a 36-hour free trial with no credit card required. You can access all features during the trial period." },
    { heading: "How do I cancel my subscription?", content: "You can cancel anytime from your account settings. Go to Client Portal > Subscription > Cancel Plan." },
    { heading: "What internet speed do I need?", content: "We recommend at least 10 Mbps for HD streaming and 25 Mbps for 4K content. Use our speed test tool to check your connection." },
  ]}
  relatedLinks={[{ title: "Pricing", url: "/pricing" }, { title: "Free Trial", url: "/free-trial" }, { title: "Speed Test", url: "/support/speed-test" }]}
/>;
export default FAQ;
