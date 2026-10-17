export interface SetupHelpOrder {
  reference: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  interval: 'monthly' | '3 months' | '6 months' | 'yearly';
  connections: number;
  amountCents: number;
  currency: 'usd';
  recordedAt: string;
  status: 'awaiting_activation';
  testMode: true;
  providerActivated: false;
}
export function readSetupHelpOrders(payload: unknown, accountId: string): { orders: SetupHelpOrder[]; checkedAt: string };
export function setupHelpDetails(order: SetupHelpOrder, checkedAt: string): string;
