import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
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
} from "lucide-react";
import PageHeader from "../../components/PageHeader";
import StatusBadge from "../../components/StatusBadge";
import ConfirmDialog from "../../components/ConfirmDialog";
import MassageBtn from "../../components/MassageBtn";
import {
  getJobList,
  deleteJob,
  toggleFavouriteCustomerFromJob,
  printLabelSheet,
  printJobSheet,
  getProductTypes,
  getCustomerDropdown,
} from "../../services/JobService";

import { useToast } from "../../context/ToastContext";

/* ---------- filters ---------- */
const s = (j) => String(j.status || "").toLowerCase();

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

const normalizeJob = (item) => ({
  id: item.id,
  srNo: item.srNo ?? item.id,
  customerId: item.customerId,
  customer: item.customer ?? "—",
  code: "",
  phone: item.mobileNo ?? "",
  device: item.productName ?? "—",
  issue: item.productDetail ?? "—",
  status: String(item.statusN ?? "—"),
  statusId: item.status,
  priority: item.priority ?? "—",
  amount: item.totalEstimatedCost ?? 0,
  advance: item.advance ?? 0,
  balance: item.balance ?? 0,
  date: formatJobDate(item.deliveryDate),
  dueNote: "",
  isFavourite: item.isFavourite === true || item.isFavourite === 1,
});

const makeFilterOption = (id, label, fallback) => {
  if (id == null || String(id).trim() === "") return null;
  return {
    value: String(id),
    label: String(label ?? "").trim() || `${fallback} ${id}`,
  };
};

const getJobFilterOptions = (jobs) => ({
  status: jobs
    .map((job) =>
      makeFilterOption(
        job.status ?? job.statusId,
        job.statusN ?? job.statusName ?? job.statusLabel,
        "Status",
      ),
    )
    .filter(Boolean),
  staff: jobs
    .map((job) =>
      makeFilterOption(
        job.staffId ?? job.technicianId ?? job.employeeId,
        job.staffName ?? job.technicianName ?? job.employeeName,
        "Staff",
      ),
    )
    .filter(Boolean),
});

