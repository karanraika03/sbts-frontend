import { useEffect, useState } from "react";
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
  Loader2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  RotateCw,
} from "lucide-react";
import PageHeader from "../../components/PageHeader";
import StatusBadge from "../../components/StatusBadge";
import ConfirmDialog from "../../components/ConfirmDialog";
import { getJobList, deleteProduct } from "../../services/JobService";
import { useToast } from "../../context/ToastContext";

/* ---------- filters ---------- */
const s = (j) => String(j.statusLabel || "").toLowerCase();
const TABS = [
  { key: "All", test: () => true },
  { key: "Pending", test: (j) => s(j) === "pending" },
  { key: "Received", test: (j) => s(j).startsWith("received") },
  { key: "Diagnosing", test: (j) => s(j).startsWith("diagnos") },
  { key: "Awaiting parts", test: (j) => s(j).startsWith("awaiting") },
  { key: "In repair", test: (j) => s(j).startsWith("in repair") },
  { key: "Ready", test: (j) => s(j).startsWith("ready") },
  { key: "Overdue", test: (j) => s(j).startsWith("overdue") },
  { key: "Delivered", test: (j) => s(j).startsWith("deliver") },
];

/* ---------- helpers ---------- */
const jobNo = (job) => {
  const number = job?.srNo ?? job?.id ?? job;
  return /^\d+$/.test(String(number)) ? `#${number}` : String(number);
};
const rupee = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const phoneOf = (j) =>
  String(j.phone || "")
    .replace(/\D/g, "")
    .slice(-10);

const formatJobDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const normalizeJob = (item) => {
  return {
    id: item.id,
    srNo: item.srNo,
    customerId: item.customerId,
    customer: item.customer,
    code: "",
    phone: item.mobileNo,
    device: item.productName,
    issue: item.productDetail,
    status: item.status,
    statusLabel: item.statusN,
    priority: "—",
    amount: item.totalEstimatedCost,
    advance: item.advance,
    balance: item.balance,
    isActive: item.isActive,
    isFavourite: item.isFavourite,
    date: formatJobDate(item.deliveryDate),
    dueNote: "",
  };
};

const parseOptionalId = (value) => {
  if (value.trim() === "") return undefined;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : undefined;
};

const paidNote = (j) => {
  const adv = Number(j.advance || 0);
  if (!adv) return "No advance";
  return adv >= Number(j.amount || 0)
    ? "Paid in full"
    : `${rupee(adv)} advance`;
};

const waText = (j) =>
  s(j).startsWith("ready")
    ? `Hello ${j.customer}, your ${j.device} (Job ${jobNo(j)}) is ready for pickup. - Shree Bhanu Technical Solutions, Red Cross Market, Hisar`
    : `Hello ${j.customer}, update on your ${j.device} (Job ${jobNo(j)}): ${j.statusLabel}. - Shree Bhanu Technical Solutions`;

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
  w.document.write(`<html><head><title>Job ${jobNo(j)}</title>
  <style>body{font-family:Arial,sans-serif;padding:16px}.box{border:2px solid #111;border-radius:10px;padding:14px;width:320px}
  h3{margin:0 0 8px;font-size:14px;text-transform:uppercase}.bar{background:#111;color:#fff;text-align:center;font-size:10px;padding:4px;margin-bottom:10px}
  p{margin:4px 0;font-size:13px}b{display:inline-block;width:80px}</style></head><body><div class="box">
  <h3>Shree Bhanu Technical Solutions</h3><div class="bar">EXPERTS IN REPAIR AND SERVICE</div>
  <p><b>Job no.</b>${jobNo(j)}</p><p><b>Customer</b>${j.customer || "-"}</p>
  <p><b>Contact</b>${j.phone || "-"}</p><p><b>Device</b>${j.device || "-"}</p>
  <p><b>Issue</b>${j.issue || "-"}</p><p><b>Amount</b>${Number(j.amount || 0).toFixed(2)}</p>
  <p style="margin-top:10px;font-size:11px">Shop No. 6, Red Cross Market, Hisar</p></div></body></html>`);
  w.document.close();
  w.focus();
  w.print();
};

