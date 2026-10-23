import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Bot, Send } from 'lucide-react';
import { hasSupabaseConfig, supabase } from '../../lib/supabase';
import { maxChatInput, maxVisibleChatMessages, requestGeneralReply } from '../../lib/general-chat';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  inContext: boolean;
  replyUnavailable?: boolean;
}
const greeting = (): Message[] => [{ id: 0, role: 'assistant', content: 'How can I help with general setup or troubleshooting? For confirmed account, payment or service details, contact support.', inContext: false }];
interface ChatRequest { controller: AbortController; epoch: number; id: number }

export default function AIChat() {
  const [messages, setMessages] = useState<Message[]>(greeting);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const owner = useRef<string | null | undefined>(undefined);
  const epoch = useRef(0);
  const sequence = useRef(0);
  const mounted = useRef(false);
  const pending = useRef<ChatRequest | null>(null);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    mounted.current = true;
    const discard = () => { epoch.current += 1; const previous = pending.current; pending.current = null; previous?.controller.abort(); };
    let unsubscribe = () => {};
    if (!hasSupabaseConfig) {
      setError('Chat is unavailable on this site. Please use the help guides or support tickets.');
    } else {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (!mounted.current) return;
        const next = session?.user.id ?? null;
        if (owner.current !== undefined && (owner.current !== next || event === 'SIGNED_OUT')) {
          discard(); setMessages(greeting()); setInput(''); setError(null); setLoading(false);
          setNotice('Your sign-in changed. A new chat has started on this page.');
        }
        owner.current = next;
        setReady(true);
      });
      unsubscribe = () => subscription.unsubscribe();
    }
    return () => { mounted.current = false; discard(); unsubscribe(); };
  }, []);

  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [messages, loading]);

  const clearChat = () => {
    epoch.current += 1;
    const previous = pending.current; pending.current = null; previous?.controller.abort();
    setMessages(greeting()); setInput(''); setError(null); setLoading(false);
    setNotice('Chat cleared from this page. A submitted request may still be processed by the chat service.');
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const text = input.trim();
    if (!ready || owner.current === undefined || pending.current || !text) return;
    if (text.length > maxChatInput) { setError('Use no more than 2,000 characters.'); return; }
    const request: ChatRequest = { controller: new AbortController(), epoch: epoch.current, id: ++sequence.current };
    pending.current = request;
    const current = () => mounted.current && pending.current === request && epoch.current === request.epoch;
    const history = messages.filter(message => message.inContext).map(message => ({ role: message.role, content: message.content }));
    const question: Message = { id: request.id, role: 'user', content: text, inContext: false };
    setMessages(previous => [...previous, question].slice(-maxVisibleChatMessages));
    setInput(''); setLoading(true); setError(null); setNotice(null);
    try {
      const answer = await requestGeneralReply(text, history, owner.current, request.controller.signal);
      if (!current()) return;
      const reply: Message = { id: ++sequence.current, role: 'assistant', content: answer, inContext: true };
      setMessages(previous => [...previous.map(message => message.id === request.id ? { ...message, inContext: true } : message), reply].slice(-maxVisibleChatMessages));
    } catch (problem) {
      if (!current()) return;
      setMessages(previous => previous.map(message => message.id === request.id ? { ...message, replyUnavailable: true } : message));
      setError(problem instanceof Error ? problem.message : 'A reply could not be confirmed. Contact support for help.');
    } finally {
      if (current()) { pending.current = null; setLoading(false); }
    }
  };

  return (
    <div className="min-h-screen bg-dark-300 py-32">
      <div className="container mx-auto max-w-4xl px-4">
        <div className="overflow-hidden rounded-xl border border-gray-800 bg-dark-100 shadow-xl">
          <div className="bg-gradient-to-r from-primary to-red-700 p-6 text-white"><div className="flex items-center gap-3"><Bot className="h-7 w-7" aria-hidden="true" /><h1 className="text-2xl font-bold">AI Support Assistant</h1></div><p className="mt-2 text-sm text-white/90">General guidance for setup and troubleshooting. Account records and live service status are not checked here.</p></div>
          <div className="border-b border-gray-800 p-5 text-sm text-gray-300">
            <p>This page does not save a browsable chat history. Leaving or reloading clears the conversation shown here. Submitted messages and recent context are sent to the chat service. Keep passwords, playback URLs and payment details out of chat.</p>
            <div className="mt-3 flex flex-wrap gap-5"><button type="button" onClick={clearChat} className="text-primary underline">Clear This Chat</button><Link to="/support/chat-history" className="text-primary underline">About Chat History</Link><Link to="/client/support/new" className="text-primary underline">Open a Support Ticket</Link></div>
          </div>
          <div role="log" aria-label="Current chat messages" aria-live="polite" aria-busy={loading} className="h-[min(55vh,500px)] min-h-72 space-y-4 overflow-y-auto bg-dark-200 p-5 sm:p-6">
            {messages.map(message => <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[90%] rounded-xl p-4 sm:max-w-[80%] ${message.role === 'user' ? 'bg-primary text-white' : 'bg-dark-100 text-gray-200'}`}><p className="mb-1 text-xs font-semibold opacity-75">{message.role === 'user' ? 'You' : 'Assistant'}</p><p className="whitespace-pre-wrap break-words">{message.content}</p>{message.replyUnavailable && <p className="mt-2 text-xs">Reply unavailable</p>}</div></div>)}
            {loading && <p role="status" className="text-sm text-gray-400">Waiting for a reply…</p>}
            <div ref={end} />
          </div>
          <form onSubmit={submit} className="space-y-3 border-t border-gray-800 p-5 sm:p-6">
            {notice && <p role="status" className="text-sm text-gray-300">{notice}</p>}
            {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
            <label htmlFor="general-chat-question" className="block text-sm font-medium text-gray-300">Your question</label>
            <textarea id="general-chat-question" rows={2} maxLength={maxChatInput} value={input} onChange={event => setInput(event.target.value)} disabled={!ready || loading} placeholder="Ask a general setup or troubleshooting question…" className="w-full resize-y rounded-lg border border-gray-700 bg-dark-200 px-4 py-3 text-white focus:border-primary focus:outline-none disabled:opacity-50" />
            <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-gray-400">{ready ? 'Latest 40 messages shown; only recent confirmed replies are used as context.' : 'Checking chat availability…'}</p><button type="submit" disabled={!ready || loading || !input.trim()} className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 font-semibold text-white hover:bg-red-700 disabled:bg-gray-700"><Send size={18} aria-hidden="true" />{loading ? 'Sending…' : 'Send'}</button></div>
          </form>
        </div>
        <nav aria-label="Chat help" className="mt-6 flex flex-wrap gap-5 text-sm"><Link to="/knowledge-base" className="text-primary underline">Help Guides</Link><Link to="/client/support" className="text-primary underline">Support Tickets</Link><Link to="/support" className="text-gray-300 underline">Support Center</Link></nav>
      </div>
    </div>
  );
}
