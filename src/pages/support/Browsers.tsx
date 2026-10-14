import SupportPage from './SupportPage';

const Browsers = () => (
  <SupportPage
    title="Browser Support"
    description="Use your browser for account access and confirm playback support separately."
    sections={[
  {
    "heading": "Website access",
    "content": "Use an up-to-date browser to sign in, review plans and contact support. If a page does not load correctly, update the browser and try again. Contact support with the browser name, version and exact error if the issue continues."
  },
  {
    "heading": "Streaming in a browser",
    "content": "Website access does not confirm that a browser can play your streaming service. Use only the web player address and instructions supplied for your account. Confirm compatibility for your browser and device with support."
  },
  {
    "heading": "Installed web app",
    "content": "Installing the website as a web app adds a shortcut to account and support pages. It does not install the Android player or replace the streaming setup instructions."
  }
]}
    relatedLinks={[
  {
    "title": "Computer Setup",
    "url": "/support/computer-setup"
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

export default Browsers;
