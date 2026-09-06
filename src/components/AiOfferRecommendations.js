import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Sparkles, ShieldCheck, Clock, Zap, ArrowRight, TrendingUp, Gift } from 'lucide-react';
import { motion } from 'motion/react';
const OfferCountdown = ({ initialMinutes = 15 }) => {
    const [timeLeft, setTimeLeft] = useState(initialMinutes * 60 + Math.floor(Math.random() * 60));
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(prev => prev > 0 ? prev - 1 : 0);
        }, 1000);
        return () => clearInterval(timer);
    }, []);
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return (_jsxs("div", { className: "flex items-center justify-center gap-2 mb-2 text-[#DC143C] bg-[#DC143C]/10 py-1.5 px-3 rounded-lg border border-[#DC143C]/20 text-xs font-bold uppercase tracking-widest animate-pulse", children: [_jsx(Clock, { size: 14 }), "oferta wygasa za: ", minutes, ":", seconds.toString().padStart(2, '0')] }));
};
export function AiOfferRecommendations({ offers }) {
    const [applicantsCount, setApplicantsCount] = useState(() => {
        const hour = new Date().getHours();
        // Baza: rano mniej, wieczorem więcej + losowy element
        return 142 + (hour * 18) + Math.floor(Math.random() * 12);
    });
    const isBonusOffer = (offer) => {
        const text = [offer.comment, offer.description].join(' ').toLowerCase();
        return /premia|bonus|otwarcie|start/i.test(text);
    };
    useEffect(() => {
        const interval = setInterval(() => {
            // Symulacja nowych wniosków co 15-45 sekund
            setApplicantsCount(prev => prev + (Math.random() > 0.7 ? 1 : 0));
        }, 15000);
        return () => clearInterval(interval);
    }, []);
    return (_jsxs("div", { className: "w-full max-w-md mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700", children: [_jsxs("div", { className: "flex flex-col items-center text-center space-y-2 mb-8", children: [_jsxs("div", { className: "inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#DC143C]/10 border border-[#DC143C]/20 text-[#DC143C] text-[10px] font-bold uppercase tracking-widest mb-2", children: [_jsx(Sparkles, { size: 12, className: "animate-pulse" }), "Inteligentna Analiza Profilu"] }), _jsx("h2", { className: "text-3xl font-black text-white leading-tight tracking-[0.05em] uppercase italic text-center", children: "AI Rekomenduje" }), _jsx("p", { className: "text-white/40 text-[10px] uppercase tracking-widest font-medium", children: "Dopasowano na podstawie 14 parametr\u00F3w ryzyka" })] }), _jsx(motion.div, { className: "space-y-6", variants: {
                    hidden: { opacity: 0 },
                    show: {
                        opacity: 1,
                        transition: {
                            staggerChildren: 0.15
                        }
                    }
                }, initial: "hidden", animate: "show", children: offers.map((offer) => (_jsxs(motion.div, { variants: {
                        hidden: { opacity: 0, scale: 0.95, y: 20 },
                        show: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
                    }, className: "relative group", children: [_jsxs("div", { className: "absolute -top-3 left-6 z-10 bg-green-500 text-black text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter shadow-lg flex items-center gap-1", children: [_jsx(Zap, { size: 10, fill: "currentColor" }), "Najwy\u017Csza Przyznawalno\u015B\u0107"] }), isBonusOffer(offer) && (_jsxs("div", { className: "absolute -top-3 right-6 z-10 bg-yellow-400 text-black text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter shadow-lg flex items-center gap-1", children: [_jsx(Gift, { size: 10, fill: "currentColor" }), "Z BONUSEM"] })), _jsxs("div", { className: "relative overflow-hidden rounded-[32px] bg-zinc-900 border border-white/10 shadow-2xl transition-all duration-500 group-hover:border-[#DC143C]/50 group-hover:shadow-[#DC143C]/10", children: [_jsx("div", { className: "absolute inset-0 bg-gradient-to-br from-[#DC143C]/5 via-transparent to-transparent opacity-50" }), _jsxs("div", { className: "p-5 space-y-4 relative z-10", children: [_jsx("div", { className: "flex flex-col items-center justify-center text-center space-y-2", children: _jsxs("div", { className: "space-y-1", children: [_jsx("h3", { className: "text-2xl font-black text-white tracking-tight leading-tight group-hover:text-[#DC143C] transition-colors", children: offer.name }), _jsxs("div", { className: "flex items-center justify-center gap-2 text-green-400", children: [_jsx(ShieldCheck, { size: 16 }), _jsx("span", { className: "text-[11px] font-bold uppercase tracking-widest", children: "Oferta Zweryfikowana" })] })] }) }), _jsxs("div", { className: "bg-white/5 rounded-xl p-3 border border-white/5 italic flex flex-col gap-2", children: [offer.comment && (_jsxs("div", { className: "flex items-start gap-1.5 text-xs text-[#DC143C] font-bold", children: [_jsx(Sparkles, { size: 14, className: "mt-0.5 shrink-0" }), _jsx("span", { children: offer.comment })] })), _jsxs("p", { className: "text-white/80 text-xs leading-relaxed", children: ["\"", offer.description, "\""] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3 sm:gap-4", children: [_jsxs("div", { className: "bg-zinc-800/50 p-4 rounded-xl border border-white/5 flex flex-col justify-center", children: [_jsxs("div", { className: "flex items-center gap-1.5 mb-1 text-white/50", children: [_jsx(TrendingUp, { size: 12 }), _jsx("span", { className: "text-[10px] uppercase font-bold tracking-widest", children: "RRSO" })] }), _jsx("p", { className: "text-xl font-black text-white", children: offer.rrso })] }), _jsxs("div", { className: "bg-zinc-800/50 p-4 rounded-xl border border-white/5 flex flex-col justify-center", children: [_jsxs("div", { className: "flex items-center gap-1.5 mb-1 text-white/50", children: [_jsx(Clock, { size: 12 }), _jsx("span", { className: "text-[10px] uppercase font-bold tracking-widest", children: "Decyzja" })] }), _jsx("p", { className: "text-xl font-black text-white", children: offer.decisionTime })] }), _jsxs("div", { className: "col-span-2 bg-zinc-800/50 p-4 sm:p-5 rounded-xl border border-white/5 flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("span", { className: "text-[10px] text-white/50 uppercase font-bold tracking-widest block mb-1", children: "Maksymalna Kwota" }), _jsx("p", { className: "text-2xl font-black text-white tracking-tighter", children: offer.maxAmount })] }), _jsx("div", { className: "w-12 h-12 rounded-full bg-white/5 flex items-center justify-center border border-white/10 shrink-0", children: _jsx(Zap, { size: 20, className: "text-[#DC143C]" }) })] })] }), _jsxs("div", { className: "space-y-3", children: [_jsx(OfferCountdown, { initialMinutes: 14 }), _jsxs("a", { href: `/api/go?offerId=${offer.id}`, target: "_blank", rel: "noopener noreferrer", className: "group/btn relative flex items-center justify-center w-full py-4 bg-[#DC143C] hover:bg-[#FF0000] text-white font-black text-lg rounded-xl shadow-[0_10px_25px_rgba(220,20,60,0.4)] transform hover:-translate-y-1 transition-all duration-300 uppercase tracking-tight", children: [_jsxs("span", { className: "relative z-10 flex items-center gap-3", children: ["Odbierz Pieni\u0105dze Teraz", _jsx(ArrowRight, { size: 20, className: "group-hover/btn:translate-x-1 transition-transform" })] }), _jsx("div", { className: "absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:animate-[shimmer_1.5s_infinite]" })] })] }), _jsxs("div", { className: "flex items-center justify-center gap-3 pt-3", children: [_jsx("div", { className: "flex -space-x-2", children: [1, 2, 3].map(i => (_jsx("div", { className: "w-8 h-8 rounded-full border-2 border-zinc-900 bg-zinc-800 overflow-hidden", children: _jsx("img", { src: `https://picsum.photos/seed/user${i}/32/32`, alt: "user", className: "w-full h-full object-cover", referrerPolicy: "no-referrer" }) }, i))) }), _jsxs("p", { className: "text-xs text-white/50 font-medium", children: [_jsxs("span", { className: "text-white font-bold", children: [applicantsCount, " os\u00F3b"] }), " z\u0142o\u017Cy\u0142o wniosek dzisiaj"] })] })] })] })] }, offer.id))) }), _jsx("style", { dangerouslySetInnerHTML: { __html: `
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      ` } })] }));
}
