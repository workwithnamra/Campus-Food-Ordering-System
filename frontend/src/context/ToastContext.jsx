import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, Sparkles, X } from 'lucide-react';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'success', duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Floating Toast Container */}
      <div className="fixed top-20 right-4 z-50 flex flex-col space-y-2 pointer-events-none max-w-sm w-full px-2 sm:px-0">
        {toasts.map(t => {
          const isSuccess = t.type === 'success';
          const isError = t.type === 'error';
          const isPromo = t.type === 'promo';

          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start space-x-3 p-3.5 rounded-2xl shadow-xl border backdrop-blur-md transition-all duration-300 transform translate-y-0 animate-fadeIn ${
                isSuccess
                  ? 'bg-emerald-900/90 text-white border-emerald-500/40 shadow-emerald-950/20'
                  : isError
                  ? 'bg-rose-900/90 text-white border-rose-500/40 shadow-rose-950/20'
                  : isPromo
                  ? 'bg-gradient-to-r from-violet-900/95 to-indigo-900/95 text-white border-violet-400/40 shadow-violet-950/20'
                  : 'bg-gray-900/90 text-white border-gray-700 shadow-gray-950/20'
              }`}
            >
              <div className="mt-0.5 flex-shrink-0">
                {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                {isError && <AlertCircle className="w-5 h-5 text-rose-400" />}
                {isPromo && <Sparkles className="w-5 h-5 text-amber-300" />}
                {!isSuccess && !isError && !isPromo && <Info className="w-5 h-5 text-blue-400" />}
              </div>
              <div className="flex-1 text-xs font-semibold leading-relaxed">
                {t.message}
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="text-white/60 hover:text-white p-0.5 rounded transition flex-shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
