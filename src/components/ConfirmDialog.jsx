import { useEffect } from "react";
import { AlertTriangle, Loader2, Trash2, UserRound, X } from "lucide-react";

export default function ConfirmDialog({
  open,
  title = "Are you sure?",
  description = "This action cannot be undone.",
  itemName,
  itemMeta,
  warning = "Please make sure you want to continue.",
  confirmText = "Confirm",
  cancelText = "Cancel",
  loading = false,
  error = "",
  onCancel,
  onConfirm,
}) {
  useEffect(() => {
    if (!open || loading) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") onCancel();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, loading, onCancel]);

  if (!open) return null;

  return (
    <div
      className="cd-backdrop fixed inset-0 z-[120] flex items-center justify-center overflow-y-auto bg-slate-950/55 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !loading) onCancel();
      }}
    >
      <style>{`
        @keyframes cd-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes cd-pop-in {
          0% { opacity: 0; transform: translateY(24px) scale(0.92); }
          60% { opacity: 1; transform: translateY(-4px) scale(1.01); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes cd-fade-up {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes cd-icon-in {
          0% { opacity: 0; transform: scale(0.3) rotate(-25deg); }
          60% { opacity: 1; transform: scale(1.15) rotate(6deg); }
          100% { opacity: 1; transform: scale(1) rotate(0deg); }
        }
        @keyframes cd-ring {
          0% { transform: scale(1); opacity: 0.55; }
          100% { transform: scale(1.55); opacity: 0; }
        }
        @keyframes cd-float-a {
          0%, 100% { transform: rotate(28deg) translate(0, 0); }
          50% { transform: rotate(32deg) translate(-8px, 6px); }
        }
        @keyframes cd-float-b {
          0%, 100% { transform: rotate(-18deg) translate(0, 0); }
          50% { transform: rotate(-14deg) translate(10px, -4px); }
        }
        @keyframes cd-warn-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.18); }
        }
        @keyframes cd-shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
        @keyframes cd-shine {
          0% { transform: translateX(-120%) skewX(-20deg); }
          100% { transform: translateX(220%) skewX(-20deg); }
        }

        .cd-backdrop { animation: cd-fade-in 0.2s ease-out both; }
        .cd-card { animation: cd-pop-in 0.45s cubic-bezier(0.22, 1, 0.36, 1) both; }
        .cd-blob-a { animation: cd-float-a 7s ease-in-out infinite; }
        .cd-blob-b { animation: cd-float-b 9s ease-in-out infinite; }
        .cd-icon { animation: cd-icon-in 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.1s both; }
        .cd-ring {
          animation: cd-ring 2.2s ease-out infinite;
        }
        .cd-up-1 { animation: cd-fade-up 0.4s ease-out 0.15s both; }
        .cd-up-2 { animation: cd-fade-up 0.4s ease-out 0.22s both; }
        .cd-up-3 { animation: cd-fade-up 0.4s ease-out 0.29s both; }
        .cd-up-4 { animation: cd-fade-up 0.4s ease-out 0.36s both; }
        .cd-up-5 { animation: cd-fade-up 0.4s ease-out 0.43s both; }
        .cd-warn-icon { animation: cd-warn-pulse 1.8s ease-in-out infinite; }
        .cd-error { animation: cd-shake 0.45s ease-in-out both; }

        .cd-confirm-btn { position: relative; overflow: hidden; }
        .cd-confirm-btn::after {
          content: "";
          position: absolute;
          top: 0;
          bottom: 0;
          left: 0;
          width: 40%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent);
          transform: translateX(-120%) skewX(-20deg);
          pointer-events: none;
        }
        .cd-confirm-btn:not(:disabled):hover::after {
          animation: cd-shine 0.9s ease-in-out;
        }

        @media (prefers-reduced-motion: reduce) {
          .cd-backdrop,
          .cd-card,
          .cd-blob-a,
          .cd-blob-b,
          .cd-icon,
          .cd-ring,
          .cd-up-1,
          .cd-up-2,
          .cd-up-3,
          .cd-up-4,
          .cd-up-5,
          .cd-warn-icon,
          .cd-error,
          .cd-confirm-btn:hover::after {
            animation: none !important;
          }
        }
      `}</style>

      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
        className="cd-card relative my-auto w-full max-w-lg overflow-hidden rounded-[26px] border border-white/70 bg-white shadow-2xl shadow-slate-950/25"
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-32 overflow-hidden bg-gradient-to-br from-rose-50 via-white to-red-100">
          <div className="cd-blob-a absolute -right-8 -top-14 h-32 w-48 rotate-[28deg] rounded-[50%] bg-rose-200/70" />
          <div className="cd-blob-b absolute -left-12 -top-20 h-36 w-56 rotate-[-18deg] rounded-[50%] bg-white/90" />
        </div>

        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          aria-label="Close confirmation"
          className="group absolute right-4 top-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-slate-500 shadow-md shadow-rose-100 transition duration-200 hover:scale-110 hover:bg-rose-50 hover:text-rose-600 hover:shadow-lg active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
        >
          <X
            size={19}
            className="transition-transform duration-300 group-hover:rotate-90"
          />
        </button>

        <div className="relative px-5 pb-5 pt-9 text-center sm:px-8 sm:pb-8 sm:pt-10">
          <div className="cd-icon group relative mx-auto mb-4 flex h-24 w-24 cursor-default items-center justify-center rounded-full border-[9px] border-rose-100 bg-rose-200/80 text-rose-600 shadow-[0_0_0_8px_rgba(255,255,255,0.8)] transition duration-300 hover:scale-105 hover:bg-rose-300/80">
            <span className="cd-ring pointer-events-none absolute inset-0 rounded-full border-2 border-rose-300" />
            <Trash2
              size={39}
              strokeWidth={2.2}
              className="relative transition-transform duration-300 group-hover:-rotate-12 group-hover:scale-110"
            />
          </div>

          <h2
            id="confirm-dialog-title"
            className="cd-up-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-[30px]"
          >
            {title}
          </h2>
          <p
            id="confirm-dialog-description"
            className="cd-up-2 mt-1.5 text-sm font-medium text-slate-500 sm:text-base"
          >
            {description}
          </p>

          {itemName && (
            <div className="cd-up-3 mx-auto mt-4 flex max-w-sm items-center justify-center gap-3 rounded-2xl bg-rose-50 px-4 py-3 text-left transition duration-200 hover:-translate-y-0.5 hover:bg-rose-100/70 hover:shadow-md hover:shadow-rose-100">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600 transition duration-200 group-hover:bg-rose-200">
                <UserRound size={19} />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold text-slate-900">
                  {itemName}
                </span>
                {itemMeta && (
                  <span className="block truncate text-xs text-slate-500">
                    {itemMeta}
                  </span>
                )}
              </span>
            </div>
          )}

          <p className="cd-up-3 mt-3 text-sm text-slate-500">
            This action cannot be undone.
          </p>

          <div className="cd-up-4 mt-5 flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-left transition duration-200 hover:border-amber-400 hover:bg-amber-100/70 hover:shadow-md hover:shadow-amber-100">
            <AlertTriangle
              size={20}
              className="cd-warn-icon mt-0.5 shrink-0 text-amber-600"
            />
            <p className="text-xs leading-5 text-slate-600 sm:text-sm">
              <span className="font-bold text-amber-700">Important: </span>
              {warning}
            </p>
          </div>

          {error && (
            <p
              role="alert"
              className="cd-error mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-left text-sm text-red-700"
            >
              {error}
            </p>
          )}

          <div className="cd-up-5 mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="inline-flex min-h-12 flex-1 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-bold text-slate-600 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-50 hover:text-slate-900 hover:shadow-md active:translate-y-0 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 sm:max-w-[170px]"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className="cd-confirm-btn group inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 px-5 text-sm font-bold text-white shadow-lg shadow-rose-200 transition duration-200 hover:-translate-y-0.5 hover:from-rose-700 hover:to-red-700 hover:shadow-xl hover:shadow-rose-300 active:translate-y-0 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 sm:max-w-[230px]"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Trash2
                  size={18}
                  className="transition-transform duration-300 group-hover:-rotate-12 group-hover:scale-110"
                />
              )}
              {loading ? "Deleting..." : confirmText}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
