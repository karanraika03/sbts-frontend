const STYLES = {
  slate: {
    badge: "bg-slate-50 text-slate-600 ring-slate-200",
    dot: "bg-slate-400",
  },
  blue: {
    badge: "bg-blue-50 text-blue-700 ring-blue-200/70",
    dot: "bg-blue-500",
  },
  amber: {
    badge: "bg-amber-50 text-amber-700 ring-amber-200/70",
    dot: "bg-amber-500",
  },
  violet: {
    badge: "bg-violet-50 text-violet-700 ring-violet-200/70",
    dot: "bg-violet-500",
  },
  indigo: {
    badge: "bg-indigo-50 text-indigo-700 ring-indigo-200/70",
    dot: "bg-indigo-500",
  },
  emerald: {
    badge: "bg-emerald-50 text-emerald-700 ring-emerald-200/70",
    dot: "bg-emerald-500",
  },
  rose: {
    badge: "bg-rose-50 text-rose-700 ring-rose-200/70",
    dot: "bg-rose-500",
  },
};

/* pulse: true = dot animate hota hai (in-progress / attention), false = static (final state) */
const map = {
  received: { tone: "slate", pulse: false },
  diagnosing: { tone: "blue", pulse: true },
  "awaiting parts": { tone: "amber", pulse: true },
  "in repair": { tone: "violet", pulse: true },
  "ready for pickup": { tone: "emerald", pulse: true },
  "ready to ship": { tone: "indigo", pulse: true },
  overdue: { tone: "rose", pulse: true },
  paid: { tone: "emerald", pulse: false },
  pending: { tone: "amber", pulse: true },
  delivered: { tone: "emerald", pulse: false },
  deliverd: { tone: "emerald", pulse: false },
  "in stock": { tone: "emerald", pulse: false },
  "low stock": { tone: "amber", pulse: true },
  "out of stock": { tone: "rose", pulse: true },
};

export default function StatusBadge({ status }) {
  const key = String(status ?? "")
    .trim()
    .toLowerCase();
  const { tone, pulse } = map[key] || { tone: "slate", pulse: false };
  const style = STYLES[tone];

  return (
    <span
      className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full px-3 py-1.5 text-[10px] font-bold ring-1 ring-inset transition-colors ${style.badge}`}
    >
      <span className="relative flex h-2 w-2 shrink-0">
        {pulse && (
          <span
            className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${style.dot}`}
          />
        )}
        <span
          className={`relative inline-flex h-2 w-2 rounded-full ${style.dot}`}
        />
      </span>
      {status}
    </span>
  );
}
