import SupportPage from './SupportPage';

export default function Issues() {
  return <SupportPage title="Known Issues" description="Get help confirming and investigating a service problem."
    sections={[
      { heading: 'Issue information unavailable', content: 'A verified list of current service incidents is not available on this page. Contact support to confirm whether a wider issue is affecting your service.' },
      { heading: 'Report an issue', content: 'Describe what happened, when it started, the device and player you use, and whether other channels or titles work. Include the exact error message and keep passwords and playback URLs private.' },
    ]}
    relatedLinks={[{ title: 'Service Status', url: '/support/status' }, { title: 'Playback Troubleshooting', url: '/support/streaming' }, { title: 'Maintenance Schedule', url: '/support/maintenance' }, { title: 'Contact Support', url: '/support' }]}
  />;
}
