import React from 'react';
import SupportPage from './SupportPage';
const SyncIssues: React.FC = () => <SupportPage title="Audio/Video Sync Issues" description="Fix audio and video synchronization problems."
  sections={[
    { heading: "Refresh the Stream", content: "Stop the current stream and restart it. This often resolves temporary sync issues." },
    { heading: "Clear App Cache", content: "Go to your device settings and clear the Kristal Streams app cache, then reopen the app." },
    { heading: "Check Your Connection", content: "Unstable internet can cause sync issues. Try switching between WiFi and mobile data, or use a wired connection." },
    { heading: "Update the App", content: "Make sure you are running the latest version of the app. Older versions may have known sync bugs." },
  ]}
  relatedLinks={[{ title: "Buffering Issues", url: "/support/buffering" }, { title: "App Crashes", url: "/support/app-crashes" }]}
/>;
export default SyncIssues;
