import SupportPage from './SupportPage';
import { supportDocuments } from '../../lib/help-content';

export default function StreamingHelp() {
  return <SupportPage {...supportDocuments.streaming} />;
}
