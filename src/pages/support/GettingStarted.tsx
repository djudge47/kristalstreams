import SupportPage from './SupportPage';

const GettingStarted = () => (
  <SupportPage
    title="Getting Started Guide"
    description="Follow these steps from your trial request or payment to device setup."
    sections={[
  {
    "heading": "1. Confirm your website account",
    "content": "Create your website account and confirm your email address. Use that email and password to sign in to your dashboard. If you forget your website password, use Forgot your password? on the sign-in page."
  },
  {
    "heading": "2. Finish your trial request or checkout",
    "content": "For a trial, return to the Free Trial page after confirming your email and click Request 36-Hour Trial. For a paid plan, review your connection count and price before continuing to secure payment. If payment verification needs attention, contact support with your order reference before paying again."
  },
  {
    "heading": "3. Check your confirmation email",
    "content": "We send an acknowledgment when your trial request is received and an internal alert for setup. A confirmed payment or an active website plan does not by itself mean your streaming player is ready. Your streaming login and device setup instructions are supplied separately by our team. Check your inbox and spam folder."
  },
  {
    "heading": "4. Use the streaming login supplied for your service",
    "content": "Your website sign-in is for account and support access. Your streaming player may use a different username, password and server address. Enter only the details supplied in your setup message, exactly as written. Keep these details private."
  },
  {
    "heading": "5. Set up your device",
    "content": "Choose the guide for your device below. The Download Apps page provides the Android APK and installation information. The Apple app download is currently unavailable. For a Smart TV, computer or console, confirm the approved playback method with support before installing a player."
  },
  {
    "heading": "6. Contact support if setup is missing",
    "content": "If your confirmation arrived but you do not have streaming setup details, open a support ticket. Include your account email, trial or order reference, device model and any error message. Do not include your password or full payment card details. Streaming credentials are still supplied separately from your website account."
  }
]}
    relatedLinks={[
  {
    "title": "My Dashboard",
    "url": "/dashboard"
  },
  {
    "title": "Request a Free Trial",
    "url": "/free-trial"
  },
  {
    "title": "Download Apps",
    "url": "/download-app"
  },
  {
    "title": "Device Setup Guides",
    "url": "/support/devices"
  },
  {
    "title": "Open a Support Ticket",
    "url": "/client/support/new"
  }
]}
  />
);

export default GettingStarted;