/* ---------- small pieces ---------- */
function IconBtn({
  onClick,
  title,
  children,
  tone = "violet",
  compact = false,
  disabled = false,
}) {
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
      disabled={disabled}
      className={`flex shrink-0 items-center justify-center rounded-full border border-violet-100 bg-white text-violet-600 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg active:scale-90 disabled:cursor-not-allowed disabled:opacity-50 ${compact ? "h-8 w-8" : "h-9 w-9"} ${tones[tone]}`}
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
  deleting = false,
  isFavorite,
  compact = false,
}) {
  const shareJob = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Job ${jobNo(j)}`,
          text: `${j.customer} · ${j.device} · ${j.statusLabel}`,
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
    <div
      className={`flex items-center justify-end ${compact ? "flex-nowrap gap-1" : "flex-wrap gap-1.5"}`}
    >
      <IconBtn compact={compact} title="View job" onClick={() => onOpen(j)}>
        <Eye size={16} />
      </IconBtn>
      <IconBtn compact={compact} title="Edit job" onClick={() => onEdit(j)}>
        <Pencil size={15} />
      </IconBtn>
      <IconBtn
        compact={compact}
        title={`Set ${j.priority === "High" ? "medium" : "high"} priority`}
        onClick={() => onPriority(j)}
      >
        <Tag
          size={15}
          className={j.priority === "High" ? "fill-current" : ""}
        />
      </IconBtn>
      <IconBtn
        compact={compact}
        title="WhatsApp"
        tone="green"
        onClick={() => openWhatsApp(j)}
      >
        <MessageCircle size={16} />
      </IconBtn>
      <IconBtn
        compact={compact}
        title="Print label"
        onClick={() => printJob(j)}
      >
        <Printer size={16} />
      </IconBtn>
      <IconBtn compact={compact} title="Share job" onClick={shareJob}>
        <Send size={15} />
      </IconBtn>
      <IconBtn
        compact={compact}
        title={isFavorite ? "Remove favorite" : "Add favorite"}
        onClick={() => onFavorite(j)}
      >
        <Star
          size={15}
          className={isFavorite ? "fill-amber-400 text-amber-500" : ""}
        />
      </IconBtn>
      <IconBtn
        compact={compact}
        title="Delete job"
        onClick={() => onDelete(j)}
        disabled={deleting}
      >
        {deleting ? (
          <Loader2 size={15} className="animate-spin text-rose-600" />
        ) : (
          <Trash2 size={15} className="text-rose-600" />
        )}
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
  const showToast = useToast();
  const [jobsList, setJobsList] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobsError, setJobsError] = useState("");
  const [jobsRetry, setJobsRetry] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filters, setFilters] = useState({
    status: "",
    customerId: "",
    productId: "",
    staffId: "",
  });
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [view, setView] = useState("table");
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(false);
  const [favorites, setFavorites] = useState(() => new Set());
  const [deletingJobId, setDeletingJobId] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  const [jobToDelete, setJobToDelete] = useState(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search);
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    if (search !== debouncedSearch) return undefined;

    const controller = new AbortController();
    const fetchJobs = async () => {
      setJobsLoading(true);
      setJobsError("");

      try {
        const response = await getJobList(
          {
            pageSize,
            pageNumber,
            searchKey: debouncedSearch,
            status: parseOptionalId(filters.status),
            customerId: parseOptionalId(filters.customerId),
            productId: parseOptionalId(filters.productId),
            staffId: parseOptionalId(filters.staffId),
          },
          { signal: controller.signal },
        );

        if (response?.success !== true || !Array.isArray(response.data)) {
          throw new Error(response?.message || "Unexpected job list response.");
        }

        const rows = response.data.map(normalizeJob);
        const pageCount = Number(response.totalPages);
        if (!Number.isInteger(pageCount) || pageCount < 0) {
          throw new Error("Job list response has an invalid totalPages value.");
        }

        setJobsList(rows);
        setTotalPages(Math.max(1, pageCount));
        setFavorites(
          new Set(
            rows.filter((job) => job.isFavourite === 1).map((job) => job.id),
          ),
        );
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("Get Job List API Error:", error);
        setJobsList([]);
        setJobsError(
          error.response?.data?.message ||
            error.message ||
            "Unable to load jobs. Please try again.",
        );
      } finally {
        if (!controller.signal.aborted) setJobsLoading(false);
      }
    };

    fetchJobs();
    return () => {
      controller.abort();
    };
  }, [debouncedSearch, filters, jobsRetry, pageNumber, pageSize, search]);

  const updateFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setPageNumber(1);
  };

  const clearFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setFilters({ status: "", customerId: "", productId: "", staffId: "" });
    setPageNumber(1);
  };

  const filtered = jobsList;

  const updateJob = (job, changes) => {
    const updated = { ...job, ...changes };
    setJobsList((current) =>
      current.map((item) => (item.id === job.id ? updated : item)),
    );
    if (selected?.id === job.id) setSelected(updated);
    return updated;
  };

  const editJob = (job) => {
    navigate(`/jobs-new?jobId=${encodeURIComponent(job.id)}`);
  };

  const confirmDeleteJob = async () => {
    if (!jobToDelete) return;
    const job = jobToDelete;
    setDeletingJobId(job.id);
    setDeleteError("");
    try {
      const response = await deleteProduct(job.id);
      if (response?.success === false) {
        throw new Error(response.message || "Unable to delete this job.");
      }

      if (selected?.id === job.id) setSelected(null);
      setJobToDelete(null);
      setFavorites((current) => {
        const next = new Set(current);
        next.delete(job.id);
        return next;
      });
      showToast("Job deleted successfully.");

      if (jobsList.length === 1 && pageNumber > 1) {
        setPageNumber((page) => page - 1);
      } else {
        setJobsRetry((attempt) => attempt + 1);
      }
    } catch (error) {
      console.error("Delete Job API Error:", error.response?.data || error);
      setDeleteError(
        error.response?.data?.message ||
          error.response?.data?.title ||
          error.message ||
          "Unable to delete this job. Please try again.",
      );
    } finally {
      setDeletingJobId(null);
    }
  };

  const deleteJob = (job) => {
    setDeleteError("");
    setJobToDelete(job);
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
      {jobsLoading && (
        <div
          className="mb-4 flex items-center justify-center gap-2 rounded-2xl border border-violet-100 bg-white p-8 text-sm font-medium text-violet-600"
          role="status"
        >
          <Loader2 size={18} className="animate-spin" />
          Loading jobs...
        </div>
      )}
      {!jobsLoading && jobsError && (
        <div
          className="mb-4 flex flex-col items-center justify-center gap-3 rounded-2xl border border-red-100 bg-red-50 p-8 text-center"
          role="alert"
        >
          <p className="text-sm text-red-700">{jobsError}</p>
          <button
            type="button"
            onClick={() => setJobsRetry((attempt) => attempt + 1)}
            className="inline-flex items-center gap-2 rounded-full bg-violet-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-violet-700"
          >
            <RefreshCw size={14} />
            Retry
          </button>
        </div>
      )}
      <div className="mb-4 space-y-3">
        <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
          {[
            ["status", "Status ID"],
            ["customerId", "Customer ID"],
            ["productId", "Product ID"],
            ["staffId", "Staff ID"],
          ].map(([key, label]) => (
            <label key={key} className="block">
              <span className="mb-1 block pl-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                {label}
              </span>
              <input
                type="number"
                min="0"
                step="1"
                inputMode="numeric"
                value={filters[key]}
                onChange={(event) => updateFilter(key, event.target.value)}
                placeholder="All"
                className="w-full rounded-xl border border-violet-100 bg-white px-3 py-2.5 text-xs text-slate-700 shadow-sm outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
              />
            </label>
          ))}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex w-full items-center gap-2 rounded-full border border-violet-100 bg-white px-4 py-2.5 shadow-sm transition focus-within:border-violet-400 focus-within:ring-4 focus-within:ring-violet-100">
            <Search size={15} className="shrink-0 text-slate-400" />
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPageNumber(1);
              }}
              placeholder="Search job, name or phone"
              className="w-full bg-transparent text-xs text-slate-700 outline-none placeholder:text-slate-400"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setPageNumber(1);
                }}
                aria-label="Clear search"
                className="text-slate-400 hover:text-violet-600"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <div className="flex shrink-0 items-center justify-end gap-2">
            <label className="flex items-center gap-2 whitespace-nowrap text-[11px] font-semibold text-slate-500">
              Rows per page
              <select
                value={pageSize}
                onChange={(event) => {
                  setPageSize(Number(event.target.value));
                  setPageNumber(1);
                }}
                className="rounded-lg border border-violet-100 bg-white px-2 py-2 text-xs text-slate-700 outline-none focus:border-violet-400"
              >
                {[10, 20, 50, 100].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-full border border-violet-100 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 transition hover:border-violet-300 hover:text-violet-700"
            >
              Clear Filters
            </button>
            <button
              type="button"
              onClick={() => setJobsRetry((attempt) => attempt + 1)}
              title="Refresh jobs"
              aria-label="Refresh jobs"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-violet-100 bg-white text-violet-600 shadow-sm transition hover:border-violet-300 hover:bg-violet-50"
            >
              <RotateCw size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* TABLE VIEW */}
      {!jobsLoading && !jobsError && view === "table" && (
        <section className="overflow-hidden rounded-[22px] border border-violet-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1280px] table-fixed text-left">
              <colgroup>
                <col className="w-[7%]" />
                <col className="w-[20%]" />
                <col className="w-[17%]" />
                <col className="w-[9%]" />
                <col className="w-[9%]" />
                <col className="w-[13%]" />
                <col className="w-[25%]" />
              </colgroup>
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
                      className={`px-3 py-3.5 ${i === 6 ? "text-right" : ""}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((j, i) => (
                  <tr
                    key={j.id}
                    onClick={() => setSelected(j)}
                    style={{ animationDelay: `${Math.min(i, 12) * 45}ms` }}
                    className="row-in group cursor-pointer transition duration-200 hover:bg-violet-50/60"
                  >
                    <td className="px-3 py-3.5 text-[13px] font-bold text-slate-800 transition group-hover:text-violet-600">
                      {jobNo(j)}
                    </td>
                    <td className="px-3 py-3.5">
                      <p className="truncate text-[13px] font-bold text-slate-800">
                        {j.customer}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-400">
                        {[j.code, j.phone].filter(Boolean).join(" · ") ||
                          "Walk-in"}
                      </p>
                    </td>
                    <td className="px-3 py-3.5">
                      <p className="text-[13px] font-semibold text-slate-700">
                        {j.device}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-400">
                        {j.issue}
                      </p>
                    </td>
                    <td className="px-3 py-3.5">
                      <p className="text-[13px] font-bold text-slate-800">
                        {rupee(j.amount)}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-400">
                        {paidNote(j)}
                      </p>
                    </td>
                    <td className="px-3 py-3.5">
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
                    <td className="px-3 py-3.5">
                      <StatusBadge status={j.statusLabel} />
                    </td>
                    <td className="px-3 py-3.5">
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
                        deleting={deletingJobId === j.id}
                        isFavorite={favorites.has(j.id)}
                        compact
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
        </section>
      )}

      {/* BOARD VIEW */}
      {!jobsLoading &&
        !jobsError &&
        view === "board" &&
        filtered.length === 0 && (
          <div className="fade-in rounded-[22px] border border-violet-100 bg-white p-12 text-center text-sm text-slate-400 shadow-sm">
            No repair jobs found.
          </div>
        )}
      {!jobsLoading &&
        !jobsError &&
        view === "board" &&
        filtered.length > 0 && (
          <div className="fade-in grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {TABS.filter((t) => !["All", "Overdue"].includes(t.key)).map(
              (col) => {
                const items = filtered.filter(col.test);
                return (
                  <div
                    key={col.key}
                    className="rounded-2xl bg-[#f1eefc]/70 p-3"
                  >
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
                              {jobNo(j)}
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
                              deleting={deletingJobId === j.id}
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

      {!jobsLoading && !jobsError && (
        <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-violet-100 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[11px] text-slate-500">
            Showing {jobsList.length} records | Page {pageNumber} of{" "}
            {totalPages}
          </p>
          <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setPageNumber((current) => Math.max(1, current - 1))
                }
                disabled={pageNumber <= 1 || jobsLoading}
                className="flex h-8 items-center gap-1 rounded-full border border-violet-100 px-3 text-xs font-bold text-slate-600 transition hover:border-violet-300 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={14} />
                Previous
              </button>
              <span className="min-w-16 text-center text-xs font-bold text-violet-700">
                {pageNumber} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() =>
                  setPageNumber((current) => Math.min(totalPages, current + 1))
                }
                disabled={pageNumber >= totalPages || jobsLoading}
                className="flex h-8 items-center gap-1 rounded-full border border-violet-100 px-3 text-xs font-bold text-slate-600 transition hover:border-violet-300 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
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
                  {jobNo(selected)}
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
                    value={selected.statusLabel}
                    onChange={(event) =>
                      setSelected((current) => ({
                        ...current,
                        statusLabel: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-violet-100 bg-white px-3 py-2 text-sm outline-none focus:border-violet-400"
                  >
                    {[
                      "Pending",
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
                  <div
                    key={k}
                    className="rounded-xl bg-[#f7f5fd] px-3.5 py-2.5"
                  >
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
                      setSelected(
                        jobsList.find((job) => job.id === selected.id),
                      );
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
                  <StatusBadge status={selected.statusLabel} />
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
                    deleting={deletingJobId === selected.id}
                    isFavorite={favorites.has(selected.id)}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      )}
      <ConfirmDialog
        open={Boolean(jobToDelete)}
        title="Delete job?"
        description="Are you sure you want to delete"
        itemName={jobToDelete ? jobNo(jobToDelete) : ""}
        itemMeta={jobToDelete?.customer || ""}
        warning="This will permanently remove the job from your records."
        confirmText="Delete Job"
        loading={deletingJobId === jobToDelete?.id}
        error={deleteError}
        onCancel={() => {
          setJobToDelete(null);
          setDeleteError("");
        }}
        onConfirm={confirmDeleteJob}
      />
    </div>
  );
}
