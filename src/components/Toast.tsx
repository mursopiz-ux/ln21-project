import React from 'react';
import { CheckCircle2, Info } from 'lucide-react';

interface ToastProps {
  message: string | null;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-[#1C1C1C] border border-[#333333] text-white shadow-2xl animate-bounce-subtle">
      <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0" />
      <span className="text-xs sm:text-sm font-medium">{message}</span>
      <button
        onClick={onClose}
        className="ml-2 text-xs text-[#888888] hover:text-white"
      >
        ✕
      </button>
    </div>
  );
};
