import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronRight,
  ChevronDown,
  Check,
  MapPin,
  Sparkles,
  Printer,
  AlertCircle,
  User,
  Laptop,
  Wrench,
  IndianRupee,
} from "lucide-react";

/* ---------- constants ---------- */
const NEXT_JOB_NO = 1631;
const NEXT_CUSTOMER_CODE = "CN0106";
const SHOP = {
  name: "Shree Bhanu Technical Solutions",
  address: "Shop No. 6, Red Cross Market, Hisar",
  helpline: "9254840600",
  phones: ["89010 34555", "99925 34555"],
};

const DEVICES = ["Laptop", "Desktop", "Printer", "Other"];
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
const TECHNICIANS = ["Amit", "Rohit", "Sandeep"];
const VILLAGES = [
  "Nyoli Kalan",
  "Dabra",
  "Kaimri",
  "Chikanwas",
  "Dhiranwas",
  "Mangali Jhara",
  "Siswal",
  "Balsamand",
  "Mayyar",
  "Sisai",
  "Pabra",
  "Kinala",
  "Adampur",
  "Khanda Kheri",
  "Hansi",
  "Satrod Khurd",
  "Barwala",
  "Narnaund",
  "Uklana",
  "Bass",
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
const fmt12 = (t) => {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${pad(m)} ${h >= 12 ? "PM" : "AM"}`;
};
const money = (n) => Number(n || 0).toFixed(2);

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-[13px] text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-violet-200 focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100";

const defaultDelivery = () => {
  const d = new Date();
  d.setDate(d.getDate() + 2);
  return toInputDate(d);
};

const initial = {
  mobile: "",
  name: "",
  village: "",
  whatsappConsent: true,
  device: "Laptop",
  brand: "",
  model: "",
  serial: "",
  extras: ["None"],
  issues: [],
  notes: "",
  estimate: "",
  advance: "",
  partCost: "",
  date: defaultDelivery(),
  time: "18:00",
  technician: TECHNICIANS[0],
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
          <h3 className="text-[15px] font-extrabold leading-tight text-slate-900">
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
  const [f, setF] = useState(initial);
  const [errors, setErrors] = useState({});
  const [vOpen, setVOpen] = useState(false);
  const [vQuery, setVQuery] = useState("");
  const [saving, setSaving] = useState(false);

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
  const deliveryText = deliveryDate
    ? `${fmtDate(deliveryDate)}, ${fmt12(f.time)}`
    : "-";
  const extraText = f.extras.length
    ? f.extras.join(", ").toUpperCase()
    : "NONE";
  const issueText = f.issues.length ? f.issues.join(", ") : "";
  const productText = [f.device.toUpperCase(), f.brand || "Brand"].join(" · ");

  const filteredVillages = VILLAGES.filter((v) =>
    v.toLowerCase().includes(vQuery.toLowerCase()),
  );

  const receiptLines = [
    `📄 *Job Receipt - ${SHOP.name}*`,
    `🔢 Job No: *${NEXT_JOB_NO}*`,
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
      village: "Dabra",
      device: "Laptop",
      brand: "HP",
      model: "15s",
      serial: "5CD1234XYZ",
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
    if (!f.name.trim()) e.name = "Customer name is required";
    if (!f.issues.length) e.issues = "Select at least one issue";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setSaving(true);
    try {
      // TODO: yaha apni real API call lagana, payload = { jobNo: NEXT_JOB_NO, ...f }
      await new Promise((r) => setTimeout(r, 600));

      if (f.sendWhatsapp && f.whatsappConsent) {
        const text = encodeURIComponent(receiptLines.join("\n"));
        window.open(`https://wa.me/91${f.mobile}?text=${text}`, "_blank");
      }
      if (f.printLabel) {
        window.print();
      }
      navigate("/jobs");
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
            <span className="text-violet-600">New job</span>
          </div>
          <h2 className="mt-1.5 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-[28px]">
            Register a job
          </h2>
        </div>
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
            <b className="font-extrabold text-violet-700">#{NEXT_JOB_NO}</b>
          </span>
        </div>
      </div>

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
                  onChange={(e) =>
                    set(
                      "mobile",
                      e.target.value.replace(/\D/g, "").slice(0, 10),
                    )
                  }
                  inputMode="numeric"
                  placeholder="10 digit number"
                  className={inputCls}
                />
                {errors.mobile && (
                  <p className={errCls}>
                    <AlertCircle size={12} /> {errors.mobile}
                  </p>
                )}
              </Field>
              <Field label="Customer name">
                <input
                  value={f.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="Full name"
                  className={inputCls}
                />
                {errors.name && (
                  <p className={errCls}>
                    <AlertCircle size={12} /> {errors.name}
                  </p>
                )}
              </Field>
            </div>

            <Field label="Village or town" className="mt-3">
              <div className="relative">
                <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 transition hover:border-violet-200 focus-within:border-violet-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-violet-100">
                  <MapPin size={15} className="text-violet-400" />
                  <input
                    value={vOpen ? vQuery : f.village}
                    onFocus={() => {
                      setVOpen(true);
                      setVQuery("");
                    }}
                    onBlur={() => setTimeout(() => setVOpen(false), 120)}
                    onChange={(e) => setVQuery(e.target.value)}
                    placeholder="Search village or town"
                    className="w-full bg-transparent text-[13px] text-slate-800 outline-none placeholder:text-slate-400"
                  />
                  <ChevronDown size={15} className="text-slate-400" />
                </div>
                {vOpen && (
                  <div className="absolute z-20 mt-1.5 max-h-48 w-full overflow-y-auto rounded-xl border border-violet-100 bg-white p-1 shadow-xl shadow-violet-100">
                    {filteredVillages.map((v) => (
                      <button
                        key={v}
                        type="button"
                        onMouseDown={() => set("village", v)}
                        className="block w-full rounded-lg px-3 py-2 text-left text-[13px] text-slate-700 hover:bg-violet-50"
                      >
                        {v}
                      </button>
                    ))}
                    {filteredVillages.length === 0 && (
                      <p className="px-3 py-2.5 text-xs text-slate-400">
                        No village found
                      </p>
                    )}
                  </div>
                )}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                <button
                  type="button"
                  onClick={() => set("village", "Hisar city")}
                  className="rounded-full bg-violet-50 px-3 py-1 text-[11px] font-bold text-violet-700 transition hover:bg-violet-100"
                >
                  Walk-in from Hisar city
                </button>
                <p className="text-[11px] text-slate-400">
                  Used for the Hisar map. Skip for walk-in customers.
                </p>
              </div>
            </Field>

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
            <div className="flex flex-wrap gap-2">
              {DEVICES.map((d) => (
                <Chip
                  key={d}
                  active={f.device === d}
                  onClick={() => set("device", d)}
                >
                  {d}
                </Chip>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Field label="Brand">
                <input
                  value={f.brand}
                  onChange={(e) => set("brand", e.target.value)}
                  placeholder="e.g. HP"
                  className={inputCls}
                />
              </Field>
              <Field label="Model">
                <input
                  value={f.model}
                  onChange={(e) => set("model", e.target.value)}
                  placeholder="e.g. 15s"
                  className={inputCls}
                />
              </Field>
              <Field label="Serial no. (optional)">
                <input
                  value={f.serial}
                  onChange={(e) => set("serial", e.target.value)}
                  placeholder="Scan or type"
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
              <b className="text-xl font-extrabold">
                ₹{balance.toLocaleString("en-IN")}
              </b>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Field label="Delivery date">
                <input
                  type="date"
                  value={f.date}
                  onChange={(e) => set("date", e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="Time">
                <input
                  type="time"
                  value={f.time}
                  onChange={(e) => set("time", e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="Technician">
                <div className="relative">
                  <select
                    value={f.technician}
                    onChange={(e) => set("technician", e.target.value)}
                    className={`${inputCls} cursor-pointer appearance-none pr-9`}
                  >
                    {TECHNICIANS.map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                  <ChevronDown
                    size={15}
                    className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                </div>
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
              {saving ? "Saving..." : "Save, print and send"}
            </button>
          </div>
        </div>

        {/* ---------- LIVE PREVIEW ---------- */}
        <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
          <p className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[1.5px] text-slate-500">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
            Live preview
          </p>

          {/* Label */}
          <section className="rounded-2xl border border-violet-100/80 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-extrabold text-slate-900">
              Printed label
            </h3>
            <div
              id="job-label"
              className="mt-3 rounded-xl border-2 border-slate-900 bg-white p-3 text-slate-900"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-900 text-xs font-extrabold text-white">
                  SB
                </div>
                <p className="text-[12px] font-extrabold uppercase leading-tight">
                  {SHOP.name}
                </p>
              </div>
              <div className="mt-2.5 bg-slate-900 py-1 text-center text-[9px] font-extrabold uppercase tracking-wide text-white">
                Experts in repair and service
              </div>
              <dl className="mt-2.5 space-y-0.5 text-[11px]">
                {[
                  ["Job no.", NEXT_JOB_NO, true],
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
                    <Barcode seed={NEXT_JOB_NO} />
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
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[10px] font-extrabold text-[#1f6f5a]">
                SB
              </div>
              <div>
                <p className="text-xs font-extrabold leading-tight">
                  {SHOP.name}
                </p>
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
