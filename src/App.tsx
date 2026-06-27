import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import InstallPrompt from './components/InstallPrompt'

// Auto-retry for lazy imports when chunks fail to load after a deploy
function lazyRetry(importFn: () => Promise<any>) {
  return lazy(() =>
    importFn().catch(() => {
      // Chunk failed to load — likely a new deploy changed file names
      // Reload the page once to get fresh files
      const hasReloaded = sessionStorage.getItem('chunk-reload');
      if (!hasReloaded) {
        sessionStorage.setItem('chunk-reload', 'true');
        window.location.reload();
        return { default: () => null };
      }
      sessionStorage.removeItem('chunk-reload');
      // If reload didn't fix it, show error
      return { default: () => React.createElement('div', { className: 'min-h-screen flex items-center justify-center bg-gray-900' },
        React.createElement('div', { className: 'text-center' },
          React.createElement('p', { className: 'text-white text-xl mb-4' }, 'Page failed to load'),
          React.createElement('button', { onClick: () => window.location.reload(), className: 'bg-red-600 text-white px-6 py-2 rounded-lg' }, 'Reload')
        )
      )};
    })
  );
}


const Home = lazyRetry(() => import('./pages/Home'));
const Pricing = lazyRetry(() => import('./pages/Pricing'));
const Support = lazyRetry(() => import('./pages/Support'));
const FreeTrial = lazyRetry(() => import('./pages/FreeTrial'));
const Login = lazyRetry(() => import('./pages/Login'));
const Register = lazyRetry(() => import('./pages/Register'));
const Dashboard = lazyRetry(() => import('./pages/Dashboard'));
const LandingPage = lazyRetry(() => import('./pages/LandingPage'));
const StandaloneLanding = lazyRetry(() => import('./pages/StandaloneLanding'));
const Privacy = lazyRetry(() => import('./pages/Privacy'));
const Terms = lazyRetry(() => import('./pages/Terms'));
const RefundPolicy = lazyRetry(() => import('./pages/RefundPolicy'));
const Testimonials = lazyRetry(() => import('./pages/Testimonials'));
const CookiePolicy = lazyRetry(() => import('./pages/CookiePolicy'));
const KnowledgeBase = lazyRetry(() => import('./pages/KnowledgeBase'));
const CheckoutPage = lazyRetry(() => import('./pages/pricing/CheckoutPage'));
const PPV = lazyRetry(() => import('./pages/PPV'));
const ContentDetail = lazyRetry(() => import('./pages/ContentDetail'));
const AboutUs = lazyRetry(() => import('./pages/AboutUs'));
const OurServices = lazyRetry(() => import('./pages/OurServices'));
const WebTVPlayer = lazyRetry(() => import('./pages/WebTVPlayer'));
const Reselling = lazyRetry(() => import('./pages/Reselling'));

const GettingStarted = lazyRetry(() => import('./pages/support/GettingStarted'));
const Billing = lazyRetry(() => import('./pages/support/Billing'));
const StreamingHelp = lazyRetry(() => import('./pages/support/StreamingHelp'));
const DeviceSetup = lazyRetry(() => import('./pages/support/DeviceSetup'));
const NetworkHelp = lazyRetry(() => import('./pages/support/NetworkHelp'));
const SystemStatus = lazyRetry(() => import('./pages/support/SystemStatus'));
const Article = lazyRetry(() => import('./pages/support/Article'));
const SpeedTest = lazyRetry(() => import('./pages/support/SpeedTest'));
const Guide = lazyRetry(() => import('./pages/support/Guide'));
const AIChat = lazyRetry(() => import('./pages/support/AIChat'));
const DownloadApp = lazyRetry(() => import('./pages/DownloadApp'));
const News = lazyRetry(() => import('./pages/News'));

const ClientLayout = lazyRetry(() => import('./pages/client/ClientLayout'));
const ClientAccount = lazyRetry(() => import('./pages/client/ClientAccount'));
const ClientSubscription = lazyRetry(() => import('./pages/client/ClientSubscription'));
const ClientDevices = lazyRetry(() => import('./pages/client/ClientDevices'));
const ClientHistory = lazyRetry(() => import('./pages/client/ClientHistory'));
const ClientSecurity = lazyRetry(() => import('./pages/client/ClientSecurity'));
const ClientSettings = lazyRetry(() => import('./pages/client/ClientSettings'));
const ClientSupport = lazyRetry(() => import('./pages/client/ClientSupport'));
const NewTicket = lazyRetry(() => import('./pages/client/NewTicket'));

const AdminLayout = lazyRetry(() => import('./pages/admin/AdminLayout'));
const AdminDashboard = lazyRetry(() => import('./pages/admin/AdminDashboard'));
const ChannelManager = lazyRetry(() => import('./pages/admin/ChannelManager'));
const AdminCustomers = lazyRetry(() => import('./pages/admin/Customers'));
const AdminTickets = lazyRetry(() => import('./pages/admin/SupportTickets'));
const AdminAnalytics = lazyRetry(() => import('./pages/admin/Analytics'));
const AdminSlider = lazyRetry(() => import('./pages/admin/SliderManager'));
const AdminDemoReel = lazyRetry(() => import('./pages/admin/DemoReelManager'));
const AdminSchedule = lazyRetry(() => import('./pages/admin/ScheduleManager'));
const AdminPrograms = lazyRetry(() => import('./pages/admin/ProgramManager'));
const CRMDashboard = lazyRetry(() => import('./pages/admin/CRMDashboard'));
const CRMContacts = lazyRetry(() => import('./pages/admin/Contacts'));
const CRMCompanies = lazyRetry(() => import('./pages/admin/Companies'));
const CRMDeals = lazyRetry(() => import('./pages/admin/Deals'));
const CRMActivities = lazyRetry(() => import('./pages/admin/Activities'));

