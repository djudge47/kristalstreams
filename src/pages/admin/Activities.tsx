import React from 'react';
import { Activity } from 'lucide-react';
import CRMPage from './CRMPage';

const Activities: React.FC = () => (
  <CRMPage
    title="Activities"
    table="crm_activities"
    fields={[
      { key: 'type', label: 'Type', required: true },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'contact_name', label: 'Contact' },
      { key: 'deal_name', label: 'Deal' },
      { key: 'date', label: 'Date', type: 'date' },
    ]}
    icon={<Activity size={48} className="mx-auto text-gray-600" />}
  />
);
export default Activities;
