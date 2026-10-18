import type { RoombaPackage } from './ks-roomba-setup.js';
export type PackageSummary = { schemaVersion: 1; purpose: string; readOnly: true; checkedAt: string; packages: RoombaPackage[] };
export function buildPackageSummary(packages: RoombaPackage[], checkedAt: string): PackageSummary;
