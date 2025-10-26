import React, { useState, useContext, createContext, useCallback, ReactNode } from 'react';
import { CheckIcon, XIcon, InfoIcon } from './icons';

interface ToastMessage {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ToastContextType {
  addToast: (message: string, type: ToastMessage['type']) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

let toastId = 0;

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((message: string, type: ToastMessage['type']) => {
    const id = toastId++;
    setToasts(currentToasts => [ { id, message, type }, ...currentToasts]);
    const timer = setTimeout(() => {
      removeToast(id);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const removeToast = (id: number) => {
    setToasts(currentToasts => currentToasts.filter(toast => toast.id !== id));
  };
  
  const toastConfig = {
      success: {
          icon: <CheckIcon className="w-5 h-5 text-green-500" />,
          borderColor: 'border-green-500',
      },
      error: {
          icon: <XIcon className="w-5 h-5 text-red-500" />,
          borderColor: 'border-red-500',
      },
      info: {
          icon: <InfoIcon className="w-5 h-5 text-blue-500" />,
          borderColor: 'border-blue-500',
      },
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed top-6 right-6 z-[100] w-full max-w-sm space-y-3">
        {toasts.map(toast => {
          const config = toastConfig[toast.type];
          return (
            <div
              key={toast.id}
              className={`relative flex items-center p-4 text-gray-800 bg-white rounded-lg shadow-lg dark:text-gray-100 dark:bg-gray-800 border-l-4 ${config.borderColor}`}
              role="alert"
            >
              <div className="flex-shrink-0">{config.icon}</div>
              <div className="ml-3 text-sm font-medium">{toast.message}</div>
              <button
                onClick={() => removeToast(toast.id)}
                className="absolute top-1/2 right-2.5 -translate-y-1/2 text-gray-400 hover:text-gray-900 rounded-lg p-1.5 hover:bg-gray-100 dark:text-gray-500 dark:hover:text-white dark:hover:bg-gray-700"
              >
                <span className="sr-only">Close</span>
                <XIcon className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};