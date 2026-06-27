import React from 'react';
import SupportPage from './SupportPage';
const Requirements: React.FC = () => <SupportPage title="System Requirements" description="Minimum requirements for streaming with Kristal Streams."
  sections={[
    { heading: "Internet Speed", content: "SD Quality: 3 Mbps minimum\nHD Quality: 10 Mbps minimum\n4K Quality: 25 Mbps minimum\nWe recommend a wired connection for the best experience." },
    { heading: "Mobile Devices", content: "Android 5.0 or newer\niOS 12 or newer\nAt least 2GB RAM\n100MB free storage" },
    { heading: "Smart TVs", content: "Samsung Smart TV (2017 or newer)\nLG Smart TV (webOS 3.0 or newer)\nAndroid TV 7.0 or newer\nAmazon Fire TV (2nd gen or newer)" },
    { heading: "Computers", content: "Windows 10 or newer / macOS 10.14 or newer\nChrome 90+, Firefox 90+, Safari 14+, or Edge 90+\n4GB RAM minimum" },
  ]}
  relatedLinks={[{ title: "Supported Devices", url: "/support/devices" }, { title: "Speed Test", url: "/support/speed-test" }]}
/>;
export default Requirements;
