import React, { useEffect, useRef, useState } from 'react';
import { Bot, Loader, Send, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const AIChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your AI support assistant. How can I help you today? I can assist with:\n\n• Account and subscription questions\n• Streaming issues and troubleshooting\n• Device setup and compatibility\n• Billing and payment inquiries\n• Channel information and EPG\n• Technical support',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    const conversationHistory = messages.slice(-10).map((message) => ({
      role: message.role,
      content: message.content,
    }));

    setMessages((previous) => [...previous, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error: functionError } = await supabase.functions.invoke('ai-chat', {
        body: {
          message: userMessage.content,
          conversationHistory,
        },
      });

      if (functionError) throw functionError;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data?.message || 'I apologize, but I encountered an error. Please try again or contact support.',
        timestamp: new Date(),
      };

      setMessages((previous) => [...previous, assistantMessage]);

      if (user?.id) {
        await supabase.from('chat_messages').insert([
          {
            user_id: user.id,
            session_id: sessionId,
            role: 'user',
            content: userMessage.content,
          },
          {
            user_id: user.id,
            session_id: sessionId,
            role: 'assistant',
            content: assistantMessage.content,
          },
        ]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((previous) => [
        ...previous,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'I apologize, but I\'m having trouble connecting right now. Please try again in a moment or contact our support team directly.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date: Date) => new Date(date).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <div className="min-h-screen py-32 bg-dark-300">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-dark-100 rounded-xl shadow-2xl overflow-hidden border border-gray-800">
          <div className="bg-gradient-to-r from-primary to-red-700 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-white/10 rounded-lg mr-4">
                <Bot className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">AI Support Assistant</h1>
                <p className="text-white/80">Always here to help you</p>
              </div>
            </div>
          </div>

          <div className="h-[500px] overflow-y-auto p-6 space-y-4 bg-dark-200">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`flex items-start max-w-[80%] ${
                    message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  <div
                    className={`p-2 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-primary/20 ml-2'
                        : 'bg-dark-100 mr-2'
                    }`}
                  >
                    {message.role === 'user' ? (
                      <User className="w-5 h-5 text-primary" />
                    ) : (
                      <Bot className="w-5 h-5 text-primary" />
                    )}
                  </div>
                  <div>
                    <div
                      className={`p-4 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-primary text-white'
                          : 'bg-dark-100 text-gray-200'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 px-2">
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="flex items-start max-w-[80%]">
                  <div className="p-2 rounded-lg bg-dark-100 mr-2">
                    <Bot className="w-5 h-5 text-primary" />
                  </div>
                  <div className="p-4 rounded-lg bg-dark-100">
                    <Loader className="w-5 h-5 text-primary animate-spin" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} className="p-6 bg-dark-100 border-t border-gray-800">
            <div className="flex items-center gap-4">
              <input
                type="text"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Type your message..."
                disabled={loading}
                className="flex-1 bg-dark-200 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-primary disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="bg-primary hover:bg-red-700 text-white p-3 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              This AI assistant can help with common questions. For complex issues, please contact our support team.
            </p>
          </form>
        </div>

        <div className="mt-6 text-center">
          <p className="text-gray-400 text-sm">
            Need more help?{' '}
            <a href="/support" className="text-primary hover:underline">
              Visit Support Center
            </a>
            {' '}or{' '}
            <a href="/client/support" className="text-primary hover:underline">
              Create a Support Ticket
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIChat;
