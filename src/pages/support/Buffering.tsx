import React from 'react';
import SupportPage from './SupportPage';
const Buffering: React.FC = () => <SupportPage title="Buffering Issues" description="Solutions for buffering and slow streaming problems."
  sections={[
    { heading: "Check Your Internet Speed", content: "Run our speed test to ensure you have at least 10 Mbps for HD and 25 Mbps for 4K. Go to Support > Speed Test." },
    { heading: "Restart Your Device", content: "Power off your streaming device completely, wait 30 seconds, then turn it back on. This clears temporary memory issues." },
    { heading: "Use a Wired Connection", content: "If possible, connect your device directly to your router with an ethernet cable. WiFi can be unstable, especially with multiple devices." },
    { heading: "Lower Video Quality", content: "In the player settings, try switching from 4K/HD to a lower quality temporarily. If buffering stops, your connection may not support higher quality." },
    { heading: "Close Other Apps", content: "Other apps using bandwidth (downloads, video calls, gaming) can cause buffering. Close them while streaming." },
  ]}
  relatedLinks={[{ title: "Speed Test", url: "/support/speed-test" }, { title: "Network Tips", url: "/support/network-tips" }, { title: "Connection Guide", url: "/support/connection" }]}
/>;
export default Buffering;
