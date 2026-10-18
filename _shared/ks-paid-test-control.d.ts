import type { PaidReviewExpected, PaidActivationReview } from './ks-paid-review-response.js';
export interface PaidTestControl {
  state: 'disabled' | 'not_started' | 'reserved' | 'processing' | 'completion_pending' | 'complete' | 'reconciliation_required' | 'review_ready';
  canPrepare: boolean; canExecute: boolean; canComplete: boolean;
  review?: PaidActivationReview; approvalToken?: string; expiresAt?: string;
}
export function parsePaidTestControl(raw: unknown, expected: PaidReviewExpected, adminId: string, now?: number): PaidTestControl;
