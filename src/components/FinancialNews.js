import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
export function FinancialNews({ onNavigateToLoan, compact = false }) {
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentArticleIndex, setCurrentArticleIndex] = useState(0);
    useEffect(() => {
        const fetchNews = async () => {
            try {
                const response = await fetch('/api/news');
                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.error || 'Wystąpił błąd podczas pobierania wiadomości.');
                }
                // Pobieramy tylko 3 najmocniejsze nagłówki
                setArticles(data.slice(0, 3));
            }
            catch (err) {
                setError(err.message);
            }
            finally {
                setLoading(false);
            }
        };
        fetchNews();
    }, []);
    useEffect(() => {
        if (compact && articles.length > 0) {
            const interval = setInterval(() => {
                setCurrentArticleIndex((prev) => (prev + 1) % articles.length);
            }, 5000);
            return () => clearInterval(interval);
        }
    }, [compact, articles.length]);
    // Agresywny mechanizm wstrzykiwania afiliacji (Wabik mBank)
    const injectM2MContext = (title) => {
        const lowerTitle = title.toLowerCase();
        if (lowerTitle.includes('inflacj') || lowerTitle.includes('stóp')) {
            return "Zabezpiecz kapitał przed spadkiem. Odbierz 300 PLN premii z mBankiem. Generuj raport.";
        }
        if (lowerTitle.includes('podat') || lowerTitle.includes('zus')) {
            return "Koszty rosną, zniweluj je darmową gotówką. 300 PLN za konto w mBanku czeka na odbiór.";
        }
        return "Wykorzystaj rynkowe zawirowania na swoją korzyść. Sprawdź ofertę mBanku i zyskaj 300 PLN. Przejdź do kalkulatora.";
    };
    const handleArticleClick = () => {
        if (onNavigateToLoan) {
            onNavigateToLoan();
        }
        else {
            window.location.href = '/';
        }
    };
    if (loading) {
        return (_jsxs("div", { className: "w-full h-full flex flex-col items-center justify-center font-sans", children: [_jsx(Loader2, { className: `text-[#DC143C] animate-spin ${compact ? 'w-4 h-4 mb-1' : 'w-8 h-8 mb-4'}` }), _jsx("p", { className: `text-white/50 uppercase tracking-widest ${compact ? 'text-[8px]' : 'text-sm'}`, children: "Pobieranie alert\u00F3w..." })] }));
    }
    if (error) {
        return compact ? (_jsxs("div", { className: "w-full h-full flex flex-col items-center justify-center font-sans px-2 text-center", children: [_jsx(AlertCircle, { className: "w-4 h-4 text-[#DC143C] mb-1" }), _jsx("p", { className: "text-white/60 text-[8px]", children: error })] })) : (_jsxs("div", { className: "w-full h-full flex flex-col items-center justify-center font-sans px-4 text-center", children: [_jsx(AlertCircle, { className: "w-12 h-12 text-[#DC143C] mb-4" }), _jsx("h2", { className: "text-xl font-bold text-white mb-2", children: "B\u0142\u0105d pobierania" }), _jsx("p", { className: "text-white/60 text-sm mb-6", children: error }), error.includes('NEWS_API_KEY') && (_jsxs("div", { className: "bg-white/5 border border-white/10 p-4 rounded-xl text-left", children: [_jsx("p", { className: "text-xs text-white/80 mb-2", children: "Aby wiadomo\u015Bci dzia\u0142a\u0142y, musisz doda\u0107 klucz API:" }), _jsxs("ol", { className: "text-[10px] text-white/50 list-decimal pl-4 space-y-1", children: [_jsxs("li", { children: ["Zarejestruj si\u0119 na ", _jsx("a", { href: "https://newsapi.org", target: "_blank", rel: "noreferrer", className: "text-[#DC143C] hover:underline", children: "newsapi.org" })] }), _jsx("li", { children: "Pobierz darmowy klucz API" }), _jsxs("li", { children: ["Dodaj go w ustawieniach aplikacji jako ", _jsx("code", { className: "bg-black/50 px-1 py-0.5 rounded text-[#DC143C]", children: "NEWS_API_KEY" })] })] })] }))] }));
    }
    if (compact && articles.length > 0) {
        const article = articles[currentArticleIndex];
        return (_jsxs("div", { className: "mx-auto bg-black border-2 border-[#DC143C] rounded-lg p-2 max-w-[260px] shadow-[0_0_20px_rgba(220,20,60,0.3)] relative overflow-hidden group cursor-pointer", onClick: handleArticleClick, children: [_jsx("div", { className: "absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" }), _jsxs("div", { className: "absolute top-1 right-2 flex items-center gap-1", children: [_jsx("div", { className: "w-1.5 h-1.5 bg-[#FF0000] rounded-full animate-pulse shadow-[0_0_8px_#FF0000]" }), _jsx("span", { className: "text-[#FF0000] text-[7px] font-bold tracking-widest drop-shadow-[0_0_5px_rgba(255,0,0,0.8)]", children: "NEWS" })] }), _jsx("div", { className: "text-[10px] font-bold text-white leading-tight line-clamp-2 mt-2 mb-1", children: article.title }), _jsx("div", { className: "text-[8px] text-[#DC143C] uppercase tracking-widest font-semibold leading-none drop-shadow-md", children: "Czytaj wi\u0119cej \u2192" })] }));
    }
    return (_jsx("div", { className: "w-full max-w-md mx-auto p-2 flex flex-col gap-6 bg-transparent custom-scrollbar overflow-y-auto h-full pb-10", children: articles.map((article, index) => (_jsxs("div", { 
            // Projekt UI: Czerwony neonowy glow, ciemne tło (Styl CashMaker)
            className: "bg-[#111] border border-red-600 rounded-2xl p-5 shadow-[0_0_15px_rgba(220,38,38,0.5)] cursor-pointer hover:shadow-[0_0_30px_rgba(220,38,38,0.8)] transition-all duration-300 relative overflow-hidden group text-left", onClick: handleArticleClick, children: [_jsx("div", { className: "absolute inset-0 bg-gradient-to-b from-red-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" }), _jsxs("div", { className: "text-red-500 text-xs font-black mb-3 uppercase tracking-[0.2em] flex items-center gap-2", children: [_jsx("span", { className: "w-2 h-2 rounded-full bg-red-600 animate-pulse" }), "Pilny Alert Rynkowy"] }), _jsx("h3", { className: "text-white text-lg font-bold mb-4 leading-snug", children: article.title }), _jsxs("div", { className: "bg-red-950/30 p-4 rounded-xl border-l-2 border-red-500 relative z-10 backdrop-blur-sm", children: [_jsx("p", { className: "text-gray-400 text-[10px] uppercase tracking-wider mb-1 font-semibold", children: "Rekomendacja CashMaker:" }), _jsx("p", { className: "text-gray-100 font-medium text-xs leading-relaxed", children: injectM2MContext(article.title) })] }), _jsx("div", { className: "mt-5 flex justify-center relative z-10", children: _jsx("button", { className: "bg-transparent border border-red-500 text-red-500 px-6 py-3 rounded-xl font-bold uppercase text-xs tracking-widest w-full group-hover:bg-red-600 group-hover:text-white transition-colors duration-300", children: "Odbierz Zysk Natychmiast" }) })] }, index))) }));
}
