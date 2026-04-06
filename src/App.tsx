import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import InstallPrompt from './components/InstallPrompt'


const Home = lazy(() => import('./pages/Home'));
const Pricing = lazy(() => import('./pages/Pricing'));
const Support = lazy(() => import('./pages/Support'));
const FreeTrial = lazy(() => import('./pages/FreeTrial'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const LandingPage = lazy(() => import('./pages/LandingPage'));
const StandaloneLanding = lazy(() => import('./pages/StandaloneLanding'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Terms = lazy(() => import('./pages/Terms'));
const RefundPolicy = lazy(() => import('./pages/RefundPolicy'));
const Testimonials = lazy(() => import('./pages/Testimonials'));
const CookiePolicy = lazy(() => import('./pages/CookiePolicy'));
const KnowledgeBase = lazy(() => import('./pages/KnowledgeBase'));
const CheckoutPage = lazy(() => import('./pages/pricing/CheckoutPage'));
const PPV = lazy(() => import('./pages/PPV'));
const ContentDetail = lazy(() => import('./pages/ContentDetail'));
const AboutUs = lazy(() => import('./pages/AboutUs'));
const OurServices = lazy(() => import('./pages/OurServices'));
const WebTVPlayer = lazy(() => import('./pages/WebTVPlayer'));
const Reselling = lazy(() => import('./pages/Reselling'));

const GettingStarted = lazy(() => import('./pages/support/GettingStarted'));
const Billing = lazy(() => import('./pages/support/Billing'));
const StreamingHelp = lazy(() => import('./pages/support/StreamingHelp'));
const DeviceSetup = lazy(() => import('./pages/support/DeviceSetup'));
const NetworkHelp = lazy(() => import('./pages/support/NetworkHelp'));
const SystemStatus = lazy(() => import('./pages/support/SystemStatus'));
const Article = lazy(() => import('./pages/support/Article'));
const SpeedTest = lazy(() => import('./pages/support/SpeedTest'));
const Guide = lazy(() => import('./pages/support/Guide'));
const AIChat = lazy(() => import('./pages/support/AIChat'));
const DownloadApp = lazy(() => import('./pages/DownloadApp'));
const News = lazy(() => import('./pages/News'));

const ClientLayout = lazy(() => import('./pages/client/ClientLayout'));
const ClientAccount = lazy(() => import('./pages/client/ClientAccount'));
const ClientSubscription = lazy(() => import('./pages/client/ClientSubscription'));
const ClientDevices = lazy(() => import('./pages/client/ClientDevices'));
const ClientHistory = lazy(() => import('./pages/client/ClientHistory'));
const ClientSecurity = lazy(() => import('./pages/client/ClientSecurity'));
const ClientSettings = lazy(() => import('./pages/client/ClientSettings'));
const ClientSupport = lazy(() => import('./pages/client/ClientSupport'));
const NewTicket = lazy(() => import('./pages/client/NewTicket'));

const BasicPlan = lazy(() => import('./pages/pricing/BasicPlan'));
const StandardPlan = lazy(() => import('./pages/pricing/StandardPlan'));
const PremiumPlan = lazy(() => import('./pages/pricing/PremiumPlan'));
const UltimatePlan = lazy(() => import('./pages/pricing/UltimatePlan'));
const AdultPlan = lazy(() => import('./pages/pricing/AdultPlan'));
const BronzePlan = lazy(() => import('./pages/pricing/BronzePlan'));
const SilverPlan = lazy(() => import('./pages/pricing/SilverPlan'));
const GoldPlan = lazy(() => import('./pages/pricing/GoldPlan'));
const PlatinumPlan = lazy(() => import('./pages/pricing/PlatinumPlan'));

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-900">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
      <p className="mt-4 text-gray-400">Loading...</p>
    </div>
  </div>
);

function App() {
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
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;