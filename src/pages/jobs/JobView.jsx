import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Laptop,
  X,
  Loader2,
  RefreshCw,
  Calendar,
  Clock,
  Hash,
  User,
  Phone,
  MessageCircle,
  Mail,
  IndianRupee,
  Wallet,
  ShieldCheck,
  ClipboardList,
  MessageSquare,
  Layers,
  Eye,
  Pencil,
  Tag,
  Star,
  Trash2,
  Printer,
  Barcode,
  Receipt,
} from "lucide-react";
import ConfirmDialog from "../../components/ConfirmDialog";
import {
  getJobById,
  deleteJob,
  toggleFavouriteCustomerFromJob,
  printLabelSheet,
  printJobSheet,
} from "../../services/JobService";
import { useToast } from "../../context/ToastContext";

/* ---------- helpers ---------- */
const jobNo = (n) => (/^\d+$/.test(String(n)) ? `#${n}` : String(n ?? "—"));
const money = (n) =>
  `₹${Number(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
const dash = (v) =>
  v === null || v === undefined || String(v).trim() === "" ? "—" : String(v);

const fmtDate = (value, withTime = false) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(withTime && { hour: "2-digit", minute: "2-digit", hour12: true }),
  });
};

/* stagger helper: delay in ms */
const dly = (ms) => ({ animationDelay: `${ms}ms` });

const printPdfBlob = (pdfBlob) =>
  new Promise((resolve) => {
    const url = window.URL.createObjectURL(
      new Blob([pdfBlob], { type: "application/pdf" }),
    );
    const iframe = document.createElement("iframe");
    iframe.style.cssText =
      "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
    iframe.src = url;
    iframe.onload = () => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (err) {
        window.open(url, "_blank");
      }
      setTimeout(() => {
        iframe.remove();
        window.URL.revokeObjectURL(url);
      }, 60000);
      resolve();
    };
    document.body.appendChild(iframe);
  });

/* ---------- small pieces ---------- */
function Section({ icon: Icon, title, children, className = "", delay = 0 }) {
  return (
    <section
      style={dly(delay)}
      className={`jv-up overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-md ${className}`}
    >
      <div className="flex items-center gap-2.5 bg-violet-50 px-3 py-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-600 text-white">
          <Icon size={16} />
        </span>
        <h3 className="text-[15px] font-bold text-violet-900">{title}</h3>
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function Row({ icon: Icon, label, value, valueClass = "" }) {
  return (
    <div className="flex items-center gap-3 border-b border-slate-100 py-2.5 transition-colors last:border-0 hover:bg-violet-50/40">
      {Icon && <Icon size={16} className="shrink-0 text-violet-500" />}
      <span className="w-40 shrink-0 text-[13px] font-semibold text-slate-800">
        {label}
      </span>
      <span
        className={`min-w-0 break-words text-[13px] text-slate-700 ${valueClass}`}
      >
        {value}
      </span>
    </div>
  );
}

function CostRow({ icon: Icon, label, value, tone = "", delay = 0 }) {
  return (
    <div
      style={dly(delay)}
      className={`jv-left flex items-center justify-between rounded-lg px-2.5 py-2 text-[13px] transition-colors hover:bg-violet-50 ${tone}`}
    >
      <span className="flex items-center gap-2 font-semibold text-slate-800">
        <Icon size={15} className="text-violet-600" />
        {label}
      </span>
      <span className="font-bold text-slate-800">{value}</span>
    </div>
  );
}

function RoundBtn({ title, onClick, children, tone = "violet" }) {
  const tones = {
    violet:
      "border-violet-100 text-violet-600 hover:bg-violet-600 hover:text-white",
    amber: "border-amber-100 text-amber-500 hover:bg-amber-50",
    red: "border-rose-100 text-rose-600 hover:bg-rose-50",
  };
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className={`flex h-11 w-11 items-center justify-center rounded-full border bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg active:scale-90 ${tones[tone]}`}
    >
      {children}
    </button>
  );
}

/* ---------- page ---------- */
export default function JobView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const showToast = useToast();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [printing, setPrinting] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await getJobById(id, { signal: controller.signal });
        if (!active) return;
        if (response?.success !== true || !response.data) {
          throw new Error(response?.message || "Unable to load job details.");
        }
        setJob(response.data);
        setIsFavorite(
          response.data.isFavourite === true || response.data.isFavourite === 1,
        );
      } catch (err) {
        if (err.name === "CanceledError" || err.code === "ERR_CANCELED") return;
        console.error("Get Job Detail API Error:", err.response?.data || err);
        if (active) {
          setError(
            err.response?.data?.message ||
              err.response?.data?.title ||
              err.message ||
              "Unable to load job details. Please try again.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
      controller.abort();
    };
  }, [id, retry]);

  const close = () => navigate("/jobs");

  const handlePrintLabel = async () => {
    try {
      setPrinting("label");
      await printPdfBlob(await printLabelSheet(id));
    } catch (err) {
      console.error("Print Label Error:", err);
      showToast("Unable to print label sheet.");
    } finally {
      setPrinting("");
    }
  };

  const handlePrintJobSheet = async () => {
    try {
      setPrinting("sheet");
      await printPdfBlob(await printJobSheet(id));
    } catch (err) {
      console.error("Print Job Sheet Error:", err);
      showToast("Unable to print job sheet.");
    } finally {
      setPrinting("");
    }
  };

  const handleFavourite = async () => {
    try {
      const response = await toggleFavouriteCustomerFromJob(
        job.id,
        job.customerId,
      );
      if (response?.success === false) {
        throw new Error(response.message || "Unable to update favourite.");
      }
      setIsFavorite((v) => !v);
      showToast(
        isFavorite
          ? "Customer removed from favourites."
          : "Customer added to favourites.",
      );
    } catch (err) {
      console.error("Favourite API Error:", err);
      showToast(
        err.response?.data?.message ||
          err.message ||
          "Unable to update favourite.",
      );
    }
  };

  const confirmDeleteJob = async () => {
    if (deleting) return;
    try {
      setDeleting(true);
      setDeleteError("");
      const response = await deleteJob(job.id);
      if (response?.success === false) {
        throw new Error(response.message || "Unable to delete job.");
      }
      showToast("Job deleted successfully.");
      navigate("/jobs");
    } catch (err) {
      console.error("Delete Job API Error:", err);
      setDeleteError(
        err.response?.data?.message ||
          err.response?.data?.title ||
          err.message ||
          "Unable to delete job. Please try again.",
      );
    } finally {
      setDeleting(false);
    }
  };

  /* ---------- motion styles ---------- */
  const motionStyles = (
    <style>{`
      @keyframes jvPop { from { opacity: 0; transform: translateY(18px) scale(.985); } to { opacity: 1; transform: translateY(0) scale(1); } }
      @keyframes jvUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes jvLeft { from { opacity: 0; transform: translateX(-12px); } to { opacity: 1; transform: translateX(0); } }
      @keyframes jvZoom { from { opacity: 0; transform: scale(.5); } to { opacity: 1; transform: scale(1); } }
      @keyframes jvFade { from { opacity: 0; } to { opacity: 1; } }
      @keyframes jvPulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.7); opacity: .45; } }
      .jv-pop { animation: jvPop .45s cubic-bezier(.2,.8,.2,1) both; }
      .jv-up { opacity: 0; animation: jvUp .5s cubic-bezier(.2,.8,.2,1) forwards; }
      .jv-left { opacity: 0; animation: jvLeft .45s ease-out forwards; }
      .jv-zoom { opacity: 0; animation: jvZoom .5s cubic-bezier(.34,1.56,.64,1) forwards; }
      .jv-fade { animation: jvFade .3s ease-out; }
      .jv-pulse { animation: jvPulse 1.6s ease-in-out infinite; }
      @media (prefers-reduced-motion: reduce) {
        .jv-pop, .jv-up, .jv-left, .jv-zoom, .jv-fade { animation: none; opacity: 1; }
        .jv-pulse { animation: none; }
      }
    `}</style>
  );

  /* ---------- loading / error ---------- */
  if (loading) {
    return (
      <div
        role="status"
        className="jv-fade flex items-center justify-center gap-2 rounded-2xl border border-violet-100 bg-white p-12 text-sm font-medium text-violet-600"
      >
        {motionStyles}
        <Loader2 size={18} className="animate-spin" />
        Loading job details...
      </div>
    );
  }

  if (error || !job) {
    return (
      <div
        role="alert"
        className="jv-pop flex flex-col items-center justify-center gap-3 rounded-2xl border border-red-100 bg-red-50 p-12 text-center"
      >
        {motionStyles}
        <p className="text-sm text-red-700">{error || "Job not found."}</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setRetry((n) => n + 1)}
            className="inline-flex items-center gap-2 rounded-full bg-violet-600 px-4 py-2 text-xs font-bold text-white transition hover:-translate-y-0.5 hover:bg-violet-700 active:scale-95"
          >
            <RefreshCw size={14} /> Retry
          </button>
          <button
            type="button"
            onClick={close}
            className="rounded-full border border-violet-100 bg-white px-4 py-2 text-xs font-bold text-violet-600 transition hover:-translate-y-0.5 active:scale-95"
          >
            Back to jobs
          </button>
        </div>
      </div>
    );
  }

  /* ---------- data mapping (exact API fields) ---------- */
  const statusLabel = String(job.statusN ?? "—");
  const isPending = /pend/i.test(statusLabel);
  const isDelivered = /deliver/i.test(statusLabel);
  const orderDate = job.orderDate;
  const deliveryDate = job.dateOfDelivery;
  const parts = Array.isArray(job.getJobItems) ? job.getJobItems : [];
  const customerName = job.customer ?? "—";
  const mobile = job.mobileNo;
  const partCost =
    job.partCost ?? parts.reduce((t, p) => t + Number(p.partCost || 0), 0);
  const repairCost = job.repairCost ?? 0;

  return (
    <div className="mx-auto w-full max-w-[1400px]">
      {motionStyles}
      <div className="jv-pop overflow-hidden rounded-3xl border border-violet-100 bg-[#f8f7fd] shadow-xl">
        {/* header */}
        <div
          style={dly(60)}
          className="jv-up flex items-center justify-between gap-3 bg-white/70 px-5 py-4"
        >
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-violet-800 text-white shadow-lg shadow-violet-200 transition duration-300 hover:rotate-6 hover:scale-110">
              <Laptop size={26} />
            </span>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900">
                Job Details
              </h1>
              <p className="text-sm text-slate-500">
                Service job information and complete details
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="rounded-full p-2 text-slate-500 transition duration-200 hover:rotate-90 hover:bg-violet-50 hover:text-violet-600 active:scale-90"
          >
            <X size={22} />
          </button>
        </div>

        <div className="space-y-4 px-5 pb-5">
          {/* summary strip */}
          <div
            style={dly(120)}
            className="jv-up grid grid-cols-1 gap-4 rounded-2xl border border-violet-100 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4 lg:divide-x lg:divide-slate-100"
          >
            <div
              style={dly(180)}
              className="jv-up flex items-center gap-3 lg:pr-4"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-50 text-violet-600">
                <Hash size={20} />
              </span>
              <div>
                <p className="text-xs font-semibold text-slate-600">Job No.</p>
                <p className="mt-0.5 rounded-md bg-violet-100 px-2 py-0.5 text-2xl font-extrabold text-violet-700">
                  {jobNo(job.srNo ?? job.id)}
                </p>
              </div>
            </div>
            <div
              style={dly(240)}
              className="jv-up flex items-center gap-3 lg:px-4"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-50 text-violet-600">
                <Calendar size={20} />
              </span>
              <div>
                <p className="text-xs font-semibold text-slate-600">
                  Order Date
                </p>
                <p className="mt-0.5 text-[15px] font-extrabold text-slate-900">
                  {fmtDate(orderDate, true)}
                </p>
              </div>
            </div>
            <div
              style={dly(300)}
              className="jv-up flex items-center gap-3 lg:px-4"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-50 text-violet-600">
                <Calendar size={20} />
              </span>
              <div>
                <p className="text-xs font-semibold text-slate-600">
                  Delivery Date
                </p>
                <p className="mt-0.5 text-[15px] font-extrabold text-slate-900">
                  {fmtDate(deliveryDate)}
                </p>
              </div>
            </div>
            <div
              style={dly(360)}
              className="jv-up flex items-center gap-3 lg:pl-4"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <Clock size={20} />
              </span>
              <div>
                <p className="text-xs font-semibold text-slate-600">Status</p>
                <span
                  className={`mt-1 inline-flex items-center gap-2 rounded-lg px-3 py-1 text-sm font-bold ${
                    isPending
                      ? "bg-amber-100 text-amber-800"
                      : isDelivered
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-violet-100 text-violet-700"
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      isPending
                        ? "jv-pulse bg-orange-500"
                        : isDelivered
                          ? "bg-emerald-500"
                          : "bg-violet-500"
                    }`}
                  />
                  {statusLabel}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[360px_1fr]">
            {/* left column */}
            <div className="space-y-4">
              <Section icon={User} title="Customer Information" delay={420}>
                <div className="mb-3 flex items-center gap-4">
                  <span
                    style={dly(560)}
                    className="jv-zoom flex h-16 w-16 items-center justify-center rounded-full bg-violet-100 text-3xl font-bold text-violet-600"
                  >
                    {String(customerName).charAt(0).toUpperCase()}
                  </span>
                  <div>
                    <p className="text-xl font-extrabold text-slate-900">
                      {customerName}
                    </p>
                    <p className="text-sm text-slate-500">
                      ID: {dash(job.customerId)}
                    </p>
                  </div>
                </div>
                <Row icon={Phone} label="Mobile No." value={dash(mobile)} />
                <Row
                  icon={MessageCircle}
                  label="WhatsApp No."
                  value={dash(job.whatsAppNo)}
                />
                <Row icon={Mail} label="Email" value={dash(job.email)} />
              </Section>

              <Section icon={IndianRupee} title="Job Cost Summary" delay={520}>
                <div className="space-y-1">
                  <CostRow
                    icon={Receipt}
                    label="Part Cost"
                    value={money(partCost)}
                    delay={660}
                  />
                  <CostRow
                    icon={Receipt}
                    label="Repair Cost"
                    value={money(repairCost)}
                    delay={720}
                  />
                  <CostRow
                    icon={Receipt}
                    label="Total Estimated Cost"
                    value={money(job.totalEstimatedCost)}
                    delay={780}
                  />
                  <CostRow
                    icon={Wallet}
                    label="Advance"
                    value={money(job.advance)}
                    tone="bg-emerald-50"
                    delay={840}
                  />
                  <CostRow
                    icon={ShieldCheck}
                    label="Balance"
                    value={money(job.balance)}
                    tone="bg-emerald-50 text-emerald-700"
                    delay={900}
                  />
                </div>
              </Section>
            </div>

            {/* right column */}
            <div className="space-y-4">
              <Section
                icon={Laptop}
                title="Product / Device Information"
                delay={450}
              >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-[170px_1fr_300px]">
                  <div className="flex h-36 items-center justify-center rounded-xl border border-violet-100 bg-slate-50">
                    <Laptop
                      size={56}
                      className="text-violet-300 transition duration-300 hover:scale-110 hover:text-violet-500"
                    />
                  </div>
                  <div>
                    <Row label="Product Name" value={dash(job.productName)} />
                    <Row
                      label="Company / Brand"
                      value={dash(job.productCompany)}
                    />
                    <Row
                      label="Model Configuration"
                      value={dash(job.modelConfi)}
                    />
                    <Row label="Model Detail" value={dash(job.modelDetail)} />
                    <Row
                      label="Model Condition"
                      value={dash(job.modelCondition)}
                    />
                  </div>
                  <div className="md:border-l md:border-slate-100 md:pl-4">
                    <Row label="Product ID" value={dash(job.productId)} />
                    <Row label="Extra Item" value={dash(job.extraItem)} />
                  </div>
                </div>
              </Section>

              <Section icon={ClipboardList} title="Job Details" delay={550}>
                <Row
                  icon={Phone}
                  label="Technical Problem"
                  value={dash(job.technicalProblem)}
                />
                <Row
                  icon={MessageSquare}
                  label="Remark"
                  value={dash(job.remark)}
                />
              </Section>

              <Section icon={Layers} title="Job Items / Parts" delay={650}>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left text-[13px]">
                    <thead className="text-[13px] font-bold text-slate-800">
                      <tr className="border-b border-slate-100">
                        <th className="px-2 py-2">#</th>
                        <th className="px-2 py-2">Part Number</th>
                        <th className="px-2 py-2">Part Name</th>
                        <th className="px-2 py-2">Technical Problem</th>
                        <th className="px-2 py-2">Customer View</th>
                        <th className="px-2 py-2">Repair Est. Cost</th>
                        <th className="px-2 py-2 text-right">Part Cost</th>
                      </tr>
                    </thead>
                    <tbody className="text-slate-700">
                      {parts.length === 0 ? (
                        <tr>
                          <td
                            colSpan={7}
                            className="px-2 py-6 text-center text-slate-400"
                          >
                            No parts added.
                          </td>
                        </tr>
                      ) : (
                        parts.map((p, i) => (
                          <tr
                            key={p.id ?? i}
                            style={dly(780 + Math.min(i, 10) * 60)}
                            className="jv-left border-b border-slate-100 transition-colors last:border-0 hover:bg-violet-50/60"
                          >
                            <td className="px-2 py-2.5">{i + 1}</td>
                            <td className="px-2 py-2.5">
                              {dash(p.partNumber)}
                            </td>
                            <td className="px-2 py-2.5">{dash(p.partName)}</td>
                            <td className="px-2 py-2.5">
                              {dash(p.technicalProblem)}
                            </td>
                            <td className="px-2 py-2.5">
                              {dash(p.customerView)}
                            </td>
                            <td className="px-2 py-2.5">
                              {p.repairEstimatedCost
                                ? money(p.repairEstimatedCost)
                                : "—"}
                            </td>
                            <td className="px-2 py-2.5 text-right font-semibold">
                              {money(p.partCost)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Section>
            </div>
          </div>

          {/* footer actions */}
          <div
            style={dly(950)}
            className="jv-up flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-center gap-2.5">
              <RoundBtn title="View job" onClick={() => setRetry((n) => n + 1)}>
                <Eye size={18} />
              </RoundBtn>
              <RoundBtn
                title="Edit job"
                onClick={() =>
                  navigate(`/jobs-new?jobId=${encodeURIComponent(job.id)}`)
                }
              >
                <Pencil size={18} />
              </RoundBtn>
              <RoundBtn title="Print Label Sheet" onClick={handlePrintLabel}>
                <Tag size={18} />
              </RoundBtn>
              <RoundBtn
                title={isFavorite ? "Remove favorite" : "Add favorite"}
                tone="amber"
                onClick={handleFavourite}
              >
                <Star
                  size={18}
                  className={`transition duration-300 ${
                    isFavorite ? "scale-110 fill-amber-400 text-amber-500" : ""
                  }`}
                />
              </RoundBtn>
              <RoundBtn
                title="Delete job"
                tone="red"
                onClick={() => {
                  setDeleteError("");
                  setConfirmDelete(true);
                }}
              >
                <Trash2 size={18} />
              </RoundBtn>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handlePrintJobSheet}
                disabled={printing === "sheet"}
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-violet-500 bg-white px-5 text-sm font-bold text-violet-700 transition duration-200 hover:-translate-y-0.5 hover:bg-violet-50 hover:shadow-md active:scale-95 disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {printing === "sheet" ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Printer size={18} />
                )}
                Print Job Sheet
              </button>
              <button
                type="button"
                onClick={handlePrintLabel}
                disabled={printing === "label"}
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-violet-600 px-5 text-sm font-bold text-white shadow-lg shadow-violet-200 transition duration-200 hover:-translate-y-0.5 hover:bg-violet-700 hover:shadow-xl active:scale-95 disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {printing === "label" ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Barcode size={18} />
                )}
                Print Label
              </button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete job?"
        description="Are you sure you want to delete"
        itemName={`Job ${jobNo(job.srNo ?? job.id)}`}
        itemMeta={`Customer: ${customerName}`}
        warning="This will permanently remove the job from your records."
        confirmText="Delete Job"
        loading={deleting}
        error={deleteError}
        onCancel={() => {
          setConfirmDelete(false);
          setDeleteError("");
        }}
        onConfirm={confirmDeleteJob}
      />
    </div>
  );
}
