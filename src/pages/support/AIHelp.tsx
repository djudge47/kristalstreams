import React from 'react';
import SupportPage from './SupportPage';
const AIHelp: React.FC = () => <SupportPage title="AI Capabilities" description="Learn what our AI assistant can do for you."
  sections={[
    { heading: "Troubleshooting", content: "The AI can diagnose streaming issues, buffering problems, audio/video sync issues, and app crashes with step-by-step solutions." },
    { heading: "Account Help", content: "Get help with login issues, password resets, subscription management, and billing questions." },
    { heading: "Device Setup", content: "The AI provides setup instructions for Smart TVs, mobile devices, computers, and gaming consoles." },
    { heading: "Service Information", content: "Ask about plans, pricing, features, channel availability, and service coverage." },
  ]}
  relatedLinks={[{ title: "Start AI Chat", url: "/support/ai-chat" }, { title: "FAQ", url: "/support/faq" }]}
/>;
export default AIHelp;
