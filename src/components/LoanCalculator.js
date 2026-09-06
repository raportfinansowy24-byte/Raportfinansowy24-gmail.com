import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Gift, Briefcase, ShieldPlus, CreditCard, Shield, X, HelpCircle, Home, Car, Coins, Banknote, Wallet, Landmark, Clock, Calendar, Coffee, ThumbsUp, Minus, ThumbsDown, ArrowLeft, ArrowRight, PiggyBank, XCircle, Building2, ChevronDown, ChevronUp, TrendingUp, Download, Bookmark, ArrowLeftRight } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { getAiRecommendedOffers } from '../services/aiOfferService';
import { AiOfferRecommendations } from './AiOfferRecommendations';
import { LiveCounter } from './LiveCounter';
import { Timer } from './Timer';
import { FinancialNews } from './FinancialNews';
import { saveToLocalStorage, loadFromLocalStorage } from '../lib/storage';
import { supabase } from '../lib/supabase';
import { fetchOffersFromApi } from '../services/apiClient';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { AmortizationChart } from './AmortizationChart';
import { motion } from 'motion/react';
const FAQ_QUESTIONS = [
    "Jak działa konsolidacja kredytów?",
    "Czy warto brać szybką gotówkę?",
    "Jakie są korzyści z karty kredytowej?",
    "Jak najlepiej planować budżet domowy?"
];
const POLISH_BANKS = [
    'Brak / Żaden z poniższych',
    'mBank',
    'PKO BP',
    'Bank Pekao',
    'Santander',
    'ING Bank Śląski',
    'Bank Millennium',
    'Alior Bank',
    'BNP Paribas',
    'VeloBank',
    'Citi Handlowy',
    'Credit Agricole',
    'Nest Bank',
    'Bank Pocztowy',
    'BOŚ Bank'
];
const POLISH_INSURERS = [
    'Brak / Żaden z poniższych',
    'PZU',
    'Warta',
    'Ergo Hestia',
    'Allianz',
    'Generali',
    'Link4',
    'Uniqa',
    'Compensa',
    'Wiener',
    'Inne'
];
const getQuizQuestions = (quizData) => {
    const goal = quizData.goal;
    const baseQuestions = [
        {
            id: 'goal',
            title: 'Rozpocznij bezpłatną diagnozę finansową swojego portfela',
            subtitle: 'Przestań przepłacać. Poznaj prawdę. Odkryj ukryte oferty.',
            type: 'button',
            options: [
                { value: 'cash', label: 'Szybka gotówka', icon: Zap },
                { value: 'house', label: 'Hipoteka', icon: Home },
                { value: 'account', label: 'Konto bankowe', icon: CreditCard },
                { value: 'savings', label: 'Oszczędzanie', icon: PiggyBank },
                { value: 'debt', label: 'Zmniejsz raty', icon: ShieldPlus },
                { value: 'car', label: 'Auto', icon: Car },
                { value: 'business', label: 'Firma', icon: Briefcase },
                { value: 'insurance', label: 'Ubezpieczenia', icon: Shield }
            ]
        }
    ];
    const getExcludedBankCountTitle = () => {
        if (goal === 'account')
            return 'W ilu bankach masz już konto?';
        if (goal === 'business') {
            if (quizData.businessType === 'loan') {
                return 'W ilu bankach masz już kredyt firmowy?';
            }
            return 'W ilu bankach masz konto firmowe?';
        }
        if (goal === 'insurance')
            return 'W ilu towarzystwach masz już ubezpieczenie?';
        return 'W ilu bankach masz już kredyt/pożyczkę?';
    };
    const excludedBankCountQuestion = {
        id: 'excludedBankCount',
        title: getExcludedBankCountTitle(),
        type: 'button',
        options: [
            { value: '0', label: 'W żadnym', icon: XCircle },
            { value: '1', label: 'W jednym', icon: Building2 },
            { value: '2', label: 'W dwóch', icon: Building2 },
            { value: '3', label: 'W trzech', icon: Building2 },
            { value: '4+', label: '4 lub więcej', icon: Building2 }
        ]
    };
    const getExcludedBankTitle = () => {
        const requiredCount = quizData.excludedBankCount === '4+' ? '4+' : (quizData.excludedBankCount || '0');
        if (goal === 'insurance')
            return `Zaznacz odpowiednie towarzystwa (wymagane: ${requiredCount})`;
        return `Zaznacz odpowiednie banki (wymagane: ${requiredCount})`;
    };
    const excludedBankQuestion = {
        id: 'excludedBank',
        title: getExcludedBankTitle(),
        type: 'multiselect',
        condition: (data) => data.excludedBankCount && data.excludedBankCount !== '0',
        options: (goal === 'insurance' ? POLISH_INSURERS : POLISH_BANKS).map(b => ({ value: b, label: b }))
    };
    const employmentQuestion = {
        id: 'employment',
        title: 'Twój status zawodowy:',
        type: 'button',
        options: [
            { value: 'uop', label: 'Umowa o pracę', icon: Briefcase },
            { value: 'uoo', label: 'Umowa zlecenie/dzieło', icon: Clock },
            { value: 'b2b', label: 'Działalność (B2B)', icon: Landmark },
            { value: 'pension', label: 'Emerytura / Renta', icon: Coffee },
            { value: 'other', label: 'Inne / Brak', icon: HelpCircle }
        ]
    };
    const incomeQuestion = {
        id: 'income',
        title: 'Twój miesięczny dochód netto:',
        type: 'button',
        options: [
            { value: 'low', label: 'Do 3 500 PLN', icon: Coins },
            { value: 'mid', label: '3 500 - 7 000 PLN', icon: Banknote },
            { value: 'high', label: '7 000 - 15 000 PLN', icon: Wallet },
            { value: 'expert', label: 'Powyżej 15 000 PLN', icon: Landmark }
        ]
    };
    const periodQuestion = {
        id: 'period',
        title: 'Na jaki okres potrzebujesz finansowania?',
        type: 'button',
        options: [
            { value: 'short', label: 'Do 12 miesięcy', icon: Clock },
            { value: 'medium', label: '1 - 3 lata', icon: Calendar },
            { value: 'long', label: '3 - 8 lat', icon: Landmark },
            { value: 'verylong', label: 'Powyżej 8 lat', icon: Landmark }
        ]
    };
    if (goal === 'account') {
        return [
            ...baseQuestions,
            {
                id: 'accountFilter',
                title: 'Filtruj według:',
                type: 'button',
                options: [
                    { value: 'free', label: 'Darmowe konta', icon: CreditCard },
                    { value: 'bonus', label: 'Konta z premią', icon: Gift },
                    { value: 'moneyback', label: 'Konta z moneyback', icon: Coins }
                ]
            },
            excludedBankCountQuestion,
            excludedBankQuestion
        ];
    }
    if (goal === 'insurance') {
        return [
            ...baseQuestions,
            {
                id: 'insuranceType',
                title: 'Jakiego ubezpieczenia szukasz?',
                type: 'button',
                options: [
                    { value: 'acoc', label: 'Ubezpieczenie AC/OC', icon: Car },
                    { value: 'other', label: 'Pozostałe ubezpieczenia', icon: Shield }
                ]
            },
            excludedBankCountQuestion,
            excludedBankQuestion
        ];
    }
    if (goal === 'business') {
        return [
            ...baseQuestions,
            {
                id: 'businessType',
                title: 'Czego potrzebuje Twoja firma?',
                type: 'button',
                options: [
                    { value: 'loan', label: 'Kredyt dla firm', icon: Landmark },
                    { value: 'account', label: 'Konto dla firm', icon: CreditCard }
                ]
            },
            {
                id: 'businessLoanType',
                title: 'Rodzaj kredytu firmowego:',
                type: 'button',
                condition: (data) => data.businessType === 'loan',
                options: [
                    { value: 'startup', label: 'Dla nowych firm (Startup)', icon: Zap },
                    { value: 'operating', label: 'Obrotowy / Inwestycyjny', icon: Building2 }
                ]
            },
            {
                id: 'businessDuration',
                title: 'Staż Twojej firmy:',
                type: 'button',
                condition: (data) => data.businessType === 'loan',
                options: [
                    { value: 'new', label: 'Do 12 miesięcy', icon: Clock },
                    { value: 'mature', label: 'Powyżej roku', icon: Calendar }
                ]
            },
            {
                id: 'amount',
                title: 'Jakiej kwoty potrzebujesz?',
                type: 'button',
                condition: (data) => data.businessType === 'loan',
                options: [
                    { value: 'small', label: 'do 50 000 PLN', icon: Coins },
                    { value: 'medium', label: '50 000 - 200 000 PLN', icon: Banknote },
                    { value: 'big', label: '200 000 - 500 000 PLN', icon: Wallet },
                    { value: 'huge', label: 'powyżej 500 000 PLN', icon: Landmark }
                ]
            },
            { ...periodQuestion, condition: (data) => data.businessType === 'loan' },
            excludedBankCountQuestion,
            excludedBankQuestion,
            employmentQuestion,
            incomeQuestion,
            {
                id: 'score',
                title: 'Jak oceniasz swoją historię kredytową (BIK)?',
                type: 'button',
                condition: (data) => data.businessType === 'loan',
                options: [
                    { value: 'good', label: 'Dobra', icon: ThumbsUp },
                    { value: 'mid', label: 'Średnia', icon: Minus },
                    { value: 'bad', label: 'Słaba', icon: ThumbsDown }
                ]
            }
        ];
    }
    if (goal === 'savings') {
        return [
            ...baseQuestions,
            {
                id: 'savingsType',
                title: 'Jak chcesz pomnażać oszczędności?',
                type: 'button',
                options: [
                    { value: 'account', label: 'Konta oszczędnościowe', icon: PiggyBank },
                    { value: 'investments', label: 'Lokaty i inwestycje', icon: Coins }
                ]
            },
            excludedBankCountQuestion,
            excludedBankQuestion,
            {
                id: 'amount',
                title: 'Jaką kwotę planujesz wpłacić?',
                type: 'button',
                options: [
                    { value: 'small', label: 'do 10 000 PLN', icon: Coins },
                    { value: 'medium', label: '10 000 - 50 000 PLN', icon: Banknote },
                    { value: 'big', label: '50 000 - 100 000 PLN', icon: Wallet },
                    { value: 'huge', label: 'powyżej 100 000 PLN', icon: Landmark }
                ]
            }
        ];
    }
    return [
        ...baseQuestions,
        {
            id: 'amount',
            title: 'Jakiej kwoty potrzebujesz?',
            type: 'button',
            options: [
                { value: 'small', label: 'do 3 000 PLN', icon: Coins },
                { value: 'medium', label: '3 000 - 10 000 PLN', icon: Banknote },
                { value: 'big', label: '10 000 - 50 000 PLN', icon: Wallet },
                { value: 'huge', label: 'powyżej 50 000 PLN', icon: Landmark }
            ]
        },
        periodQuestion,
        excludedBankCountQuestion,
        excludedBankQuestion,
        employmentQuestion,
        incomeQuestion,
        {
            id: 'score',
            title: 'Jak oceniasz swoją historię kredytową (BIK)?',
            type: 'button',
            options: [
                { value: 'good', label: 'Dobra', icon: ThumbsUp },
                { value: 'mid', label: 'Średnia', icon: Minus },
                { value: 'bad', label: 'Słaba', icon: ThumbsDown }
            ]
        }
    ];
};
const getOfferIcon = (category) => {
    const cat = category.toLowerCase();
    if (cat.includes('gotówk') || cat.includes('pożyczk'))
        return _jsx(Zap, { className: "w-4 h-4 text-[#DC143C]" });
    if (cat.includes('premi') || cat.includes('promocj'))
        return _jsx(Gift, { className: "w-4 h-4 text-[#DC143C]" });
    if (cat.includes('firm'))
        return _jsx(Briefcase, { className: "w-4 h-4 text-[#DC143C]" });
    if (cat.includes('konsolidacj'))
        return _jsx(ShieldPlus, { className: "w-4 h-4 text-[#DC143C]" });
    if (cat.includes('kart') || cat.includes('osobist'))
        return _jsx(CreditCard, { className: "w-4 h-4 text-[#DC143C]" });
    if (cat.includes('ubezpieczeni'))
        return _jsx(Shield, { className: "w-4 h-4 text-[#DC143C]" });
    if (cat.includes('oszczęd') || cat.includes('lokat') || cat.includes('inwestycj'))
        return _jsx(PiggyBank, { className: "w-4 h-4 text-[#DC143C]" });
    return _jsx(Zap, { className: "w-4 h-4 text-[#DC143C]" });
};
const LoadingIndicator = ({ text }) => (_jsxs("div", { className: "flex flex-col items-center justify-center gap-4 animate-in fade-in", children: [_jsx("div", { className: "relative w-12 h-12", children: _jsx("div", { className: "absolute inset-0 border-4 border-[#DC143C]/20 border-t-[#DC143C] rounded-full animate-spin" }) }), _jsx("p", { className: "text-white font-bold text-sm tracking-widest uppercase animate-pulse text-center px-4", children: text })] }));
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
    return (_jsxs("div", { className: "flex items-center justify-center gap-2 mb-2 text-[#DC143C] bg-[#DC143C]/10 py-1.5 px-3 rounded-lg border border-[#DC143C]/20 text-[10px] sm:text-xs font-bold uppercase tracking-widest animate-pulse w-full", children: [_jsx(Clock, { size: 12 }), "oferta wygasa za: ", minutes, ":", seconds.toString().padStart(2, '0')] }));
};
const ScanningPhase = ({ quizData }) => {
    const [progress, setProgress] = useState(0);
    useEffect(() => {
        const startTime = Date.now();
        const duration = 4000;
        const interval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const newProgress = Math.min(99, Math.floor((elapsed / duration) * 100));
            setProgress(newProgress);
        }, 50);
        return () => clearInterval(interval);
    }, []);
    let statusText = '';
    if (progress < 25) {
        statusText = 'Łączenie z bazami ofertowymi...';
    }
    else if (progress < 50) {
        statusText = 'Skanowanie 43 ukrytych ofert bankowych...';
    }
    else if (progress < 75) {
        const scoreText = quizData.score === 'good' ? 'Dobra' : quizData.score === 'mid' ? 'Średnia' : quizData.score === 'bad' ? 'Słaba' : 'Brak danych';
        statusText = `Weryfikacja akceptacji dla BIK: ${scoreText}...`;
    }
    else {
        statusText = 'Odrzucanie ofert o niskiej przyznawalności...';
    }
    return (_jsxs("div", { className: "flex flex-col items-center justify-center space-y-8 w-full max-w-md px-6 animate-in fade-in zoom-in duration-500", children: [_jsxs("div", { className: "relative w-24 h-24 flex items-center justify-center", children: [_jsx("div", { className: "absolute inset-0 border-4 border-[#DC143C]/20 border-t-[#DC143C] rounded-full animate-spin" }), _jsxs("span", { className: "text-[#DC143C] font-black text-2xl relative z-10", children: [progress, "%"] })] }), _jsxs("div", { className: "w-full space-y-4", children: [_jsx("h2", { className: "text-white font-bold text-center text-sm md:text-base h-12 flex items-center justify-center uppercase tracking-widest", children: statusText }), _jsx("div", { className: "w-full h-2 bg-white/10 rounded-full overflow-hidden", children: _jsx("div", { className: "h-full bg-[#DC143C] transition-all duration-75 ease-linear", style: { width: `${progress}%` } }) })] })] }));
};
const ExpertTip = ({ quizData, savedQuizData }) => {
    const [tip, setTip] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const fetchTip = async () => {
            try {
                const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        history: [],
                        message: `Jesteś ekspertem finansowym. Użytkownik porównuje dwa scenariusze kredytowe. \nScenariusz 1: Kwota ${quizData.amount}, Okres ${quizData.period}, Cel ${quizData.goal}. \nScenariusz 2 (Zapisany): Kwota ${savedQuizData.amount}, Okres ${savedQuizData.period}, Cel ${savedQuizData.goal}. \nPodaj JEDNĄ, bardzo krótką (max 2 zdania) poradę dotyczącą optymalizacji, porównując te dwa warianty (np. krótszy okres zmniejszy odsetki, większa kwota wymaga lepszego BIK). Bądź konkretny i używaj języka korzyści.`
                    })
                });
                const data = await response.json();
                setTip(data.text);
            }
            catch (e) {
                setTip("Zastanów się nad skróceniem okresu kredytowania, aby zmniejszyć całkowity koszt odsetek.");
            }
            finally {
                setLoading(false);
            }
        };
        fetchTip();
    }, [quizData, savedQuizData]);
    if (loading) {
        return _jsx("div", { className: "bg-[#111] border border-[#DC143C]/20 p-4 rounded-xl mt-4 animate-pulse h-24 w-full" });
    }
    return (_jsxs("div", { className: "bg-gradient-to-r from-[#111] to-[#1a0a0a] border border-[#DC143C]/30 p-4 rounded-xl mt-4 relative overflow-hidden w-full", children: [_jsx("div", { className: "absolute top-0 right-0 p-2 opacity-10", children: _jsx(Briefcase, { className: "w-16 h-16 text-[#DC143C]" }) }), _jsxs("div", { className: "flex items-start gap-4 relative z-10", children: [_jsx("div", { className: "bg-[#DC143C]/20 p-3 rounded-full shrink-0 mt-1", children: _jsx(Zap, { className: "w-6 h-6 text-[#DC143C]" }) }), _jsxs("div", { children: [_jsx("h4", { className: "text-[12px] uppercase font-black tracking-widest text-[#DC143C] mb-2", children: "Porada Eksperta AI" }), _jsx("p", { className: "text-white/90 text-sm leading-relaxed", children: tip })] })] })] }));
};
export function LoanCalculator() {
    const navigate = useNavigate();
    const [step, setStep] = useState(0);
    const [quizStep, setQuizStep] = useState(0);
    const [quizData, setQuizData] = useState(() => loadFromLocalStorage('quizData') || {
        goal: '',
        amount: '',
        period: '',
        score: '',
        employment: '',
        income: '',
        email: '',
        phone: '',
        firstName: '',
        excludedBank: []
    });
    const [loadingText, setLoadingText] = useState('Analiza danych...');
    const [bestOffer, setBestOffer] = useState(null);
    const [allOffers, setAllOffers] = useState([]);
    const [downsellData, setDownsellData] = useState(null);
    const [excludedBanks, setExcludedBanks] = useState([]);
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [filterBank, setFilterBank] = useState('');
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [aiOffer, setAiOffer] = useState(null);
    const [faqAnswers, setFaqAnswers] = useState({});
    const [loadingFaq, setLoadingFaq] = useState(null);
    const [isCalculating, setIsCalculating] = useState(false);
    const [emailError, setEmailError] = useState('');
    const [phoneError, setPhoneError] = useState('');
    const [nameError, setNameError] = useState('');
    const [slideIndex, setSlideIndex] = useState(0);
    const [showFaqModal, setShowFaqModal] = useState(false);
    const [showComparisonModal, setShowComparisonModal] = useState(false);
    const [expandedFaq, setExpandedFaq] = useState(null);
    const [comparedOffers, setComparedOffers] = useState([]);
    const [savedSimulation, setSavedSimulation] = useState(() => loadFromLocalStorage('savedSimulation') || null);
    const [showSavedComparison, setShowSavedComparison] = useState(false);
    const allPossibleQuestions = getQuizQuestions(quizData);
    const currentQuestions = allPossibleQuestions.filter(q => !q.condition || q.condition(quizData));
    useEffect(() => {
        saveToLocalStorage('quizData', quizData);
    }, [quizData]);
    useEffect(() => {
        const interval = setInterval(() => {
            setSlideIndex(prev => (prev + 1) % 3);
        }, 10000);
        return () => clearInterval(interval);
    }, []);
    const handleOptionSelect = async (value) => {
        const currentQuestion = currentQuestions[quizStep];
        // Jeśli wybrano "Hipoteka", przejdź do symulatora hipoteki
        if (currentQuestion.id === 'goal' && value === 'house') {
            navigate('/mortgage');
            return;
        }
        const newData = { ...quizData, [currentQuestion.id]: value };
        setQuizData(newData);
        // Re-calculate questions based on new data to see if next steps changed
        const nextPossibleQuestions = allPossibleQuestions.filter(q => !q.condition || q.condition(newData));
        if (quizStep < nextPossibleQuestions.length - 1) {
            setQuizStep(quizStep + 1);
        }
        else {
            // Add contact info step before submitting
            setStep(6);
        }
    };
    useEffect(() => {
        if (step === 7 && downsellData && downsellData.url) {
            const timer = setTimeout(() => {
                window.location.href = downsellData.url;
            }, 2500);
            return () => clearTimeout(timer);
        }
    }, [step, downsellData]);
    const [shouldFetchOffers, setShouldFetchOffers] = useState(false);
    useEffect(() => {
        if (step === 2 && shouldFetchOffers) {
            const fetchAllData = async () => {
                setShouldFetchOffers(false);
                // Fire and forget leads insert
                supabase.from('leads').insert({
                    quiz_data: quizData,
                    email: quizData.email,
                    phone: quizData.phone,
                    first_name: quizData.firstName
                }).then();
                const fetchAiAndOffers = async () => {
                    try {
                        const aiPromise = getAiRecommendedOffers(quizData);
                        const offersPromise = fetchOffersFromApi(quizData);
                        const [recommendations, offersData] = await Promise.all([aiPromise, offersPromise]);
                        setAiOffer(recommendations);
                        return offersData;
                    }
                    catch (error) {
                        console.error('Error in fetching data:', error);
                        return null;
                    }
                    finally {
                        setIsAiLoading(false);
                        setIsCalculating(false);
                    }
                };
                const [offersData] = await Promise.all([
                    fetchAiAndOffers(),
                    new Promise(resolve => setTimeout(resolve, 4000))
                ]);
                if (quizData.goal === 'business') {
                    if (offersData && !Array.isArray(offersData) && offersData.status === 'downsell') {
                        setDownsellData(offersData);
                        setStep(7);
                    }
                    else {
                        setAllOffers(offersData || []);
                        setStep(5);
                    }
                    return;
                }
                if (offersData && !Array.isArray(offersData) && offersData.status === 'downsell') {
                    setDownsellData(offersData);
                    setStep(7);
                }
                else if (offersData && Array.isArray(offersData) && offersData.length > 0) {
                    setBestOffer(offersData[0]);
                    setAllOffers(offersData);
                    setStep(3);
                }
                else {
                    setStep(4);
                }
            };
            fetchAllData();
        }
    }, [step, shouldFetchOffers, quizData]);
    const submitQuiz = async (finalData) => {
        setIsCalculating(true);
        setIsAiLoading(true);
        setStep(2);
        setShouldFetchOffers(true);
    };
    const saveSimulation = () => {
        const simulationData = {
            quizData,
            bestOffer,
            allOffers,
            aiOffer,
            date: new Date().toISOString()
        };
        setSavedSimulation(simulationData);
        saveToLocalStorage('savedSimulation', simulationData);
    };
    const fetchAnswer = async (question) => {
        if (expandedFaq === question) {
            setExpandedFaq(null);
            return;
        }
        setExpandedFaq(question);
        if (faqAnswers[question])
            return;
        setLoadingFaq(question);
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    history: [],
                    message: `Odpowiedz krótko i konkretnie na pytanie: ${question}`
                })
            });
            if (!response.ok)
                throw new Error('Network error');
            const data = await response.json();
            setFaqAnswers(prev => ({ ...prev, [question]: data.text || "Brak odpowiedzi." }));
        }
        catch (error) {
            console.error("Error fetching FAQ:", error);
            setFaqAnswers(prev => ({ ...prev, [question]: "Wystąpił błąd pobierania odpowiedzi." }));
        }
        finally {
            setLoadingFaq(null);
        }
    };
    const toggleCompare = (offer) => {
        setComparedOffers(prev => {
            if (prev.find(o => o.id === offer.id)) {
                return prev.filter(o => o.id !== offer.id);
            }
            if (prev.length >= 2)
                return prev;
            return [...prev, offer];
        });
    };
    const reset = () => {
        setStep(0);
        setQuizStep(0);
        setQuizData({
            goal: '',
            amount: '',
            period: '',
            score: '',
            employment: '',
            income: '',
            accountFilter: '',
            insuranceType: '',
            businessType: '',
            savingsType: '',
            excludedBank: [],
            firstName: '',
            email: '',
            phone: ''
        });
        setBestOffer(null);
        setAllOffers([]);
        setExcludedBanks([]);
    };
    const getEpi = () => 'react_app';
    const handleContactSubmit = () => {
        setEmailError('');
        setPhoneError('');
        setNameError('');
        let hasError = false;
        // Name validation
        if (!quizData.firstName || quizData.firstName.trim().length < 2) {
            setNameError('Imię jest wymagane');
            hasError = true;
        }
        if (!hasError) {
            submitQuiz(quizData);
        }
    };
    const renderResultsStep = () => {
        const visibleOffers = allOffers.filter(o => !excludedBanks.includes(o.name || ''));
        const principal = quizData.amount === 'small' ? 3000 : quizData.amount === 'medium' ? 6500 : quizData.amount === 'big' ? 30000 : 75000;
        const months = quizData.period === 'short' ? 12 : quizData.period === 'medium' ? 24 : quizData.period === 'long' ? 60 : 120;
        const generatePdf = () => {
            const doc = new jsPDF();
            doc.setFontSize(18);
            doc.text("Podsumowanie Raportu Finansowego", 20, 20);
            doc.setFontSize(12);
            doc.text(`Cel: ${quizData.goal}`, 20, 35);
            doc.text(`Szacowana kwota: ${principal} PLN`, 20, 42);
            doc.text(`Okres spłaty: ${months} miesiecy`, 20, 49);
            doc.setFontSize(14);
            doc.text("Najlepsze dopasowane wyliczenia:", 20, 65);
            doc.setFontSize(12);
            let yPos = 75;
            if (aiOffer) {
                doc.text(`[REKOMENDACJA AI] ${aiOffer.name}`, 20, yPos);
                doc.setFontSize(10);
                const rrsoStr = aiOffer.rrso || "10%";
                const rrsoVal = parseFloat(rrsoStr.replace(',', '.').replace('%', '')) || 10;
                const monthlyRate = rrsoVal / 100 / 12;
                const estimatedPayment = (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months));
                doc.text(`RRSO: ${rrsoStr} | Szacowana rata: ${estimatedPayment.toFixed(2)} PLN/mc`, 20, yPos + 7);
                doc.text(`Calkowity koszt: ${(estimatedPayment * months).toFixed(2)} PLN`, 20, yPos + 14);
                const splitDescription = doc.splitTextToSize(`Powod: ${aiOffer.description}`, 170);
                doc.text(splitDescription, 20, yPos + 21);
                doc.setFontSize(12);
                yPos += 25 + (splitDescription.length * 4);
            }
            visibleOffers.slice(0, 3).forEach((offer, idx) => {
                if (yPos > 260) {
                    doc.addPage();
                    yPos = 20;
                }
                doc.text(`${idx + 1}. ${offer.name}`, 20, yPos);
                doc.setFontSize(10);
                if (offer.features && offer.features.length > 0) {
                    const splitAttr = doc.splitTextToSize(`Cechy: ${offer.features.slice(0, 4).join(', ')}`, 170);
                    doc.text(splitAttr, 20, yPos + 7);
                    yPos += (splitAttr.length * 4);
                }
                doc.setFontSize(12);
                yPos += 15;
            });
            doc.save("raport_finansowy.pdf");
        };
        const currentBestOffer = visibleOffers.length > 0 ? visibleOffers[0] : null;
        if (!aiOffer && visibleOffers.length === 0) {
            return (_jsxs("div", { className: "flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4 animate-in fade-in duration-500 relative", children: [_jsx("button", { onClick: reset, className: "absolute top-0 left-4 text-white/50 hover:text-white transition-colors p-2", children: _jsx(ArrowLeft, { className: "w-5 h-5" }) }), _jsx(HelpCircle, { className: "w-12 h-12 text-white/20 mb-2" }), _jsx("h3", { className: "text-lg font-bold text-white uppercase", children: "Brak dost\u0119pnych ofert" }), _jsx("p", { className: "text-white/60 text-sm", children: "Przepraszamy, w tej chwili nie znale\u017Ali\u015Bmy ofert dopasowanych do Twojego profilu. Spr\u00F3buj zmieni\u0107 parametry wyszukiwania." }), _jsx("button", { onClick: reset, className: "w-full py-4 bg-[#DC143C] text-white font-bold rounded-xl uppercase tracking-widest mt-4", children: "Spr\u00F3buj ponownie" })] }));
        }
        const chartData = [
            ...(aiOffer ? [{ name: aiOffer.name || 'AI Rekomendacja', match: 98 }] : []),
            ...visibleOffers.slice(0, aiOffer ? 3 : 4).map((offer, index) => ({
                name: offer.name || `Oferta ${index + 1}`,
                match: Math.max(70, 92 - index * 8 + Math.floor(Math.random() * 5)),
            }))
        ];
        return (_jsxs("div", { className: "flex-1 w-full max-w-md mx-auto space-y-4 animate-in zoom-in duration-500 p-4 pb-6 overflow-y-auto relative custom-scrollbar", children: [_jsx("button", { onClick: reset, className: "absolute top-0 left-4 text-white/50 hover:text-white transition-colors p-2 z-20", children: _jsx(ArrowLeft, { className: "w-5 h-5" }) }), _jsxs("div", { className: "flex items-center justify-end mb-2 pt-2 pr-2 gap-2 flex-wrap", children: [visibleOffers.length > 0 && (_jsxs("button", { onClick: saveSimulation, className: "flex items-center gap-1 text-[10px] uppercase font-black tracking-widest text-white hover:text-[#DC143C] transition-colors bg-white/5 px-3 py-1 rounded-full border border-white/10", children: [_jsx(Bookmark, { className: "w-3 h-3" }), " Zapisz"] })), savedSimulation && (_jsxs("button", { onClick: () => setShowSavedComparison(true), className: "flex items-center gap-1 text-[10px] uppercase font-black tracking-widest text-[#DC143C] hover:text-white transition-colors bg-[#DC143C]/10 px-3 py-1 rounded-full border border-[#DC143C]/20", children: [_jsx(ArrowLeftRight, { className: "w-3 h-3" }), " Por\u00F3wnaj z zapisan\u0105"] })), visibleOffers.length > 0 && (_jsxs("button", { onClick: generatePdf, className: "flex items-center gap-1 text-[10px] uppercase font-black tracking-widest text-white hover:text-[#DC143C] transition-colors bg-white/5 px-3 py-1 rounded-full border border-white/10", children: [_jsx(Download, { className: "w-3 h-3" }), " PDF"] })), visibleOffers.length > 0 && (_jsx("button", { onClick: () => { setFilterBank(''); setShowFilterModal(true); }, className: "text-[10px] uppercase font-black tracking-widest text-[#DC143C] hover:text-white transition-colors bg-[#DC143C]/5 px-3 py-1 rounded-full border border-[#DC143C]/20", children: "Filtruj Wyniki" }))] }), aiOffer && _jsx(AiOfferRecommendations, { offers: [aiOffer] }), chartData.length > 0 && (_jsxs("div", { className: "mt-8 mb-4 bg-[#111111] p-5 rounded-[24px] border border-white/5 shadow-2xl relative overflow-hidden group hover:border-[#DC143C]/30 transition-all", children: [_jsx("div", { className: "absolute inset-0 bg-gradient-to-br from-[#DC143C]/5 via-transparent to-transparent opacity-50" }), _jsxs("h3", { className: "text-sm font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2 relative z-10", children: [_jsx(TrendingUp, { className: "w-4 h-4 text-[#DC143C]" }), "Szansa na akceptacj\u0119 (%)"] }), _jsx("div", { className: "h-48 w-full relative z-10", children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(BarChart, { data: chartData, layout: "vertical", margin: { top: 0, right: 20, left: -20, bottom: 0 }, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#ffffff10", horizontal: false }), _jsx(XAxis, { type: "number", domain: [0, 100], hide: true }), _jsx(YAxis, { dataKey: "name", type: "category", stroke: "#ffffff50", fontSize: 10, tickLine: false, axisLine: false, width: 100 }), _jsx(Tooltip, { cursor: { fill: 'transparent' }, contentStyle: { backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }, itemStyle: { color: '#fff', fontSize: '12px' }, formatter: (value) => [`${value}%`, 'Akceptacja'] }), _jsx(Bar, { dataKey: "match", radius: [0, 4, 4, 0], barSize: 16, children: chartData.map((entry, index) => (_jsx(Cell, { fill: index === 0 && aiOffer ? '#DC143C' : '#ffffff20' }, `cell-${index}`))) })] }) }) })] })), _jsx(AmortizationChart, { principal: principal, annualRate: 0.10, months: months }), visibleOffers.length > 0 && (_jsxs("div", { className: "mt-8 space-y-4", children: [_jsx("h3", { className: "text-lg font-black text-white uppercase italic text-center w-full block mb-4 border-b border-white/10 pb-2", children: "Pozosta\u0142e Dopasowane Oferty" }), visibleOffers.map((offer, idx) => (_jsxs("div", { className: "bg-[#111111] p-5 sm:p-6 rounded-[24px] border border-white/5 flex flex-col gap-5 group hover:border-[#DC143C]/50 hover:shadow-[0_0_15px_rgba(220,20,60,0.15)] transition-all relative overflow-hidden", children: [_jsx("div", { className: "absolute inset-0 bg-gradient-to-br from-[#DC143C]/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" }), _jsxs("div", { className: "flex items-center justify-center relative min-h-[64px] z-10", children: [_jsx("h4", { className: "text-white font-bold text-base sm:text-lg text-center px-10 leading-snug tracking-tight group-hover:text-[#DC143C] transition-colors", children: offer.name }), _jsx("div", { className: "absolute right-0 top-1/2 -translate-y-1/2 text-[#DC143C] opacity-80 group-hover:opacity-100 transition-opacity", children: getOfferIcon(offer.category || '') })] }), _jsxs("div", { className: "flex flex-col items-center w-full z-10 gap-2", children: [_jsx(OfferCountdown, { initialMinutes: 14 }), _jsx("button", { onClick: () => toggleCompare(offer), className: `w-full py-2 text-[10px] sm:text-xs font-bold uppercase tracking-widest rounded-lg border transition-all ${comparedOffers.find(o => o.id === offer.id)
                                                ? 'bg-[#DC143C] border-[#DC143C] text-white'
                                                : 'bg-transparent border-white/20 text-white/50 hover:text-white hover:border-white/40'}`, children: comparedOffers.find(o => o.id === offer.id) ? 'Wybrano do porównania' : 'Porównaj' }), _jsxs("a", { href: `/api/go?offerId=${offer.id || idx}`, target: "_blank", rel: "noopener noreferrer", className: "w-full py-4 sm:py-4 bg-[#1a1a1a] hover:bg-[#DC143C] border border-white/10 group-hover:border-transparent text-white text-[13px] sm:text-sm font-black uppercase tracking-[0.2em] rounded-xl flex items-center justify-center gap-2 transition-all duration-300 min-h-[48px] shadow-lg group-hover:shadow-[#DC143C]/30", children: ["Dalej ", _jsx(ArrowRight, { className: "w-4 h-4 group-hover:translate-x-1 transition-transform" })] })] })] }, idx)))] })), comparedOffers.length > 0 && (_jsx("button", { onClick: () => setShowComparisonModal(true), className: "fixed bottom-6 right-6 bg-[#DC143C] text-white p-4 rounded-full shadow-lg z-40 animate-bounce", children: _jsx(Coins, { className: "w-6 h-6" }) })), showComparisonModal && (_jsx("div", { className: "fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4", children: _jsxs("div", { className: "bg-[#0A0A0A] border border-[#DC143C]/30 rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col p-4", children: [_jsxs("div", { className: "flex items-center justify-between border-b border-white/10 pb-4", children: [_jsx("h3", { className: "text-white font-bold uppercase tracking-widest", children: "Por\u00F3wnanie Ofert" }), _jsx("button", { onClick: () => setShowComparisonModal(false), className: "text-white/50 hover:text-white", children: _jsx(X, { className: "w-6 h-6" }) })] }), _jsx("div", { className: "flex-1 overflow-y-auto space-y-4 pt-4 custom-scrollbar", children: comparedOffers.map(o => (_jsxs("div", { className: "bg-white/5 p-4 rounded-xl border border-white/10", children: [_jsx("h4", { className: "text-white font-bold text-lg", children: o.name }), _jsx("p", { className: "text-white/60 text-sm mt-1", children: o.category })] }, o.id))) })] }) })), showSavedComparison && savedSimulation && (_jsxs(_Fragment, { children: [_jsx("div", { className: "fixed inset-0 bg-black/60 backdrop-blur-sm z-40", onClick: () => setShowSavedComparison(false) }), _jsxs("div", { className: "fixed inset-y-0 right-0 w-full max-w-md bg-[#0A0A0A] border-l border-[#DC143C]/30 z-50 flex flex-col shadow-2xl animate-in slide-in-from-right duration-500", children: [_jsxs("div", { className: "flex items-center justify-between p-4 border-b border-white/10 shrink-0 bg-black/50", children: [_jsxs("h3", { className: "text-white font-bold uppercase tracking-widest flex items-center gap-2", children: [_jsx(ArrowLeftRight, { className: "w-5 h-5 text-[#DC143C]" }), "Por\u00F3wnanie Scenariuszy"] }), _jsx("button", { onClick: () => setShowSavedComparison(false), className: "text-white/50 hover:text-white transition-colors", children: _jsx(X, { className: "w-6 h-6" }) })] }), _jsxs("div", { className: "flex-1 overflow-y-auto p-4 custom-scrollbar", children: [_jsxs("div", { className: "flex flex-col gap-6 h-full", children: [_jsxs("div", { className: "bg-white/5 p-4 rounded-xl border border-[#DC143C]/30 flex flex-col space-y-4", children: [_jsx("h4", { className: "text-white font-bold text-center uppercase tracking-widest mb-2 border-b border-white/10 pb-2 text-[#DC143C]", children: "Bie\u017C\u0105ca Symulacja" }), _jsxs("div", { className: "space-y-2 text-sm", children: [_jsxs("p", { className: "text-white/70", children: ["Cel: ", _jsx("span", { className: "text-white font-bold", children: quizData.goal })] }), _jsxs("p", { className: "text-white/70", children: ["Kwota: ", _jsx("span", { className: "text-white font-bold", children: quizData.amount })] }), _jsxs("p", { className: "text-white/70", children: ["Okres: ", _jsx("span", { className: "text-white font-bold", children: quizData.period })] })] }), aiOffer && (_jsxs("div", { className: "bg-[#111] p-3 rounded-lg border border-white/10 mt-4", children: [_jsx("p", { className: "text-xs text-[#DC143C] font-bold uppercase mb-1", children: "Rekomendacja AI" }), _jsx("p", { className: "text-white font-bold", children: aiOffer.name }), _jsx("p", { className: "text-white/60 text-xs mt-1", children: aiOffer.description })] })), _jsxs("div", { className: "flex-1 mt-4", children: [_jsx("p", { className: "text-xs text-white/50 font-bold uppercase mb-2", children: "Najlepsze Oferty" }), _jsx("div", { className: "space-y-2", children: allOffers.slice(0, 3).map((o, i) => (_jsx("div", { className: "bg-[#111] p-2 rounded-lg border border-white/5 text-xs text-white", children: o.name }, i))) })] })] }), _jsxs("div", { className: "bg-white/5 p-4 rounded-xl border border-white/10 flex flex-col space-y-4", children: [_jsxs("div", { className: "flex justify-between items-center mb-2 border-b border-white/10 pb-2", children: [_jsx("h4", { className: "text-white font-bold uppercase tracking-widest text-white/70", children: "Zapisana Symulacja" }), _jsx("span", { className: "text-[10px] text-white/40", children: new Date(savedSimulation.date).toLocaleDateString() })] }), _jsxs("div", { className: "space-y-2 text-sm", children: [_jsxs("p", { className: "text-white/70", children: ["Cel: ", _jsx("span", { className: "text-white font-bold", children: savedSimulation.quizData.goal })] }), _jsxs("p", { className: "text-white/70", children: ["Kwota: ", _jsx("span", { className: "text-white font-bold", children: savedSimulation.quizData.amount })] }), _jsxs("p", { className: "text-white/70", children: ["Okres: ", _jsx("span", { className: "text-white font-bold", children: savedSimulation.quizData.period })] })] }), savedSimulation.aiOffer && (_jsxs("div", { className: "bg-[#111] p-3 rounded-lg border border-white/10 mt-4", children: [_jsx("p", { className: "text-xs text-white/50 font-bold uppercase mb-1", children: "Rekomendacja AI" }), _jsx("p", { className: "text-white font-bold", children: savedSimulation.aiOffer.name }), _jsx("p", { className: "text-white/60 text-xs mt-1", children: savedSimulation.aiOffer.description })] })), _jsxs("div", { className: "flex-1 mt-4", children: [_jsx("p", { className: "text-xs text-white/50 font-bold uppercase mb-2", children: "Najlepsze Oferty" }), _jsx("div", { className: "space-y-2", children: savedSimulation.allOffers.slice(0, 3).map((o, i) => (_jsx("div", { className: "bg-[#111] p-2 rounded-lg border border-white/5 text-xs text-white", children: o.name }, i))) })] })] })] }), _jsx("div", { className: "mt-6 mb-8", children: _jsx(ExpertTip, { quizData: quizData, savedQuizData: savedSimulation.quizData }) })] })] })] })), _jsx(Timer, { start: step === 3 || step === 5 }), _jsx("div", { className: "text-center", children: _jsxs("p", { className: "text-[9px] text-white/40 font-medium italic", children: ["Ostatnia wyp\u0142ata: ", new Date().toLocaleTimeString(), " dla klienta z Twojego regionu."] }) }), _jsx("button", { onClick: reset, className: "w-full text-white/20 text-[9px] uppercase font-bold mt-4 tracking-widest hover:text-white transition-colors pb-4", children: "\u2190 Resetuj i przeprowad\u017A now\u0105 analiz\u0119" })] }));
    };
    return (_jsxs("div", { className: "w-full min-h-full flex flex-col items-center justify-between font-sans relative px-2 pb-2", children: [_jsx("div", { className: "absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-[#DC143C]/10 blur-[80px] pointer-events-none" }), _jsx("div", { className: "text-center pt-2 pb-1 w-full flex-shrink-0", children: step === 0 ? (_jsxs("div", { className: "relative h-[140px] w-full max-w-[300px] mx-auto flex items-center justify-center mb-2", children: [_jsx("div", { className: `absolute inset-0 transition-all duration-1000 flex items-center justify-center ${slideIndex === 0 ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`, children: _jsx("p", { className: "text-white/40 text-xs sm:text-sm leading-tight font-light", children: "Poznaj oferty dzi\u0119ki kt\u00F3rym zyskasz Ty. Nie jak dotychczas tylko bank." }) }), _jsx("div", { className: `absolute inset-0 transition-all duration-1000 flex items-center justify-center ${slideIndex === 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`, children: _jsx("div", { className: "scale-90 origin-center w-full", children: _jsx(LiveCounter, {}) }) }), _jsx("div", { className: `absolute inset-0 transition-all duration-1000 flex items-center justify-center ${slideIndex === 2 ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`, children: _jsx("div", { className: "scale-90 origin-center w-full", children: _jsx(FinancialNews, { compact: true }) }) })] })) : (_jsx("h2", { className: "text-sm sm:text-base font-bold text-white tracking-tight mt-2 uppercase", children: step === 2 ? 'Analiza Twojego Profilu' : 'Skalibruj system pod swój profil' })) }), step === 0 && (_jsxs("div", { className: "flex-1 w-full flex flex-col px-2 sm:px-4 pb-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-4 sm:mb-6", children: [quizStep > 0 ? (_jsx("button", { onClick: () => setQuizStep(quizStep - 1), className: "text-white/50 hover:text-white transition-colors", children: _jsx(ArrowLeft, { className: "w-5 h-5" }) })) : (_jsx("div", { className: "w-5 h-5" })), _jsx("div", { className: "flex gap-1.5", children: currentQuestions.map((_, idx) => (_jsx("div", { className: `h-1.5 rounded-full transition-all duration-300 ${idx === quizStep ? 'w-6 bg-[#DC143C]' : idx < quizStep ? 'w-2 bg-[#DC143C]/50' : 'w-2 bg-white/10'}` }, idx))) }), _jsx("div", { className: "w-5 h-5" })] }), _jsxs("div", { className: "flex-1 flex flex-col animate-in slide-in-from-right duration-500 min-h-0", children: [_jsxs("div", { className: "text-center shrink-0 mb-6 space-y-2", children: [_jsx("h2", { className: "text-[19px] sm:text-[22px] font-black text-white tracking-tight leading-snug", children: currentQuestions[quizStep].title }), currentQuestions[quizStep].subtitle && (_jsx("p", { className: "text-sm sm:text-base text-white/70 font-medium", children: currentQuestions[quizStep].subtitle }))] }), currentQuestions[quizStep].type === 'select' || currentQuestions[quizStep].type === 'multiselect' ? (_jsxs("div", { className: "flex flex-col gap-3 w-full max-w-xs mx-auto flex-1 min-h-0", children: [_jsx("div", { className: "flex flex-col gap-2 overflow-y-auto custom-scrollbar pr-1 pb-4 flex-1", children: currentQuestions[quizStep].options.map((opt) => {
                                            const selectedList = Array.isArray(quizData[currentQuestions[quizStep].id])
                                                ? quizData[currentQuestions[quizStep].id]
                                                : (quizData[currentQuestions[quizStep].id] ? [quizData[currentQuestions[quizStep].id]] : []);
                                            const isSelected = selectedList.includes(opt.value);
                                            return (_jsxs("button", { onClick: () => {
                                                    const questionId = currentQuestions[quizStep].id;
                                                    let newSelections = [...selectedList];
                                                    if (currentQuestions[quizStep].type === 'select') {
                                                        newSelections = [opt.value];
                                                    }
                                                    else {
                                                        if (opt.value.startsWith('Brak')) {
                                                            newSelections = [opt.value];
                                                        }
                                                        else {
                                                            newSelections = newSelections.filter((v) => !v.startsWith('Brak'));
                                                            if (isSelected) {
                                                                newSelections = newSelections.filter((v) => v !== opt.value);
                                                            }
                                                            else {
                                                                newSelections.push(opt.value);
                                                            }
                                                        }
                                                    }
                                                    setQuizData({ ...quizData, [questionId]: newSelections });
                                                    let shouldAutoProceed = false;
                                                    if (currentQuestions[quizStep].type === 'select') {
                                                        shouldAutoProceed = true;
                                                    }
                                                    else {
                                                        const requiredCount = quizData.excludedBankCount;
                                                        if (newSelections.length > 0 && newSelections[0].startsWith('Brak')) {
                                                            shouldAutoProceed = true;
                                                        }
                                                        else if (requiredCount && requiredCount !== '4+' && Number(requiredCount) > 0) {
                                                            if (newSelections.length === Number(requiredCount)) {
                                                                shouldAutoProceed = true;
                                                            }
                                                        }
                                                    }
                                                    if (shouldAutoProceed) {
                                                        setTimeout(() => {
                                                            if (quizStep < currentQuestions.length - 1) {
                                                                setQuizStep(prev => prev + 1);
                                                            }
                                                            else {
                                                                setStep(6);
                                                            }
                                                        }, 300);
                                                    }
                                                }, className: `flex items-center gap-3 p-3 sm:p-4 rounded-xl border text-left cursor-pointer transition-all ${isSelected ? 'bg-[#DC143C]/20 border-[#DC143C]' : 'bg-[#1a1a1a] border-white/10 hover:border-white/30'}`, children: [_jsx("div", { className: `w-5 h-5 rounded flex-shrink-0 flex items-center justify-center border ${isSelected ? 'bg-[#DC143C] border-[#DC143C]' : 'border-white/30'}`, children: isSelected && _jsx("svg", { className: "w-3 h-3 text-white", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 3, d: "M5 13l4 4L19 7" }) }) }), _jsx("span", { className: "text-xs sm:text-sm font-medium text-white break-words", children: opt.label })] }, opt.value));
                                        }) }), (!quizData.excludedBankCount || quizData.excludedBankCount === '4+') && (_jsx("button", { onClick: () => {
                                            const val = quizData[currentQuestions[quizStep].id];
                                            if (!val || val.length === 0)
                                                return;
                                            if (quizStep < currentQuestions.length - 1) {
                                                setQuizStep(quizStep + 1);
                                            }
                                            else {
                                                setStep(6);
                                            }
                                        }, disabled: (() => {
                                            const val = quizData[currentQuestions[quizStep].id] || [];
                                            const requiredCount = quizData.excludedBankCount;
                                            if (val.length > 0 && val[0].startsWith('Brak'))
                                                return false;
                                            if (requiredCount === '4+')
                                                return val.length < 4;
                                            if (requiredCount && Number(requiredCount) > 0)
                                                return val.length < Number(requiredCount);
                                            return val.length === 0;
                                        })(), className: "w-full shrink-0 py-4 mb-2 bg-[#DC143C] text-white font-bold rounded-xl uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:bg-[#ff1a4b] mt-2", children: "Dalej" }))] })) : (_jsx("div", { className: "flex-1 overflow-y-auto custom-scrollbar pr-1 pb-4 min-h-0", children: _jsx("div", { className: "grid grid-cols-2 gap-3 sm:gap-4 px-2", children: currentQuestions[quizStep].options.map((option) => {
                                        const Icon = option.icon;
                                        return (_jsxs("button", { onClick: () => handleOptionSelect(option.value), className: "flex flex-col items-center justify-center gap-3 p-3 sm:p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-white/[0.08] to-transparent border border-[#FF0033]/30 shadow-[0_4px_20px_rgba(0,0,0,0.5),inset_1px_1px_0_rgba(255,255,255,0.15)] hover:border-[#FF0033]/80 hover:shadow-[0_0_25px_rgba(255,0,51,0.25)] transition-all duration-300 group text-center min-h-[105px] sm:min-h-[135px] relative overflow-hidden", children: [_jsx("div", { className: "absolute inset-0 bg-[#0a0a0a] z-[-1] opacity-60" }), _jsx("div", { className: "w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300", children: _jsx(Icon, { className: "w-6 h-6 sm:w-7 sm:h-7 text-[#FF0033] drop-shadow-[0_0_8px_rgba(255,0,51,0.6)] group-hover:drop-shadow-[0_0_12px_rgba(255,0,51,1)] transition-all" }) }), _jsx("span", { className: "text-white font-bold text-xs sm:text-sm leading-tight px-1 z-10", children: option.label })] }, option.value));
                                    }) }) }))] }), quizStep === 0 && (_jsx("div", { className: "mt-6 pt-4 pb-2", children: _jsxs("button", { onClick: () => setShowFaqModal(true), className: "w-full flex items-center justify-center gap-2 text-white/50 text-[10px] uppercase font-bold tracking-widest hover:text-white transition-colors", children: [_jsx(HelpCircle, { className: "w-3 h-3" }), "Poka\u017C FAQ"] }) }))] })), step === 6 && (_jsxs("div", { className: "flex-1 w-full flex flex-col items-center justify-center p-6 space-y-4 animate-in fade-in duration-500 relative", children: [_jsx("button", { onClick: () => setStep(0), className: "absolute top-0 left-4 text-white/50 hover:text-white transition-colors p-2", children: _jsx(ArrowLeft, { className: "w-5 h-5" }) }), _jsxs("div", { className: "text-center mb-4", children: [_jsx("h2", { className: "text-xl font-bold text-white mb-1", children: "Ostatni krok" }), _jsx("p", { className: "text-white/60 text-xs uppercase tracking-widening", children: "Dane do wysy\u0142ki Twojego raportu" })] }), _jsxs("div", { className: "w-full space-y-1", children: [_jsx("input", { type: "text", placeholder: "Twoje imi\u0119", className: `w-full p-4 rounded-xl bg-white/5 border ${nameError ? 'border-[#DC143C]' : 'border-white/10'} text-white placeholder-white/30 focus:outline-none focus:border-[#DC143C]/50 transition-colors`, value: quizData.firstName || '', onChange: (e) => {
                                    setQuizData({ ...quizData, firstName: e.target.value });
                                    if (nameError)
                                        setNameError('');
                                } }), nameError && _jsx("p", { className: "text-[#DC143C] text-[10px] font-bold uppercase ml-2 animate-in fade-in slide-in-from-top-1", children: nameError })] }), _jsxs("div", { className: "w-full space-y-1", children: [_jsx("input", { type: "email", placeholder: "E-mail", className: `w-full p-4 rounded-xl bg-white/5 border ${emailError ? 'border-[#DC143C]' : 'border-white/10'} text-white placeholder-white/30 focus:outline-none focus:border-[#DC143C]/50 transition-colors`, value: quizData.email || '', onChange: (e) => {
                                    setQuizData({ ...quizData, email: e.target.value });
                                    if (emailError)
                                        setEmailError('');
                                } }), emailError && _jsx("p", { className: "text-[#DC143C] text-[10px] font-bold uppercase ml-2 animate-in fade-in slide-in-from-top-1", children: emailError })] }), _jsxs("div", { className: "w-full space-y-1", children: [_jsx("input", { type: "tel", placeholder: "Telefon (np. 123456789)", className: `w-full p-4 rounded-xl bg-white/5 border ${phoneError ? 'border-[#DC143C]' : 'border-white/10'} text-white placeholder-white/30 focus:outline-none focus:border-[#DC143C]/50 transition-colors`, value: quizData.phone || '', onChange: (e) => {
                                    setQuizData({ ...quizData, phone: e.target.value });
                                    if (phoneError)
                                        setPhoneError('');
                                } }), phoneError && _jsx("p", { className: "text-[#DC143C] text-[10px] font-bold uppercase ml-2 animate-in fade-in slide-in-from-top-1", children: phoneError })] }), _jsx("button", { onClick: handleContactSubmit, className: "w-full py-4 bg-[#DC143C] text-white font-bold rounded-xl uppercase tracking-widest mt-4 shadow-[0_0_20px_rgba(220,20,60,0.3)] hover:shadow-[0_0_30px_rgba(220,20,60,0.5)] transition-all hover:scale-[1.02] active:scale-95", children: "Zako\u0144cz i odbierz raport" }), _jsx("p", { className: "text-[9px] text-white/30 text-center uppercase tracking-tighter mt-2", children: "Bezpiecze\u0144stwo Twoich danych jest dla nas priorytetem" })] })), step === 2 && (_jsx("div", { className: "flex-1 flex flex-col items-center justify-center space-y-6 w-full", children: _jsx(ScanningPhase, { quizData: quizData }) })), (step === 3 || step === 5) && renderResultsStep(), step === 4 && (_jsxs("div", { className: "flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4 relative", children: [_jsx("button", { onClick: reset, className: "absolute top-0 left-4 text-white/50 hover:text-white transition-colors p-2", children: _jsx(ArrowLeft, { className: "w-5 h-5" }) }), _jsx(ShieldPlus, { className: "w-12 h-12 text-[#DC143C] mb-2" }), _jsx("h3", { className: "text-xl font-bold text-white uppercase", children: "Wymagana dodatkowa weryfikacja" }), _jsx("p", { className: "text-white/60 text-sm", children: "Twoje parametry wymagaj\u0105 manualnego dopasowania przez eksperta." }), _jsx("button", { onClick: reset, className: "w-full py-4 bg-[#DC143C] text-white font-bold rounded-xl uppercase tracking-widest", children: "Spr\u00F3buj ponownie" })] })), step === 7 && downsellData && (_jsxs("div", { className: "fixed inset-0 bg-[#0A0A0A] flex flex-col items-center justify-center p-8 text-center animate-in fade-in z-50", children: [_jsx("h2", { className: "text-2xl font-black text-[#DC143C] uppercase animate-pulse mb-6", children: "Weryfikacja bankowa wstrzymana. Uruchamiam protok\u00F3\u0142 awaryjny: Wstrzymanie egzekucji i Czyszczenie BIK..." }), _jsxs("div", { className: "bg-white/5 p-6 rounded-2xl border border-white/10 w-full max-w-sm", children: [_jsx("h3", { className: "text-white font-bold mb-4", children: downsellData.name }), _jsx("ul", { className: "text-white/70 text-sm space-y-2", children: downsellData.features && downsellData.features.map((f) => _jsxs("li", { children: ["\u2022 ", f] }, f)) })] })] })), showFaqModal && (_jsx("div", { className: "fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4", children: _jsxs("div", { className: "bg-[#0A0A0A] border border-[#DC143C]/30 rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col", children: [_jsxs("div", { className: "flex items-center justify-between p-4 border-b border-white/10", children: [_jsx("h3", { className: "text-white font-bold uppercase tracking-widest", children: "FAQ - Finanse" }), _jsx("button", { onClick: () => setShowFaqModal(false), className: "text-white/50 hover:text-white", children: _jsx(X, { className: "w-6 h-6" }) })] }), _jsx("div", { className: "p-4 overflow-y-auto space-y-4", children: FAQ_QUESTIONS.map((q, index) => (_jsxs(motion.div, { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { delay: index * 0.1, duration: 0.3 }, className: "bg-white/5 rounded-xl p-3", children: [_jsxs("button", { onClick: () => fetchAnswer(q), className: "text-left text-white font-medium text-sm w-full flex justify-between items-center gap-2", children: [_jsx("span", { children: q }), _jsxs("div", { className: "flex items-center gap-2", children: [loadingFaq === q && _jsx("span", { className: "text-[#DC143C] text-[10px]", children: "\u0141adowanie..." }), expandedFaq === q ? _jsx(ChevronUp, { className: "w-4 h-4 text-white/50" }) : _jsx(ChevronDown, { className: "w-4 h-4 text-white/50" })] })] }), expandedFaq === q && faqAnswers[q] && (_jsx(motion.p, { initial: { opacity: 0, height: 0 }, animate: { opacity: 1, height: 'auto' }, className: "text-white/60 text-xs mt-2 pt-2 border-t border-white/5", children: faqAnswers[q] }))] }, q))) })] }) })), showFilterModal && (_jsx("div", { className: "fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4", children: _jsxs("div", { className: "bg-[#0A0A0A] border border-[#DC143C]/30 rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col", children: [_jsxs("div", { className: "flex items-center justify-between p-4 border-b border-white/10", children: [_jsx("h3", { className: "text-white font-bold uppercase tracking-widest", children: "Filtruj oferty" }), _jsx("button", { onClick: () => { setFilterBank(''); setShowFilterModal(false); }, className: "text-white/50 hover:text-white", children: _jsx(X, { className: "w-6 h-6" }) })] }), _jsxs("div", { className: "p-4 overflow-y-auto space-y-2 flex-1 custom-scrollbar", children: [_jsx("input", { type: "text", placeholder: "Szukaj banku...", className: "w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-[#DC143C]/50 mb-4", value: filterBank, onChange: (e) => setFilterBank(e.target.value) }), _jsx("p", { className: "text-white/50 text-xs mb-4", children: "Wybierz banki/oferty, kt\u00F3rych nie chcesz widzie\u0107 w wynikach." }), Array.from(new Set(allOffers.map(o => o.name || ''))).filter(Boolean).filter(name => name.toLowerCase().includes(filterBank.toLowerCase())).map((offerName, idx) => {
                                    const isExcluded = excludedBanks.includes(offerName);
                                    return (_jsxs("button", { onClick: () => {
                                            if (isExcluded) {
                                                setExcludedBanks(excludedBanks.filter(b => b !== offerName));
                                            }
                                            else {
                                                setExcludedBanks([...excludedBanks, offerName]);
                                            }
                                        }, className: `w-full flex items-center justify-between p-4 rounded-xl border transition-all ${isExcluded ? 'bg-white/5 border-[#DC143C]/50' : 'bg-white/10 border-transparent hover:bg-white/20'}`, children: [_jsx("span", { className: `text-sm font-medium ${isExcluded ? 'text-white/50 line-through' : 'text-white'}`, children: offerName }), _jsx("div", { className: `w-5 h-5 rounded-md border flex items-center justify-center ${isExcluded ? 'bg-[#DC143C] border-[#DC143C]' : 'border-white/30'}`, children: isExcluded && _jsx(X, { className: "w-3 h-3 text-white" }) })] }, idx));
                                })] }), _jsx("div", { className: "p-4 border-t border-white/10", children: _jsx("button", { onClick: () => { setFilterBank(''); setShowFilterModal(false); }, className: "w-full py-4 bg-[#DC143C] text-white font-bold rounded-xl uppercase tracking-widest hover:bg-[#FF0000] transition-colors", children: "Zastosuj filtry" }) })] }) }))] }));
}
