import React from 'react';
import SupportPage from './SupportPage';
const TVSetup: React.FC = () => <SupportPage title="Smart TV Setup" description="Set up Kristal Streams on your Smart TV."
  sections={[
    { heading: "Samsung Smart TV", content: "1. Open the Samsung App Store\n2. Search for IPTV Smarters or TiviMate\n3. Install the app\n4. Open the app and enter your Kristal Streams credentials\n5. Your channel list will load automatically" },
    { heading: "LG Smart TV", content: "1. Open the LG Content Store\n2. Search for IPTV Smarters\n3. Install and open the app\n4. Enter your login details\n5. Start watching" },
    { heading: "Android TV / Google TV", content: "1. Open the Google Play Store on your TV\n2. Search for TiviMate or IPTV Smarters\n3. Install your preferred app\n4. Log in with your Kristal Streams account\n5. Enjoy your channels" },
    { heading: "Amazon Fire TV", content: "1. Go to the Amazon App Store\n2. Search for IPTV Smarters\n3. Install the app\n4. Open and enter your credentials\n5. Your channels will load automatically" },
  ]}
  relatedLinks={[{ title: "Mobile Setup", url: "/support/mobile-setup" }, { title: "Supported Devices", url: "/support/devices" }]}
/>;
export default TVSetup;
