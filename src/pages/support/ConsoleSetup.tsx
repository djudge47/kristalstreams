import SupportPage from './SupportPage';
import { supportDocuments } from '../../lib/help-content';

export default function ConsoleSetup() {
  return <SupportPage {...supportDocuments.console} />;
}
