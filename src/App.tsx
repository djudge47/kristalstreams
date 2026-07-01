import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import InstallPrompt from './components/InstallPrompt';
import Layout from './components/Layout';

function lazyRetry(importFn: () => Promise<any>) {
  return lazy(() => importFn().catch(() => {
    const hasReloaded = sessionStorage.getItem('chunk-reload');
    if (!hasReloaded) {
      sessionStorage.setItem('chunk-reload', 'true');
      window.location.reload();
      return { default: () => null };
    }
    sessionStorage.removeItem('chunk-reload');
    return { default: () => <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">Page failed to load. Please refresh.</div> };
  }));
}

const pages = {
  Home: lazyRetry(() => import('./pages/Home')),
  Pricing: lazyRetry(() => import('./pages/Pricing')),
  Support: lazyRetry(() => import('./pages/Support')),
  FreeTrial: lazyRetry(() => import('./pages/FreeTrial')),
  Login: lazyRetry(() => import('./pages/Login')),
  Register: lazyRetry(() => import('./pages/Register')),
  ResetPassword: lazyRetry(() => import('./pages/ResetPassword')),
  Dashboard: lazyRetry(() => import('./pages/Dashboard')),
  LandingPage: lazyRetry(() => import('./pages/LandingPage')),
  StandaloneLanding: lazyRetry(() => import('./pages/StandaloneLanding')),
  Privacy: lazyRetry(() => import('./pages/Privacy')),
  Terms: lazyRetry(() => import('./pages/Terms')),
  RefundPolicy: lazyRetry(() => import('./pages/RefundPolicy')),
  Testimonials: lazyRetry(() => import('./pages/Testimonials')),
  CookiePolicy: lazyRetry(() => import('./pages/CookiePolicy')),
  KnowledgeBase: lazyRetry(() => import('./pages/KnowledgeBase')),
  CheckoutPage: lazyRetry(() => import('./pages/pricing/CheckoutPage')),
  PPV: lazyRetry(() => import('./pages/PPV')),
  ContentDetail: lazyRetry(() => import('./pages/ContentDetail')),
  AboutUs: lazyRetry(() => import('./pages/AboutUs')),
  OurServices: lazyRetry(() => import('./pages/OurServices')),
  WebTVPlayer: lazyRetry(() => import('./pages/WebTVPlayer')),
  Reselling: lazyRetry(() => import('./pages/Reselling')),
  DownloadApp: lazyRetry(() => import('./pages/DownloadApp')),
  News: lazyRetry(() => import('./pages/News')),
  BasicPlan: lazyRetry(() => import('./pages/pricing/BasicPlan')),
  StandardPlan: lazyRetry(() => import('./pages/pricing/StandardPlan')),
  PremiumPlan: lazyRetry(() => import('./pages/pricing/PremiumPlan')),
  UltimatePlan: lazyRetry(() => import('./pages/pricing/UltimatePlan')),
  AdultPlan: lazyRetry(() => import('./pages/pricing/AdultPlan')),
  BronzePlan: lazyRetry(() => import('./pages/pricing/BronzePlan')),
  SilverPlan: lazyRetry(() => import('./pages/pricing/SilverPlan')),
  GoldPlan: lazyRetry(() => import('./pages/pricing/GoldPlan')),
  PlatinumPlan: lazyRetry(() => import('./pages/pricing/PlatinumPlan')),
};

const supportPages = {
  GettingStarted: lazyRetry(() => import('./pages/support/GettingStarted')),
  Billing: lazyRetry(() => import('./pages/support/Billing')),
  StreamingHelp: lazyRetry(() => import('./pages/support/StreamingHelp')),
  DeviceSetup: lazyRetry(() => import('./pages/support/DeviceSetup')),
  NetworkHelp: lazyRetry(() => import('./pages/support/NetworkHelp')),
  SystemStatus: lazyRetry(() => import('./pages/support/SystemStatus')),
  Article: lazyRetry(() => import('./pages/support/Article')),
  SpeedTest: lazyRetry(() => import('./pages/support/SpeedTest')),
  Guide: lazyRetry(() => import('./pages/support/Guide')),
  AIChat: lazyRetry(() => import('./pages/support/AIChat')),
  AIFaq: lazyRetry(() => import('./pages/support/AIFaq')),
  ChatHistory: lazyRetry(() => import('./pages/support/ChatHistory')),
  AIHelp: lazyRetry(() => import('./pages/support/AIHelp')),
  FAQ: lazyRetry(() => import('./pages/support/FAQ')),
  Buffering: lazyRetry(() => import('./pages/support/Buffering')),
  LoginHelp: lazyRetry(() => import('./pages/support/LoginHelp')),
  SyncIssues: lazyRetry(() => import('./pages/support/SyncIssues')),
  AppCrashes: lazyRetry(() => import('./pages/support/AppCrashes')),
  TVSetup: lazyRetry(() => import('./pages/support/TVSetup')),
  MobileSetup: lazyRetry(() => import('./pages/support/MobileSetup')),
  ComputerSetup: lazyRetry(() => import('./pages/support/ComputerSetup')),
  ConsoleSetup: lazyRetry(() => import('./pages/support/ConsoleSetup')),
  Requirements: lazyRetry(() => import('./pages/support/Requirements')),
  Browsers: lazyRetry(() => import('./pages/support/Browsers')),
  Apps: lazyRetry(() => import('./pages/support/Apps')),
  Connection: lazyRetry(() => import('./pages/support/Connection')),
  Bandwidth: lazyRetry(() => import('./pages/support/Bandwidth')),
  NetworkTips: lazyRetry(() => import('./pages/support/NetworkTips')),
  Issues: lazyRetry(() => import('./pages/support/Issues')),
  Maintenance: lazyRetry(() => import('./pages/support/Maintenance')),
  StatusHistory: lazyRetry(() => import('./pages/support/StatusHistory')),
};

const clientPages = {
  Layout: lazyRetry(() => import('./pages/client/ClientLayout')),
  Account: lazyRetry(() => import('./pages/client/ClientAccount')),
  Subscription: lazyRetry(() => import('./pages/client/ClientSubscription')),
  Devices: lazyRetry(() => import('./pages/client/ClientDevices')),
  History: lazyRetry(() => import('./pages/client/ClientHistory')),
  Security: lazyRetry(() => import('./pages/client/ClientSecurity')),
  Settings: lazyRetry(() => import('./pages/client/ClientSettings')),
  Support: lazyRetry(() => import('./pages/client/ClientSupport')),
  NewTicket: lazyRetry(() => import('./pages/client/NewTicket')),
};

const adminPages = {
  Layout: lazyRetry(() => import('./pages/admin/AdminLayout')),
  Dashboard: lazyRetry(() => import('./pages/admin/AdminDashboard')),
  Channels: lazyRetry(() => import('./pages/admin/ChannelManager')),
  Customers: lazyRetry(() => import('./pages/admin/Customers')),
  Tickets: lazyRetry(() => import('./pages/admin/SupportTickets')),
  Analytics: lazyRetry(() => import('./pages/admin/Analytics')),
  Slider: lazyRetry(() => import('./pages/admin/SliderManager')),
  DemoReel: lazyRetry(() => import('./pages/admin/DemoReelManager')),
  Schedule: lazyRetry(() => import('./pages/admin/ScheduleManager')),
  Programs: lazyRetry(() => import('./pages/admin/ProgramManager')),
  CRM: lazyRetry(() => import('./pages/admin/CRMDashboard')),
  Contacts: lazyRetry(() => import('./pages/admin/Contacts')),
  Companies: lazyRetry(() => import('./pages/admin/Companies')),
  Deals: lazyRetry(() => import('./pages/admin/Deals')),
  Activities: lazyRetry(() => import('./pages/admin/Activities')),
};

const LoadingFallback = () => <div className="flex min-h-screen items-center justify-center bg-gray-900 text-gray-300">Loading...</div>;

function App() {
  sessionStorage.removeItem('chunk-reload');
  const P = pages;
  const S = supportPages;
  const C = clientPages;
  const A = adminPages;

  return (
    <Router>
      <InstallPrompt />
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<P.Home />} />
            <Route path="pricing" element={<P.Pricing />} />
            <Route path="pricing/basic" element={<P.BasicPlan />} />
            <Route path="pricing/standard" element={<P.StandardPlan />} />
            <Route path="pricing/premium" element={<P.PremiumPlan />} />
            <Route path="pricing/ultimate" element={<P.UltimatePlan />} />
            <Route path="pricing/adult" element={<P.AdultPlan />} />
            <Route path="pricing/bronze" element={<P.BronzePlan />} />
            <Route path="pricing/silver" element={<P.SilverPlan />} />
            <Route path="pricing/gold" element={<P.GoldPlan />} />
            <Route path="pricing/platinum" element={<P.PlatinumPlan />} />
            <Route path="checkout" element={<P.CheckoutPage />} />
            <Route path="support" element={<P.Support />} />
            <Route path="knowledge-base" element={<P.KnowledgeBase />} />
            <Route path="free-trial" element={<P.FreeTrial />} />
            <Route path="login" element={<P.Login />} />
            <Route path="register" element={<P.Register />} />
            <Route path="reset-password" element={<P.ResetPassword />} />
            <Route path="dashboard" element={<P.Dashboard />} />
            <Route path="landing" element={<P.LandingPage />} />
            <Route path="standalone-landing" element={<P.StandaloneLanding />} />
            <Route path="privacy" element={<P.Privacy />} />
            <Route path="terms" element={<P.Terms />} />
            <Route path="refund-policy" element={<P.RefundPolicy />} />
            <Route path="testimonials" element={<P.Testimonials />} />
            <Route path="cookies" element={<P.CookiePolicy />} />
            <Route path="ppv" element={<P.PPV />} />
            <Route path="content/:type/:id" element={<P.ContentDetail />} />
            <Route path="about" element={<P.AboutUs />} />
            <Route path="services" element={<P.OurServices />} />
            <Route path="web-tv-player" element={<P.WebTVPlayer />} />
            <Route path="reselling" element={<P.Reselling />} />
            <Route path="download-app" element={<P.DownloadApp />} />
            <Route path="news" element={<P.News />} />
            <Route path="support/ai-chat" element={<S.AIChat />} />
            <Route path="support/ai-faq" element={<S.AIFaq />} />
            <Route path="support/chat-history" element={<S.ChatHistory />} />
            <Route path="support/ai-help" element={<S.AIHelp />} />
            <Route path="support/getting-started" element={<S.GettingStarted />} />
            <Route path="support/billing" element={<S.Billing />} />
            <Route path="support/streaming" element={<S.StreamingHelp />} />
            <Route path="support/faq" element={<S.FAQ />} />
            <Route path="support/buffering" element={<S.Buffering />} />
            <Route path="support/login-help" element={<S.LoginHelp />} />
            <Route path="support/sync-issues" element={<S.SyncIssues />} />
            <Route path="support/app-crashes" element={<S.AppCrashes />} />
            <Route path="support/tv-setup" element={<S.TVSetup />} />
            <Route path="support/mobile-setup" element={<S.MobileSetup />} />
            <Route path="support/computer-setup" element={<S.ComputerSetup />} />
            <Route path="support/console-setup" element={<S.ConsoleSetup />} />
            <Route path="support/devices" element={<S.DeviceSetup />} />
            <Route path="support/requirements" element={<S.Requirements />} />
            <Route path="support/browsers" element={<S.Browsers />} />
            <Route path="support/apps" element={<S.Apps />} />
            <Route path="support/speed-test" element={<S.SpeedTest />} />
            <Route path="support/connection" element={<S.Connection />} />
            <Route path="support/bandwidth" element={<S.Bandwidth />} />
            <Route path="support/network-tips" element={<S.NetworkTips />} />
            <Route path="support/network" element={<S.NetworkHelp />} />
            <Route path="support/status" element={<S.SystemStatus />} />
            <Route path="support/issues" element={<S.Issues />} />
            <Route path="support/maintenance" element={<S.Maintenance />} />
            <Route path="support/status-history" element={<S.StatusHistory />} />
            <Route path="support/article/:slug" element={<S.Article />} />
            <Route path="support/guide/:slug" element={<S.Guide />} />
            <Route path="client" element={<C.Layout />}>
              <Route path="account" element={<C.Account />} />
              <Route path="subscription" element={<C.Subscription />} />
              <Route path="devices" element={<C.Devices />} />
              <Route path="history" element={<C.History />} />
              <Route path="security" element={<C.Security />} />
              <Route path="settings" element={<C.Settings />} />
              <Route path="support" element={<C.Support />} />
              <Route path="support/new" element={<C.NewTicket />} />
            </Route>
          </Route>
          <Route path="admin" element={<A.Layout />}>
            <Route index element={<A.Dashboard />} />
            <Route path="channels" element={<A.Channels />} />
            <Route path="customers" element={<A.Customers />} />
            <Route path="tickets" element={<A.Tickets />} />
            <Route path="analytics" element={<A.Analytics />} />
            <Route path="slider" element={<A.Slider />} />
            <Route path="demo-reel" element={<A.DemoReel />} />
            <Route path="schedule" element={<A.Schedule />} />
            <Route path="programs" element={<A.Programs />} />
            <Route path="crm" element={<A.CRM />} />
            <Route path="crm/contacts" element={<A.Contacts />} />
            <Route path="crm/companies" element={<A.Companies />} />
            <Route path="crm/deals" element={<A.Deals />} />
            <Route path="crm/activities" element={<A.Activities />} />
          </Route>
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
