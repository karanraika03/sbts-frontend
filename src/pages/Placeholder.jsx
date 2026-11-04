import { useState } from "react";
import { Plus, Search, FileText } from "lucide-react";
import PageHeader from "../components/PageHeader";

export default function Placeholder({
  title,
  description,
  actionLabel = "Add New",
  icon: Icon = FileText,
}) {
  const [search, setSearch] = useState("");
  return (
    <div>
      <PageHeader
        title={title}
        description={description}
        action={
          <button className="inline-flex h-11 items-center gap-2 rounded-full bg-violet-600 px-5 text-xs font-bold text-white shadow-lg shadow-violet-200">
            <Plus size={17} />
            {actionLabel}
          </button>
        }
      />
      <div className="rounded-[24px] border border-violet-100 bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:max-w-sm">
            <Search
              size={17}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${title.toLowerCase()}...`}
              className="h-11 w-full rounded-full border border-slate-200 bg-slate-50 pl-11 pr-4 text-xs outline-none focus:border-violet-300"
            />
          </div>
          <span className="text-xs text-slate-400">Module workspace</span>
        </div>
        <div className="flex min-h-[340px] flex-col items-center justify-center rounded-2xl border border-dashed border-violet-200 bg-violet-50/30 px-5 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
            <Icon size={29} />
          </div>
          <h3 className="text-base font-bold text-slate-800">
            {title} workspace
          </h3>
          <p className="mt-2 max-w-md text-xs leading-6 text-slate-500">
            The page layout is ready. We can build the complete forms, tables,
            filters and API integration for this module step by step.
          </p>
          <span className="mt-4 rounded-full bg-white px-3 py-1.5 text-[10px] font-bold text-violet-600 ring-1 ring-violet-100">
            UI foundation ready
          </span>
        </div>
      </div>
    </div>
  );
}
