import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { CheckCircle2 } from "lucide-react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const showToast = useCallback((message) => setToast(message), []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed left-1/2 top-4 z-[60] flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-xl border border-emerald-100 bg-white px-4 py-3 text-sm font-semibold text-emerald-700 shadow-lg shadow-emerald-100 sm:top-6"
        >
          <CheckCircle2 size={18} />
          {toast}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const showToast = useContext(ToastContext);
  if (!showToast) {
    throw new Error("useToast must be used inside ToastProvider");
  }
  return showToast;
}
