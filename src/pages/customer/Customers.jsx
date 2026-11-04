import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Plus, Search } from "lucide-react";
import { customers as initialCustomers } from "../../data/mockData";

const formatVisitDate = (value) => {
  const match = String(value || "").match(/^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})$/);
  if (!match) return value || "—";

  const [, day, month, year] = match;
  const date = new Date(Number(year), new Date(`${month} 1, ${year}`).getMonth(), Number(day));
  return date.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
};

function CustomerIdentity({ customer }) {
  const initials = customer.name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("");

  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-100 text-[11px] font-bold text-violet-700">
        {initials}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-bold text-slate-800">
          {customer.name}
        </span>
        <span className="mt-0.5 block truncate text-[11px] text-slate-400">
          {customer.code}
        </span>
      </span>
    </div>
  );
}

function NewJobButton({ onClick, compact = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-full font-bold text-violet-700 transition duration-200 hover:scale-[1.03] hover:bg-violet-600 hover:text-white active:scale-95 ${
        compact
          ? "border border-violet-200 px-3.5 py-2 text-xs"
          : "bg-violet-600 px-5 py-3 text-sm text-white shadow-lg shadow-violet-200 hover:bg-violet-700"
      }`}
    >
      <Plus size={compact ? 15 : 17} />
      New job
    </button>
  );
}

export default function Customers() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return initialCustomers.filter((customer) =>
      [customer.name, customer.phone, customer.code, customer.city]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [search]);

  const startNewJob = () => navigate("/jobs-new");
  const summary = [
    { label: "Customers on the map", value: "1,129" },
    { label: "In this list", value: filtered.length },
    { label: "Agreed to WhatsApp", value: "100%" },
  ];

  return (
    <div className="customer-motion">
      <header className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-[30px]">
            Customers
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            The {initialCustomers.length} most recent customers. The Hisar map
            counts 1,129 in total.
          </p>
        </div>
        <NewJobButton onClick={startNewJob} />
      </header>

      <div className="customer-stagger mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        {summary.map((item, index) => (
          <div
            key={item.label}
            style={{ animationDelay: `${index * 70}ms` }}
            className={`customer-card rounded-[20px] border border-violet-100 bg-white p-4 shadow-sm sm:p-5 ${
              index === 2 ? "col-span-2 sm:col-span-1" : ""
            }`}
          >
            <p className="text-xs font-medium text-slate-500 sm:text-sm">
              {item.label}
            </p>
            <p className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900 sm:text-[28px]">
              {item.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative block w-full sm:max-w-sm">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name, phone, code or village"
            className="h-11 w-full rounded-full border border-violet-100 bg-white pl-11 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
          />
        </label>
        <span className="text-xs font-semibold text-slate-500">
          {filtered.length} customers
        </span>
      </div>

      <section className="customer-panel overflow-hidden rounded-[22px] border border-violet-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="hidden w-full min-w-[850px] text-left md:table">
            <thead className="border-b border-violet-100 text-[11px] font-bold uppercase text-slate-400">
              <tr>
                {["Customer", "Phone", "Village", "Jobs", "Last visit", "WhatsApp", ""].map(
                  (heading) => (
                    <th key={heading || "action"} className="px-5 py-4">
                      {heading}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-violet-100">
              {filtered.map((customer, index) => (
                <tr
                  key={customer.id}
                  style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
                  className="customer-row transition-colors hover:bg-violet-50/40"
                >
                  <td className="px-5 py-3.5">
                    <CustomerIdentity customer={customer} />
                  </td>
                  <td className="whitespace-nowrap px-5 py-3.5 text-sm text-slate-700">
                    {customer.phone}
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="text-sm text-slate-800">{customer.city}</p>
                    <p className="text-xs text-slate-400">Hisar</p>
                  </td>
                  <td className="px-5 py-3.5 text-sm font-bold text-slate-800">
                    {customer.jobs}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3.5 text-sm text-slate-600">
                    {formatVisitDate(customer.joined)}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-700">
                      Agreed
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <NewJobButton compact onClick={startNewJob} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="divide-y divide-violet-100 md:hidden">
          {filtered.map((customer, index) => (
            <article
              key={customer.id}
              style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
              className="customer-row p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <CustomerIdentity customer={customer} />
                <NewJobButton compact onClick={startNewJob} />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 pl-[52px] text-xs">
                <span className="text-slate-500">{customer.phone}</span>
                <span className="flex items-center gap-1 text-slate-600">
                  <MapPin size={13} className="text-violet-500" />
                  {customer.city}
                </span>
                <span className="text-slate-500">
                  {customer.jobs} {customer.jobs === 1 ? "job" : "jobs"}
                </span>
                <span className="text-slate-500">
                  {formatVisitDate(customer.joined)}
                </span>
                <span className="col-span-2">
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                    WhatsApp agreed
                  </span>
                </span>
              </div>
            </article>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="p-10 text-center text-sm text-slate-400">
            No customers match your search.
          </div>
        )}
      </section>
    </div>
  );
}
