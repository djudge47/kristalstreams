import SupportPage from './SupportPage';

const MobileSetup = () => (
  <SupportPage
    title="Mobile Setup"
    description="Use the setup method approved for your phone or tablet."
    sections={[
  {
    "heading": "Before you begin",
    "content": "A website login gives you account and support access. Streaming credentials and setup instructions are supplied separately. If those details have not arrived, check your inbox and spam folder, then contact support."
  },
  {
    "heading": "Android phones and tablets",
    "content": "Open the Download Apps page below and follow its Android APK installation instructions. Use the current device requirements shown there. When updating an existing installation, preserve its settings and data unless support specifically asks you to clear them."
  },
  {
    "heading": "Sign in to the Android player",
    "content": "Open the installed Kristal Streams player and use the streaming username and password supplied for your service. If the player requests a server address, enter only the supplied address. Allow the channel list and guide to load before checking playback."
  },
  {
    "heading": "iPhone / iPad",
    "content": "The Kristal Streams Apple app download is currently unavailable. Contact support with your device model and iOS or iPadOS version to confirm an approved playback option. Do not install the Android APK on an Apple device."
  },
  {
    "heading": "Using the website on your phone",
    "content": "You can use the website to request a trial, review plans, manage your account and contact support. Installing the website as a web app provides a shortcut to these pages. Browser playback requires a separately confirmed player and setup instructions."
  }
]}
    relatedLinks={[
  {
    "title": "Download Apps",
    "url": "/download-app"
  },
  {
    "title": "TV Setup",
    "url": "/support/tv-setup"
  },
  {
    "title": "Getting Started",
    "url": "/support/getting-started"
  },
  {
    "title": "Contact Support",
    "url": "/client/support/new"
  }
]}
  />
);

export default MobileSetup;
