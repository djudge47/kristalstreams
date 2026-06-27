import React from 'react';
import SupportPage from './SupportPage';
const ComputerSetup: React.FC = () => <SupportPage title="Computer Setup" description="Watch Kristal Streams on your Windows or Mac computer."
  sections={[
    { heading: "Web Browser (Easiest)", content: "Simply visit kristalstream.com, log in to your account, and click Watch Live TV from your dashboard. Works in Chrome, Firefox, Safari, and Edge." },
    { heading: "VLC Media Player", content: "1. Download VLC from videolan.org\n2. Open VLC\n3. Go to Media then Open Network Stream\n4. Paste your Kristal Streams M3U URL\n5. Click Play" },
    { heading: "IPTV Smarters (Windows)", content: "1. Download IPTV Smarters from the official website\n2. Install and open the app\n3. Select Xtream Codes API\n4. Enter your Kristal Streams credentials\n5. Start watching" },
  ]}
  relatedLinks={[{ title: "Browser Support", url: "/support/browsers" }, { title: "System Requirements", url: "/support/requirements" }]}
/>;
export default ComputerSetup;
