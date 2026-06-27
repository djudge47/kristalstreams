import React from 'react';
import SupportPage from './SupportPage';
const Apps: React.FC = () => <SupportPage title="App Versions" description="Available apps and their latest versions."
  sections={[
    { heading: "Recommended Apps", content: "IPTV Smarters Pro: Available on Android, iOS, Windows, Samsung/LG Smart TVs, Fire TV\nTiviMate: Available on Android TV, Fire TV\nGSE Smart IPTV: Available on iOS\nVLC Media Player: Available on all platforms" },
    { heading: "Kristal Streams Web App", content: "Our web app works on any device with a modern browser. Visit kristalstream.com, log in, and click Watch Live TV. You can also install it as a PWA for a native app experience." },
    { heading: "Android APK", content: "Download our Android APK directly from kristalstream.com/download for sideloading on Android devices and Fire TV." },
  ]}
  relatedLinks={[{ title: "Mobile Setup", url: "/support/mobile-setup" }, { title: "TV Setup", url: "/support/tv-setup" }]}
/>;
export default Apps;
