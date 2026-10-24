import { invokeGeneralChat } from './supabase';

export interface ChatContextMessage { role: 'user' | 'assistant'; content: string }
export const maxChatInput = 2000;
export const maxChatReply = 12000;
export const maxVisibleChatMessages = 40;

export function requestGeneralReply(message: string, history: ChatContextMessage[], ownerId: string | null, signal: AbortSignal): Promise<string> {
  const text = message.trim();
  if (!text || text.length > maxChatInput) return Promise.reject(new Error('Use 1–2,000 characters for your question.'));
  const conversationHistory = history.filter(item => (item.role === 'user' || item.role === 'assistant') && typeof item.content === 'string' && item.content.trim().length > 0 && item.content.length <= maxChatReply)
    .slice(-10).map(item => ({ role: item.role, content: item.content }));
  return new Promise((resolve, reject) => {
    let finished = false;
    const finish = (reply: string | null, error?: Error) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      signal.removeEventListener('abort', discarded);
      if (error) reject(error); else resolve(reply!);
    };
    const discarded = () => finish(null, new Error('This chat was cleared or the account changed.'));
    const timer = setTimeout(() => finish(null, new Error('The reply could not be confirmed in time. Your message may have been processed. No automatic retry was made.')), 20000);
    if (signal.aborted) { discarded(); return; }
    signal.addEventListener('abort', discarded, { once: true });
    void invokeGeneralChat({ message: text, conversationHistory }, ownerId, signal).then(({ data, error }) => {
      if (error || !data || typeof data.message !== 'string' || !data.message.trim() || data.message.length > maxChatReply) {
        finish(null, new Error('A valid reply could not be confirmed. Your message may have been processed. You can try another question or contact support.'));
        return;
      }
      finish(data.message.trim());
    }, () => finish(null, new Error('The chat service could not be reached. Your message may have been processed. No automatic retry was made.')));
  });
}
