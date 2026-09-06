import React from 'react';
import { X } from 'lucide-react';

export const PrivacyPolicy = ({ onClose }: { onClose: () => void }) => (
  <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div className="bg-[#0A0A0A] border border-[#DC143C]/30 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <h3 className="text-white font-bold uppercase tracking-widest">Polityka Prywatności</h3>
        <button onClick={onClose} className="text-white/50 hover:text-white">
          <X className="w-6 h-6" />
        </button>
      </div>
      <div className="p-6 overflow-y-auto text-white/70 text-sm space-y-4 custom-scrollbar">
        <h1 className="text-white font-bold text-lg">Polityka prywatności</h1>
        <p>Dane są przetwarzane przez Raport Finansowy 24 Sp. z o.o.</p>
        <p>Email: raportfinansowy24@gmail.com</p>
      </div>
    </div>
  </div>
);
