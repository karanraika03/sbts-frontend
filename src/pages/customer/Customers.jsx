import { useMemo, useState } from "react";
import {
  Plus,
  Search,
  Users,
  Mail,
  Phone,
  MapPin,
  CalendarDays,
  Eye,
  MoreHorizontal,
} from "lucide-react";
import PageHeader from "../../components/PageHeader";
import { customers as initialCustomers } from "../../data/mockData";

export default function Customers() {
  const [items] = useState(initialCustomers);
  const [search, setSearch] = useState("");
  const filtered = useMemo(
    () =>
      items.filter((c) =>
        [c.name, c.phone, c.code, c.city]
          .join(" ")
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [items, search],
  );
  return (
    <div>
      <PageHeader
        title="Customers"
        description="Manage customer profiles, contact details and repair history."
        action={
          <button className="inline-flex h-11 items-center gap-2 rounded-full bg-violet-600 px-5 text-xs font-bold text-white shadow-lg shadow-violet-200 hover:bg-violet-700">
            <Plus size={17} /> Add Customer
          </button>
        }
      />
      <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-3">
        {[
          {
            label: "Customers on record",
            value: "1,129",
            icon: Users,
            tone: "violet",
          },
          {
            label: "In this list",
            value: filtered.length,
            icon: Users,
            tone: "blue",
          },
          {
            label: "WhatsApp consent",
            value: "94%",
            icon: Phone,
            tone: "green",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-[20px] border border-violet-100 bg-white p-5 shadow-sm"
          >
            <div className="flex justify-between text-sm text-slate-500">
              <span>{s.label}</span>
              <span
                className={`rounded-xl p-2 ${s.tone === "green" ? "bg-emerald-50 text-emerald-600" : s.tone === "blue" ? "bg-blue-50 text-blue-600" : "bg-violet-50 text-violet-600"}`}
              >
                <s.icon size={18} />
              </span>
            </div>
            <p className="mt-2 text-3xl font-extrabold text-slate-800">
              {s.value}
            </p>
          </div>
        ))}
      </div>
      <section className="overflow-hidden rounded-[22px] border border-violet-100 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center">
          <div className="relative w-full sm:max-w-sm">
            <Search
              size={17}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, phone, code or city..."
              className="h-11 w-full rounded-full border border-slate-200 bg-slate-50 pl-11 pr-4 text-xs outline-none focus:border-violet-300 focus:bg-white"
            />
          </div>
          <span className="text-xs font-semibold text-slate-400">
            {filtered.length} customers
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left">
            <thead className="bg-[#faf9fd] text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                {[
                  "Customer",
                  "Phone",
                  "Location",
                  "Jobs",
                  "Last Visit",
                  "WhatsApp",
                  "Action",
                ].map((h) => (
                  <th key={h} className="px-5 py-4">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-violet-50/40">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-[11px] font-extrabold text-violet-700">
                        {c.name
                          .split(" ")
                          .map((x) => x[0])
                          .slice(0, 2)
                          .join("")}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">
                          {c.name}
                        </p>
                        <p className="mt-1 text-[10px] text-slate-400">
                          {c.code}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-xs text-slate-600">
                    {c.phone}
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-xs text-slate-700">{c.city}</p>
                    <p className="text-[10px] text-slate-400">Haryana</p>
                  </td>
                  <td className="px-5 py-4 text-xs font-bold text-slate-700">
                    {c.jobs}
                  </td>
                  <td className="px-5 py-4 text-xs text-slate-500">
                    {c.joined}
                  </td>
                  <td className="px-5 py-4">
                    <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-bold text-emerald-700">
                      Agreed
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <button className="inline-flex items-center gap-1 rounded-full border border-violet-200 px-3 py-2 text-[10px] font-bold text-violet-700 hover:bg-violet-600 hover:text-white">
                      <Plus size={13} /> New Job
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="p-12 text-center text-sm text-slate-400">
              No customers match your search.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
