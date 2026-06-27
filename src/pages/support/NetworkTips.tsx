import React from 'react';
import SupportPage from './SupportPage';
const NetworkTips: React.FC = () => <SupportPage title="Network Tips" description="Tips to improve your network performance for streaming."
  sections={[
    { heading: "Restart Your Router", content: "Unplug your router for 30 seconds, then plug it back in. This clears the router memory and can fix many connection issues." },
    { heading: "Update Router Firmware", content: "Check your router manufacturer website for firmware updates. Updated firmware can improve speed and stability." },
    { heading: "Use Quality of Service (QoS)", content: "Many routers have QoS settings that let you prioritize streaming traffic. Check your router settings and prioritize your streaming device." },
    { heading: "Consider Upgrading", content: "If you consistently struggle with speeds, contact your ISP about upgrading your plan. Many providers offer streaming-optimized plans." },
  ]}
  relatedLinks={[{ title: "Connection Guide", url: "/support/connection" }, { title: "Buffering Issues", url: "/support/buffering" }]}
/>;
export default NetworkTips;
