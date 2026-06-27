import React from 'react';
import SupportPage from './SupportPage';
const ConsoleSetup: React.FC = () => <SupportPage title="Gaming Console Setup" description="Set up Kristal Streams on your gaming console."
  sections={[
    { heading: "Xbox", content: "1. Open the Microsoft Store on your Xbox\n2. Search for MyIPTV Player or similar IPTV app\n3. Install and open the app\n4. Enter your Kristal Streams M3U playlist URL\n5. Your channels will load" },
    { heading: "PlayStation", content: "PlayStation does not have native IPTV apps. The best option is to use the built-in web browser to access kristalstream.com, or cast from your phone using Screen Mirroring." },
    { heading: "Nintendo Switch", content: "The Nintendo Switch does not support IPTV apps. We recommend using a Smart TV, streaming device, or phone instead." },
  ]}
  relatedLinks={[{ title: "TV Setup", url: "/support/tv-setup" }, { title: "Supported Devices", url: "/support/devices" }]}
/>;
export default ConsoleSetup;
