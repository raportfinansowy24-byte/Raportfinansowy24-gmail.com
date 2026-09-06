import React from 'react';
import { X } from 'lucide-react';

export const Terms = ({ onClose }: { onClose: () => void }) => (
  <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div className="bg-[#0A0A0A] border border-[#DC143C]/30 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <h3 className="text-white font-bold uppercase tracking-widest">Regulamin</h3>
        <button onClick={onClose} className="text-white/50 hover:text-white">
          <X className="w-6 h-6" />
        </button>
      </div>
      <div className="p-6 overflow-y-auto text-white/70 text-sm space-y-4 custom-scrollbar">
        <h4 className="text-white font-bold">1. Postanowienia ogólne</h4>
        <p>Niniejszy regulamin określa zasady korzystania z serwisu raport-finansowy24.pl.</p>
        
        <h4 className="text-white font-bold">2. Zasady korzystania</h4>
        <p>Użytkownik zobowiązuje się do korzystania z serwisu zgodnie z prawem i zasadami współżycia społecznego.</p>

        <h4 className="text-white font-bold">3. Odpowiedzialność</h4>
        <p>RaportFinansowy24 Sp. z o.o. nie ponosi odpowiedzialności za decyzje finansowe podejmowane przez użytkowników na podstawie informacji zawartych w serwisie.</p>
      </div>
    </div>
  </div>
);
