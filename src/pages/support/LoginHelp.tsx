import React from 'react';
import SupportPage from './SupportPage';
const LoginHelp: React.FC = () => <SupportPage title="Login Problems" description="Troubleshoot issues signing into your Kristal Streams account."
  sections={[
    { heading: "Forgot Your Password?", content: "Click Forgot Password on the login page. Enter your email and check your inbox for a reset link." },
    { heading: "Account Locked", content: "After multiple failed login attempts, your account may be temporarily locked. Wait 15 minutes and try again." },
    { heading: "Email Not Found", content: "Make sure you are using the same email you registered with. Check for typos. If you signed up with Google, use the Google sign-in option." },
    { heading: "Still Cannot Log In?", content: "Contact our support team with your registered email address and we will help you regain access." },
  ]}
  relatedLinks={[{ title: "Contact Support", url: "/support" }, { title: "FAQ", url: "/support/faq" }]}
/>;
export default LoginHelp;
