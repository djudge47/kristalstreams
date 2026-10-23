import { Link, useParams } from 'react-router-dom';
import { findSetupGuide } from '../../lib/help-content';
import SupportPage from './SupportPage';

export default function Guide() {
  const { slug } = useParams<{ slug: string }>();
  const guide = findSetupGuide(slug);
  if (!guide) return (
    <div className="min-h-screen bg-dark-300 px-4 py-32 text-center">
      <h1 className="mb-4 text-3xl font-bold text-white">Guide not found</h1>
      <p className="mb-6 text-gray-400">Choose the instructions for your device from the setup guides.</p>
      <Link to="/support/devices" className="text-primary hover:underline">Browse device setup guides</Link>
    </div>
  );
  return <SupportPage {...guide} backLink={{ title: 'Back to Device Setup Guides', url: '/support/devices' }} />;
}
