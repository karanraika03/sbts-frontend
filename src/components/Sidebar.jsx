import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Wrench,
  Users,
  MessageCircle,
  Laptop,
  X,
  ChevronDown,
  ShieldCheck,
  LogOut,
  Settings,
  SlidersHorizontal,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const mainLinks = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard },
  { label: "Jobs", path: "/jobs", icon: Wrench, count: "47" },
  { label: "Customers", path: "/customers", icon: Users },
  {
    label: "Master Setup",
    path: "/master-setup",
    icon: Settings,
  },
  {
    label: "Master Setting",
    path: "/master-setting",
    icon: SlidersHorizontal,
  },
  // { label: "WhatsApp", path: "/whatsapp", icon: MessageCircle },
];
function LinkGroup({ title, links, onNavigate }) {
  return (
    <div className="mb-6">
      <p className="mb-2 px-4 text-[10px] font-bold uppercase tracking-[1.5px] text-slate-400">
        {title}
      </p>
      <div className="space-y-1">
        {links.map(({ label, path, icon: Icon, count }) => (
          <NavLink
            key={path}
            to={path}
            end={path === "/"}
            onClick={onNavigate}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-2xl px-4 py-3 text-[13px] font-semibold transition-all duration-200 ${isActive ? "bg-violet-600 text-white shadow-lg shadow-violet-200" : "text-slate-600 hover:bg-violet-50 hover:text-violet-700"}`
            }
          >
            <Icon size={18} strokeWidth={2} />
            <span className="flex-1">{label}</span>
            {count && (
              <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-[10px] font-bold text-violet-700 group-[.active]:bg-white/20 group-[.active]:text-white">
                {count}
              </span>
            )}
          </NavLink>
        ))}
      </div>
    </div>
  );
}

export default function Sidebar({ open, onClose }) {
  const [accountOpen, setAccountOpen] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setAccountOpen(false);
    onClose();
    navigate("/login", { replace: true });
  };

  return (
    <>
      {open && (
        <button
          aria-label="Close menu"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[264px] flex-col border-r border-violet-100/80 bg-[#fcfbff] px-4 py-5 transition-transform duration-300 lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="mb-8 flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-base font-bold text-white shadow-lg shadow-violet-200">
              SB
            </div>
            <div>
              <h2 className="text-[15px] font-bold tracking-tight text-slate-800">
                Shree Bhanu
              </h2>
              <p className="text-[11px] font-medium text-slate-500">
                Technical Solutions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-violet-50 lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          <LinkGroup title="Workspace" links={mainLinks} onNavigate={onClose} />
        </div>

        <div className="mt-4">
          {accountOpen && (
            <div className="mb-2 overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-lg">
              <div className="px-4 py-3">
                <p className="text-sm font-bold text-slate-800">Admin</p>
                <p className="text-xs text-slate-500">Owner account</p>
              </div>
              <div className="border-t border-violet-100 p-1.5">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-violet-50 hover:text-violet-700"
                >
                  <LogOut size={18} />
                  Sign out
                </button>
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={() => setAccountOpen((isOpen) => !isOpen)}
            aria-expanded={accountOpen}
            className="flex w-full items-center gap-3 rounded-2xl border border-violet-100 bg-white p-3 text-left shadow-sm transition hover:border-violet-200"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700">
              AD
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-bold text-slate-800">
                Administrator
              </span>
              <span className="block truncate text-[10px] text-slate-400">
                Shop Owner
              </span>
            </span>
            <ChevronDown
              size={16}
              className={`text-slate-400 transition-transform ${accountOpen ? "rotate-180" : ""}`}
            />
          </button>
        </div>
        <div className="mt-3 flex items-center justify-center gap-1 text-[10px] text-slate-400">
          <ShieldCheck size={12} /> SBTS Admin · Version 1.0
        </div>
      </aside>
    </>
  );
}
