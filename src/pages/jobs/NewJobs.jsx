import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ChevronRight,
  ChevronDown,
  Check,
  Sparkles,
  Printer,
  AlertCircle,
  User,
  Laptop,
  Wrench,
  IndianRupee,
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

const EXTRAS = ["Charger", "Bag", "Battery", "Mouse", "None"];
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
  extras: ["None"],
  issues: [],
  notes: "",
  estimate: "",
  advance: "",
  partCost: "",
  date: defaultDelivery(),
  sendWhatsapp: true,
  printLabel: true,
};

/* ---------- small pieces ---------- */
function Section({ n, title, hint, icon: Icon, children }) {
  return (
    <section className="rounded-2xl border border-violet-100/80 bg-white p-4 shadow-sm transition hover:shadow-md sm:p-5">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 text-white shadow-md shadow-violet-200">
          <Icon size={17} />
        </div>
        <div className="flex-1">
          <h3 className="text-[15px] font-bold leading-tight text-slate-900">
            {title}
          </h3>
          <p className="text-[11px] text-slate-400">{hint}</p>
        </div>
        <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-bold text-violet-600">
          Step {n} of 4
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
      className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-bold transition ${
        active
          ? "border-violet-600 bg-violet-600 text-white shadow-md shadow-violet-200"
          : "border-slate-200 bg-white text-slate-600 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700"
      }`}
    >
      {active && <Check size={12} strokeWidth={3} />}
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
        className={`flex h-5 w-5 items-center justify-center rounded-md transition ${
          checked
            ? "bg-violet-600 text-white shadow shadow-violet-200"
            : "border border-slate-300 bg-white"
        }`}
      >
        {checked && <Check size={12} strokeWidth={3.5} />}
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

  useEffect(() => {
    if (!isEditingJob) {
      setJobLoading(false);
      setJobLoadError("");
      setF(initial);
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
        const technicalProblem = String(job.technicalProblem || "");
        const issueMatches = ISSUES.filter(
          (issue) =>
            issue.toLowerCase() === technicalProblem.trim().toLowerCase(),
        );
        const extras = String(job.extraItem || "")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);

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
          extras: extras.length ? extras : ["None"],
          issues: issueMatches,
          notes: technicalProblem,
          estimate: String(job.totalEstimatedCost ?? ""),
          advance: String(job.advance ?? ""),
          partCost: String(
            job.repairCost ??
              job.partCost ??
              job.getJobItems?.[0]?.partCost ??
              "",
          ),
          date: toDateInput(job.dateOfDelivery),
        }));
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

  const toggleExtra = (x) => {
    if (x === "None") return set("extras", ["None"]);
    const base = f.extras.filter((e) => e !== "None");
    set(
      "extras",
      base.includes(x) ? base.filter((e) => e !== x) : [...base, x],
    );
  };
  const toggleIssue = (x) =>
    set(
      "issues",
      f.issues.includes(x) ? f.issues.filter((i) => i !== x) : [...f.issues, x],
    );

  const balance = Math.max(Number(f.estimate || 0) - Number(f.advance || 0), 0);
  const now = new Date();
  const deliveryDate = f.date ? new Date(f.date + "T00:00:00") : null;
  const deliveryText = deliveryDate ? fmtDate(deliveryDate) : "-";
  const extraText = f.extras.length
    ? f.extras.join(", ").toUpperCase()
    : "NONE";
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
    `💰 Total cost: ₹${money(f.estimate)}`,
    `📅 Estimated delivery: ${deliveryText}`,
    `📍 ${SHOP.address}`,
    `☎️ Office helpline: ${SHOP.helpline}`,
  ];

  const fillSample = () =>
    setF({
      ...initial,
      mobile: "9812345678",
      name: "Rahul Sharma",
      device: productTypes[0] ? String(productTypes[0].id) : "",
      brand: "HP",
      model: "15s",
      configuration: "8GB RAM, 256GB SSD",
      condition: "Screen flickers, scratch on the lid",
      extras: ["Charger"],
      issues: ["No display"],
      notes: "Screen flickers, scratch on the lid.",
      estimate: "1500",
      advance: "500",
      partCost: "900",
    });

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
      const payload = isEditingJob
        ? {
            ...jobRecord,
            id: Number(jobRecord?.id ?? jobId),
            srNo: Number(jobRecord?.srNo ?? jobNumber),
            customerId: Number(f.customerId),
            customer: f.name,
            mobileNo: f.mobile,
            productName:
              selectedProductType?.name?.toUpperCase() ??
              jobRecord?.productName ??
              "",
            productCompany: f.brand,
            productId: Number(f.device),
            modelConfi: f.configuration,
            modelDetail: f.model,
            modelCondition: f.condition,
            extraItem: f.extras.filter((item) => item !== "None").join(", "),
            remark: jobRecord?.remark ?? "",
            technicalProblem: f.notes,
            totalEstimatedCost: Number(f.estimate || 0),
            repairCost: Number(f.partCost || 0),
            partCost: Number(f.partCost || 0),
            advance: Number(f.advance || 0),
            balance,
            dateOfDelivery: new Date(`${f.date}T12:00:00`).toISOString(),
            getJobItems: jobRecord?.getJobItems?.length
              ? jobRecord.getJobItems.map((item, index) =>
                  index === 0
                    ? {
                        ...item,
                        jobProfileId: Number(jobRecord?.id ?? jobId),
                        technicalProblem: f.notes,
                        repairEstimatedCost: Number(f.partCost || 0),
                        partCost: Number(f.partCost || 0),
                      }
                    : item,
                )
              : [
                  {
                    id: 0,
                    jobProfileId: Number(jobRecord?.id ?? jobId),
                    isActive: true,
                    srNo: 1,
                    technicalProblem: f.notes,
                    partNumber: "",
                    partName: "",
                    jobQRPath: "",
                    customerView: f.notes,
                    repairEstimatedCost: Number(f.partCost || 0),
                    partCost: Number(f.partCost || 0),
                  },
                ],
          }
        : {
            srNo: 0,
            customerId: Number(f.customerId),
            productId: Number(f.device),
            modelConfi: f.configuration,
            modelDetail: f.model,
            modelCondition: f.condition,
            modalCompany: f.brand,
            extraItem: f.extras.join(", "),
            remark: f.notes,
            totalEstimatedCost: Number(f.estimate || 0),
            technicalProblem: f.notes,
            repairCost: Number(f.partCost || 0),
            advance: Number(f.advance || 0),
            balance,
            status: 0,
            isActive: 1,
            dateOfDelivery: f.date,
            getJobItems: [
              {
                srNo: 0,
                partName: "",
                partCost: Number(f.partCost || 0),
              },
            ],
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

      if (!isEditingJob && f.sendWhatsapp && f.whatsappConsent) {
        const text = encodeURIComponent(receiptLines.join("\n"));
        window.open(`https://wa.me/91${f.mobile}?text=${text}`, "_blank");
      }
      if (!isEditingJob && f.printLabel) {
        window.print();
      }
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
    "mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-red-600";

  return (
    <div>
      {/* print only the label */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #job-label, #job-label * { visibility: visible !important; }
          #job-label { position: fixed; left: 0; top: 0; width: 100mm; }
        }
      `}</style>

      {/* Header */}
      <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
            <button
              onClick={() => navigate("/jobs")}
              className="hover:text-violet-600"
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
            <button
              type="button"
              onClick={fillSample}
              className="flex items-center gap-1.5 rounded-full bg-violet-50 px-4 py-2 text-xs font-bold text-violet-700 transition hover:bg-violet-100"
            >
              <Sparkles size={14} /> Fill sample
            </button>
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
          className="mb-4 rounded-2xl border border-violet-100 bg-white p-4 text-sm font-medium text-violet-600"
        >
          Loading job details...
        </div>
      )}
      {jobLoadError && (
        <div
          role="alert"
          className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700"
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
                  <p className="mt-1.5 text-[11px] text-slate-500">
                    Looking up customer...
                  </p>
                )}
                {errors.mobile && (
                  <p className={errCls}>
                    <AlertCircle size={12} /> {errors.mobile}
                  </p>
                )}
                {customerLookup.message && (
                  <p className="mt-1.5 text-[11px] text-amber-700">
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
                      className={`shrink-0 text-slate-400 transition-transform ${
                        customerDropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {customerDropdownOpen && (
                    <div
                      role="listbox"
                      aria-label="Customers"
                      className="absolute left-0 right-0 top-full z-30 mt-1 max-h-60 w-full min-w-0 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl shadow-slate-900/10"
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
                  <div className="mt-1.5 flex items-center justify-between gap-2 text-[11px] text-red-600">
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
              <div className="mt-2 flex items-center justify-between gap-3 text-xs text-red-600">
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
              <div className="flex flex-wrap gap-2">
                {EXTRAS.map((x) => (
                  <Chip
                    key={x}
                    active={f.extras.includes(x)}
                    onClick={() => toggleExtra(x)}
                  >
                    {x}
                  </Chip>
                ))}
              </div>
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

          {/* 4 Money */}
          <Section
            n={4}
            title="Money and delivery"
            hint="Estimate, advance and pickup time"
            icon={IndianRupee}
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Field label="Estimate (₹)">
                <input
                  value={f.estimate}
                  onChange={(e) =>
                    set("estimate", e.target.value.replace(/\D/g, ""))
                  }
                  inputMode="numeric"
                  placeholder="e.g. 1500"
                  className={inputCls}
                />
              </Field>
              <Field label="Advance paid (₹)">
                <input
                  value={f.advance}
                  onChange={(e) =>
                    set("advance", e.target.value.replace(/\D/g, ""))
                  }
                  inputMode="numeric"
                  placeholder="0"
                  className={inputCls}
                />
              </Field>
              <Field label="Part cost (₹)">
                <input
                  value={f.partCost}
                  onChange={(e) =>
                    set("partCost", e.target.value.replace(/\D/g, ""))
                  }
                  inputMode="numeric"
                  placeholder="0"
                  className={inputCls}
                />
              </Field>
            </div>

            <div className="mt-3 flex items-center justify-between rounded-xl bg-gradient-to-r from-violet-600 to-indigo-500 px-4 py-3 text-white shadow-md shadow-violet-200">
              <span className="text-xs font-semibold text-violet-100">
                Balance due
              </span>
              <b className="text-xl font-bold">
                ₹{balance.toLocaleString("en-IN")}
              </b>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3">
              <Field label="Estimate date">
                <input
                  type="date"
                  value={f.date}
                  onChange={(e) => set("date", e.target.value)}
                  className={inputCls}
                />
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
              className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600"
            >
              {submitError}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2.5 pb-2">
            <button
              type="button"
              onClick={() => navigate("/jobs")}
              className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 rounded-full bg-violet-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-violet-200 transition hover:-translate-y-0.5 hover:bg-violet-700 disabled:opacity-70 disabled:hover:translate-y-0"
            >
              <Printer size={15} />
              {saving
                ? isEditingJob
                  ? "Updating..."
                  : "Saving..."
                : isEditingJob
                  ? "Update job"
                  : "Save, print and send"}
            </button>
          </div>
        </div>

        {/* ---------- LIVE PREVIEW ---------- */}
        <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
          <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[1.5px] text-slate-500">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
            Live preview
          </p>

          {/* Label */}
          <section className="rounded-2xl border border-violet-100/80 bg-white p-4 shadow-sm">
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
                  ["Amount", money(f.estimate), true],
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
          <section className="overflow-hidden rounded-2xl shadow-sm">
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
              <div className="max-w-[94%] rounded-xl rounded-tl-sm bg-[#d9fdd3] px-3 py-2 text-[11.5px] leading-[1.15rem] text-slate-900 shadow-sm">
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
