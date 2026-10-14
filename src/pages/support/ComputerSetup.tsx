import SupportPage from './SupportPage';

const ComputerSetup = () => (
  <SupportPage
    title="Computer Setup"
    description="Confirm the playback method for your Windows or Mac computer."
    sections={[
  {
    "heading": "Website account access",
    "content": "Use the Kristal Streams website to review plans, check your account and contact support. The dashboard manages your website account; streaming access uses the player and login details supplied separately for your service."
  },
  {
    "heading": "Choose an approved playback method",
    "content": "Contact support with your computer operating system and preferred browser. Ask for the current approved computer player or web player address and its setup instructions. Do not guess a player URL or use your website password in an unrelated app."
  },
  {
    "heading": "Enter your supplied streaming details",
    "content": "If your approved player asks for a username, password, server address or playlist URL, enter exactly what was provided in your setup message. Keep playlist links and login details private. The Android APK on the download page is not a Windows or Mac installer."
  },
  {
    "heading": "Check playback and get help",
    "content": "Allow the channel list to load, then try a live channel and an on-demand title. If playback fails, note the player or browser version, computer operating system and exact error. Include that information in your support ticket, without sending passwords."
  }
]}
    relatedLinks={[
  {
    "title": "Getting Started",
    "url": "/support/getting-started"
  },
  {
    "title": "Browser Support",
    "url": "/support/browsers"
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

export default ComputerSetup;
