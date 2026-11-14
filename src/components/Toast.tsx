import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, Info, XCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
}

type ToastListener = (toast: ToastMessage) => void;
const listeners: ToastListener[] = [];

export const showToast = (title: string, type: ToastType = 'success', description?: string) => {
  const toast: ToastMessage = {
    id: Math.random().toString(36).substr(2, 9),
    title,
    type,
    description,
  };
  listeners.forEach((listener) => listener(toast));
};

export const ToastContainer: React.FC<{ isRtl?: boolean }> = ({ isRtl = false }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const handler: ToastListener = (newToast) => {
      setToasts((prev) => [...prev, newToast]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
      }, 4000);
    };

    listeners.push(handler);
    return () => {
      const idx = listeners.indexOf(handler);
      if (idx !== -1) listeners.splice(idx, 1);
    };
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="text-emerald-500 shrink-0" size={20} />;
      case 'error':
        return <XCircle className="text-rose-500 shrink-0" size={20} />;
      case 'warning':
        return <AlertCircle className="text-amber-500 shrink-0" size={20} />;
      case 'info':
        return <Info className="text-sky-500 shrink-0" size={20} />;
    }
  };

  return (
    <div
      className={`fixed bottom-5 z-[9999] flex flex-col gap-2 pointer-events-none ${
        isRtl ? 'left-5' : 'right-5'
      }`}
      style={{ direction: isRtl ? 'rtl' : 'ltr' }}
    >
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="pointer-events-auto flex items-start gap-3 min-w-[280px] max-w-[380px] bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xl rounded-2xl p-4 text-stone-850 dark:text-stone-100"
          >
            {getIcon(toast.type)}
            <div className="flex-1">
              <h4 className="text-sm font-bold">{toast.title}</h4>
              {toast.description && (
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 leading-relaxed">
                  {toast.description}
                </p>
              )}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-0.5 rounded-lg transition-colors"
            >
              <X size={16} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
