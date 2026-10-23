import SupportPage from './SupportPage';
import { supportDocuments } from '../../lib/help-content';

export default function MobileSetup() {
  return <SupportPage {...supportDocuments.mobile} />;
}
