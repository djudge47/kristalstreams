export type BulkCustomer = {
  id: string; external_id: number | string; username: string; package_name: string | null;
  connections_allowed: number; expiration_at: string | null; account_status: string; trial: boolean;
};
export type BulkField = { name: string; saved: string | number | boolean | null; provider: string | number | boolean | null; status: 'unverified' | 'match' | 'different' };
export type BulkRow = { customerId: string; panelId: string; username: string; status: 'match' | 'review' | 'failed'; checkedAt: string | null; fields: BulkField[]; error?: string };
export type BulkProgress = { state: 'checking' | 'waiting' | 'checked' | 'complete' | 'stopped'; completed: number; total: number; username: string; rows: BulkRow[]; waitSeconds?: number; error?: string };
export function bulkCustomerSnapshot(customers: BulkCustomer[]): BulkCustomer[];
export function compareBulkLine(customer: BulkCustomer, payload: unknown, now?: number): BulkRow;
export function runBulkXuiCheck(options: {
  customers: BulkCustomer[]; getToken: () => Promise<string | null>; fetchImpl?: typeof fetch;
  signal?: AbortSignal; onProgress?: (progress: BulkProgress) => void;
}): Promise<{ rows: BulkRow[]; complete: boolean }>;
