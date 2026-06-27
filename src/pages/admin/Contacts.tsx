import React from 'react';
import { Users } from 'lucide-react';
import CRMPage from './CRMPage';

const Contacts: React.FC = () => (
  <CRMPage
    title="Contacts"
    table="crm_contacts"
    fields={[
      { key: 'name', label: 'Name', required: true },
      { key: 'email', label: 'Email', type: 'email' },
      { key: 'phone', label: 'Phone' },
      { key: 'company', label: 'Company' },
      { key: 'notes', label: 'Notes', type: 'textarea' },
    ]}
    icon={<Users size={48} className="mx-auto text-gray-600" />}
  />
);
export default Contacts;
