import SupportPage from './SupportPage';

export default function StatusHistory() {
  return <SupportPage title="Status History" description="Availability of verified uptime and incident records."
    sections={[
      { heading: 'Incident history unavailable', content: 'Verified incident records and uptime measurements are not currently available on this page. Contact support if you need information about a past disruption.' },
      { heading: 'Ask about a past issue', content: 'Provide the date, time, device model and affected channel or title. Support can investigate your report and explain what information is available.' },
    ]}
    relatedLinks={[{ title: 'Service Status', url: '/support/status' }, { title: 'Known Issues', url: '/support/issues' }, { title: 'Maintenance Schedule', url: '/support/maintenance' }, { title: 'Contact Support', url: '/support' }]}
  />;
}
