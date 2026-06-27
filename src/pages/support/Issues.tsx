import React from 'react';
import SupportPage from './SupportPage';
const Issues: React.FC = () => <SupportPage title="Known Issues" description="Current known issues and their workarounds."
  sections={[
    { heading: "No Known Issues", content: "There are currently no known widespread issues with Kristal Streams services. If you are experiencing a problem, it may be specific to your device or connection." },
    { heading: "Report an Issue", content: "If you are experiencing an issue not listed here, please contact our support team so we can investigate and resolve it." },
  ]}
  relatedLinks={[{ title: "Service Status", url: "/support/status" }, { title: "Maintenance Schedule", url: "/support/maintenance" }, { title: "Contact Support", url: "/support" }]}
/>;
export default Issues;
