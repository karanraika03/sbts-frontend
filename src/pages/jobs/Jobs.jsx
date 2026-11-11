import { useEffect, useRef, useState } from "react";
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
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import PageHeader from "../../components/PageHeader";
import StatusBadge from "../../components/StatusBadge";
import ConfirmDialog from "../../components/ConfirmDialog";
import MassageBtn from "../../components/MassageBtn";
import {
  getJobList,
  getJobById,
  deleteJob,
  toggleFavouriteCustomerFromJob,
  printLabelSheet,
  printJobSheet,
  getProductTypes,
  getCustomerDropdown,
  verifyJobCode,
  getClosingStatus,
  updateJobStatus,
  getAllJobStatus,
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

const normalizeJob = (item, fallback = {}) => {
  const status =
    item.statusN ??
    item.statusName ??
    (typeof item.status === "string" && !/^\d+$/.test(item.status)
      ? item.status
      : fallback.status);
  const deliveryDate = item.deliveryDate ?? item.dateOfDelivery;

  return {
    id: item.id ?? fallback.id,
    srNo: item.srNo ?? item.id ?? fallback.srNo,
    customerId: item.customerId ?? fallback.customerId,
    customer: item.customer ?? item.customerName ?? fallback.customer ?? "—",
    code: item.customerCode ?? item.userName ?? fallback.code ?? "",
    phone: item.mobileNo ?? item.phone ?? fallback.phone ?? "",
    device:
      item.productName ??
      item.productTypeName ??
      item.productCompany ??
      fallback.device ??
      "—",
    issue: item.productDetail ?? item.technicalProblem ?? fallback.issue ?? "—",
    status: String(status ?? "—"),
    statusId: item.status ?? fallback.statusId,
    priority: item.priority ?? item.priorityName ?? fallback.priority ?? "—",
    amount: item.totalEstimatedCost ?? fallback.amount ?? 0,
    advance: item.advance ?? fallback.advance ?? 0,
    balance: item.balance ?? fallback.balance ?? 0,
    date: deliveryDate ? formatJobDate(deliveryDate) : (fallback.date ?? "—"),
    dueNote: fallback.dueNote ?? "",
    isFavourite:
      item.isFavourite == null
        ? (fallback.isFavourite ?? false)
        : item.isFavourite === true || item.isFavourite === 1,
  };
};

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

const printPdfBlob = (pdfBlob) =>
  new Promise((resolve) => {
    const url = window.URL.createObjectURL(
      new Blob([pdfBlob], { type: "application/pdf" }),
    );

    const iframe = document.createElement("iframe");
    iframe.style.cssText =
      "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
    iframe.src = url;

    const cleanup = () => {
      setTimeout(() => {
        iframe.remove();
        window.URL.revokeObjectURL(url);
      }, 60000);
    };

    iframe.onload = () => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (err) {
        // fallback: print na chale toh PDF new tab me khol do
        window.open(url, "_blank");
      }
      cleanup();
      resolve();
    };

    document.body.appendChild(iframe);
  });

