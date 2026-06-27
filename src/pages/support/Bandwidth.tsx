import React from 'react';
import SupportPage from './SupportPage';
const Bandwidth: React.FC = () => <SupportPage title="Bandwidth Calculator" description="Calculate the bandwidth needed for your streaming setup."
  sections={[
    { heading: "Bandwidth Per Stream", content: "SD Quality (480p): approximately 3 Mbps per stream\nHD Quality (720p): approximately 5 Mbps per stream\nFull HD (1080p): approximately 10 Mbps per stream\n4K Ultra HD: approximately 25 Mbps per stream" },
    { heading: "Multiple Devices", content: "If you have multiple connections streaming simultaneously, multiply the per-stream bandwidth by the number of active streams. For example, 3 HD streams need about 30 Mbps." },
    { heading: "Other Usage", content: "Remember to account for other internet usage in your household such as gaming, video calls, and downloads. Add 10-20 Mbps on top of your streaming needs." },
  ]}
  relatedLinks={[{ title: "Speed Test", url: "/support/speed-test" }, { title: "Connection Guide", url: "/support/connection" }]}
/>;
export default Bandwidth;
