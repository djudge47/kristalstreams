export type PackageDuration = { count: number; unit: string; credits: number };
export type RoombaPackage = { id: string; name: string; maxConnections: number | null; bouquets: number[] | null; trial: PackageDuration | null; paid: PackageDuration | null; issues: string[] };
export type SetupInput = { packageId: string; mode: 'trial' | 'paid'; username: string; password: string; connections: number; notes: string };
export type SetupDraft = { draftOnly: true; sent: false; packageId: string; packageName: string; accessType: 'trial' | 'paid'; duration: string; estimatedCredits: number; fields: { trial: string; username: string; password: string; package: string; package_duration: string; max_connections: string; 'bouquets_selected[]': string[]; reseller_notes: string } };
export function normalizePackages(records: unknown, secrets?: string[]): RoombaPackage[];
export function buildSetupDraft(input: SetupInput, packages: RoombaPackage[]): SetupDraft;
