interface SetupHelpBase {
  reference: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  interval: 'monthly' | '3 months' | '6 months' | 'yearly';
  connections: number;
  amountCents: number;
  currency: 'usd';
  recordedAt: string;
}
export type SetupHelpOrder = SetupHelpBase & (
  | { status: 'awaiting_activation' | 'requires_review'; testMode: boolean; providerActivated: false; expiresAt?: never }
  | { status: 'setup_complete'; testMode: true; providerActivated: true; expiresAt: string }
  | { status: 'renewal_complete'; testMode: false; providerActivated: false; renewalCompleted: true; completedAt: string; expiresAt: string }
  | { status: 'setup_expired'; testMode: true; providerActivated: false; expiresAt: string }
);
export function readSetupHelpOrders(payload: unknown, accountId: string): { orders: SetupHelpOrder[]; checkedAt: string };
export function setupHelpDetails(order: SetupHelpOrder, checkedAt: string): string;
