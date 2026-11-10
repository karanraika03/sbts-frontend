import { useState } from "react";
import { createPortal } from "react-dom";
import {
  MessageCircle,
  Send,
  Mail,
  X,
  FileText,
  CheckCircle2,
  Bell,
  SquarePen,
  ArrowLeft,
} from "lucide-react";

import {
  sendJobReminder,
  resendJobMessage,
  sendCustomJobMessage,
} from "../services/JobService";

import { useToast } from "../context/ToastContext";

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

const SHOP = "Shree Bhanu Technical Solutions, Red Cross Market, Hisar";

const buildMessage = (type, j) => {
  switch (type) {
    case "creation":
      return `Hello ${j.customer}, aapka ${j.device} (Job ${jobNo(j)}) hamare paas receive ho gaya hai. Estimate: ${rupee(j.amount)}. - ${SHOP}`;
    case "close":
      return `Hello ${j.customer}, aapka ${j.device} (Job ${jobNo(j)}) ready hai. Kripya pickup kar lein. Balance: ${rupee(j.balance)}. - ${SHOP}`;
    case "reminder":
      return `Hello ${j.customer}, reminder: aapka ${j.device} (Job ${jobNo(j)}) abhi tak pickup nahi hua hai. Kripya jaldi sampark karein. - ${SHOP}`;
    default:
      return "";
  }
};

const OPTIONS = [
  {
    key: "creation",
    label: "Job Creation",
    icon: FileText,
    cls: "border-emerald-500 text-emerald-700 hover:bg-emerald-50",
  },
  {
    key: "close",
    label: "Job Close",
    icon: CheckCircle2,
    cls: "border-rose-500 bg-rose-50 text-rose-600 hover:bg-rose-100",
  },
  {
    key: "reminder",
    label: "Reminder",
    icon: Bell,
    cls: "border-amber-400 text-amber-500 hover:bg-amber-50",
  },
  {
    key: "custom",
    label: "Custom",
    icon: SquarePen,
    cls: "border-blue-500 text-blue-600 hover:bg-blue-50",
  },
];

/* ---------- component ---------- */
export default function MassageBtn({ j, compact = false }) {
  const showToast = useToast();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState("choose"); // choose | custom
  const [customText, setCustomText] = useState("");

  const close = () => {
    setOpen(false);
    setStep("choose");
    setCustomText("");
  };

  const sendWhatsApp = (text) => {
    const p = phoneOf(j);
    window.open(
      `https://wa.me/${p ? `91${p}` : ""}?text=${encodeURIComponent(text)}`,
      "_blank",
    );
    close();
  };

  const handlePick = async (key) => {
    if (key === "custom") {
      setCustomText(`Hello ${j.customer}, `);
      setStep("custom");
      return;
    }

    try {
      if (key === "reminder") {
        await sendJobReminder(j.id);
      } else {
        await resendJobMessage(j.id, key);
      }

      showToast("Message sent successfully.");
      close();
    } catch (error) {
      console.error("Send Message Error:", error);

      showToast(error.response?.data?.message || "Unable to send message.");
    }
  };

  return (
    <>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        title="Send message"
        aria-label="Send message"
        className={`flex shrink-0 items-center justify-center rounded-full border border-violet-100 bg-white text-violet-600 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-emerald-500 hover:text-white hover:shadow-lg hover:shadow-emerald-200 active:scale-90 ${compact ? "h-8 w-8" : "h-9 w-9"}`}
      >
        <Send size={16} />
      </button>

      {open &&
        createPortal(
          <div
            onClick={(e) => {
              e.stopPropagation();
              close();
            }}
            className="fade-in fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="pop-in w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-4 text-white">
                <div className="flex items-center gap-3">
                  {step === "custom" ? (
                    <button
                      type="button"
                      onClick={() => setStep("choose")}
                      aria-label="Back"
                      className="rounded-full p-1 transition hover:bg-white/20"
                    >
                      <ArrowLeft size={20} />
                    </button>
                  ) : (
                    <Send size={20} />
                  )}
                  <h3 className="text-lg font-bold">
                    Send Message to Customer
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={close}
                  aria-label="Close"
                  className="rounded-full p-1 transition hover:bg-white/20"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Body */}
              {step === "choose" ? (
                <div className="px-6 pb-6 pt-8">
                  <div className="flex justify-center text-blue-600">
                    <Mail size={52} strokeWidth={2.5} />
                  </div>
                  <p className="mt-8 text-center text-sm text-slate-500">
                    Choose the type of message you want to send
                  </p>
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    {OPTIONS.map(({ key, label, icon: Icon, cls }) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handlePick(key)}
                        className={`flex h-[120px] flex-col items-center justify-center gap-3 rounded-xl border bg-white text-[15px] font-medium transition active:scale-95 ${cls}`}
                      >
                        <Icon size={28} />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="px-6 pb-6 pt-5">
                  <p className="text-xs font-bold text-slate-500">
                    To: {j.customer} {j.phone ? `· ${j.phone}` : ""}
                  </p>
                  <textarea
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                    rows={6}
                    placeholder="Type your message..."
                    className="mt-2 w-full resize-none rounded-xl border border-violet-100 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  />
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setStep("choose")}
                      className="rounded-full border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      disabled={!customText.trim()}
                      onClick={async () => {
                        try {
                          await sendCustomJobMessage(j.id, customText.trim());

                          showToast("Custom message sent successfully.");
                          close();
                        } catch (error) {
                          console.error("Custom Message Error:", error);

                          showToast(
                            error.response?.data?.message ||
                              "Unable to send custom message.",
                          );
                        }
                      }}
                      className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Send size={15} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
