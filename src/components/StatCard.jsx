export default function StatCard({
  label,
  value,
  note,
  change,
  icon: Icon,
  tone = "violet",
  negative = false,
}) {
  const tones = {
    violet: "bg-violet-100 text-violet-600",
    green: "bg-emerald-100 text-emerald-600",
    red: "bg-rose-100 text-rose-600",
    blue: "bg-blue-100 text-blue-600",
    amber: "bg-amber-100 text-amber-600",
  };
  return (
    <div className="dashboard-card rounded-[20px] border border-violet-100/80 bg-white p-4 shadow-[0_4px_18px_rgba(45,35,90,0.025)] transition duration-200 hover:shadow-lg hover:shadow-violet-100/60 sm:rounded-[22px] sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <span className="min-w-0 text-xs font-medium leading-4 text-slate-500 sm:text-[13px]">
          {label}
        </span>
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full sm:h-10 sm:w-10 ${tones[tone]}`}
        >
          <Icon size={17} className="sm:h-[19px] sm:w-[19px]" />
        </div>
      </div>
      <div className="mt-3 whitespace-nowrap text-[25px] font-extrabold tracking-tight text-slate-800 sm:text-[29px]">
        {value}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5 sm:gap-2">
        {change && (
          <span
            className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ${negative ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"}`}
          >
            {change}
          </span>
        )}
        <span className="text-[11px] text-slate-400">{note}</span>
      </div>
    </div>
  );
}
