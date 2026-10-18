export interface PaidReviewExpected { reference: string; customerId: string; tier: string; connections: number; interval: string; amountCents: number; }
export interface PaidActivationReview { customerEmail: string; creditCostUnits: string; balanceUnits: string; projectedBalanceUnits: string | null; checkedAt: string; providerMonths: number; connections: number; blockers: string[]; status: 'blocked' | 'review_only'; }
export const paidReviewBlockers: Record<string, string>;
export function parsePaidActivationReview(raw: unknown, expected: PaidReviewExpected, adminId: string): PaidActivationReview;
export function formatCreditUnits(value: string): string;
