import React, { useState } from 'react';
import { X, Copy, Check, Bot, Download, FileText, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FinancialReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  reportText: string;
}

export function FinancialReportModal({
  isOpen,
  onClose,
  title = "Raport Finansowy",
  reportText,
}: FinancialReportModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(reportText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Błąd kopiowania:', err);
    }
  };

  const handleSendToAi = () => {
    onClose();
    const prompt = `Oto mój raport finansowy. Przeanalizuj go uważnie, wskaż mocne strony, ryzyka oraz przekaż praktyczne rekomendacje:\n\n${reportText}`;
    window.dispatchEvent(
      new CustomEvent('open_ai_chat', { detail: { prompt } })
    );
  };

  const handleDownloadTxt = () => {
    const element = document.createElement('a');
    const file = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `raport_finansowy_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-zinc-950 border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10 bg-zinc-900/90">
            <div className="flex items-center gap-2 text-white">
              <div className="p-2 bg-[#DC143C]/10 rounded-lg text-[#DC143C] border border-[#DC143C]/20">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base tracking-tight">{title}</h3>
                <p className="text-[10px] text-white/40 uppercase tracking-widest font-semibold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-[#DC143C]" /> Podsumowanie Tekstowe
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/40 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/5"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Report Body */}
          <div className="p-4 flex-1 overflow-y-auto custom-scrollbar bg-black/40">
            <div className="bg-zinc-900/80 border border-white/10 rounded-xl p-4 font-mono text-xs text-zinc-200 whitespace-pre-wrap leading-relaxed selection:bg-[#DC143C] selection:text-white">
              {reportText}
            </div>
          </div>

          {/* Actions */}
          <div className="p-4 border-t border-white/10 bg-zinc-900/90 flex flex-col sm:flex-row gap-2">
            <button
              onClick={handleCopy}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs rounded-xl border border-white/10 transition-all active:scale-95"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-green-400" />
                  <span className="text-green-400">Skopiowano!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-zinc-300" />
                  <span>Kopiuj Raport</span>
                </>
              )}
            </button>

            <button
              onClick={handleSendToAi}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-3 bg-[#DC143C] hover:bg-[#FF0033] text-white font-bold text-xs rounded-xl shadow-[0_0_15px_rgba(220,20,60,0.3)] transition-all active:scale-95"
            >
              <Bot className="w-4 h-4" />
              <span>Przeanalizuj z AI</span>
            </button>

            <button
              onClick={handleDownloadTxt}
              title="Pobierz plik .txt"
              className="flex items-center justify-center p-3 bg-zinc-800 hover:bg-zinc-700 text-white/70 hover:text-white rounded-xl border border-white/10 transition-all active:scale-95"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
