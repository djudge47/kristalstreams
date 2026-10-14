import SupportPage from './SupportPage';

const Apps = () => (
  <SupportPage
    title="Apps and Updates"
    description="Find the current Kristal Streams download and the setup method for your device."
    sections={[
  {
    "heading": "Android APK",
    "content": "The Download Apps page provides the current Kristal Streams Android APK and installation information. Check that page for the version and device requirements before installing."
  },
  {
    "heading": "Apple devices",
    "content": "The Kristal Streams Apple app download is currently unavailable. Contact support to confirm any approved alternative for your exact device before relying on it for streaming."
  },
  {
    "heading": "Website and installed web app",
    "content": "Use the website for your dashboard, plans and support. Installing it as a web app creates a shortcut to the same website. Streaming playback requires the separately supplied player and setup instructions."
  },
  {
    "heading": "Updates and other players",
    "content": "Preserve a working installation and its data when updating. Use the player or installer approved by Kristal Streams for your device. Ask support before changing players or clearing app data."
  }
]}
    relatedLinks={[
  {
    "title": "Download Apps",
    "url": "/download-app"
  },
  {
    "title": "Mobile Setup",
    "url": "/support/mobile-setup"
  },
  {
    "title": "TV Setup",
    "url": "/support/tv-setup"
  },
  {
    "title": "Contact Support",
    "url": "/client/support/new"
  }
]}
  />
);

export default Apps;
