export default function StatusBadge({ status }) {
  const map = {
    "Received": "bg-slate-100 text-slate-600",
    "Diagnosing": "bg-blue-50 text-blue-700",
    "Awaiting Parts": "bg-amber-50 text-amber-700",
    "In Repair": "bg-violet-50 text-violet-700",
    "Ready for Pickup": "bg-emerald-50 text-emerald-700",
    "Overdue": "bg-rose-50 text-rose-700",
    "Paid": "bg-emerald-50 text-emerald-700",
    "Pending": "bg-amber-50 text-amber-700",
    "In Stock": "bg-emerald-50 text-emerald-700",
    "Low Stock": "bg-amber-50 text-amber-700",
    "Out of Stock": "bg-rose-50 text-rose-700",
  };
  return <span className={`inline-flex whitespace-nowrap rounded-full px-3 py-1.5 text-[10px] font-bold ${map[status] || "bg-slate-100 text-slate-600"}`}><span className="mr-1.5 mt-[3px] h-1.5 w-1.5 rounded-full bg-current" />{status}</span>;
}
