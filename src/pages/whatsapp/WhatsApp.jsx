import { useRef, useState } from "react";
import {
  CheckCheck,
  Check,
  Lock,
  LockOpen,
  MessageCircle,
  ChevronDown,
  Send,
} from "lucide-react";

/* ---------- constants ---------- */
const SHOP_NUMBER = "92548 40600";
const TEST_NUMBER = "919254840600"; // TODO: apna test number daalna (91 ke saath)

const SAMPLE = {
  customer_name: "Rohit",
  customer_full: "ROHIT VERMA",
  customer_code: "RV0001",
  job_no: "1631",
  device_type: "LAPTOP",
  device: "HP 15s",
  issue: "DEAD",
  extras: "CHARGER",
  advance: "₹500.00",
  total: "₹1,500.00",
  eta: "02/Nov/2026, 6:00 PM",
  otp: "482 913",
  ready_date: "31/Oct/2026",
  balance: "₹1,000.00",
};

const FIELDS = ["customer_name", "job_no", "device", "issue", "total", "eta", "otp"];

const TEMPLATES = [
  {
    id: "job",
    name: "Job created",
    category: "Utility",
    status: "Approved",
    note: "Sent automatically when a job is saved. Approved by WhatsApp before first use.",
    action: "Send test to my number",
    text: `*📄 Job Receipt - Shree Bhanu Technical Solutions*
🔢 Job No: *{job_no}*
👤 Customer: {customer_full} ({customer_code})
📦 Product: {device_type} · {device}
💬 Issue: {issue}
📦 Extra item: {extras}
💳 Advance: {advance}
💰 Total cost: {total}
📅 Estimated delivery: {eta}
📍 Shop No. 6, Red Cross Market, Hisar
☎️ Office helpline: 9254840600`,
  },
  {
    id: "otp",
    name: "Ready, with OTP",
    category: "Utility",
    status: "Approved",
    note: "Sent when a job is marked Ready. A fresh one-time code is generated for every send.",
    action: "Send test to my number",
    text: `📢 Dear {customer_name},
Your product (Job No: {job_no}) is now ready ✅
Please collect it from Shree Bhanu Technical Solutions.
🔐 Bring this OTP when you collect: {otp}
📍 Shop No. 6, Red Cross Market, Hisar
☎️ Office helpline: 9254840600`,
  },
  {
    id: "reminder",
    name: "Reminder",
    category: "Utility",
    status: "Approved",
    note: "Used by the uncollected-job rule and by the Remind button on any job.",
    action: "Send test to my number",
    text: `Dear {customer_name}, your {device} (Job No: {job_no}) has been ready since {ready_date}.
Balance due: {balance}.
Please collect it from Shree Bhanu Technical Solutions, Red Cross Market, Hisar.
☎️ Office helpline: 9254840600`,
  },
  {
    id: "welcome",
    name: "Welcome",
    category: "Utility",
    status: "Pending review",
    note: "Sent once, when a new customer is registered. Waiting for WhatsApp review.",
    action: "Submit for approval",
    text: `🙏 Welcome {customer_name}!
Your registration was successful.
🆔 Your customer code: {customer_code}
Thank you for joining us.
- Team Shree Bhanu Technical Solutions`,
  },
];

const CUSTOM = { id: "custom", name: "Custom message", sub: "Free text", status: "Needs open window" };

const CUSTOMERS = [
  { id: "1629", name: "Kavita Devi", phone: "9811100001", open: true },
  { id: "1628", name: "Gaurav Dhaka", phone: "9811100002", open: true },
  { id: "1627", name: "Pooja Beniwal", phone: "9811100003", open: false },
  { id: "1626", name: "Seema Yadav", phone: "9811100004", open: false },
];

