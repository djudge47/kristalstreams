import SupportPage from './SupportPage';

export default function Maintenance() {
  return <SupportPage title="Maintenance Schedule" description="Confirm maintenance information before planning around an interruption."
    sections={[
      { heading: 'Schedule unavailable', content: 'A verified maintenance schedule is not currently available on this page. Contact support to confirm any planned work and its expected effect on your service.' },
      { heading: 'Confirm the details', content: 'Ask for the affected service, date, time zone and expected duration. Report any current playback problem to support with your device model, the time it occurred and the exact error message.' },
    ]}
    relatedLinks={[{ title: 'Service Status', url: '/support/status' }, { title: 'Status History', url: '/support/status-history' }, { title: 'Contact Support', url: '/support' }]}
  />;
}
