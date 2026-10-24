import { useCallback, useEffect, useRef, useState } from 'react';
import { SupportFailure, type SupportScope } from './support-tickets';

type ReadState<T> = { key: string; status: 'loading' | 'unavailable' | 'changed' | 'missing'; value?: never } | { key: string; status: 'ready'; value: T };
export function useSupportRead<T>(key: string, loader: (scope: SupportScope) => Promise<T>) {
  const [state, setState] = useState<ReadState<T>>({ key, status: 'loading' });
  const active = useRef(false), version = useRef(0), request = useRef<AbortController | null>(null);
  const timer = useRef<number | undefined>();
  const reload = useCallback(async () => {
    if (!active.current) return;
    request.current?.abort(); window.clearTimeout(timer.current);
    const controller = new AbortController(); request.current = controller; const generation = ++version.current;
    const isCurrent = () => active.current && version.current === generation && request.current === controller;
    setState({ key, status: 'loading' });
    const deadline = window.setTimeout(() => { if (!isCurrent()) return; request.current = null; controller.abort(); setState({ key, status: 'unavailable' }); }, 20000); timer.current = deadline;
    try { const value = await loader({ signal: controller.signal, isCurrent }); if (isCurrent()) setState({ key, status: 'ready', value }); }
    catch (error) { if (isCurrent()) setState({ key, status: error instanceof SupportFailure && (error.code === 'changed' || error.code === 'missing') ? error.code : 'unavailable' }); }
    finally { window.clearTimeout(deadline); if (request.current === controller) request.current = null; }
  }, [key, loader]);
  useEffect(() => {
    active.current = true; void reload();
    return () => { active.current = false; request.current?.abort(); request.current = null; window.clearTimeout(timer.current); };
  }, [reload]);
  return { ...(state.key === key ? state : { key, status: 'loading' as const }), reload };
}
