import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Rows3,
  LayoutGrid,
  Eye,
  Pencil,
  Tag,
  MessageCircle,
  Send,
  Printer,
  Star,
  Trash2,
  X,
} from "lucide-react";
import PageHeader from "../../components/PageHeader";
import StatusBadge from "../../components/StatusBadge";
import { jobs } from "../../data/mockData";

/* ---------- filters ---------- */
const s = (j) => String(j.status || "").toLowerCase();
const TABS = [
  { key: "All", test: () => true },
  { key: "Received", test: (j) => s(j).startsWith("received") },
  { key: "Diagnosing", test: (j) => s(j).startsWith("diagnos") },
  { key: "Awaiting parts", test: (j) => s(j).startsWith("awaiting") },
  { key: "In repair", test: (j) => s(j).startsWith("in repair") },
  { key: "Ready", test: (j) => s(j).startsWith("ready") },
  { key: "Overdue", test: (j) => s(j).startsWith("overdue") },
  { key: "Delivered", test: (j) => s(j).startsWith("deliver") },
];

/* ---------- helpers ---------- */
const jobNo = (id) => (/^\d+$/.test(String(id)) ? `#${id}` : String(id));
const rupee = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const phoneOf = (j) =>
  String(j.phone || "")
    .replace(/\D/g, "")
    .slice(-10);

const paidNote = (j) => {
  const adv = Number(j.advance || 0);
  if (!adv) return "No advance";
  return adv >= Number(j.amount || 0)
    ? "Paid in full"
    : `${rupee(adv)} advance`;
};

const waText = (j) =>
  s(j).startsWith("ready")
    ? `Hello ${j.customer}, your ${j.device} (Job ${jobNo(j.id)}) is ready for pickup. - Shree Bhanu Technical Solutions, Red Cross Market, Hisar`
    : `Hello ${j.customer}, update on your ${j.device} (Job ${jobNo(j.id)}): ${j.status}. - Shree Bhanu Technical Solutions`;

const openWhatsApp = (j) => {
  const p = phoneOf(j);
  window.open(
    `https://wa.me/${p ? `91${p}` : ""}?text=${encodeURIComponent(waText(j))}`,
    "_blank",
  );
};

const printJob = (j) => {
  const w = window.open("", "_blank", "width=420,height=600");
  if (!w) return;
  w.document.write(`<html><head><title>Job ${jobNo(j.id)}</title>
  <style>body{font-family:Arial,sans-serif;padding:16px}.box{border:2px solid #111;border-radius:10px;padding:14px;width:320px}
  h3{margin:0 0 8px;font-size:14px;text-transform:uppercase}.bar{background:#111;color:#fff;text-align:center;font-size:10px;padding:4px;margin-bottom:10px}
  p{margin:4px 0;font-size:13px}b{display:inline-block;width:80px}</style></head><body><div class="box">
  <h3>Shree Bhanu Technical Solutions</h3><div class="bar">EXPERTS IN REPAIR AND SERVICE</div>
  <p><b>Job no.</b>${jobNo(j.id)}</p><p><b>Customer</b>${j.customer || "-"}</p>
  <p><b>Contact</b>${j.phone || "-"}</p><p><b>Device</b>${j.device || "-"}</p>
  <p><b>Issue</b>${j.issue || "-"}</p><p><b>Amount</b>${Number(j.amount || 0).toFixed(2)}</p>
  <p style="margin-top:10px;font-size:11px">Shop No. 6, Red Cross Market, Hisar</p></div></body></html>`);
  w.document.close();
  w.focus();
  w.print();
};

/* ---------- small pieces ---------- */
function IconBtn({ onClick, title, children, tone = "violet" }) {
  const tones = {
    violet: "hover:bg-violet-600 hover:text-white hover:shadow-violet-200",
    green: "hover:bg-emerald-500 hover:text-white hover:shadow-emerald-200",
  };
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      title={title}
      aria-label={title}
      className={`flex h-9 w-9 items-center justify-center rounded-full border border-violet-100 bg-white text-violet-600 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg active:scale-90 ${tones[tone]}`}
    >
      {children}
    </button>
  );
}

