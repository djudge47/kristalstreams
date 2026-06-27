import React from 'react';
import { Handshake } from 'lucide-react';
import CRMPage from './CRMPage';

const Deals: React.FC = () => (
  <CRMPage
    title="Deals"
    table="crm_deals"
    fields={[
      { key: 'name', label: 'Deal Name', required: true },
      { key: 'value', label: 'Value', type: 'number' },
      { key: 'stage', label: 'Stage', type: 'select' },
      { key: 'contact_name', label: 'Contact' },
      { key: 'notes', label: 'Notes', type: 'textarea' },
    ]}
    icon={<Handshake size={48} className="mx-auto text-gray-600" />}
  />
);
export default Deals;