function Actions({
  j,
  onOpen,
  onEdit,
  onVerify,
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
      await printPdfBlob(pdfBlob);
    } catch (error) {
      console.error("Print Label Error:", error);
      showToast("Unable to print label sheet.");
    }
  };

  const handlePrintJobSheet = async (id) => {
    try {
      const pdfBlob = await printJobSheet(id);
      await printPdfBlob(pdfBlob);
    } catch (error) {
      console.error("Print Job Sheet Error:", error);
      showToast("Unable to print job sheet.");
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
      {!s(j).startsWith("deliver") && (
        <IconBtn
          compact={compact}
          title="Verify job code"
          onClick={() => onVerify(j)}
        >
          <ShieldCheck size={15} />
        </IconBtn>
      )}
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
  const showToast = useToast();
  const [jobsList, setJobsList] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobsError, setJobsError] = useState("");
  const [jobsRetry, setJobsRetry] = useState(0);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");
  const detailsControllerRef = useRef(null);
  const [verificationJob, setVerificationJob] = useState(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [verificationError, setVerificationError] = useState("");
  const [codeVerified, setCodeVerified] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState("");
  const [closingStatuses, setClosingStatuses] = useState([]);
  const [closingStatusesLoading, setClosingStatusesLoading] = useState(false);
  const [closingStatusesError, setClosingStatusesError] = useState("");
  const [closingStatusesRetry, setClosingStatusesRetry] = useState(0);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const verificationRequestRef = useRef(0);
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
  const [statusOptions, setStatusOptions] = useState([]);
  const [statusOptionsLoading, setStatusOptionsLoading] = useState(true);
  const [statusOptionsError, setStatusOptionsError] = useState("");
  const [statusOptionsRetry, setStatusOptionsRetry] = useState(0);
  const [filterOptions, setFilterOptions] = useState({ status: [], staff: [] });
  const [jobToDelete, setJobToDelete] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    let active = true;

    const fetchStatusOptions = async () => {
      setStatusOptionsLoading(true);
      setStatusOptionsError("");
      try {
        const response = await getAllJobStatus();
        if (response?.success !== true || !Array.isArray(response.data)) {
          throw new Error(
            response?.message || "Unexpected job status response.",
          );
        }

        const options = response.data
          .map((item) =>
            makeFilterOption(
              item.id ?? item.statusId ?? item.value,
              item.name ?? item.statusName ?? item.statusN ?? item.label,
              "Status",
            ),
          )
          .filter(Boolean);

        if (active) setStatusOptions(options);
      } catch (error) {
        console.error(
          "Get All Job Status API Error:",
          error.response?.data || error,
        );
        if (active) {
          setStatusOptions([]);
          setStatusOptionsError(
            error.response?.data?.message ||
              error.response?.data?.title ||
              error.message ||
              "Unable to load job statuses.",
          );
        }
      } finally {
        if (active) setStatusOptionsLoading(false);
      }
    };

    fetchStatusOptions();
    return () => {
      active = false;
    };
  }, [statusOptionsRetry]);

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

  // const openJobDetails = async (job) => {
  //   detailsControllerRef.current?.abort();
  //   const controller = new AbortController();
  //   detailsControllerRef.current = controller;
  //   setSelected(job);
  //   setDetailsLoading(true);
  //   setDetailsError("");

  //   try {
  //     const response = await getJobById(job.id, {
  //       signal: controller.signal,
  //     });
  //     if (controller.signal.aborted) return;
  //     if (response?.success !== true || !response.data) {
  //       throw new Error(response?.message || "Unable to load job details.");
  //     }

  //     setSelected(normalizeJob(response.data, job));
  //   } catch (error) {
  //     if (controller.signal.aborted) return;
  //     console.error("Get Job Detail API Error:", error.response?.data || error);
  //     setDetailsError(
  //       error.response?.data?.message ||
  //         error.response?.data?.title ||
  //         error.message ||
  //         "Unable to load job details. Please try again.",
  //     );
  //   } finally {
  //     if (!controller.signal.aborted) {
  //       setDetailsLoading(false);
  //       detailsControllerRef.current = null;
  //     }
  //   }
  // };

  const openJobDetails = (job) => {
    navigate(`/jobs/${encodeURIComponent(job.id)}`);
  };

  // const closeJobDetails = () => {
  //   detailsControllerRef.current?.abort();
  //   detailsControllerRef.current = null;
  //   setSelected(null);
  //   setDetailsLoading(false);
  //   setDetailsError("");
  //   setEditing(false);
  // };

  // useEffect(
  //   () => () => {
  //     detailsControllerRef.current?.abort();
  //   },
  //   [],
  // );

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

  const openVerification = (job) => {
    verificationRequestRef.current += 1;
    setVerificationJob(job);
    setVerificationCode("");
    setVerificationError("");
    setCodeVerified(false);
    setVerificationStatus("");
    setVerificationLoading(false);
    setClosingStatuses([]);
    setClosingStatusesLoading(true);
    setClosingStatusesError("");
  };

  const closeVerification = () => {
    if (verificationLoading || statusUpdating) return;
    verificationRequestRef.current += 1;
    setVerificationJob(null);
    setVerificationCode("");
    setVerificationError("");
    setCodeVerified(false);
    setVerificationStatus("");
    setVerificationLoading(false);
    setClosingStatusesLoading(false);
  };

  useEffect(() => {
    if (!verificationJob) {
      setClosingStatuses([]);
      setClosingStatusesError("");
      return undefined;
    }

    let active = true;
    const loadClosingStatuses = async () => {
      setClosingStatusesLoading(true);
      setClosingStatusesError("");

      try {
        const response = await getClosingStatus();
        if (response?.success !== true) {
          throw new Error(
            response?.message || "Unable to load closing statuses.",
          );
        }

        const rows = Array.isArray(response.data) ? response.data : null;
        if (!rows) {
          throw new Error("Closing status response is not a list.");
        }

        const options = rows
          .map((item) => ({
            value: item.id ?? item.statusId ?? item.value,
            label:
              item.name ?? item.statusName ?? item.statusN ?? item.label ?? "",
          }))
          .filter(
            (option) =>
              option.value != null && String(option.label).trim() !== "",
          );
        if (options.length === 0) {
          throw new Error("No closing statuses are available.");
        }
        if (active) setClosingStatuses(options);
      } catch (error) {
        console.error(
          "Get Closing Status API Error:",
          error.response?.data || error,
        );
        if (active) {
          setClosingStatuses([]);
          setClosingStatusesError(
            error.response?.data?.message ||
              error.response?.data?.title ||
              error.message ||
              "Unable to load closing statuses.",
          );
        }
      } finally {
        if (active) setClosingStatusesLoading(false);
      }
    };

    loadClosingStatuses();
    return () => {
      active = false;
    };
  }, [verificationJob, closingStatusesRetry]);

  useEffect(() => {
    const code = verificationCode.trim();
    if (!verificationJob || !code) return undefined;

    const jobId = verificationJob.id;
    const timer = setTimeout(async () => {
      const requestId = ++verificationRequestRef.current;
      setVerificationLoading(true);
      setVerificationError("");

      try {
        const response = await verifyJobCode(jobId, code);
        if (requestId !== verificationRequestRef.current) return;
        if (response?.success !== true) {
          throw new Error(response?.message || "Verification code is invalid.");
        }
        setCodeVerified(true);
      } catch (error) {
        if (requestId !== verificationRequestRef.current) return;
        console.error(
          "Verify Job Code API Error:",
          error.response?.data || error,
        );
        setVerificationError(
          error.response?.data?.message ||
            error.response?.data?.title ||
            error.message ||
            "Unable to verify job code. Please try again.",
        );
      } finally {
        if (requestId === verificationRequestRef.current) {
          setVerificationLoading(false);
        }
      }
    }, 500);

    return () => {
      clearTimeout(timer);
      verificationRequestRef.current += 1;
    };
  }, [verificationCode, verificationJob]);

  const handleStatusUpdate = async () => {
    if (
      !codeVerified ||
      !verificationJob ||
      !verificationStatus ||
      statusUpdating
    ) {
      return;
    }

    const selectedStatus = closingStatuses.find(
      (option) => String(option.value) === String(verificationStatus),
    );
    if (!selectedStatus) {
      setClosingStatusesError("Select a valid closing status.");
      return;
    }

    try {
      setStatusUpdating(true);
      const response = await updateJobStatus(
        verificationJob.id,
        selectedStatus.value,
      );
      const updateResult = response?.success;
      if (
        updateResult !== true &&
        updateResult?.result !== true &&
        updateResult?.isCompletedSuccessfully !== true
      ) {
        throw new Error(
          response?.message ||
            updateResult?.exception ||
            "Unable to update job status.",
        );
      }

      setJobsList((current) =>
        current.map((job) =>
          job.id === verificationJob.id
            ? {
                ...job,
                status: selectedStatus.label,
                statusId: selectedStatus.value,
              }
            : job,
        ),
      );
      showToast("Job status updated successfully.");
      setJobsRetry((attempt) => attempt + 1);
      setVerificationJob(null);
    } catch (error) {
      console.error(
        "Update Job Status API Error:",
        error.response?.data || error,
      );
      setVerificationError(
        error.response?.data?.message ||
          error.response?.data?.title ||
          error.message ||
          "Unable to update job status. Please try again.",
      );
    } finally {
      setStatusUpdating(false);
    }
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
              options: statusOptions,
              error: statusOptionsError,
              loading: statusOptionsLoading,
              canRetry: true,
            },
            {
              label: "Customer",
              value: customerIdFilter,
              setValue: setCustomerIdFilter,
              options: customerOptions,
              error: customerOptionsError,
              canRetry: false,
            },
            {
              label: "Product",
              value: productIdFilter,
              setValue: setProductIdFilter,
              options: productOptions,
              error: productOptionsError,
              canRetry: false,
            },
            {
              label: "Staff",
              value: staffIdFilter,
              setValue: setStaffIdFilter,
              options: filterOptions.staff,
              canRetry: false,
            },
          ].map(
            ({ label, value, setValue, options, error, loading, canRetry }) => (
              <label key={label} className="block min-w-0">
                <span className="mb-1 block pl-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  {label}
                </span>
                <select
                  value={value}
                  disabled={loading}
                  onChange={(event) => {
                    setValue(event.target.value);
                    setPageNumber(1);
                  }}
                  className="h-[46px] w-full rounded-2xl border border-violet-100 bg-white px-3.5 text-[13px] text-slate-600 shadow-sm outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                >
                  <option value="">
                    {loading ? "Loading statuses..." : "All"}
                  </option>
                  {options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label} (ID: {option.value})
                    </option>
                  ))}
                </select>
                {error && (
                  <span className="mt-1 flex items-center justify-between gap-2 text-[10px] text-red-600">
                    <span role="alert">{error}</span>
                    {canRetry && (
                      <button
                        type="button"
                        onClick={() =>
                          setStatusOptionsRetry((attempt) => attempt + 1)
                        }
                        className="shrink-0 font-bold text-violet-600 hover:text-violet-800"
                      >
                        Retry
                      </button>
                    )}
                  </span>
                )}
              </label>
            ),
          )}
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
                    onClick={() => openJobDetails(j)}
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
                        onOpen={openJobDetails}
                        onEdit={editJob}
                        onVerify={openVerification}
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
          onClick={closeJobDetails}
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
                onClick={closeJobDetails}
                className="rounded-full p-2 text-slate-400 transition hover:bg-violet-50 hover:text-violet-600"
              >
                <X size={18} />
              </button>
            </div>

            {detailsLoading ? (
              <div
                role="status"
                className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-violet-50 p-5 text-sm font-medium text-violet-600"
              >
                <Loader2 size={18} className="animate-spin" />
                Loading job details...
              </div>
            ) : detailsError ? (
              <div
                role="alert"
                className="mt-5 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700"
              >
                <p>{detailsError}</p>
                <button
                  type="button"
                  onClick={() => openJobDetails(selected)}
                  className="mt-3 font-bold text-violet-700 hover:text-violet-900"
                >
                  Try again
                </button>
              </div>
            ) : editing ? (
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

            {!detailsLoading && !detailsError && (
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
                      onOpen={openJobDetails}
                      onEdit={editJob}
                      onVerify={openVerification}
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
            )}
          </div>
        </div>
      )}
      {verificationJob && (
        <div
          className="fade-in fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
          onClick={closeVerification}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="job-code-dialog-title"
            className="pop-in w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="flex items-center justify-between bg-blue-600 px-6 py-5 text-white">
              <h2
                id="job-code-dialog-title"
                className="flex items-center gap-2 text-lg font-bold"
              >
                <RefreshCw size={22} />
                Update Job Status
              </h2>
              <button
                type="button"
                onClick={closeVerification}
                aria-label="Close verification dialog"
                className="rounded-full p-1 text-blue-200 transition hover:bg-blue-500 hover:text-white disabled:opacity-50"
                disabled={verificationLoading || statusUpdating}
              >
                <X size={24} />
              </button>
            </header>

            <div className="space-y-5 p-6">
              <p className="text-sm text-slate-500">
                Enter the verification code for job{" "}
                <span className="font-bold text-slate-800">
                  {jobNo(verificationJob)}
                </span>
                .
              </p>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  Verification Code
                </span>
                <input
                  autoFocus
                  value={verificationCode}
                  onChange={(event) => {
                    verificationRequestRef.current += 1;
                    setVerificationCode(event.target.value);
                    setVerificationError("");
                    setCodeVerified(false);
                    setVerificationStatus("");
                    setVerificationLoading(false);
                  }}
                  placeholder="Enter verification code"
                  autoComplete="one-time-code"
                  className="h-14 w-full rounded-xl border border-slate-200 px-4 text-lg text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  disabled={verificationLoading}
                />
              </label>

              {verificationLoading && (
                <div
                  role="status"
                  className="flex items-center gap-2 text-sm font-medium text-blue-700"
                >
                  <Loader2 size={17} className="animate-spin" />
                  Verifying code...
                </div>
              )}
              {codeVerified && (
                <div
                  role="status"
                  className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800"
                >
                  <CheckCircle2 size={20} className="shrink-0" />
                  Code verified successfully.
                </div>
              )}
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  New Status
                </span>
                <select
                  value={verificationStatus}
                  onChange={(event) =>
                    setVerificationStatus(event.target.value)
                  }
                  disabled={
                    !codeVerified ||
                    verificationLoading ||
                    closingStatusesLoading ||
                    Boolean(closingStatusesError) ||
                    statusUpdating
                  }
                  className="h-14 w-full rounded-xl border border-slate-200 bg-white px-4 text-base text-slate-800 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                >
                  <option value="">Select a status</option>
                  {closingStatuses.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </label>
              {closingStatusesLoading && (
                <div
                  role="status"
                  className="flex items-center gap-2 text-sm font-medium text-blue-700"
                >
                  <Loader2 size={17} className="animate-spin" />
                  Loading statuses...
                </div>
              )}
              {closingStatusesError && (
                <div
                  role="alert"
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                >
                  <span>{closingStatusesError}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setClosingStatusesRetry((attempt) => attempt + 1)
                    }
                    className="font-semibold text-blue-700 hover:text-blue-900"
                  >
                    Retry
                  </button>
                </div>
              )}
              {verificationError && (
                <p
                  role="alert"
                  className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                >
                  {verificationError}
                </p>
              )}

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={closeVerification}
                  disabled={verificationLoading || statusUpdating}
                  className="rounded-lg bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 disabled:opacity-50"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleStatusUpdate}
                  disabled={
                    !codeVerified ||
                    !verificationStatus ||
                    verificationLoading ||
                    closingStatusesLoading ||
                    Boolean(closingStatusesError) ||
                    statusUpdating
                  }
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {statusUpdating ? (
                    <Loader2 size={17} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={17} />
                  )}
                  {statusUpdating ? "Updating..." : "Update Status"}
                </button>
              </div>
            </div>
          </section>
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
