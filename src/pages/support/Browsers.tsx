import React from 'react';
import SupportPage from './SupportPage';
const Browsers: React.FC = () => <SupportPage title="Browser Support" description="Supported web browsers for Kristal Streams."
  sections={[
    { heading: "Fully Supported", content: "Google Chrome (version 90+)\nMozilla Firefox (version 90+)\nMicrosoft Edge (version 90+)\nSafari (version 14+)\nOpera (version 76+)" },
    { heading: "Not Supported", content: "Internet Explorer (all versions)\nOlder browser versions\nText-only browsers" },
    { heading: "Best Experience", content: "We recommend Google Chrome for the best streaming experience. Make sure your browser is updated to the latest version." },
  ]}
  relatedLinks={[{ title: "System Requirements", url: "/support/requirements" }, { title: "Computer Setup", url: "/support/computer-setup" }]}
/>;
export default Browsers;
