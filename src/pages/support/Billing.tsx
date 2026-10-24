import SupportPage from './SupportPage';
import { supportDocuments } from '../../lib/help-content';

export default function Billing() {
  return <SupportPage {...supportDocuments.billing} />;
}
