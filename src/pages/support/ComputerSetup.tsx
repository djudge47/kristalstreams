import SupportPage from './SupportPage';
import { supportDocuments } from '../../lib/help-content';

export default function ComputerSetup() {
  return <SupportPage {...supportDocuments.computer} />;
}
