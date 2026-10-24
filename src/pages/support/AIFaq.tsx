import SupportPage from './SupportPage';

export default function AIFaq() {
  return <SupportPage title="Common AI Questions" description="What to expect from general automated chat."
    sections={[
      { heading: 'What can I ask?', content: 'Ask general setup or troubleshooting questions. The assistant can suggest checks and relevant help pages. It does not verify your private account records, payments or current service availability.' },
      { heading: 'Can I return to an old conversation?', content: 'Saved chat history is not available. The current conversation is displayed only on the chat page and is cleared when you leave, reload, use Clear This Chat or change accounts. For a saved support conversation, use a support ticket.' },
      { heading: 'What happens if a reply fails?', content: 'The page shows an error rather than inventing a reply or claiming a message was saved. A submitted request may still be processed even if its result is not received. No automatic retry is made; use the help guides or support tickets if chat is unavailable.' },
      { heading: 'Can chat fix my account?', content: 'Chat offers general guidance and can be wrong. Support must confirm account-specific details and any requested action. Never put passwords, playback URLs or payment details in chat.' },
    ]}
    relatedLinks={[{ title: 'Start General Chat', url: '/support/ai-chat' }, { title: 'About Chat History', url: '/support/chat-history' }, { title: 'Open a Support Ticket', url: '/client/support/new' }]}
  />;
}
