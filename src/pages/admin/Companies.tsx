import React from 'react';
import { Building2 } from 'lucide-react';
import CRMPage from './CRMPage';

const Companies: React.FC = () => (
  <CRMPage
    title="Companies"
    table="crm_companies"
    fields={[
      { key: 'name', label: 'Company Name', required: true },
      { key: 'industry', label: 'Industry' },
      { key: 'website', label: 'Website' },
      { key: 'phone', label: 'Phone' },
      { key: 'notes', label: 'Notes', type: 'textarea' },
    ]}
    icon={<Building2 size={48} className="mx-auto text-gray-600" />}
  />
);
export default Companies;
