import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, Suspense, lazy } from 'react';
import { BrowserRouter, useLocation, useNavigate } from 'react-router-dom';
import { Header } from './components/Layout';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { Terms } from './components/Terms';
import { Chatbot } from './components/Chatbot';
import { Calculator, Home, PiggyBank } from 'lucide-react';
import { ThemeProvider, useTheme } from './context/ThemeContext';
const LoanCalculator = lazy(() => import('./components/LoanCalculator').then(m => ({ default: m.LoanCalculator })));
const MortgageSimulator = lazy(() => import('./components/MortgageSimulator').then(m => ({ default: m.MortgageSimulator })));
const SavingsGoal = lazy(() => import('./components/SavingsGoal').then(m => ({ default: m.SavingsGoal })));
const NotificationSystem = lazy(() => import('./components/NotificationSystem').then(m => ({ default: m.NotificationSystem })));
function AppContent() {
    const location = useLocation();
    const navigate = useNavigate();
    const { theme } = useTheme();
    return (_jsx("div", { className: `relative z-20 w-full max-w-[480px] flex-1 flex flex-col mx-auto sm:border-x transition-colors duration-300 overflow-hidden ${theme === 'high-contrast'
            ? 'bg-black border-white/5'
            : 'bg-[#18181b] border-white/10'}`, children: _jsxs(Suspense, { fallback: _jsx("div", { className: "flex items-center justify-center h-full text-white/50", children: "\u0141adowanie..." }), children: [_jsx("div", { className: "absolute top-4 right-4 z-50", children: _jsx(NotificationSystem, {}) }), _jsxs("div", { className: `flex justify-between items-center transition-colors duration-300 border-b p-4 z-40 rounded-t-3xl sm:rounded-none ${theme === 'high-contrast'
                        ? 'bg-[#0a0a0a] border-white/5'
                        : 'bg-[#1e1e24] border-white/10'}`, children: [_jsxs("button", { onClick: () => navigate('/loan'), className: `flex-1 flex flex-col items-center justify-center py-4 rounded-3xl transition-all ${location.pathname === '/loan' || location.pathname === '/'
                                ? (theme === 'high-contrast'
                                    ? 'bg-[#1a1114] border border-[#FF0033] text-[#FF0033] shadow-[0_0_15px_rgba(255,0,51,0.2)]'
                                    : 'bg-[#ff0033]/10 border border-[#dc143c]/30 text-[#dc143c]')
                                : (theme === 'high-contrast' ? 'text-zinc-500 hover:text-zinc-300' : 'text-zinc-400 hover:text-zinc-200')}`, children: [_jsx(Calculator, { size: 20, className: "mb-1" }), _jsx("span", { className: "text-[10px] font-bold uppercase tracking-wider", children: "Kredyty" })] }), _jsxs("button", { onClick: () => navigate('/mortgage'), className: `flex-1 flex flex-col items-center justify-center py-4 rounded-3xl transition-all mx-2 ${location.pathname === '/mortgage'
                                ? (theme === 'high-contrast'
                                    ? 'bg-[#1a1114] border border-[#FF0033] text-[#FF0033] shadow-[0_0_15px_rgba(255,0,51,0.2)]'
                                    : 'bg-[#ff0033]/10 border border-[#dc143c]/30 text-[#dc143c]')
                                : (theme === 'high-contrast' ? 'text-zinc-500 hover:text-zinc-300' : 'text-zinc-400 hover:text-zinc-200')}`, children: [_jsx(Home, { size: 20, className: "mb-1" }), _jsx("span", { className: "text-[10px] font-bold uppercase tracking-wider", children: "Hipoteka" })] }), _jsxs("button", { onClick: () => navigate('/savings'), className: `flex-1 flex flex-col items-center justify-center py-4 rounded-3xl transition-all ${location.pathname === '/savings'
                                ? (theme === 'high-contrast'
                                    ? 'bg-[#1a1114] border border-[#FF0033] text-[#FF0033] shadow-[0_0_15px_rgba(255,0,51,0.2)]'
                                    : 'bg-[#ff0033]/10 border border-[#dc143c]/30 text-[#dc143c]')
                                : (theme === 'high-contrast' ? 'text-zinc-500 hover:text-zinc-300' : 'text-zinc-400 hover:text-zinc-200')}`, children: [_jsx(PiggyBank, { size: 20, className: "mb-1" }), _jsx("span", { className: "text-[10px] font-bold uppercase tracking-wider", children: "Oszcz\u0119dno\u015Bci" })] })] }), _jsx("div", { className: "flex-1 overflow-hidden w-full relative min-h-0", children: _jsxs("div", { className: "flex w-[300%] h-full transition-transform duration-500 ease-in-out", style: {
                            transform: `translateX(-${location.pathname === '/mortgage' ? 33.333 :
                                location.pathname === '/savings' ? 66.666 : 0}%)`
                        }, children: [_jsx("div", { className: "w-1/3 h-full overflow-hidden flex flex-col p-2 sm:p-4", children: _jsx(LoanCalculator, {}) }), _jsx("div", { className: "w-1/3 h-full overflow-hidden flex flex-col p-2 sm:p-4", children: _jsx(MortgageSimulator, {}) }), _jsx("div", { className: "w-1/3 h-full overflow-hidden flex flex-col p-2 sm:p-4", children: _jsx(SavingsGoal, {}) })] }) })] }) }));
}
function AppLayout() {
    const [showPrivacy, setShowPrivacy] = useState(false);
    const [showTerms, setShowTerms] = useState(false);
    const { theme } = useTheme();
    return (_jsxs("main", { className: `relative h-full w-full flex flex-col items-center transition-colors duration-300 text-center text-white overflow-hidden sm:overflow-auto ${theme === 'high-contrast' ? 'bg-[#050505]' : 'bg-[#121215]'}`, children: [_jsx(Header, {}), _jsx(AppContent, {}), showPrivacy && _jsx(PrivacyPolicy, { onClose: () => setShowPrivacy(false) }), showTerms && _jsx(Terms, { onClose: () => setShowTerms(false) }), _jsx(Chatbot, {})] }));
}
export default function App() {
    return (_jsx(ThemeProvider, { children: _jsx(BrowserRouter, { children: _jsx(AppLayout, {}) }) }));
}
