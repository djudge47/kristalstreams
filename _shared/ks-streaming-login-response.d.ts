export type StreamingLogin = { username: string; password: string };
export function parseLoginAvailability(raw: unknown, accountId: string): { reference: string; expiresAt: string }[];
export function parseStreamingLogin(raw: unknown, accountId: string, reference: string): StreamingLogin;
