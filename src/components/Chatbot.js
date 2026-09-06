import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Loader2, Bot, Trash2 } from 'lucide-react';
export function Chatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);
    // Load history from localStorage
    useEffect(() => {
        const savedMessages = localStorage.getItem('cashmaker_chat_history');
        if (savedMessages) {
            try {
                setMessages(JSON.parse(savedMessages));
            }
            catch (e) {
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
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);
    const initChat = async () => {
        if (messages.length > 0)
            return;
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
            if (!response.ok)
                throw new Error('Błąd komunikacji z serwerem');
            const data = await response.json();
            setMessages([{
                    id: Date.now().toString(),
                    role: 'model',
                    content: data.text || 'Witaj! Jestem Twoim osobistym doradcą finansowym AI. W czym mogę Ci dzisiaj pomóc?'
                }]);
        }
        catch (error) {
            console.error('Error initializing chat:', error);
            setMessages([{
                    id: Date.now().toString(),
                    role: 'model',
                    content: 'Witaj! Jestem Twoim osobistym doradcą finansowym AI. W czym mogę Ci dzisiaj pomóc?'
                }]);
        }
        finally {
            setIsLoading(false);
        }
    };
    const handleSend = async () => {
        if (!input.trim() || isLoading)
            return;
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
            if (!response.ok)
                throw new Error('Błąd serwera');
            const data = await response.json();
            setMessages(prev => [...prev, {
                    id: (Date.now() + 1).toString(),
                    role: 'model',
                    content: data.text || 'Przepraszam, nie zrozumiałem.'
                }]);
        }
        catch (error) {
            console.error('Error sending message:', error);
            setMessages(prev => [...prev, {
                    id: (Date.now() + 1).toString(),
                    role: 'model',
                    content: 'Wystąpił błąd podczas przetwarzania wiadomości. Spróbuj ponownie.'
                }]);
        }
        finally {
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
    return (_jsxs(_Fragment, { children: [_jsx("button", { onClick: () => setIsOpen(true), className: `fixed bottom-6 right-6 w-14 h-14 bg-[#DC143C] text-white rounded-full shadow-[0_0_20px_rgba(220,20,60,0.4)] flex items-center justify-center hover:scale-110 transition-transform z-50 ${isOpen ? 'hidden' : 'flex'}`, children: _jsx(MessageSquare, { size: 24 }) }), isOpen && (_jsxs("div", { className: "fixed bottom-6 right-6 w-[calc(100%-3rem)] sm:w-[350px] h-[500px] max-h-[80vh] bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden animate-in slide-in-from-bottom-4", children: [_jsxs("div", { className: "bg-zinc-900 border-b border-white/10 p-4 flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-8 h-8 bg-[#DC143C]/20 rounded-full flex items-center justify-center text-[#DC143C]", children: _jsx(Bot, { size: 18 }) }), _jsxs("div", { children: [_jsx("h3", { className: "text-white font-bold text-sm tracking-tight", children: "Doradca AI" }), _jsxs("p", { className: "text-green-500 text-[10px] flex items-center gap-1 uppercase tracking-widest font-bold", children: [_jsx("span", { className: "w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" }), "Online"] })] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("button", { onClick: clearHistory, className: "text-white/30 hover:text-[#DC143C] transition-colors p-1", title: "Wyczy\u015B\u0107 histori\u0119", children: _jsx(Trash2, { size: 16 }) }), _jsx("button", { onClick: () => setIsOpen(false), className: "text-white/50 hover:text-white transition-colors p-1", children: _jsx(X, { size: 20 }) })] })] }), _jsxs("div", { className: "flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar", children: [messages.map((msg) => (_jsx("div", { className: `flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`, children: _jsx("div", { className: `max-w-[85%] p-3 text-sm shadow-md ${msg.role === 'user'
                                        ? 'bg-[#DC143C] text-white rounded-2xl rounded-tr-sm'
                                        : 'bg-zinc-800 text-white/90 rounded-2xl rounded-tl-sm border border-white/5'}`, children: msg.content }) }, msg.id))), isLoading && (_jsx("div", { className: "flex justify-start", children: _jsxs("div", { className: "bg-zinc-800 border border-white/5 p-3 rounded-2xl rounded-tl-sm flex items-center gap-2", children: [_jsx(Loader2, { size: 14, className: "animate-spin text-[#DC143C]" }), _jsx("span", { className: "text-white/50 text-xs", children: "Analizuje profil..." })] }) })), _jsx("div", { ref: messagesEndRef })] }), _jsx("div", { className: "p-4 bg-zinc-900 border-t border-white/10", children: _jsxs("div", { className: "relative flex items-center", children: [_jsx("input", { type: "text", value: input, onChange: (e) => setInput(e.target.value), onKeyDown: (e) => e.key === 'Enter' && handleSend(), placeholder: "Napisz wiadomo\u015B\u0107...", className: "w-full bg-black/50 border border-white/10 rounded-full pl-4 pr-12 py-3 text-sm text-white focus:outline-none focus:border-[#DC143C] transition-colors" }), _jsx("button", { onClick: handleSend, disabled: !input.trim() || isLoading, className: "absolute right-2 w-8 h-8 bg-[#DC143C] text-white rounded-full flex items-center justify-center disabled:opacity-50 hover:bg-[#FF0000] transition-colors", children: _jsx(Send, { size: 14, className: "ml-0.5" }) })] }) })] }))] }));
}
