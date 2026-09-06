import React, { useState, useEffect } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';

interface NewsArticle {
  title: string;
  description: string;
  url: string;
  urlToImage: string;
  publishedAt: string;
  source: {
    name: string;
  };
}

interface FinancialNewsProps {
  onNavigateToLoan?: () => void;
  compact?: boolean;
}

export function FinancialNews({ onNavigateToLoan, compact = false }: FinancialNewsProps) {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
      } catch (err: any) {
        setError(err.message);
      } finally {
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
  const injectM2MContext = (title: string) => {
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
    } else {
      window.location.href = '/';
    }
  };

  if (loading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center font-sans">
        <Loader2 className={`text-[#DC143C] animate-spin ${compact ? 'w-4 h-4 mb-1' : 'w-8 h-8 mb-4'}`} />
        <p className={`text-white/50 uppercase tracking-widest ${compact ? 'text-[8px]' : 'text-sm'}`}>Pobieranie alertów...</p>
      </div>
    );
  }

  if (error) {
    return compact ? (
      <div className="w-full h-full flex flex-col items-center justify-center font-sans px-2 text-center">
        <AlertCircle className="w-4 h-4 text-[#DC143C] mb-1" />
        <p className="text-white/60 text-[8px]">{error}</p>
      </div>
    ) : (
      <div className="w-full h-full flex flex-col items-center justify-center font-sans px-4 text-center">
        <AlertCircle className="w-12 h-12 text-[#DC143C] mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Błąd pobierania</h2>
        <p className="text-white/60 text-sm mb-6">{error}</p>
        {error.includes('NEWS_API_KEY') && (
          <div className="bg-white/5 border border-white/10 p-4 rounded-xl text-left">
            <p className="text-xs text-white/80 mb-2">Aby wiadomości działały, musisz dodać klucz API:</p>
            <ol className="text-[10px] text-white/50 list-decimal pl-4 space-y-1">
              <li>Zarejestruj się na <a href="https://newsapi.org" target="_blank" rel="noreferrer" className="text-[#DC143C] hover:underline">newsapi.org</a></li>
              <li>Pobierz darmowy klucz API</li>
              <li>Dodaj go w ustawieniach aplikacji jako <code className="bg-black/50 px-1 py-0.5 rounded text-[#DC143C]">NEWS_API_KEY</code></li>
            </ol>
          </div>
        )}
      </div>
    );
  }

  if (compact && articles.length > 0) {
    const article = articles[currentArticleIndex];
    return (
      <div 
        className="mx-auto bg-black border-2 border-[#DC143C] rounded-lg p-2 max-w-[260px] shadow-[0_0_20px_rgba(220,20,60,0.3)] relative overflow-hidden group cursor-pointer"
        onClick={handleArticleClick}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>
        <div className="absolute top-1 right-2 flex items-center gap-1">
          <div className="w-1.5 h-1.5 bg-[#FF0000] rounded-full animate-pulse shadow-[0_0_8px_#FF0000]"></div>
          <span className="text-[#FF0000] text-[7px] font-bold tracking-widest drop-shadow-[0_0_5px_rgba(255,0,0,0.8)]">NEWS</span>
        </div>
        <div className="text-[10px] font-bold text-white leading-tight line-clamp-2 mt-2 mb-1">
          {article.title}
        </div>
        <div className="text-[8px] text-[#DC143C] uppercase tracking-widest font-semibold leading-none drop-shadow-md">
          Czytaj więcej →
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto p-2 flex flex-col gap-6 bg-transparent custom-scrollbar overflow-y-auto h-full pb-10">
      {articles.map((article, index) => (
        <div 
          key={index} 
          // Projekt UI: Czerwony neonowy glow, ciemne tło (Styl CashMaker)
          className="bg-[#111] border border-red-600 rounded-2xl p-5 shadow-[0_0_15px_rgba(220,38,38,0.5)] cursor-pointer hover:shadow-[0_0_30px_rgba(220,38,38,0.8)] transition-all duration-300 relative overflow-hidden group text-left"
          onClick={handleArticleClick} // Pułapka UX - przekierowanie do lejka
        >
          {/* Subtelny wewnętrzny gradient / edge light */}
          <div className="absolute inset-0 bg-gradient-to-b from-red-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
          
          <div className="text-red-500 text-xs font-black mb-3 uppercase tracking-[0.2em] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
            Pilny Alert Rynkowy
          </div>
          
          <h3 className="text-white text-lg font-bold mb-4 leading-snug">
            {article.title}
          </h3>
          
          <div className="bg-red-950/30 p-4 rounded-xl border-l-2 border-red-500 relative z-10 backdrop-blur-sm">
            <p className="text-gray-400 text-[10px] uppercase tracking-wider mb-1 font-semibold">
              Rekomendacja CashMaker:
            </p>
            <p className="text-gray-100 font-medium text-xs leading-relaxed">
              {injectM2MContext(article.title)}
            </p>
          </div>
          
          <div className="mt-5 flex justify-center relative z-10">
            <button className="bg-transparent border border-red-500 text-red-500 px-6 py-3 rounded-xl font-bold uppercase text-xs tracking-widest w-full group-hover:bg-red-600 group-hover:text-white transition-colors duration-300">
              Odbierz Zysk Natychmiast
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
