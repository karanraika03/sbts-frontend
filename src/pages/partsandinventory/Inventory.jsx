import { useState } from "react";
import { Plus, Search, Package, AlertTriangle, Boxes } from "lucide-react";
import PageHeader from "../../components/PageHeader";
import StatusBadge from "../../components/StatusBadge";
import { inventory } from "../../data/mockData";

export default function Inventory() {
  const [search, setSearch] = useState("");
  const filtered = inventory.filter((x) =>
    [x.name, x.sku, x.category]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  return (
    <div>
      <PageHeader
        title="Parts & Inventory"
        description="Keep track of spare parts, stock levels and purchase costs."
        action={
          <button className="inline-flex h-11 items-center gap-2 rounded-full bg-violet-600 px-5 text-xs font-bold text-white">
            <Plus size={17} /> Add Part
          </button>
        }
      />
      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { l: "Total Parts", v: "128", i: Boxes },
          { l: "Low Stock Items", v: "5", i: AlertTriangle },
          { l: "Inventory Value", v: "₹2,48,500", i: Package },
        ].map((s) => (
          <div
            key={s.l}
            className="rounded-2xl border border-violet-100 bg-white p-5"
          >
            <div className="flex justify-between text-xs text-slate-500">
              {s.l}
              <s.i size={19} className="text-violet-500" />
            </div>
            <p className="mt-2 text-2xl font-extrabold text-slate-800">{s.v}</p>
          </div>
        ))}
      </div>
      <section className="overflow-hidden rounded-[22px] border border-violet-100 bg-white">
        <div className="border-b border-slate-100 p-5">
          <div className="relative max-w-sm">
            <Search
              size={17}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search part, SKU or category..."
              className="h-11 w-full rounded-full border border-slate-200 bg-slate-50 pl-11 pr-4 text-xs outline-none focus:border-violet-300"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left">
            <thead className="bg-[#faf9fd] text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                {[
                  "Part Name",
                  "SKU",
                  "Category",
                  "Stock Qty",
                  "Unit Price",
                  "Stock Status",
                ].map((x) => (
                  <th key={x} className="px-5 py-4">
                    {x}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-violet-50/40">
                  <td className="px-5 py-4 text-xs font-bold text-slate-700">
                    {p.name}
                  </td>
                  <td className="px-5 py-4 text-xs text-violet-600">{p.sku}</td>
                  <td className="px-5 py-4 text-xs text-slate-500">
                    {p.category}
                  </td>
                  <td className="px-5 py-4 text-xs font-bold text-slate-700">
                    {p.stock}
                  </td>
                  <td className="px-5 py-4 text-xs font-semibold text-slate-700">
                    ₹{p.price.toLocaleString("en-IN")}
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={p.level} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
