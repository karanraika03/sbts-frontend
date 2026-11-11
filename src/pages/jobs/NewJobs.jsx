import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ChevronRight,
  ChevronDown,
  Check,
  AlertCircle,
  User,
  Laptop,
  Puzzle,
  Wrench,
  IndianRupee,
  Plus,
  Trash2,
} from "lucide-react";

import {
  getCustomerDropdown,
  getProductTypes,
  createJob,
  getJobById,
  getCustomerByMobile,
  updateJob,
} from "../../services/JobService";
import { useToast } from "../../context/ToastContext";

/* ---------- constants ---------- */
const NEXT_JOB_NO = 1631;
const NEXT_CUSTOMER_CODE = "CN0106";
const SHOP = {
  name: "Shree Bhanu Technical Solutions",
  address: "Shop No. 6, Red Cross Market, Hisar",
  helpline: "9254840600",
  phones: ["89010 34555", "99925 34555"],
};

const ISSUES = [
  "Dead",
  "No display",
  "Keyboard",
  "Battery",
  "Charging port",
  "Slow or hangs",
  "Other",
];
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const pad = (n) => String(n).padStart(2, "0");
const fmtDate = (d) =>
  `${pad(d.getDate())}/${MONTHS[d.getMonth()]}/${d.getFullYear()}`;
const toInputDate = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const money = (n) => Number(n || 0).toFixed(2);

const newPart = () => ({
  key: `${Date.now()}-${Math.random()}`,
  partName: "",
  partCost: "",
  raw: null,
});

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-[13px] text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-violet-200 focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100";

const defaultDelivery = () => {
  const d = new Date();
  d.setDate(d.getDate() + 2);
  return toInputDate(d);
};
const toDateInput = (value) => {
  const dateValue = String(value || "").slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(dateValue) ? dateValue : defaultDelivery();
};

const initial = {
  customerId: "",
  mobile: "",
  name: "",
  whatsappConsent: true,
  device: "",
  brand: "",
  model: "",
  configuration: "",
  condition: "",
  extras: "",
  issues: [],
  notes: "",
  advance: "",
  repairCost: "",
  date: defaultDelivery(),
  sendWhatsapp: true,
  printLabel: true,
};

/* ---------- small pieces ---------- */
function Section({ n, title, hint, icon: Icon, children }) {
  return (
    <section
      style={{ animationDelay: `${80 + n * 70}ms` }}
      className="nj-up rounded-2xl border border-violet-100/80 bg-white p-4 shadow-sm transition duration-300 hover:shadow-md sm:p-5"
    >
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 text-white shadow-md shadow-violet-200 transition duration-300 hover:rotate-6 hover:scale-110">
          <Icon size={17} />
        </div>
        <div className="flex-1">
          <h3 className="text-[15px] font-bold leading-tight text-slate-900">
            {title}
          </h3>
          <p className="text-[11px] text-slate-400">{hint}</p>
        </div>
        <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-bold text-violet-600">
          Step {n} of 5
        </span>
      </div>
      {children}
    </section>
  );
}

function Field({ label, children, className = "" }) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-xs font-bold text-slate-600">
        {label}
      </label>
      {children}
    </div>
  );
}