const BasicPlan = lazyRetry(() => import('./pages/pricing/BasicPlan'));
const StandardPlan = lazyRetry(() => import('./pages/pricing/StandardPlan'));
const PremiumPlan = lazyRetry(() => import('./pages/pricing/PremiumPlan'));
const UltimatePlan = lazyRetry(() => import('./pages/pricing/UltimatePlan'));
const AdultPlan = lazyRetry(() => import('./pages/pricing/AdultPlan'));
const BronzePlan = lazyRetry(() => import('./pages/pricing/BronzePlan'));
const SilverPlan = lazyRetry(() => import('./pages/pricing/SilverPlan'));
const GoldPlan = lazyRetry(() => import('./pages/pricing/GoldPlan'));
const PlatinumPlan = lazyRetry(() => import('./pages/pricing/PlatinumPlan'));

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-900">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
      <p className="mt-4 text-gray-400">Loading...</p>
    </div>
  </div>
);

function App() {
  // Clear chunk reload flag on successful load
  sessionStorage.removeItem('chunk-reload');
  
  return (
    <Router>
      <InstallPrompt />
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="pricing" element={<Pricing />} />
            <Route path="pricing/basic" element={<BasicPlan />} />
            <Route path="pricing/standard" element={<StandardPlan />} />
            <Route path="pricing/premium" element={<PremiumPlan />} />
            <Route path="pricing/ultimate" element={<UltimatePlan />} />
            <Route path="pricing/adult" element={<AdultPlan />} />
            <Route path="pricing/bronze" element={<BronzePlan />} />
            <Route path="pricing/silver" element={<SilverPlan />} />
            <Route path="pricing/gold" element={<GoldPlan />} />
            <Route path="pricing/platinum" element={<PlatinumPlan />} />
            <Route path="checkout" element={<CheckoutPage />} />
            <Route path="support" element={<Support />} />
            <Route path="knowledge-base" element={<KnowledgeBase />} />
            <Route path="free-trial" element={<FreeTrial />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="landing" element={<LandingPage />} />
            <Route path="standalone-landing" element={<StandaloneLanding />} />
            <Route path="privacy" element={<Privacy />} />
            <Route path="terms" element={<Terms />} />
            <Route path="refund-policy" element={<RefundPolicy />} />
            <Route path="testimonials" element={<Testimonials />} />
            <Route path="cookies" element={<CookiePolicy />} />
            <Route path="ppv" element={<PPV />} />
            <Route path="content/:type/:id" element={<ContentDetail />} />
            <Route path="about" element={<AboutUs />} />
            <Route path="services" element={<OurServices />} />
            <Route path="web-tv-player" element={<WebTVPlayer />} />
            <Route path="reselling" element={<Reselling />} />

            <Route path="support/ai-chat" element={<AIChat />} />
            <Route path="support/getting-started" element={<GettingStarted />} />
            <Route path="support/billing" element={<Billing />} />
            <Route path="support/streaming" element={<StreamingHelp />} />
            <Route path="support/devices" element={<DeviceSetup />} />
            <Route path="support/network" element={<NetworkHelp />} />
            <Route path="support/status" element={<SystemStatus />} />
            <Route path="support/article/:slug" element={<Article />} />
            <Route path="support/speed-test" element={<SpeedTest />} />
            <Route path="support/guide/:slug" element={<Guide />} />
            <Route path="download-app" element={<DownloadApp />} />
            <Route path="news" element={<News />} />

            <Route path="client" element={<ClientLayout />}>
              <Route path="account" element={<ClientAccount />} />
              <Route path="subscription" element={<ClientSubscription />} />
              <Route path="devices" element={<ClientDevices />} />
              <Route path="history" element={<ClientHistory />} />
              <Route path="security" element={<ClientSecurity />} />
              <Route path="settings" element={<ClientSettings />} />
              <Route path="support" element={<ClientSupport />} />
              <Route path="support/new" element={<NewTicket />} />
            </Route>
          </Route>

          <Route path="admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="channels" element={<ChannelManager />} />
              <Route path="customers" element={<AdminCustomers />} />
              <Route path="tickets" element={<AdminTickets />} />
              <Route path="analytics" element={<AdminAnalytics />} />
              <Route path="slider" element={<AdminSlider />} />
              <Route path="demo-reel" element={<AdminDemoReel />} />
              <Route path="schedule" element={<AdminSchedule />} />
              <Route path="programs" element={<AdminPrograms />} />
              <Route path="crm" element={<CRMDashboard />} />
              <Route path="crm/contacts" element={<CRMContacts />} />
              <Route path="crm/companies" element={<CRMCompanies />} />
              <Route path="crm/deals" element={<CRMDeals />} />
              <Route path="crm/activities" element={<CRMActivities />} />
            </Route>
          </Routes>
      </Suspense>
    </Router>
  );
}

export default App;