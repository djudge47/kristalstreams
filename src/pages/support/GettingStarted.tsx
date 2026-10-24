import SupportPage from './SupportPage';
import { supportDocuments } from '../../lib/help-content';

export default function GettingStarted() {
  return <SupportPage {...supportDocuments.gettingStarted} />;
}
