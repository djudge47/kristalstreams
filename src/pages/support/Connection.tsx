import React from 'react';
import SupportPage from './SupportPage';
const Connection: React.FC = () => <SupportPage title="Connection Guide" description="Optimize your internet connection for streaming."
  sections={[
    { heading: "Wired vs WiFi", content: "A wired ethernet connection is always more stable and faster than WiFi. If you experience buffering, try connecting your device directly to your router." },
    { heading: "WiFi Optimization", content: "Place your router in a central location\nUse 5GHz band instead of 2.4GHz for faster speeds\nKeep your router away from walls and metal objects\nReduce the number of connected devices" },
    { heading: "VPN Usage", content: "Using a VPN may reduce your streaming speed. If you use a VPN, choose a server close to your location for better performance." },
  ]}
  relatedLinks={[{ title: "Speed Test", url: "/support/speed-test" }, { title: "Bandwidth Calculator", url: "/support/bandwidth" }, { title: "Network Tips", url: "/support/network-tips" }]}
/>;
export default Connection;
