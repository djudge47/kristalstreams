import SupportPage from './SupportPage';

const TVSetup = () => (
  <SupportPage
    title="Smart TV Setup"
    description="Choose the setup instructions for your exact television or streaming device."
    sections={[
  {
    "heading": "Before installing",
    "content": "Have your streaming setup message ready. Your website account password may be different from your player login. If you have not received streaming credentials, contact support before trying to sign in to a player."
  },
  {
    "heading": "Android TV / Google TV",
    "content": "Open the Download Apps page below and follow the Android installation instructions for your device. If an existing Kristal Streams installation already works, preserve its data and settings. Do not uninstall it or clear app data unless support asks you to."
  },
  {
    "heading": "Amazon Fire TV / Firestick",
    "content": "Use the installer and device instructions supplied by Kristal Streams. The Download Apps page contains the Android APK. Ask support if your device cannot open the download or installation is blocked; include the exact Fire TV model and error."
  },
  {
    "heading": "Samsung and LG Smart TVs",
    "content": "Confirm your TV model and operating system with support. The Android APK is not a Samsung or LG TV installer. Support must confirm a compatible playback option or external streaming device for your model before you install anything."
  },
  {
    "heading": "Sign in and check playback",
    "content": "Open the approved player and enter the streaming credentials from your setup message. If it asks for a server address, use the supplied address exactly. Let the channel list and guide load, then try a live channel and an on-demand title. Send support the exact error if either fails."
  }
]}
    relatedLinks={[
  {
    "title": "Download Apps",
    "url": "/download-app"
  },
  {
    "title": "Getting Started",
    "url": "/support/getting-started"
  },
  {
    "title": "Mobile Setup",
    "url": "/support/mobile-setup"
  },
  {
    "title": "Contact Support",
    "url": "/client/support/new"
  }
]}
  />
);

export default TVSetup;
