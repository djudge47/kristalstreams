import SupportPage from './SupportPage';

const ConsoleSetup = () => (
  <SupportPage
    title="Gaming Console Setup"
    description="Confirm support for your exact console before choosing a playback method."
    sections={[
  {
    "heading": "Check compatibility first",
    "content": "Send support your console model and operating system version. There is no verified Kristal Streams console installer linked from this website. Support must confirm any approved player, browser or casting method for your model."
  },
  {
    "heading": "Use only confirmed instructions",
    "content": "Do not assume that a console browser or an app with IPTV in its name will work with your service. If support confirms a method, follow the supplied setup instructions and use the streaming login provided for your account."
  },
  {
    "heading": "Alternative devices",
    "content": "If your console has no approved playback option, ask support about a compatible Android streaming device, television or phone. Confirm the exact model before buying or installing anything."
  }
]}
    relatedLinks={[
  {
    "title": "TV Setup",
    "url": "/support/tv-setup"
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

export default ConsoleSetup;
