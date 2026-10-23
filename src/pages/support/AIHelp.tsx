import SupportPage from './SupportPage';

export default function AIHelp() {
  return <SupportPage title="AI Capabilities" description="General guidance and the limits of automated chat."
    sections={[
      { heading: 'General troubleshooting', content: 'Ask for suggested checks for buffering, picture or sound problems. A reply is general guidance; the assistant does not check your device, live service health or streaming account.' },
      { heading: 'Account and payment questions', content: 'The assistant can point you toward account pages and help guides. Support must verify your saved payment, subscription, service access or ownership. Chat does not change passwords, process payments, activate lines or renew service.' },
      { heading: 'Device setup', content: 'Use the guide for your exact device and confirm an approved installer with support. A general chat reply does not establish compatibility or identify the current approved APK.' },
      { heading: 'Confirm important details', content: 'Automated answers can be incomplete or incorrect. Confirm current prices on the Plans page and current title availability in your supplied streaming player. Use a support ticket for account-specific assistance.' },
    ]}
    relatedLinks={[{ title: 'Start General Chat', url: '/support/ai-chat' }, { title: 'Device Guides', url: '/support/devices' }, { title: 'Plans', url: '/pricing' }, { title: 'Open a Support Ticket', url: '/client/support/new' }]}
  />;
}
