// A saved destination selects a page, never an account or authorization level.
// Admin and customer pages still perform their normal access checks.
export function loginDestination(from: unknown): string {
  if (typeof from !== 'string' || !from.startsWith('/') || from.startsWith('//')
    || [...from].some(character => character === '\\' || character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127)) return '/dashboard';

  try {
    const target = new URL(from, 'https://kristal.invalid');
    if (target.origin !== 'https://kristal.invalid') return '/dashboard';
    const allowed = target.pathname === '/free-trial' || target.pathname === '/dashboard'
      || /^\/(admin|client)(\/|$)/.test(target.pathname);
    return allowed ? `${target.pathname}${target.search}${target.hash}` : '/dashboard';
  } catch {
    return '/dashboard';
  }
}
