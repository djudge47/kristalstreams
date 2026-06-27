import React from 'react';
import SupportPage from './SupportPage';
const AppCrashes: React.FC = () => <SupportPage title="App Crashes" description="Solutions for app crashing and freezing issues."
  sections={[
    { heading: "Update the App", content: "Make sure you have the latest version installed. Updates often fix crash-related bugs." },
    { heading: "Clear Cache and Data", content: "Go to your device settings, find the Kristal Streams app, and clear cache. If that does not help, try clearing data (you will need to log in again)." },
    { heading: "Restart Your Device", content: "A full restart (not just sleep) can resolve memory issues causing crashes." },
    { heading: "Reinstall the App", content: "Uninstall the app completely, restart your device, then reinstall from the app store." },
    { heading: "Check Device Compatibility", content: "Older devices may not meet the minimum requirements. Check our supported devices page." },
  ]}
  relatedLinks={[{ title: "Supported Devices", url: "/support/devices" }, { title: "System Requirements", url: "/support/requirements" }]}
/>;
export default AppCrashes;
