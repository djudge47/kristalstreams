export const unavailableAdminModules = [
  { path: '/admin/analytics', title: 'Analytics', description: 'Website visitor, conversion and revenue reporting is not connected here. Received-payment information is available in the Customer Workspace.' },
  { path: '/admin/slider', title: 'Slider Manager', description: 'Homepage banner editing is not connected. This screen cannot add, change or delete banners.' },
  { path: '/admin/demo-reel', title: 'Demo Reel Manager', description: 'Demo-video management is not connected. This screen cannot upload, edit or publish videos.' },
  { path: '/admin/programs', title: 'Program Manager', description: 'Program and channel-catalog management is not connected. This screen cannot change channel listings or streaming-provider content.' },
  { path: '/admin/crm/contacts', title: 'Contacts', description: 'A separate contact directory is not available. Saved streaming-customer contact details remain in the Customer Workspace.' },
  { path: '/admin/crm/companies', title: 'Companies', description: 'A company directory is not available. This screen does not contain a verified company list or editing workflow.' },
  { path: '/admin/crm/deals', title: 'Deals', description: 'Sales-pipeline management is not available. This screen does not provide verified deals, pipeline totals or editing controls.' },
  { path: '/admin/crm/activities', title: 'Activities', description: 'A separate general-activity workspace is not available. Existing customer history and follow-ups remain in the Customer Workspace.' },
] as const;

export function unavailableAdminModule(pathname: string) {
  const normalized = pathname.toLowerCase().replace(/\/+$/, '');
  return unavailableAdminModules.find(module => module.path === normalized);
}

export const adminShortcuts = [
  { path: '/admin', label: 'Overview' },
  { path: '/admin/crm', label: 'Customer Workspace' },
  { path: '/admin/tickets', label: 'Support Tickets' },
  { path: '/admin/modules', label: 'Unavailable Modules' },
] as const;
