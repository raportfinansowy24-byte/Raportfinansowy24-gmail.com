import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Loader2, Bot, User, Trash2 } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
}

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Load history from localStorage
  useEffect(() => {
    const savedMessages = localStorage.getItem('cashmaker_chat_history');
    if (savedMessages) {
      try {
        setMessages(JSON.parse(savedMessages));
      } catch (e) {
        console.error('Failed to parse chat history', e);
      }
    }
  }, []);

  // Save history to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('cashmaker_chat_history', JSON.stringify(messages));
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      initChat();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleOpenChat = (e: Event) => {
      const customEvent = e as CustomEvent<{ prompt?: string }>;
      setIsOpen(true);
      if (customEvent.detail?.prompt) {
        sendDirectPrompt(customEvent.detail.prompt);
      }
    };
    window.addEventListener('open_ai_chat', handleOpenChat);
    return () => {
      window.removeEventListener('open_ai_chat', handleOpenChat);
    };
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendDirectPrompt = async (userMessage: string) => {
    const currentMessages = [...messages];
    
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage
    }]);

    setIsLoading(true);

    try {
      const history = currentMessages.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.content }]
      }));
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          history: history,
          message: userMessage
        })
      });
      
      if (!response.ok) throw new Error('Błąd serwera');
      const data = await response.json();
      
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: data.text || 'Oto analiza Twojego raportu finansowego.'
      }]);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: 'Wystąpił błąd podczas analizowania raportu przez AI. Spróbuj ponownie.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const initChat = async () => {
    if (messages.length > 0) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          history: [],
          message: 'Zacznij rozmowę, przywitaj się i zapytaj w czym możesz pomóc.'
        })
      });
      
      if (!response.ok) throw new Error('Błąd komunikacji z serwerem');
      const data = await response.json();
      
      setMessages([{
        id: Date.now().toString(),
        role: 'model',
        content: data.text || 'Witaj! Jestem Twoim osobistym doradcą finansowym AI. W czym mogę Ci dzisiaj pomóc?'
      }]);
    } catch (error) {
      console.error('Error initializing chat:', error);
      setMessages([{
        id: Date.now().toString(),
        role: 'model',
        content: 'Witaj! Jestem Twoim osobistym doradcą finansowym AI. W czym mogę Ci dzisiaj pomóc?'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    
    const currentMessages = [...messages];
    
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage
    }]);

    setIsLoading(true);

    try {
      const history = currentMessages.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.content }]
      }));
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          history: history,
          message: userMessage
        })
      });
      
      if (!response.ok) throw new Error('Błąd serwera');
      const data = await response.json();
      
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: data.text || 'Przepraszam, nie zrozumiałem.'
      }]);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: 'Wystąpił błąd podczas przetwarzania wiadomości. Spróbuj ponownie.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearHistory = () => {
    if (window.confirm("Czy na pewno chcesz usunąć całą historię rozmowy? Ta akcja jest nieodwracalna.")) {
      localStorage.removeItem('cashmaker_chat_history');
      setMessages([]);
      if (isOpen) {
        initChat();
      }
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 w-14 h-14 bg-[#DC143C] text-white rounded-full shadow-[0_0_20px_rgba(220,20,60,0.4)] flex items-center justify-center hover:scale-110 transition-transform z-50 ${isOpen ? 'hidden' : 'flex'}`}
      >
        <MessageSquare size={24} />
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-[calc(100%-3rem)] sm:w-[350px] h-[500px] max-h-[80vh] bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden animate-in slide-in-from-bottom-4">
          {/* Header */}
          <div className="bg-zinc-900 border-b border-white/10 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#DC143C]/20 rounded-full flex items-center justify-center text-[#DC143C]">
                <Bot size={18} />
              </div>
              <div>
                <h3 className="text-white font-bold text-sm tracking-tight">Doradca AI</h3>
                <p className="text-green-500 text-[10px] flex items-center gap-1 uppercase tracking-widest font-bold">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                  Online
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={clearHistory} className="text-white/30 hover:text-[#DC143C] transition-colors p-1" title="Wyczyść historię">
                <Trash2 size={16} />
              </button>
              <button onClick={() => setIsOpen(false)} className="text-white/50 hover:text-white transition-colors p-1">
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 text-sm shadow-md ${
                  msg.role === 'user' 
                    ? 'bg-[#DC143C] text-white rounded-2xl rounded-tr-sm' 
                    : 'bg-zinc-800 text-white/90 rounded-2xl rounded-tl-sm border border-white/5'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-zinc-800 border border-white/5 p-3 rounded-2xl rounded-tl-sm flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin text-[#DC143C]" />
                  <span className="text-white/50 text-xs">Analizuje profil...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 bg-zinc-900 border-t border-white/10">
            <div className="relative flex items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Napisz wiadomość..."
                className="w-full bg-black/50 border border-white/10 rounded-full pl-4 pr-12 py-3 text-sm text-white focus:outline-none focus:border-[#DC143C] transition-colors"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="absolute right-2 w-8 h-8 bg-[#DC143C] text-white rounded-full flex items-center justify-center disabled:opacity-50 hover:bg-[#FF0000] transition-colors"
              >
                <Send size={14} className="ml-0.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