function Actions({
  j,
  onOpen,
  onEdit,
  onPriority,
  onFavorite,
  onDelete,
  isFavorite,
}) {
  const shareJob = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Job ${jobNo(j.id)}`,
          text: `${j.customer} · ${j.device} · ${j.status}`,
        });
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Unable to share job", error);
        }
      }
      return;
    }
    openWhatsApp(j);
  };

  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      <IconBtn title="View job" onClick={() => onOpen(j)}>
        <Eye size={16} />
      </IconBtn>
      <IconBtn title="Edit job" onClick={() => onEdit(j)}>
        <Pencil size={15} />
      </IconBtn>
      <IconBtn title={`Set ${j.priority === "High" ? "medium" : "high"} priority`} onClick={() => onPriority(j)}>
        <Tag size={15} className={j.priority === "High" ? "fill-current" : ""} />
      </IconBtn>
      <IconBtn title="WhatsApp" tone="green" onClick={() => openWhatsApp(j)}>
        <MessageCircle size={16} />
      </IconBtn>
      <IconBtn title="Print label" onClick={() => printJob(j)}>
        <Printer size={16} />
      </IconBtn>
      <IconBtn title="Share job" onClick={shareJob}>
        <Send size={15} />
      </IconBtn>
      <IconBtn
        title={isFavorite ? "Remove favorite" : "Add favorite"}
        onClick={() => onFavorite(j)}
      >
        <Star size={15} className={isFavorite ? "fill-amber-400 text-amber-500" : ""} />
      </IconBtn>
      <IconBtn title="Delete job" onClick={() => onDelete(j)}>
        <Trash2 size={15} className="text-rose-600" />
      </IconBtn>
    </div>
  );
}

const dueClass = (j) =>
  s(j).startsWith("overdue") ||
  /overdue|waiting \d{2,}|waiting [8-9]/i.test(j.dueNote || "")
    ? "text-red-600"
    : "text-slate-400";

/* ---------- page ---------- */
export default function Jobs() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("All");
  const [view, setView] = useState("table");
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(false);
  const [jobsList, setJobsList] = useState(jobs);
  const [favorites, setFavorites] = useState(() => new Set());

  const counts = useMemo(
    () =>
      Object.fromEntries(TABS.map((t) => [t.key, jobsList.filter(t.test).length])),
    [jobsList],
  );

  const filtered = useMemo(() => {
    const t = TABS.find((x) => x.key === tab);
    const q = search.toLowerCase();
    return jobsList.filter(
      (j) =>
        t.test(j) &&
        [j.id, j.customer, j.device, j.issue, j.phone, j.code]
          .join(" ")
          .toLowerCase()
          .includes(q),
    );
  }, [jobsList, search, tab]);

  const updateJob = (job, changes) => {
    const updated = { ...job, ...changes };
    setJobsList((current) =>
      current.map((item) => (item.id === job.id ? updated : item)),
    );
    if (selected?.id === job.id) setSelected(updated);
    return updated;
  };

  const editJob = (job) => {
    setSelected(job);
    setEditing(true);
  };

  const deleteJob = (job) => {
    if (!window.confirm(`Delete job ${jobNo(job.id)}? This cannot be undone.`)) {
      return;
    }
    setJobsList((current) => current.filter((item) => item.id !== job.id));
    setFavorites((current) => {
      const next = new Set(current);
      next.delete(job.id);
      return next;
    });
    if (selected?.id === job.id) setSelected(null);
  };

  const toggleFavorite = (job) => {
    setFavorites((current) => {
      const next = new Set(current);
      if (next.has(job.id)) next.delete(job.id);
      else next.add(job.id);
      return next;
    });
  };

  return (
    <div>
      <style>{`
        @keyframes rowIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes popIn { from { opacity: 0; transform: translateY(14px) scale(.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .row-in { opacity: 0; animation: rowIn .45s ease-out forwards; }
        .fade-in { animation: fadeIn .2s ease-out; }
        .pop-in { animation: popIn .25s ease-out; }
        @media (prefers-reduced-motion: reduce) { .row-in, .fade-in, .pop-in { animation: none; opacity: 1; } }
      `}</style>

      <PageHeader
        title="Jobs"
        description="Track every repair from device intake to customer pickup."
        action={
          <div className="flex items-center gap-3">
            <div className="flex rounded-full bg-white p-1 shadow-sm ring-1 ring-violet-100">
              {[
                { k: "table", l: "Table", i: Rows3 },
                { k: "board", l: "Board", i: LayoutGrid },
              ].map(({ k, l, i: Icon }) => (
                <button
                  key={k}
                  onClick={() => setView(k)}
                  className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition ${view === k ? "bg-violet-600 text-white shadow-md shadow-violet-200" : "text-slate-500 hover:text-violet-600"}`}
                >
                  <Icon size={14} /> {l}
                </button>
              ))}
            </div>
            <button
              onClick={() => navigate("/jobs-new")}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-violet-600 px-5 text-xs font-bold text-white shadow-lg shadow-violet-200 transition hover:-translate-y-0.5 hover:bg-violet-700 active:scale-95"
            >
              <Plus size={17} /> New job
            </button>
          </div>
        }
      />

      {/* Filters + search */}
      <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-nowrap gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {TABS.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-bold transition duration-200 active:scale-95 ${
                  active
                    ? "border-violet-600 bg-violet-600 text-white shadow-md shadow-violet-200"
                    : "border-violet-100 bg-white text-slate-600 hover:-translate-y-0.5 hover:border-violet-300 hover:text-violet-700"
                }`}
              >
                {t.key}
                <span
                  className={`rounded-full px-1 py-0.5 text-[9px] font-bold ${
                    active
                      ? "bg-white/25 text-white"
                      : t.key === "Overdue"
                        ? "bg-red-50 text-red-600"
                        : "bg-violet-50 text-violet-600"
                  }`}
                >
                  {counts[t.key]}
                </span>
              </button>
            );
          })}
        </div>
        <div className="flex w-full items-center gap-2 rounded-full border border-violet-100 bg-white px-4 py-2.5 shadow-sm transition focus-within:border-violet-400 focus-within:ring-4 focus-within:ring-violet-100 xl:w-[320px]">
          <Search size={15} className="text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search job, name or phone"
            className="w-full bg-transparent text-xs text-slate-700 outline-none placeholder:text-slate-400"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="text-slate-400 hover:text-violet-600"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* TABLE VIEW */}
      {view === "table" && (
        <section className="overflow-hidden rounded-[22px] border border-violet-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead className="bg-[#faf9fd] text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <tr>
                  {[
                    "Job",
                    "Customer",
                    "Device and issue",
                    "Estimate",
                    "Due",
                    "Status",
                    "Actions",
                  ].map((h, i) => (
                    <th
                      key={h}
                      className={`px-5 py-3.5 ${i === 6 ? "text-right" : ""}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody key={tab} className="divide-y divide-slate-100">
                {filtered.map((j, i) => (
                  <tr
                    key={j.id}
                    onClick={() => setSelected(j)}
                    style={{ animationDelay: `${Math.min(i, 12) * 45}ms` }}
                    className="row-in group cursor-pointer transition duration-200 hover:bg-violet-50/60"
                  >
                    <td className="px-5 py-3.5 text-[13px] font-bold text-slate-800 transition group-hover:text-violet-600">
                      {jobNo(j.id)}
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-[13px] font-bold text-slate-800">
                        {j.customer}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-400">
                        {[j.code, j.phone].filter(Boolean).join(" · ") ||
                          "Walk-in"}
                      </p>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-[13px] font-semibold text-slate-700">
                        {j.device}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-400">
                        {j.issue}
                      </p>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-[13px] font-bold text-slate-800">
                        {rupee(j.amount)}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-400">
                        {paidNote(j)}
                      </p>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-[13px] font-semibold text-slate-700">
                        {j.date}
                      </p>
                      {j.dueNote && (
                        <p
                          className={`mt-0.5 text-[11px] font-semibold ${dueClass(j)}`}
                        >
                          {j.dueNote}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={j.status} />
                    </td>
                    <td className="px-5 py-3.5">
                      <Actions
                        j={j}
                        onOpen={setSelected}
                        onEdit={editJob}
                        onPriority={(job) =>
                          updateJob(job, {
                            priority: job.priority === "High" ? "Medium" : "High",
                          })
                        }
                        onFavorite={toggleFavorite}
                        onDelete={deleteJob}
                        isFavorite={favorites.has(j.id)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="fade-in p-12 text-center text-sm text-slate-400">
                No repair jobs found.
              </div>
            )}
          </div>
          <div className="border-t border-slate-100 px-5 py-3 text-[11px] text-slate-400">
            Showing {filtered.length} of {jobsList.length} jobs
          </div>
        </section>
      )}

      {/* BOARD VIEW */}
      {view === "board" && (
        <div className="fade-in grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {TABS.filter((t) => !["All", "Overdue"].includes(t.key)).map(
            (col) => {
              const items = filtered.filter(col.test);
              return (
                <div key={col.key} className="rounded-2xl bg-[#f1eefc]/70 p-3">
                  <div className="mb-3 flex items-center justify-between px-1">
                    <h4 className="text-xs font-bold text-slate-700">
                      {col.key}
                    </h4>
                    <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-violet-600">
                      {items.length}
                    </span>
                  </div>
                  <div className="space-y-2.5">
                    {items.map((j, i) => (
                      <div
                        key={j.id}
                        onClick={() => setSelected(j)}
                        style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }}
                        className="row-in cursor-pointer rounded-xl border border-violet-100 bg-white p-3 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-violet-100"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-violet-600">
                            {jobNo(j.id)}
                          </span>
                          <span className="text-xs font-bold text-slate-700">
                            {rupee(j.amount)}
                          </span>
                        </div>
                        <p className="mt-1.5 text-[13px] font-bold text-slate-800">
                          {j.customer}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {j.device} · {j.issue}
                        </p>
                        <div className="mt-2.5 flex items-center justify-between">
                          <span className="text-[11px] text-slate-500">
                            {j.date}
                          </span>
                          <Actions
                            j={j}
                            onOpen={setSelected}
                            onEdit={editJob}
                            onPriority={(job) =>
                              updateJob(job, {
                                priority:
                                  job.priority === "High" ? "Medium" : "High",
                              })
                            }
                            onFavorite={toggleFavorite}
                            onDelete={deleteJob}
                            isFavorite={favorites.has(j.id)}
                          />
                        </div>
                      </div>
                    ))}
                    {items.length === 0 && (
                      <p className="py-6 text-center text-[11px] text-slate-400">
                        No jobs
                      </p>
                    )}
                  </div>
                </div>
              );
            },
          )}
        </div>
      )}

      {/* DETAILS MODAL */}
      {selected && (
        <div
          onClick={() => setSelected(null)}
          className="fade-in fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="pop-in w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-violet-600">
                  {jobNo(selected.id)}
                </p>
                <h3 className="mt-1 text-xl font-bold text-slate-900">
                  {selected.customer}
                </h3>
                <p className="text-xs text-slate-400">
                  {[selected.code, selected.phone]
                    .filter(Boolean)
                    .join(" · ") || "Walk-in"}
                </p>
              </div>
              <button
                onClick={() => {
                  setSelected(null);
                  setEditing(false);
                }}
                className="rounded-full p-2 text-slate-400 transition hover:bg-violet-50 hover:text-violet-600"
              >
                <X size={18} />
              </button>
            </div>

            {editing ? (
              <div className="mt-5 space-y-3">
                {[
                  ["customer", "Customer"],
                  ["device", "Device"],
                  ["issue", "Issue"],
                  ["amount", "Estimate"],
                  ["date", "Date"],
                ].map(([key, label]) => (
                  <label key={key} className="block">
                    <span className="mb-1 block text-xs font-bold text-slate-500">
                      {label}
                    </span>
                    <input
                      type={key === "amount" ? "number" : "text"}
                      value={selected[key] ?? ""}
                      onChange={(event) =>
                        setSelected((current) => ({
                          ...current,
                          [key]:
                            key === "amount"
                              ? Number(event.target.value)
                              : event.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-violet-100 px-3 py-2 text-sm outline-none focus:border-violet-400"
                    />
                  </label>
                ))}
                <label className="block">
                  <span className="mb-1 block text-xs font-bold text-slate-500">
                    Status
                  </span>
                  <select
                    value={selected.status}
                    onChange={(event) =>
                      setSelected((current) => ({
                        ...current,
                        status: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-violet-100 bg-white px-3 py-2 text-sm outline-none focus:border-violet-400"
                  >
                    {[
                      "Received",
                      "Diagnosing",
                      "Awaiting Parts",
                      "In Repair",
                      "Ready for Pickup",
                      "Overdue",
                      "Delivered",
                    ].map((status) => (
                      <option key={status}>{status}</option>
                    ))}
                  </select>
                </label>
              </div>
            ) : (
            <div className="mt-4 grid grid-cols-2 gap-3">
              {[
                ["Device", selected.device],
                ["Issue", selected.issue],
                ["Estimate", rupee(selected.amount)],
                ["Payment", paidNote(selected)],
                ["Due", selected.date],
                ["Priority", selected.priority || "-"],
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl bg-[#f7f5fd] px-3.5 py-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    {k}
                  </p>
                  <p className="mt-0.5 text-[13px] font-bold text-slate-800">
                    {v}
                  </p>
                </div>
              ))}
            </div>
            )}

            <div className="mt-5 flex items-center justify-between gap-3">
              {editing ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setSelected(jobsList.find((job) => job.id === selected.id));
                      setEditing(false);
                    }}
                    className="rounded-full border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      updateJob(selected, {});
                      setEditing(false);
                    }}
                    className="rounded-full bg-violet-600 px-5 py-2 text-sm font-bold text-white"
                  >
                    Save changes
                  </button>
                </>
              ) : (
                <>
                  <StatusBadge status={selected.status} />
                  <Actions
                    j={selected}
                    onOpen={setSelected}
                    onEdit={editJob}
                    onPriority={(job) =>
                      updateJob(job, {
                        priority: job.priority === "High" ? "Medium" : "High",
                      })
                    }
                    onFavorite={toggleFavorite}
                    onDelete={deleteJob}
                    isFavorite={favorites.has(selected.id)}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
