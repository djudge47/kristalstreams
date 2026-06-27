import React from 'react';
import SupportPage from './SupportPage';
const ChatHistory: React.FC = () => <SupportPage title="Chat History" description="View and manage your previous AI chat conversations."
  sections={[
    { heading: "Accessing Chat History", content: "Your previous AI chat conversations are stored for reference. You can review past solutions and recommendations." },
    { heading: "Managing Your History", content: "Chat history is stored locally in your browser. Clearing your browser data will remove your chat history." },
  ]}
  relatedLinks={[{ title: "Start AI Chat", url: "/support/ai-chat" }, { title: "Common Questions", url: "/support/ai-faq" }]}
/>;
export default ChatHistory;
