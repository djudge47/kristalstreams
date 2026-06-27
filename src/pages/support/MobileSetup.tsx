import React from 'react';
import SupportPage from './SupportPage';
const MobileSetup: React.FC = () => <SupportPage title="Mobile Setup" description="Set up Kristal Streams on your phone or tablet."
  sections={[
    { heading: "Android", content: "1. Open the Google Play Store\n2. Search for IPTV Smarters Pro or TiviMate\n3. Install the app\n4. Open it and select Xtream Codes API\n5. Enter your Kristal Streams server URL, username, and password\n6. Click Add User and start streaming" },
    { heading: "iPhone / iPad", content: "1. Open the App Store\n2. Search for IPTV Smarters or GSE Smart IPTV\n3. Install the app\n4. Open and enter your Kristal Streams login credentials\n5. Your channel list will appear automatically" },
    { heading: "Using the Web Player", content: "You can also watch directly in your mobile browser at kristalstream.com. Log in to your account and click Watch Live TV from the dashboard." },
  ]}
  relatedLinks={[{ title: "TV Setup", url: "/support/tv-setup" }, { title: "Computer Setup", url: "/support/computer-setup" }]}
/>;
export default MobileSetup;
