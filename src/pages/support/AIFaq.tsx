import React from 'react';
import SupportPage from './SupportPage';
const AIFaq: React.FC = () => <SupportPage title="Common AI Questions" description="Frequently asked questions about our AI chat support."
  sections={[
    { heading: "What can the AI help with?", content: "Our AI assistant can help with account issues, streaming troubleshooting, billing questions, device setup, and general questions about Kristal Streams services." },
    { heading: "Is the AI available 24/7?", content: "Yes, our AI chat support is available around the clock. For complex issues that require human assistance, you can create a support ticket." },
    { heading: "How accurate are AI responses?", content: "Our AI is trained on Kristal Streams documentation and common support scenarios. For account-specific actions, we recommend contacting our support team directly." },
  ]}
  relatedLinks={[{ title: "Start AI Chat", url: "/support/ai-chat" }, { title: "AI Capabilities", url: "/support/ai-help" }]}
/>;
export default AIFaq;
