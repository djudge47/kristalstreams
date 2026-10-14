import SupportPage from './SupportPage';

const Requirements = () => (
  <SupportPage
    title="System Requirements"
    description="Check requirements for the player and device you will actually use."
    sections={[
  {
    "heading": "Android player",
    "content": "Check the current Android requirements, download size and version on the Download Apps page. Use the supplied installer for your device and keep enough storage available for installation and content data."
  },
  {
    "heading": "TVs, computers and Apple devices",
    "content": "Compatibility depends on the exact device, operating system and approved player. Ask support to confirm these details before installing or purchasing a device. The Apple app download is currently unavailable."
  },
  {
    "heading": "Internet connection",
    "content": "Required bandwidth depends on picture quality, the stream and the number of simultaneous connections. If playback buffers, test your connection and share the result with support. A stable wired connection may help where your device supports one."
  },
  {
    "heading": "Account and streaming setup",
    "content": "You need the appropriate trial or paid access and the streaming credentials supplied separately for your service. Your plan connection allowance limits simultaneous use. An active website plan alone does not complete player setup."
  }
]}
    relatedLinks={[
  {
    "title": "Download Apps",
    "url": "/download-app"
  },
  {
    "title": "Device Setup Guides",
    "url": "/support/devices"
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

export default Requirements;