const mergeFilterOptions = (current, incoming) => {
  const optionsById = new Map(current.map((option) => [option.value, option]));
  incoming.forEach((option) => optionsById.set(option.value, option));
  return [...optionsById.values()].sort((a, b) =>
    a.label.localeCompare(b.label),
  );
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
    : `Hello ${j.customer}, update on your ${j.device} (Job ${jobNo(j)}): ${j.status}. - Shree Bhanu Technical Solutions`;

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
      className={`flex shrink-0 items-center justify-center rounded-full border border-violet-100 bg-white text-violet-600 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg active:scale-90 ${compact ? "h-8 w-8" : "h-9 w-9"} ${tones[tone]}`}
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
  compact = false,
}) {
  const showToast = useToast();

  const handlePrintLabel = async (id) => {
    try {
      const pdfBlob = await printLabelSheet(id);

      const file = new Blob([pdfBlob], {
        type: "application/pdf",
      });

      const url = window.URL.createObjectURL(file);

      const link = document.createElement("a");
      link.href = url;
      link.download = "LabelSheet.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);

      showToast("Label sheet downloaded successfully.");
    } catch (error) {
      console.error("Print Label Error:", error);
      showToast("Unable to download label sheet.");
    }
  };

  const handlePrintJobSheet = async (id) => {
    try {
      const pdfBlob = await printJobSheet(id);

      const url = window.URL.createObjectURL(
        new Blob([pdfBlob], { type: "application/pdf" }),
      );

      const link = document.createElement("a");
      link.href = url;
      link.download = `JobSheet-${id}.pdf`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);

      showToast("Job sheet downloaded successfully.");
    } catch (error) {
      console.error("Print Job Sheet Error:", error);
      showToast("Unable to download job sheet.");
    }
  };

  const handleFavourite = async () => {
    try {
      const response = await toggleFavouriteCustomerFromJob(j.id, j.customerId);

      if (response?.success === false) {
        throw new Error(response.message || "Unable to update favourite.");
      }

      onFavorite(j);

      showToast(
        isFavorite
          ? "Customer removed from favourites."
          : "Customer added to favourites.",
      );
    } catch (error) {
      console.error("Favourite API Error:", error);

      showToast(
        error.response?.data?.message ||
          error.message ||
          "Unable to update favourite.",
      );
    }
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
      <IconBtn title="Print Label Sheet" onClick={() => handlePrintLabel(j.id)}>
        <Tag size={15} />
      </IconBtn>
      {/* <IconBtn
        compact={compact}
        title="WhatsApp"
        tone="green"
        onClick={() => openWhatsApp(j)}
      >
        <MessageCircle size={16} />
      </IconBtn> */}
      <IconBtn
        compact={compact}
        title="Print Job Sheet"
        onClick={() => handlePrintJobSheet(j.id)}
      >
        <Printer size={16} />
      </IconBtn>
      <div className="relative">
        <MassageBtn j={j} compact={compact} />
      </div>
      <IconBtn
        compact={compact}
        title={isFavorite ? "Remove favorite" : "Add favorite"}
        onClick={handleFavourite}
      >
        <Star
          size={15}
          className={isFavorite ? "fill-amber-400 text-amber-500" : ""}
        />
      </IconBtn>
      <IconBtn compact={compact} title="Delete job" onClick={() => onDelete(j)}>
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
  const [jobsList, setJobsList] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobsError, setJobsError] = useState("");
  const [jobsRetry, setJobsRetry] = useState(0);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(false);
  const [favorites, setFavorites] = useState(() => new Set());
  const [pageSize, setPageSize] = useState(10);
  const [pageNumber, setPageNumber] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [customerIdFilter, setCustomerIdFilter] = useState("");
  const [productIdFilter, setProductIdFilter] = useState("");
  const [staffIdFilter, setStaffIdFilter] = useState("");
  const [customerOptions, setCustomerOptions] = useState([]);
  const [customerOptionsError, setCustomerOptionsError] = useState("");
  const [productOptions, setProductOptions] = useState([]);
  const [productOptionsError, setProductOptionsError] = useState("");
  const [filterOptions, setFilterOptions] = useState({ status: [], staff: [] });
  const [jobToDelete, setJobToDelete] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    let active = true;

    const fetchCustomerOptions = async () => {
      setCustomerOptionsError("");
      try {
        const response = await getCustomerDropdown();
        if (!Array.isArray(response)) {
          throw new Error("Customer dropdown response is not an array.");
        }

        const options = response.map(({ id, name }) => ({
          value: String(id),
          label: String(name),
        }));

        if (active) setCustomerOptions(options);
      } catch (error) {
        console.error("Get Customer Dropdown API Error:", error);
        if (active) {
          setCustomerOptions([]);
          setCustomerOptionsError(
            error.response?.data?.message ||
              error.response?.data?.title ||
              error.message ||
              "Unable to load customers.",
          );
        }
      }
    };

    fetchCustomerOptions();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    const fetchProductOptions = async () => {
      setProductOptionsError("");
      try {
        const response = await getProductTypes();
        if (!Array.isArray(response)) {
          throw new Error("Product types response is not an array.");
        }

        const options = response.map(({ id, name }) => ({
          value: String(id),
          label: String(name),
        }));

        if (active) setProductOptions(options);
      } catch (error) {
        console.error("Get Product Types API Error:", error);
        if (active) {
          setProductOptions([]);
          setProductOptionsError(
            error.response?.data?.message ||
              error.response?.data?.title ||
              error.message ||
              "Unable to load product types.",
          );
        }
      }
    };

    fetchProductOptions();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    const fetchJobs = async () => {
      setJobsLoading(true);
      setJobsError("");
      try {
        const params = {
          pageSize,
          pageNumber,
          ...(search.trim() && { searchKey: search.trim() }),
          ...(statusFilter !== "" && { status: Number(statusFilter) }),
          ...(customerIdFilter !== "" && {
            customerId: Number(customerIdFilter),
          }),
          ...(productIdFilter !== "" && { productId: Number(productIdFilter) }),
          ...(staffIdFilter !== "" && { staffId: Number(staffIdFilter) }),
        };
        const response = await getJobList(params);
        if (response?.success === false) {
          throw new Error(response.message || "Unable to load jobs.");
        }
        if (!Array.isArray(response?.data)) {
          throw new Error("Job list response data is not an array.");
        }
        if (active) {
          const normalizedJobs = response.data.map(normalizeJob);

          setJobsList(normalizedJobs);

          setFavorites(
            new Set(
              normalizedJobs
                .filter((job) => job.isFavourite)
                .map((job) => job.id),
            ),
          );
          const options = getJobFilterOptions(response.data);
          setFilterOptions((current) => ({
            status: mergeFilterOptions(current.status, options.status),
            staff: mergeFilterOptions(current.staff, options.staff),
          }));
          setTotalPages(Math.max(1, Number(response.totalPages) || 1));
        }
      } catch (error) {
        if (error.name === "CanceledError" || error.code === "ERR_CANCELED")
          return;
        console.error("Get Job List API Error:", error);
        if (active) {
          setJobsList([]);
          setTotalPages(1);
          setJobsError(
            error.response?.data?.message ||
              error.message ||
              "Unable to load jobs. Please try again.",
          );
        }
      } finally {
        if (active) setJobsLoading(false);
      }
    };

    const timer = setTimeout(fetchJobs, search ? 350 : 0);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [
    jobsRetry,
    pageSize,
    pageNumber,
    search,
    statusFilter,
    customerIdFilter,
    productIdFilter,
    staffIdFilter,
  ]);

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

  const handleDeleteJob = (job) => {
    setDeleteError("");
    setJobToDelete(job);
  };

  const confirmDeleteJob = async () => {
    if (!jobToDelete || deletingId != null) return;
    const job = jobToDelete;
    try {
      setDeletingId(job.id);
      setDeleteError("");
      const response = await deleteJob(job.id);
      if (response?.success === false) {
        throw new Error(response.message || "Unable to delete job.");
      }

      setJobToDelete(null);
      setFavorites((current) => {
        const next = new Set(current);
        next.delete(job.id);
        return next;
      });
      if (selected?.id === job.id) setSelected(null);
      setEditing(false);

      // Refetch from server so the UI always reflects persisted data.
      // If the current page becomes empty, move back one page.
      if (jobsList.length === 1 && pageNumber > 1) {
        setPageNumber((current) => current - 1);
      } else {
        setJobsRetry((current) => current + 1);
      }
    } catch (error) {
      console.error("Delete Job API Error:", error);
      setDeleteError(
        error.response?.data?.message ||
          error.response?.data?.title ||
          error.message ||
          "Unable to delete job. Please try again.",
      );
    } finally {
      setDeletingId(null);
    }
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
      <div className="mb-4 space-y-2.5">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: "Status",
              value: statusFilter,
              setValue: setStatusFilter,
              options: filterOptions.status,
            },
            {
              label: "Customer",
              value: customerIdFilter,
              setValue: setCustomerIdFilter,
              options: customerOptions,
              error: customerOptionsError,
            },
            {
              label: "Product",
              value: productIdFilter,
              setValue: setProductIdFilter,
              options: productOptions,
              error: productOptionsError,
            },
            {
              label: "Staff",
              value: staffIdFilter,
              setValue: setStaffIdFilter,
              options: filterOptions.staff,
            },
          ].map(({ label, value, setValue, options, error }) => (
            <label key={label} className="block min-w-0">
              <span className="mb-1 block pl-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                {label}
              </span>
              <select
                value={value}
                onChange={(event) => {
                  setValue(event.target.value);
                  setPageNumber(1);
                }}
                className="h-[46px] w-full rounded-2xl border border-violet-100 bg-white px-3.5 text-[13px] text-slate-600 shadow-sm outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
              >
                <option value="">All</option>
                {options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label} (ID: {option.value})
                  </option>
                ))}
              </select>
              {error && (
                <span
                  role="alert"
                  className="mt-1 block text-[10px] text-red-600"
                >
                  {error}
                </span>
              )}
            </label>
          ))}
        </div>

        <div className="flex flex-col gap-2 xl:flex-row xl:items-center">
          <div className="flex min-h-[46px] min-w-0 flex-1 items-center gap-2.5 rounded-full border border-violet-100 bg-white px-4 shadow-sm transition focus-within:border-violet-400 focus-within:ring-4 focus-within:ring-violet-100">
            <Search size={16} className="shrink-0 text-slate-400" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPageNumber(1);
              }}
              placeholder="Search job, name or phone"
              className="w-full bg-transparent text-[13px] text-slate-700 outline-none placeholder:text-slate-400"
            />
            {search && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => {
                  setSearch("");
                  setPageNumber(1);
                }}
                className="shrink-0 text-slate-400 hover:text-violet-600"
              >
                <X size={15} />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 sm:justify-end">
            <label className="flex items-center gap-2 text-[11px] font-medium text-slate-500">
              Rows per page
              <select
                value={pageSize}
                onChange={(event) => {
                  setPageSize(Number(event.target.value));
                  setPageNumber(1);
                }}
                className="h-9 rounded-xl border border-violet-100 bg-white px-2.5 text-[13px] text-slate-700 outline-none focus:border-violet-400"
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
              onClick={() => {
                setSearch("");
                setStatusFilter("");
                setCustomerIdFilter("");
                setProductIdFilter("");
                setStaffIdFilter("");
                setPageNumber(1);
              }}
              className="h-9 rounded-full border border-violet-100 bg-white px-4 text-[13px] font-medium text-slate-600 shadow-sm transition hover:border-violet-200 hover:text-violet-700"
            >
              Clear filters
            </button>
            <button
              type="button"
              aria-label="Refresh jobs"
              title="Refresh jobs"
              onClick={() => setJobsRetry((attempt) => attempt + 1)}
              disabled={jobsLoading}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-violet-100 bg-white text-violet-600 shadow-sm transition hover:bg-violet-50 disabled:opacity-50"
            >
              <RefreshCw
                size={15}
                className={jobsLoading ? "animate-spin" : ""}
              />
            </button>
          </div>
        </div>
      </div>

      {/* TABLE VIEW */}
      {!jobsLoading && !jobsError && (
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
                {jobsList.map((j, i) => (
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
                      <StatusBadge status={j.status} />
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
                        onDelete={handleDeleteJob}
                        isFavorite={favorites.has(j.id)}
                        compact
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {jobsList.length === 0 && (
              <div className="fade-in p-12 text-center text-sm text-slate-400">
                No repair jobs found.
              </div>
            )}
          </div>
          <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span>
                Showing {jobsList.length} jobs · Page{" "}
                <strong>{pageNumber}</strong> of <strong>{totalPages}</strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={pageNumber <= 1 || jobsLoading}
                onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-violet-100 px-4 py-2 text-xs font-bold text-violet-600 hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>
              <span className="min-w-8 text-center text-xs font-bold text-slate-700">
                {pageNumber}
              </span>
              <button
                type="button"
                disabled={pageNumber >= totalPages || jobsLoading}
                onClick={() =>
                  setPageNumber((p) => Math.min(totalPages, p + 1))
                }
                className="rounded-lg border border-violet-100 px-4 py-2 text-xs font-bold text-violet-600 hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </section>
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
                    onDelete={handleDeleteJob}
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
        itemName={jobToDelete ? `Job ${jobNo(jobToDelete)}` : ""}
        itemMeta={`Customer: ${jobToDelete?.customer ?? ""}`}
        warning="This will permanently remove the job from your records."
        confirmText="Delete Job"
        loading={deletingId === jobToDelete?.id}
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
