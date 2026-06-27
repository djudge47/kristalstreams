import React from 'react';
import SupportPage from './SupportPage';
const Maintenance: React.FC = () => <SupportPage title="Maintenance Schedule" description="Planned maintenance windows and service updates."
  sections={[
    { heading: "Regular Maintenance", content: "We perform routine maintenance weekly during off-peak hours (typically Tuesday 3-5 AM EST). During this time, you may experience brief interruptions." },
    { heading: "Upcoming Maintenance", content: "No major maintenance is currently scheduled. Check back for updates." },
    { heading: "Emergency Maintenance", content: "In rare cases, emergency maintenance may be required. We will notify users via email and update the service status page." },
  ]}
  relatedLinks={[{ title: "Service Status", url: "/support/status" }, { title: "Status History", url: "/support/status-history" }]}
/>;
export default Maintenance;
