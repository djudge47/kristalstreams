import SupportPage from './SupportPage';

export default function ChatHistory() {
  return <SupportPage title="Chat History" description="How the current chat is handled and where to keep a support record."
    sections={[
      { heading: 'Saved chat history is unavailable', content: 'The chat page does not provide a saved conversation archive. Leaving or reloading that page clears the conversation displayed there. It is not restored from browser storage or your website account.' },
      { heading: 'Submitted messages', content: 'Questions and recent confirmed conversation context are sent to the chat service to produce a reply. Clearing the page does not undo a submitted request or promise deletion from the service. Keep passwords, playback links and payment details out of chat.' },
      { heading: 'Keep a support record', content: 'Use a support ticket for account-specific questions or a conversation you need to return to. The chat assistant does not open a ticket, record a payment or change streaming access.' },
    ]}
    relatedLinks={[{ title: 'Start General Chat', url: '/support/ai-chat' }, { title: 'Open a Support Ticket', url: '/client/support/new' }, { title: 'My Support Tickets', url: '/client/support' }]}
  />;
}
