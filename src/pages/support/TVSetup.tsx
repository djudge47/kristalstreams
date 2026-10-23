import SupportPage from './SupportPage';
import { supportDocuments } from '../../lib/help-content';

export default function TVSetup() {
  return <SupportPage {...supportDocuments.tv} />;
}
