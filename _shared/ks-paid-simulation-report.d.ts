export type PaidSimulationPlan = { tier: string; connections: number; interval: string; amountCents: number };
export type PaidSimulationReport = { plan: PaidSimulationPlan & { providerMonths: number; expectedProviderCredits: number; bouquetCount: number };
  checks: { id: string; label: string; state: string; passed: boolean; simulatedCreates: number; simulatedCredits: number }[]; catalogCheckedAt: string };
export const paidSimulationCases: string[][];
export function parsePaidSimulationReport(raw: unknown, expected: PaidSimulationPlan): PaidSimulationReport;
