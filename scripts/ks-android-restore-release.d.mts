export const androidRelease: Readonly<{ versionCode: number; bytes: number; sha256: string }>;
export function loadApprovedAndroidApk(): Promise<Uint8Array>;
export function materializeAndroidRelease(base: Uint8Array, encoded: string): Uint8Array;