const INITIAL_LOG = [
  { time: "1:35 PM", job: "#1628", customer: "Gaurav Dhaka", msg: "Ready, with OTP", status: "Read" },
  { time: "1:34 PM", job: "#1628", customer: "Gaurav Dhaka", msg: "Ready, with OTP", status: "Read" },
  { time: "12:57 PM", job: "#1630", customer: "Rohit Verma", msg: "Ready, with OTP", status: "Read" },
  { time: "11:46 AM", job: "#1630", customer: "Rohit Verma", msg: "Job created", status: "Read" },
  { time: "10:02 AM", job: "#1630", customer: "Rohit Verma", msg: "Job created", status: "Delivered" },
];

const RULES = [
  { key: "receipt", title: "Receipt on save", desc: "Sends Job created when a job is saved", on: true },
  { key: "otp", title: "Ready with OTP", desc: "Sends when a job is marked Ready", on: true },
  { key: "remind", title: "Uncollected reminder", desc: "After 3 days in Ready, once a week", on: true },
  { key: "summary", title: "Daily owner summary", desc: "Jobs in, out and cash, at 9 PM", on: false },
];

/* ---------- helpers ---------- */
const fill = (text) => text.replace(/\{(\w+)\}/g, (m, k) => (k in SAMPLE ? SAMPLE[k] : m));

const bold = (text) =>
  text.split(/(\*[^*\n]+\*)/g).map((p, i) =>
    p.length > 2 && p.startsWith("*") && p.endsWith("*") ? (
      <b key={i}>{p.slice(1, -1)}</b>
    ) : (
      <span key={i}>{p}</span>
    ),
  );

const nowTime = () =>
  new Date().toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });

const badgeCls = {
  Approved: "bg-emerald-50 text-emerald-700",
  "Pending review": "bg-amber-50 text-amber-700",
  "Needs open window": "bg-violet-50 text-violet-600",
};

const logCls = {
  Read: "bg-emerald-50 text-emerald-700",
  Delivered: "bg-blue-50 text-blue-700",
  Sent: "bg-slate-100 text-slate-600",
};