function Chip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-bold transition duration-200 hover:-translate-y-0.5 active:scale-95 ${
        active
          ? "border-violet-600 bg-violet-600 text-white shadow-md shadow-violet-200"
          : "border-slate-200 bg-white text-slate-600 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700"
      }`}
    >
      {active && <Check size={12} strokeWidth={3} className="nj-pop" />}
      {children}
    </button>
  );
}

function Check2({ checked, onChange, children }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-[13px] text-slate-700">
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`flex h-5 w-5 items-center justify-center rounded-md transition duration-200 active:scale-90 ${
          checked
            ? "bg-violet-600 text-white shadow shadow-violet-200"
            : "border border-slate-300 bg-white"
        }`}
      >
        {checked && <Check size={12} strokeWidth={3.5} className="nj-pop" />}
      </button>
      {children}
    </label>
  );
}

function Barcode({ seed }) {
  const bars = useMemo(() => {
    let s = seed * 9301 + 49297;
    const out = [];
    let x = 0;
    while (x < 330) {
      s = (s * 9301 + 49297) % 233280;
      const w = 1 + Math.floor((s / 233280) * 3);
      s = (s * 9301 + 49297) % 233280;
      const gap = 1 + Math.floor((s / 233280) * 2);
      out.push({ x, w });
      x += w + gap;
    }
    return out;
  }, [seed]);
  return (
    <svg viewBox="0 0 330 42" preserveAspectRatio="none" className="h-8 w-full">
      {bars.map((b, i) => (
        <rect key={i} x={b.x} y={0} width={b.w} height={42} fill="#111" />
      ))}
    </svg>
  );
}

/* ---------- page ---------- */
export default function NewJobs() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const jobId = searchParams.get("jobId");
  const isEditingJob = jobId != null;
  const showToast = useToast();
  const [f, setF] = useState(initial);
  const [jobNumber, setJobNumber] = useState(NEXT_JOB_NO);
  const [jobLoading, setJobLoading] = useState(isEditingJob);
  const [jobLoadError, setJobLoadError] = useState("");
  const [jobRetry, setJobRetry] = useState(0);
  const [jobRecord, setJobRecord] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(true);
  const [customersError, setCustomersError] = useState("");
  const [customersRetry, setCustomersRetry] = useState(0);
  const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false);
  const [customerLookup, setCustomerLookup] = useState({
    loading: false,
    message: "",
  });
  const [productTypes, setProductTypes] = useState([]);
  const [productTypesLoading, setProductTypesLoading] = useState(true);
  const [productTypesError, setProductTypesError] = useState("");
  const [productTypesRetry, setProductTypesRetry] = useState(0);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [saving, setSaving] = useState(false);
  const customerDropdownRef = useRef(null);

  const [parts, setParts] = useState(() => [newPart()]);

  const addPart = () => setParts((current) => [...current, newPart()]);
  const removePart = (key) =>
    setParts((current) =>
      current.length === 1 ? [newPart()] : current.filter((p) => p.key !== key),
    );
  const updatePart = (key, field, value) =>
    setParts((current) =>
      current.map((p) => (p.key === key ? { ...p, [field]: value } : p)),
    );
  const partsTotal = parts.reduce((t, p) => t + Number(p.partCost || 0), 0);
  const totalPartCost = partsTotal;

  useEffect(() => {
    if (!isEditingJob) {
      setJobLoading(false);
      setJobLoadError("");
      setF(initial);
      setParts([newPart()]);
      setJobNumber(NEXT_JOB_NO);
      setJobRecord(null);
      return undefined;
    }

    const controller = new AbortController();
    const fetchJob = async () => {
      setJobLoading(true);
      setJobLoadError("");

      try {
        const response = await getJobById(jobId, { signal: controller.signal });
        if (response?.success !== true || !response.data) {
          throw new Error(
            response?.message || "Unexpected job detail response.",
          );
        }

        const job = response.data;
        setJobRecord(job);
        const technicalProblem = String(job.technicalProblem || "").trim();
        const issueMatches = ISSUES.filter(
          (issue) => issue.toLowerCase() === technicalProblem.toLowerCase(),
        );
        setF((current) => ({
          ...current,
          customerId: String(job.customerId ?? ""),
          mobile: String(job.mobileNo ?? ""),
          name: String(job.customer ?? ""),
          whatsappConsent: Boolean(job.whatsAppNo),
          device: String(job.productId ?? ""),
          brand: String(job.productCompany ?? ""),
          model: String(job.modelDetail ?? ""),
          configuration: String(job.modelConfi ?? ""),
          condition: String(job.modelCondition ?? ""),
          extras: String(job.extraItem ?? ""),
          issues: issueMatches,
          notes: technicalProblem,
          advance: String(job.advance ?? ""),
          repairCost: String(job.repairCost ?? ""),
          date: toDateInput(job.dateOfDelivery),
        }));
        const loadedParts = Array.isArray(job.getJobItems)
          ? job.getJobItems
              .filter((item) => item.isActive !== false)
              .map((item) => ({
                key: `${item.id ?? Math.random()}-${Math.random()}`,
                partName: String(item.partName ?? ""),
                partCost: String(item.partCost ?? ""),
                raw: item,
              }))
          : [];
        setParts(loadedParts.length ? loadedParts : [newPart()]);
        setJobNumber(job.srNo ?? job.id);
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error(
          "Get Job Detail API Error:",
          error.response?.data || error,
        );
        setJobLoadError(
          error.response?.data?.message ||
            error.message ||
            "Unable to load job details. Please try again.",
        );
      } finally {
        if (!controller.signal.aborted) setJobLoading(false);
      }
    };

    fetchJob();
    return () => controller.abort();
  }, [isEditingJob, jobId, jobRetry]);

  useEffect(() => {
    if (isEditingJob || !/^\d{10}$/.test(f.mobile)) {
      setCustomerLookup({ loading: false, message: "" });
      return undefined;
    }

    const controller = new AbortController();
    const lookupCustomer = async () => {
      setCustomerLookup({ loading: true, message: "" });

      try {
        const response = await getCustomerByMobile(f.mobile, {
          signal: controller.signal,
        });
        const rows = Array.isArray(response)
          ? response
          : [
              response?.data,
              response?.data?.data,
              response?.items,
              response?.records,
              response?.result,
              response?.obj,
            ].find(Array.isArray);
        const customer =
          rows?.[0] ||
          response?.data?.data ||
          response?.data ||
          response?.customer ||
          response;
        const customerId =
          customer?.id ??
          customer?.Id ??
          customer?.customerId ??
          customer?.CustomerId;
        const customerName =
          customer?.name ??
          customer?.Name ??
          customer?.customerName ??
          customer?.CustomerName;

        if (
          response?.success === false ||
          customerId == null ||
          customerName == null ||
          String(customerName).trim() === ""
        ) {
          throw new Error(
            response?.message || "No customer found for this mobile number.",
          );
        }

        if (controller.signal.aborted) return;
        setF((current) => ({
          ...current,
          customerId: String(customerId),
          name: String(customerName),
        }));
        setErrors((current) => ({
          ...current,
          customerId: undefined,
          name: undefined,
        }));
        setCustomerLookup({ loading: false, message: "" });
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error(
          "Get Customer By Mobile API Error:",
          error.response?.data || error,
        );
        setCustomerLookup({
          loading: false,
          message:
            error.response?.data?.message ||
            error.response?.data?.title ||
            error.message ||
            "Unable to look up this customer.",
        });
      }
    };

    lookupCustomer();
    return () => controller.abort();
  }, [f.mobile, isEditingJob]);

  useEffect(() => {
    let active = true;

    const fetchCustomers = async () => {
      setCustomersLoading(true);
      setCustomersError("");

      try {
        const response = await getCustomerDropdown();
        const rows = Array.isArray(response)
          ? response
          : [
              response?.data,
              response?.data?.data,
              response?.items,
              response?.records,
              response?.result,
              response?.obj,
            ].find(Array.isArray) ||
            (response &&
            typeof response === "object" &&
            (response.id != null || response.Id != null)
              ? [response]
              : null);

        if (!rows) {
          throw new Error(
            "Customer list response is not in the expected format.",
          );
        }

        const options = rows
          .map((customer) => ({
            id:
              customer.id ??
              customer.Id ??
              customer.customerId ??
              customer.CustomerId,
            name:
              customer.name ??
              customer.Name ??
              customer.customerName ??
              customer.CustomerName,
          }))
          .filter(
            (customer) =>
              customer.id != null &&
              customer.name != null &&
              String(customer.name).trim() !== "",
          );

        if (active) setCustomers(options);
      } catch (error) {
        console.error("Get Customer Dropdown API Error:", error);
        if (active) {
          setCustomers([]);
          setCustomersError(
            error.response?.data?.message ||
              error.response?.data?.title ||
              error.message ||
              "Unable to load customers. Please try again.",
          );
        }
      } finally {
        if (active) setCustomersLoading(false);
      }
    };

    fetchCustomers();
    return () => {
      active = false;
    };
  }, [customersRetry]);

  useEffect(() => {
    let active = true;

    const fetchProductTypes = async () => {
      setProductTypesLoading(true);
      setProductTypesError("");

      try {
        const response = await getProductTypes();
        const rows = Array.isArray(response)
          ? response
          : [
              response?.data,
              response?.data?.data,
              response?.items,
              response?.records,
              response?.result,
              response?.obj,
            ].find(Array.isArray) ||
            (response &&
            typeof response === "object" &&
            (response.id != null ||
              response.Id != null ||
              response.productTypeId != null)
              ? [response]
              : null);

        if (!rows) {
          throw new Error(
            "Product type response is not in the expected format.",
          );
        }

        const options = rows
          .map((product) => ({
            id:
              product.id ??
              product.Id ??
              product.productTypeId ??
              product.ProductTypeId ??
              product.productId ??
              product.ProductId,
            name:
              product.name ??
              product.Name ??
              product.productTypeName ??
              product.ProductTypeName ??
              product.productName ??
              product.ProductName,
          }))
          .filter(
            (product) =>
              product.id != null &&
              product.name != null &&
              String(product.name).trim() !== "",
          );

        if (options.length === 0) {
          throw new Error("No product types are available.");
        }

        if (active) {
          setProductTypes(options);
        }
      } catch (error) {
        console.error("Get Product Types API Error:", error);
        if (active) {
          setProductTypes([]);
          setProductTypesError(
            error.response?.data?.message ||
              error.response?.data?.title ||
              error.message ||
              "Unable to load product types. Please try again.",
          );
        }
      } finally {
        if (active) setProductTypesLoading(false);
      }
    };

    fetchProductTypes();
    return () => {
      active = false;
    };
  }, [productTypesRetry]);

  useEffect(() => {
    if (!customerDropdownOpen) return undefined;

    const closeOnOutsideClick = (event) => {
      if (!customerDropdownRef.current?.contains(event.target)) {
        setCustomerDropdownOpen(false);
      }
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setCustomerDropdownOpen(false);
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [customerDropdownOpen]);

  const set = (k, v) => {
    setF((p) => ({ ...p, [k]: v }));
    if (errors[k]) setErrors((p) => ({ ...p, [k]: undefined }));
  };

  const toggleIssue = (issue) => {
    const nextIssues = f.issues.includes(issue)
      ? f.issues.filter((item) => item !== issue)
      : [...f.issues, issue];
    const currentIssueText = f.issues.join(", ");
    const nextIssueText = nextIssues.join(", ");
    let extraNotes = f.notes;

    if (currentIssueText && extraNotes.startsWith(currentIssueText)) {
      const remainder = extraNotes.slice(currentIssueText.length);
      if (!remainder || remainder.startsWith("\n")) {
        extraNotes = remainder.replace(/^\n/, "");
      }
    }

    setF((current) => ({
      ...current,
      issues: nextIssues,
      notes: [nextIssueText, extraNotes].filter(Boolean).join("\n"),
    }));
    if (errors.issues) {
      setErrors((current) => ({ ...current, issues: undefined }));
    }
  };

  const estimate = Number(f.repairCost || 0) + totalPartCost;
  const balance = Math.max(estimate - Number(f.advance || 0), 0);
  const now = new Date();
  const deliveryDate = f.date ? new Date(f.date + "T00:00:00") : null;
  const deliveryText = deliveryDate ? fmtDate(deliveryDate) : "-";
  const extraText = f.extras.trim().toUpperCase() || "NONE";
  const issueText = f.issues.length ? f.issues.join(", ") : "";
  const selectedProductType = productTypes.find(
    (product) => String(product.id) === String(f.device),
  );
  const productText = [
    selectedProductType?.name?.toUpperCase() || "DEVICE",
    f.brand || "Brand",
  ].join(" · ");

  const receiptLines = [
    `📄 *Job Receipt - ${SHOP.name}*`,
    `🔢 Job No: *${jobNumber}*`,
    `👤 Customer: ${(f.name || "CUSTOMER NAME").toUpperCase()} (${NEXT_CUSTOMER_CODE})`,
    `📦 Product: ${productText}${f.model ? ` ${f.model}` : ""}`,
    `💬 Issue: ${issueText ? issueText.toUpperCase() : "ISSUE"}`,
    `📦 Extra item: ${extraText}`,
    `💳 Advance: ₹${money(f.advance)}`,
    `💰 Total cost: ₹${money(estimate)}`,
    `📅 Estimated delivery: ${deliveryText}`,
    `📍 ${SHOP.address}`,
    `☎️ Office helpline: ${SHOP.helpline}`,
  ];

  const validate = () => {
    const e = {};
    if (!/^\d{10}$/.test(f.mobile)) e.mobile = "Enter a 10 digit mobile number";
    if (!f.customerId) e.customerId = "Select a customer";
    if (!f.name.trim()) e.name = "Customer name is required";
    if (f.device === "") e.device = "Select a product type";
    if (!f.model.trim()) e.model = "Model detail is required";
    if (!f.issues.length && !(isEditingJob && f.notes.trim())) {
      e.issues = "Select at least one issue";
    }
    if (!f.date) e.date = "Select a delivery date";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async (event) => {
    event?.preventDefault();
    setSubmitError("");

    if (isEditingJob && !jobRecord) {
      setSubmitError(
        "Job details are not loaded. Please try loading them again.",
      );
      return;
    }

    if (!validate()) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setSaving(true);
    try {
      const filledParts = parts.filter(
        (part) => part.partName.trim() || Number(part.partCost || 0) > 0,
      );
      const partsToSend = filledParts.length ? filledParts : [newPart()];
      const dateOfDelivery = new Date(`${f.date}T12:00:00`).toISOString();

      const common = {
        srNo: isEditingJob ? Number(jobRecord?.srNo ?? jobNumber) : 0,
        customerId: Number(f.customerId),
        productId: Number(f.device),
        modelConfi: f.configuration,
        modelDetail: f.model,
        modelCondition: f.condition,
        extraItem: f.extras.trim(),
        remark: isEditingJob ? (jobRecord?.remark ?? "") : f.notes,
        totalEstimatedCost: estimate,
        technicalProblem: f.notes,
        repairCost: Number(f.repairCost || 0),
        advance: Number(f.advance || 0),
        balance,
        status: isEditingJob ? Number(jobRecord?.status ?? 0) : 0,
        isActive: 1,
        dateOfDelivery,
      };

      const payload = isEditingJob
        ? {
            id: Number(jobRecord?.id ?? jobId),
            ...common,
            productCompany: f.brand,
            getJobItems: partsToSend.map((part, index) => ({
              id: Number(part.raw?.id ?? 0),
              srNo: index + 1,
              partName: part.partName.trim(),
              partCost: Number(part.partCost || 0),
            })),
          }
        : {
            ...common,
            modalCompany: f.brand,
            getJobItems: partsToSend.map((part, index) => ({
              srNo: index + 1,
              partName: part.partName.trim(),
              partCost: Number(part.partCost || 0),
            })),
          };

      const response = isEditingJob
        ? await updateJob(payload)
        : await createJob(payload);
      if (response?.success === false) {
        throw new Error(
          response.message ||
            `Unable to ${isEditingJob ? "update" : "create"} job.`,
        );
      }

      showToast(
        isEditingJob
          ? "Job updated successfully."
          : "Job created successfully.",
      );

      navigate("/jobs");
    } catch (error) {
      console.error(
        isEditingJob ? "Update Job Error:" : "Create Job Error:",
        error.response?.data || error,
      );
      setSubmitError(
        error.response?.data?.message ||
          error.response?.data?.title ||
          error.message ||
          `Unable to ${
            isEditingJob ? "update" : "create"
          } job. Please try again.`,
      );
    } finally {
      setSaving(false);
    }
  };
  const errCls =
    "nj-err mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-red-600";

  return (
    <div>
      <style>{`
        @keyframes njDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: none; } }
        @keyframes njUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
        @keyframes njLeft { from { opacity: 0; transform: translateX(-14px); } to { opacity: 1; transform: none; } }
        @keyframes njRight { from { opacity: 0; transform: translateX(18px); } to { opacity: 1; transform: none; } }
        @keyframes njDrop { from { opacity: 0; transform: translateY(-6px) scale(.98); } to { opacity: 1; transform: none; } }
        @keyframes njPop { from { opacity: 0; transform: scale(.4); } to { opacity: 1; transform: none; } }
        @keyframes njTick { 0% { transform: scale(1); } 40% { transform: scale(1.12); } 100% { transform: scale(1); } }
        @keyframes njShake { 0%, 100% { transform: translateX(0); } 20% { transform: translateX(-5px); } 40% { transform: translateX(5px); } 60% { transform: translateX(-3px); } 80% { transform: translateX(3px); } }
        .nj-down { animation: njDown .45s cubic-bezier(.2,.8,.2,1) backwards; }
        .nj-up { animation: njUp .5s cubic-bezier(.2,.8,.2,1) backwards; }
        .nj-left { animation: njLeft .35s ease-out backwards; }
        .nj-right { animation: njRight .55s cubic-bezier(.2,.8,.2,1) backwards; }
        .nj-drop { animation: njDrop .18s ease-out backwards; }
        .nj-pop { animation: njPop .3s cubic-bezier(.34,1.56,.64,1) backwards; }
        .nj-tick { animation: njTick .3s ease-out; }
        .nj-err { animation: njShake .35s ease-in-out; }
        @media (prefers-reduced-motion: reduce) {
          .nj-down, .nj-up, .nj-left, .nj-right, .nj-drop, .nj-pop, .nj-tick, .nj-err { animation: none; }
        }
        @media print {
          body * { visibility: hidden !important; }
          #job-label, #job-label * { visibility: visible !important; }
          #job-label { position: fixed; left: 0; top: 0; width: 100mm; }
        }
      `}</style>

      {/* Header */}
      <div className="nj-down mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
            <button
              onClick={() => navigate("/jobs")}
              className="transition hover:text-violet-600"
            >
              Jobs
            </button>
            <ChevronRight size={13} />
            <span className="text-violet-600">
              {isEditingJob ? "Edit job" : "New job"}
            </span>
          </div>
          <h2 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900 sm:text-[28px]">
            {isEditingJob ? `Edit job #${jobNumber}` : "Register a job"}
          </h2>
        </div>
        {!isEditingJob && (
          <div className="flex items-center gap-3">
            <span className="rounded-full border border-violet-100 bg-white px-4 py-2 text-xs text-slate-500">
              Next job{" "}
              <b className="font-bold text-violet-700">#{NEXT_JOB_NO}</b>
            </span>
          </div>
        )}
      </div>

      {jobLoading && (
        <div
          role="status"
          className="nj-down mb-4 rounded-2xl border border-violet-100 bg-white p-4 text-sm font-medium text-violet-600"
        >
          Loading job details...
        </div>
      )}
      {jobLoadError && (
        <div
          role="alert"
          className="nj-down mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700"
        >
          <span>{jobLoadError}</span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setJobRetry((attempt) => attempt + 1)}
              className="font-bold text-violet-700 hover:text-violet-900"
            >
              Retry
            </button>
            <button
              type="button"
              onClick={() => navigate("/jobs")}
              className="font-bold text-slate-600 hover:text-slate-900"
            >
              Back to jobs
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.5fr_1fr]">
        {/* ---------- FORM ---------- */}
        <div className="space-y-4">
          {/* 1 Customer */}
          <Section
            n={1}
            title="Customer"
            hint="Who is dropping the device?"
            icon={User}
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Mobile number">
                <input
                  value={f.mobile}
                  onChange={(e) => {
                    const mobile = e.target.value
                      .replace(/\D/g, "")
                      .slice(0, 10);
                    setF((current) => ({
                      ...current,
                      mobile,
                      customerId:
                        mobile === current.mobile ? current.customerId : "",
                      name: mobile === current.mobile ? current.name : "",
                    }));
                    setErrors((current) => ({
                      ...current,
                      mobile: undefined,
                      customerId: undefined,
                      name: undefined,
                    }));
                  }}
                  inputMode="numeric"
                  placeholder="10 digit number"
                  className={inputCls}
                />
                {customerLookup.loading && (
                  <p className="mt-1.5 animate-pulse text-[11px] text-slate-500">
                    Looking up customer...
                  </p>
                )}
                {errors.mobile && (
                  <p className={errCls}>
                    <AlertCircle size={12} /> {errors.mobile}
                  </p>
                )}
                {customerLookup.message && (
                  <p className="nj-down mt-1.5 text-[11px] text-amber-700">
                    {customerLookup.message}
                  </p>
                )}
              </Field>
              <Field label="Customer name">
                <div ref={customerDropdownRef} className="relative min-w-0">
                  <button
                    type="button"
                    aria-haspopup="listbox"
                    aria-expanded={customerDropdownOpen}
                    disabled={customersLoading || Boolean(customersError)}
                    onClick={() => setCustomerDropdownOpen((isOpen) => !isOpen)}
                    className={`${inputCls} flex cursor-pointer items-center justify-between gap-2 text-left disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    <span
                      className={`min-w-0 truncate ${
                        f.name ? "text-slate-800" : "text-slate-400"
                      }`}
                    >
                      {customersLoading
                        ? "Loading customers..."
                        : f.name || "Select customer"}
                    </span>
                    <ChevronDown
                      size={16}
                      className={`shrink-0 text-slate-400 transition-transform duration-200 ${
                        customerDropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {customerDropdownOpen && (
                    <div
                      role="listbox"
                      aria-label="Customers"
                      className="nj-drop absolute left-0 right-0 top-full z-30 mt-1 max-h-60 w-full min-w-0 origin-top overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl shadow-slate-900/10"
                    >
                      <button
                        type="button"
                        role="option"
                        aria-selected={!f.customerId}
                        onClick={() => {
                          setF((previous) => ({
                            ...previous,
                            customerId: "",
                            name: "",
                          }));
                          setCustomerDropdownOpen(false);
                        }}
                        title="Select customer"
                        className="block w-full truncate rounded-lg px-3 py-2 text-left text-sm text-slate-500 transition hover:bg-violet-50"
                      >
                        Select customer
                      </button>
                      {customers.map((customer) => {
                        const selected =
                          String(customer.id) === String(f.customerId);
                        return (
                          <button
                            key={customer.id}
                            type="button"
                            role="option"
                            aria-selected={selected}
                            onClick={() => {
                              setF((previous) => ({
                                ...previous,
                                customerId: String(customer.id),
                                name: customer.name,
                              }));
                              setCustomerDropdownOpen(false);
                              if (errors.name || errors.customerId) {
                                setErrors((previous) => ({
                                  ...previous,
                                  name: undefined,
                                  customerId: undefined,
                                }));
                              }
                            }}
                            title={customer.name}
                            className={`block w-full truncate rounded-lg px-3 py-2 text-left text-sm transition hover:bg-violet-50 ${
                              selected
                                ? "bg-violet-50 font-semibold text-violet-700"
                                : "text-slate-700"
                            }`}
                          >
                            {customer.name}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
                {errors.customerId && (
                  <p className={errCls}>
                    <AlertCircle size={12} /> {errors.customerId}
                  </p>
                )}
                {errors.name && (
                  <p className={errCls}>
                    <AlertCircle size={12} /> {errors.name}
                  </p>
                )}
                {customersError && (
                  <div className="nj-down mt-1.5 flex items-center justify-between gap-2 text-[11px] text-red-600">
                    <span>{customersError}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setCustomersRetry((attempt) => attempt + 1)
                      }
                      className="shrink-0 font-bold text-violet-600 hover:text-violet-800"
                    >
                      Retry
                    </button>
                  </div>
                )}
              </Field>
            </div>

            <div className="mt-4 rounded-xl bg-emerald-50/60 px-3.5 py-2.5">
              <Check2
                checked={f.whatsappConsent}
                onChange={(v) => set("whatsappConsent", v)}
              >
                Customer agrees to receive job updates on WhatsApp
              </Check2>
            </div>
          </Section>

          {/* 2 Device */}
          <Section
            n={2}
            title="Device"
            hint="What are we repairing?"
            icon={Laptop}
          >
            <Field label="Product type">
              <div className="relative">
                <select
                  value={f.device}
                  onChange={(event) => set("device", event.target.value)}
                  disabled={productTypesLoading || Boolean(productTypesError)}
                  className={`${inputCls} cursor-pointer appearance-none pr-10 disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  <option value="">
                    {productTypesLoading
                      ? "Loading product types..."
                      : "Select product type"}
                  </option>
                  {productTypes.map((product) => (
                    <option key={product.id} value={String(product.id)}>
                      {product.name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={16}
                  className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>
              {errors.device && (
                <p className={errCls}>
                  <AlertCircle size={12} /> {errors.device}
                </p>
              )}
            </Field>
            {productTypesError && (
              <div className="nj-down mt-2 flex items-center justify-between gap-3 text-xs text-red-600">
                <span>{productTypesError}</span>
                <button
                  type="button"
                  onClick={() => setProductTypesRetry((attempt) => attempt + 1)}
                  className="shrink-0 font-bold text-violet-600 hover:text-violet-800"
                >
                  Retry
                </button>
              </div>
            )}
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Field label="Brand name">
                <input
                  value={f.brand}
                  onChange={(e) => set("brand", e.target.value)}
                  placeholder="Enter brand name"
                  className={inputCls}
                />
              </Field>
              <Field label="Model detail *">
                <input
                  value={f.model}
                  onChange={(e) => set("model", e.target.value)}
                  placeholder="Enter model detail"
                  className={inputCls}
                />
                {errors.model && (
                  <p className={errCls}>
                    <AlertCircle size={12} /> {errors.model}
                  </p>
                )}
              </Field>
              <Field label="Configuration">
                <input
                  value={f.configuration}
                  onChange={(e) => set("configuration", e.target.value)}
                  placeholder="Enter configuration"
                  className={inputCls}
                />
              </Field>
              <Field label="Condition of product">
                <input
                  value={f.condition}
                  onChange={(e) => set("condition", e.target.value)}
                  placeholder="Enter product condition"
                  className={inputCls}
                />
              </Field>
            </div>
            <Field label="Extra items received" className="mt-4">
              <input
                value={f.extras}
                onChange={(event) => set("extras", event.target.value)}
                placeholder="Enter extra items received (e.g. Charger, Bag)"
                className={inputCls}
              />
            </Field>
          </Section>

          {/* 3 Issue */}
          <Section
            n={3}
            title="Issue"
            hint="Pick one or more problems"
            icon={Wrench}
          >
            <div className="flex flex-wrap gap-2">
              {ISSUES.map((i) => (
                <Chip
                  key={i}
                  active={f.issues.includes(i)}
                  onClick={() => toggleIssue(i)}
                >
                  {i}
                </Chip>
              ))}
            </div>
            {errors.issues && (
              <p className={errCls}>
                <AlertCircle size={12} /> {errors.issues}
              </p>
            )}
            <Field label="Notes for the technician" className="mt-4">
              <textarea
                value={f.notes}
                onChange={(e) => set("notes", e.target.value)}
                rows={3}
                placeholder="Anything the customer mentioned, marks on the body, password if shared"
                className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-[13px] text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-violet-200 focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
              />
            </Field>
          </Section>

          {/* 4 Job Parts */}
          <Section
            n={4}
            title="Job Parts"
            hint="Parts used for this repair"
            icon={Puzzle}
          >
            <div className="border-t border-slate-100 pt-4">
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
                  <h4 className="text-sm font-bold text-slate-800">
                    Parts List
                  </h4>
                  <button
                    type="button"
                    onClick={addPart}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-2 text-xs font-bold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-emerald-600 hover:shadow-md hover:shadow-emerald-200 active:scale-95"
                  >
                    <Plus size={15} />
                    Add Part
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <div className="min-w-[560px]">
                    <div className="grid grid-cols-[90px_minmax(150px,1fr)_minmax(175px,1fr)_90px] items-center gap-3 bg-slate-50 px-3 py-2.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                      <span>Serial no.</span>
                      <span>Part name</span>
                      <span>Part cost</span>
                      <span className="text-center">Action</span>
                    </div>

                    <div className="space-y-2 p-3">
                      {parts.map((part, index) => (
                        <div
                          key={part.key}
                          className="nj-left grid grid-cols-[90px_minmax(150px,1fr)_minmax(175px,1fr)_90px] items-center gap-3 rounded-xl border border-slate-200 p-2 transition-colors hover:border-violet-200 hover:bg-violet-50/30"
                        >
                          <span className="inline-flex h-8 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500 text-xs font-bold text-white shadow-sm">
                            {index + 1}
                          </span>
                          <input
                            value={part.partName}
                            onChange={(event) =>
                              updatePart(
                                part.key,
                                "partName",
                                event.target.value,
                              )
                            }
                            placeholder="Enter part name"
                            className={inputCls}
                          />
                          <div className="flex min-w-0">
                            <span className="flex items-center rounded-l-xl border border-r-0 border-slate-200 bg-slate-100 px-3 text-sm font-semibold text-slate-600">
                              ₹
                            </span>
                            <input
                              value={part.partCost}
                              onChange={(event) =>
                                updatePart(
                                  part.key,
                                  "partCost",
                                  event.target.value.replace(/\D/g, ""),
                                )
                              }
                              inputMode="numeric"
                              placeholder="Enter part cost"
                              className={`${inputCls} min-w-0 rounded-l-none`}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removePart(part.key)}
                            aria-label={`Remove part ${index + 1}`}
                            title="Remove part"
                            className="mx-auto flex h-9 w-9 items-center justify-center rounded-lg text-red-500 transition duration-200 hover:bg-red-50 hover:text-red-600 active:scale-90"
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between rounded-xl bg-violet-50 px-4 py-3 text-sm">
                <span className="font-semibold text-violet-800">
                  Total part cost
                </span>
                <b
                  key={totalPartCost}
                  className="nj-tick inline-block text-base font-bold text-violet-900"
                >
                  ₹{totalPartCost.toLocaleString("en-IN")}
                </b>
              </div>
            </div>
          </Section>

          {/* 5 Money */}
          <Section
            n={5}
            title="Money and delivery"
            hint="Estimate, advance and pickup time"
            icon={IndianRupee}
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Field label="Estimate (₹)">
                <div className="flex">
                  <span className="flex items-center rounded-l-xl border border-r-0 border-slate-200 bg-slate-100 px-3 text-sm font-semibold text-slate-600">
                    ₹
                  </span>
                  <input
                    value={estimate.toFixed(2)}
                    readOnly
                    aria-label="Total estimated cost"
                    className={`${inputCls} cursor-not-allowed rounded-l-none bg-slate-100`}
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  Repair cost plus total part cost
                </p>
              </Field>
              <Field label="Advance amount (₹)">
                <div className="flex">
                  <span className="flex items-center rounded-l-xl border border-r-0 border-slate-200 bg-slate-100 px-3 text-sm font-semibold text-slate-600">
                    ₹
                  </span>
                  <input
                    value={f.advance}
                    onChange={(e) =>
                      set("advance", e.target.value.replace(/\D/g, ""))
                    }
                    inputMode="numeric"
                    placeholder="0"
                    className={`${inputCls} rounded-l-none`}
                  />
                </div>
              </Field>
              <Field label="Balance amount (₹)">
                <div className="flex">
                  <span className="flex items-center rounded-l-xl border border-r-0 border-slate-200 bg-slate-100 px-3 text-sm font-semibold text-slate-600">
                    ₹
                  </span>
                  <input
                    value={balance.toFixed(2)}
                    readOnly
                    aria-label="Balance amount"
                    className={`${inputCls} cursor-not-allowed rounded-l-none bg-slate-100`}
                  />
                </div>
              </Field>
              <Field label="Repair cost (₹)">
                <div className="flex">
                  <span className="flex items-center rounded-l-xl border border-r-0 border-slate-200 bg-slate-100 px-3 text-sm font-semibold text-slate-600">
                    ₹
                  </span>
                  <input
                    value={f.repairCost}
                    onChange={(e) =>
                      set("repairCost", e.target.value.replace(/\D/g, ""))
                    }
                    inputMode="numeric"
                    placeholder="0"
                    className={`${inputCls} rounded-l-none`}
                  />
                </div>
              </Field>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3">
              <Field label="Estimate date">
                <input
                  type="date"
                  value={f.date}
                  onChange={(e) => set("date", e.target.value)}
                  className={inputCls}
                />
                {errors.date && (
                  <p className={errCls}>
                    <AlertCircle size={12} /> {errors.date}
                  </p>
                )}
              </Field>
            </div>

            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2.5 rounded-xl bg-slate-50 px-3.5 py-2.5">
              <Check2
                checked={f.sendWhatsapp}
                onChange={(v) => set("sendWhatsapp", v)}
              >
                Send receipt on WhatsApp
              </Check2>
              <Check2
                checked={f.printLabel}
                onChange={(v) => set("printLabel", v)}
              >
                Print label
              </Check2>
            </div>
          </Section>

          {/* Actions */}
          {submitError && (
            <p
              role="alert"
              className="nj-err rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600"
            >
              {submitError}
            </p>
          )}
          <div
            style={{ animationDelay: "500ms" }}
            className="nj-up flex flex-wrap items-center gap-2.5 pb-2"
          >
            <button
              type="button"
              onClick={() => navigate("/jobs")}
              className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-600 transition duration-200 hover:-translate-y-0.5 hover:bg-slate-50 active:scale-95"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-full bg-violet-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-violet-200 transition duration-200 hover:-translate-y-0.5 hover:bg-violet-700 hover:shadow-xl active:scale-95 disabled:opacity-70 disabled:hover:translate-y-0"
            >
              {saving
                ? isEditingJob
                  ? "Updating..."
                  : "Saving..."
                : isEditingJob
                  ? "Update job"
                  : "Submit"}
            </button>
          </div>
        </div>

        {/* ---------- LIVE PREVIEW ---------- */}
        <aside
          style={{ animationDelay: "250ms" }}
          className="nj-right space-y-4 xl:sticky xl:top-6 xl:self-start"
        >
          <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[1.5px] text-slate-500">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
            Live preview
          </p>

          {/* Label */}
          <section className="rounded-2xl border border-violet-100/80 bg-white p-4 shadow-sm transition duration-300 hover:shadow-md">
            <h3 className="text-sm font-bold text-slate-900">Printed label</h3>
            <div
              id="job-label"
              className="mt-3 rounded-xl border-2 border-slate-900 bg-white p-3 text-slate-900"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-900 text-xs font-bold text-white">
                  SB
                </div>
                <p className="text-[12px] font-bold uppercase leading-tight">
                  {SHOP.name}
                </p>
              </div>
              <div className="mt-2.5 bg-slate-900 py-1 text-center text-[9px] font-bold uppercase tracking-wide text-white">
                Experts in repair and service
              </div>
              <dl className="mt-2.5 space-y-0.5 text-[11px]">
                {[
                  ["Job no.", jobNumber, true],
                  ["Date", fmtDate(now)],
                  ["Customer", f.name || "-"],
                  ["Contact", f.mobile || "-"],
                  ["Issue", issueText || "-"],
                  ["Extra item", extraText],
                  ["Amount", money(estimate), true],
                ].map(([k, v, bold]) => (
                  <div key={k} className="flex gap-2">
                    <dt className="w-[64px] shrink-0 font-bold">{k}</dt>
                    <dd className={bold ? "font-bold" : ""}>{v}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-2.5 border-t border-slate-700 pt-2">
                <div className="flex items-center gap-2.5">
                  <div className="flex-1">
                    <Barcode seed={Number(jobNumber) || NEXT_JOB_NO} />
                  </div>
                  <div className="text-right text-[10px] font-semibold leading-tight">
                    {SHOP.phones.map((p) => (
                      <p key={p}>{p}</p>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-2 rounded-full bg-slate-900 py-1 text-center text-[9px] font-bold text-white">
                {SHOP.address}
              </div>
            </div>
          </section>

          {/* WhatsApp */}
          <section className="overflow-hidden rounded-2xl shadow-sm transition duration-300 hover:shadow-md">
            <div className="flex items-center gap-2.5 bg-[#1f6f5a] px-4 py-3 text-white">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[10px] font-bold text-[#1f6f5a]">
                SB
              </div>
              <div>
                <p className="text-xs font-bold leading-tight">{SHOP.name}</p>
                <p className="text-[10px] text-emerald-100">Business account</p>
              </div>
            </div>
            <div className="bg-[#ece8e1] p-3.5">
              <div
                style={{ animationDelay: "600ms" }}
                className="nj-pop max-w-[94%] origin-top-left rounded-xl rounded-tl-sm bg-[#d9fdd3] px-3 py-2 text-[11.5px] leading-[1.15rem] text-slate-900 shadow-sm"
              >
                {receiptLines.map((line, i) => (
                  <p key={i}>{line.replace(/\*/g, "")}</p>
                ))}
                <p className="mt-0.5 text-right text-[10px] text-slate-500">
                  {now.toLocaleTimeString("en-IN", {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          </section>

          <p className="text-[11px] text-slate-400">
            Preview updates as the form changes. Sample data for demonstration.
          </p>
        </aside>
      </div>
    </div>
  );
}
