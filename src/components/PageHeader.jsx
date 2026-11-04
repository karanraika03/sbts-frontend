export default function PageHeader({
  eyebrow = "SHOP MANAGEMENT",
  title,
  description,
  action,
}) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <p className="mb-1 text-[10px] font-bold uppercase tracking-[1.5px] text-violet-500">
          {eyebrow}
        </p>
        <h2 className="text-2xl font-bold tracking-tight text-slate-800 sm:text-[28px]">
          {title}
        </h2>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      {action}
    </div>
  );
}