function Badge({ children }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${badgeCls[children] || "bg-slate-100 text-slate-500"}`}>
      {children}
    </span>
  );
}

function Toggle({ on, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition duration-300 ${on ? "bg-violet-600" : "bg-slate-300"}`}
    >
      <i
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all duration-300 ${on ? "left-[22px]" : "left-0.5"}`}
      />
    </button>
  );
}

function Bubble({ children }) {
  return (
    <section className="overflow-hidden rounded-2xl shadow-sm">
      <div className="flex items-center gap-2.5 bg-[#1f6f5a] px-4 py-3 text-white">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[11px] font-bold text-[#1f6f5a]">
          SB
        </div>
        <div className="min-w-0">
          <p className="truncate text-[13px] font-bold leading-tight">Shree Bhanu Technical Solutions</p>
          <p className="text-[10px] text-emerald-100">Business account</p>
        </div>
      </div>
      <div className="bg-[#ece8e1] p-3.5">
        <div className="max-w-[96%] rounded-xl rounded-tl-sm bg-[#d9fdd3] px-3 py-2 text-[12.5px] leading-[1.15rem] text-slate-900 shadow-sm">
          {children}
          <p className="mt-1 text-right text-[10px] text-slate-500">{nowTime()}</p>
        </div>
      </div>
    </section>
  );
}

/* ---------- page ---------- */
export default function WhatsApp() {
  const [activeId, setActiveId] = useState("job");
  const [status, setStatus] = useState(
    Object.fromEntries(TEMPLATES.map((t) => [t.id, t.status])),
  );
  const [drafts, setDrafts] = useState(Object.fromEntries(TEMPLATES.map((t) => [t.id, t.text])));
  const [saved, setSaved] = useState(Object.fromEntries(TEMPLATES.map((t) => [t.id, t.text])));
  const [rules, setRules] = useState(Object.fromEntries(RULES.map((r) => [r.key, r.on])));
  const [log, setLog] = useState(INITIAL_LOG);
  const [customerId, setCustomerId] = useState(CUSTOMERS[0].id);
  const [customText, setCustomText] = useState("");
  const [toast, setToast] = useState("");
  const taRef = useRef(null);

  const tpl = TEMPLATES.find((t) => t.id === activeId);
  const isCustom = activeId === "custom";
  const customer = CUSTOMERS.find((c) => c.id === customerId);
  const dirty = tpl && drafts[tpl.id] !== saved[tpl.id];

  const showToast = (m) => {
    setToast(m);
    setTimeout(() => setToast(""), 2200);
  };

  const insertField = (key) => {
    const el = taRef.current;
    const token = `{${key}}`;
    const cur = drafts[tpl.id];
    const start = el ? el.selectionStart : cur.length;
    const end = el ? el.selectionEnd : cur.length;
    const next = cur.slice(0, start) + token + cur.slice(end);
    setDrafts((p) => ({ ...p, [tpl.id]: next }));
    requestAnimationFrame(() => {
      if (!el) return;
      el.focus();
      el.setSelectionRange(start + token.length, start + token.length);
    });
  };

  const saveDraft = () => {
    setSaved((p) => ({ ...p, [tpl.id]: drafts[tpl.id] }));
    showToast("Draft saved");
  };

  const mainAction = () => {
    if (tpl.action === "Submit for approval") {
      setSaved((p) => ({ ...p, [tpl.id]: drafts[tpl.id] }));
      setStatus((p) => ({ ...p, [tpl.id]: "Pending review" }));
      showToast("Submitted for WhatsApp review");
      return;
    }
    // TODO: real API se test message bhejna
    window.open(
      `https://wa.me/${TEST_NUMBER}?text=${encodeURIComponent(fill(drafts[tpl.id]))}`,
      "_blank",
    );
  };

  const sendCustom = () => {
    if (!customer.open || !customText.trim()) return;
    // TODO: real API call
    window.open(
      `https://wa.me/91${customer.phone}?text=${encodeURIComponent(customText)}`,
      "_blank",
    );
    setLog((p) => [
      { time: nowTime(), job: `#${customer.id}`, customer: customer.name, msg: "Custom message", status: "Sent" },
      ...p,
    ]);
    setCustomText("");
    showToast(`Message sent to ${customer.name.split(" ")[0]}`);
  };

  const previewText = isCustom
    ? customText.trim()
      ? customText
      : "Type a message to preview it here."
    : fill(drafts[tpl.id]);

  return (
    <div>
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes toastIn { from { opacity: 0; transform: translate(-50%, 12px); } to { opacity: 1; transform: translate(-50%, 0); } }
        .fade-up { animation: fadeUp .3s ease-out both; }
        .toast-in { animation: toastIn .25s ease-out both; }
        @media (prefers-reduced-motion: reduce) { .fade-up, .toast-in { animation: none; } }
      `}</style>

      {/* Header */}
      <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-[28px]">
            WhatsApp Center
          </h2>
          <p className="mt-1 text-sm text-slate-500">Every customer message the shop sends, in one place.</p>
        </div>
        <div className="flex items-center gap-3 self-start rounded-full border border-violet-100 bg-white px-4 py-2.5 shadow-sm">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </span>
          <div className="leading-tight">
            <p className="text-xs font-bold text-slate-800">Connected</p>
            <p className="text-[11px] text-slate-500">Sending from {SHOP_NUMBER}</p>
          </div>
        </div>
      </div>

      {/* 3 columns */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[250px_1fr] xl:grid-cols-[250px_1fr_330px]">
        {/* Messages list */}
        <section className="rounded-2xl border border-violet-100/80 bg-white p-3.5 shadow-sm">
          <p className="mb-2.5 px-1 text-xs font-bold text-slate-500">Messages</p>
          <div className="space-y-2">
            {[...TEMPLATES, CUSTOM].map((t) => {
              const on = activeId === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveId(t.id)}
                  className={`block w-full rounded-xl border px-3.5 py-2.5 text-left transition duration-200 hover:-translate-y-0.5 ${
                    on
                      ? "border-violet-500 bg-violet-50 shadow-md shadow-violet-100"
                      : "border-violet-100 bg-white hover:border-violet-300 hover:bg-violet-50/40"
                  }`}
                >
                  <p className="text-[13px] font-bold text-slate-800">{t.name}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] text-slate-500">{t.category || t.sub}</span>
                    <Badge>{t.id === "custom" ? t.status : status[t.id]}</Badge>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Editor */}
        <section key={activeId} className="fade-up rounded-2xl border border-violet-100/80 bg-white p-4 shadow-sm sm:p-5">
          {!isCustom ? (
            <>
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-bold text-slate-900">{tpl.name}</h3>
                <Badge>{status[tpl.id]}</Badge>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {[
                  ["Category", tpl.category],
                  ["Language", "English"],
                ].map(([k, v]) => (
                  <div key={k}>
                    <label className="mb-1.5 block text-xs font-bold text-slate-600">{k}</label>
                    <div className="rounded-xl bg-[#f5f3fd] px-3.5 py-2.5 text-[13px] text-slate-700">{v}</div>
                  </div>
                ))}
              </div>

              <label className="mb-1.5 mt-4 block text-xs font-bold text-slate-600">Message text</label>
              <textarea
                ref={taRef}
                value={drafts[tpl.id]}
                onChange={(e) => setDrafts((p) => ({ ...p, [tpl.id]: e.target.value }))}
                rows={9}
                className="w-full resize-y rounded-xl border border-violet-100 bg-white px-3.5 py-3 font-mono text-[12.5px] leading-5 text-slate-800 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
              />

              <label className="mb-2 mt-3 block text-xs font-bold text-slate-600">Insert a field</label>
              <div className="flex flex-wrap gap-2">
                {FIELDS.map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => insertField(f)}
                    className="rounded-full border border-violet-200 bg-white px-3 py-1 font-mono text-[11px] font-semibold text-violet-700 transition hover:-translate-y-0.5 hover:bg-violet-600 hover:text-white active:scale-95"
                  >
                    {`{${f}}`}
                  </button>
                ))}
              </div>

              <p className="mt-4 text-xs text-slate-500">{tpl.note}</p>

              <div className="mt-4 flex flex-wrap items-center gap-2.5">
                <button
                  onClick={saveDraft}
                  disabled={!dirty}
                  className="rounded-full border border-violet-100 bg-white px-5 py-2.5 text-xs font-bold text-violet-600 transition hover:bg-violet-50 disabled:cursor-not-allowed disabled:text-violet-300 disabled:hover:bg-white"
                >
                  Save draft
                </button>
                <button
                  onClick={mainAction}
                  className="flex items-center gap-2 rounded-full bg-violet-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-violet-200 transition hover:-translate-y-0.5 hover:bg-violet-700 active:scale-95"
                >
                  <Send size={14} /> {tpl.action}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-bold text-slate-900">Custom message</h3>
                <Badge>Needs open window</Badge>
              </div>

              <label className="mb-1.5 mt-4 block text-xs font-bold text-slate-600">Customer</label>
              <div className="relative">
                <select
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="w-full cursor-pointer appearance-none rounded-xl border border-violet-100 bg-white px-3.5 py-2.5 pr-10 text-[13px] text-slate-800 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                >
                  {CUSTOMERS.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} · #{c.id} · {c.open ? "window open" : "window closed"}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>

              <div
                className={`mt-3 flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-[13px] font-semibold transition ${
                  customer.open ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                }`}
              >
                {customer.open ? <LockOpen size={16} /> : <Lock size={16} />}
                {customer.open
                  ? `Window open. You can write any message to ${customer.name.split(" ")[0]}.`
                  : `Window closed. ${customer.name.split(" ")[0]} has not replied in 24 hours, use a template.`}
              </div>

              <label className="mb-1.5 mt-4 block text-xs font-bold text-slate-600">Message text</label>
              <textarea
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                disabled={!customer.open}
                rows={6}
                className="w-full resize-y rounded-xl border border-violet-100 bg-white px-3.5 py-3 text-[13px] text-slate-800 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100 disabled:cursor-not-allowed disabled:bg-slate-50"
              />
              <p className="mt-2 text-xs text-slate-500">
                Free text is allowed only while the customer window is open. Otherwise pick a template.
              </p>

              <button
                onClick={sendCustom}
                disabled={!customer.open || !customText.trim()}
                className="mt-4 flex items-center gap-2 rounded-full bg-violet-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-violet-200 transition hover:-translate-y-0.5 hover:bg-violet-700 active:scale-95 disabled:cursor-not-allowed disabled:bg-violet-300 disabled:shadow-none disabled:hover:translate-y-0"
              >
                <MessageCircle size={15} /> Send custom message
              </button>
            </>
          )}
        </section>

        {/* Preview */}
        <section className="rounded-2xl border border-violet-100/80 bg-white p-4 shadow-sm lg:col-span-2 xl:col-span-1 xl:self-start">
          <p className="mb-3 text-sm font-bold text-slate-900">What the customer sees</p>
          <Bubble>
            <p key={activeId} className="fade-up whitespace-pre-wrap">
              {bold(previewText)}
            </p>
          </Bubble>
          <p className="mt-3 text-xs text-slate-500">Sample customer: Rohit Verma, job 1631.</p>
        </section>
      </div>

      {/* Automation rules */}
      <section className="mt-5 rounded-2xl border border-violet-100/80 bg-white p-4 shadow-sm sm:p-5">
        <h3 className="text-lg font-bold text-slate-900">Automation rules</h3>
        <p className="mt-1 text-sm text-slate-500">Messages the shop sends without anyone pressing a button.</p>
        <div className="mt-3 grid grid-cols-1 gap-x-10 md:grid-cols-2">
          {RULES.map((r) => (
            <div key={r.key} className="flex items-center justify-between gap-4 border-b border-slate-100 py-3.5 last:border-b-0 md:[&:nth-last-child(2)]:border-b-0">
              <div>
                <p className="text-[13px] font-bold text-slate-800">{r.title}</p>
                <p className="mt-0.5 text-xs text-slate-500">{r.desc}</p>
              </div>
              <Toggle on={rules[r.key]} onChange={(v) => setRules((p) => ({ ...p, [r.key]: v }))} />
            </div>
          ))}
        </div>
      </section>

      {/* Message log */}
      <section className="mt-5 overflow-hidden rounded-2xl border border-violet-100/80 bg-white shadow-sm">
        <div className="flex items-center justify-between p-4 sm:px-5">
          <h3 className="text-lg font-bold text-slate-900">Message log</h3>
          <span className="text-xs text-slate-400">Latest 10</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left">
            <thead className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <tr className="border-y border-slate-100">
                {["Time", "Job", "Customer", "Message", "Status"].map((h) => (
                  <th key={h} className="px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="bg-[#f5f3fd]">
                <td colSpan={5} className="px-5 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Today
                </td>
              </tr>
              {log.slice(0, 10).map((l, i) => (
                <tr
                  key={`${l.time}-${i}`}
                  className="fade-up border-b border-slate-100 transition hover:bg-violet-50/40"
                  style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
                >
                  <td className="px-5 py-3.5 text-xs text-slate-500">{l.time}</td>
                  <td className="px-5 py-3.5 font-mono text-xs font-bold text-slate-800">{l.job}</td>
                  <td className="px-5 py-3.5 text-[13px] text-slate-800">{l.customer}</td>
                  <td className="px-5 py-3.5 text-[13px] text-slate-700">{l.msg}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${logCls[l.status]}`}>
                      {l.status === "Sent" ? <Check size={12} /> : <CheckCheck size={12} />}
                      {l.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Toast */}
      {toast && (
        <div className="toast-in fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-slate-900 px-5 py-2.5 text-xs font-bold text-white shadow-xl">
          {toast}
        </div>
      )}
    </div>
  );
}