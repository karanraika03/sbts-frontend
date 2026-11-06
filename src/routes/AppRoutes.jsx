import { useState } from "react";
import {
  Routes,
  Route,
  Navigate,
  NavLink,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  Home,
  LayoutGrid,
  MessageCircle,
  Plus,
  ReceiptText,
  Wallet,
  HardHat,
  BarChart3,
  Settings,
  FileText,
  Wrench,
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import Dashboard from "../pages/dashboard/Dashboard";
import CustomerList from "../pages/customer/CustomerList";
import Customer from "../pages/customer/Customers";
import Jobs from "../pages/jobs/Jobs";
import NewJobs from "../pages/jobs/NewJobs";
import Inventory from "../pages/partsandinventory/Inventory";
import Placeholder from "../pages/Placeholder";
import Login from "../pages/auth/Login";
import WhatsApp from "../pages/whatsapp/WhatsApp";
import { useAuth } from "../context/AuthContext";

const pageInfo = {
  "/": "Dashboard",
  "/jobs": "Repair Jobs",
  "/jobs-new": "New Job",
  "/customers": "Customers",
  "/customers/new": "Add Customer",
  "/whatsapp": "WhatsApp",
  "/inventory": "Parts & Inventory",
  "/billing": "Billing & Invoices",
  "/expenses": "Expenses",
  "/technicians": "Technicians",
  "/reports": "Reports",
  "/settings": "Settings",
};

function MobileNavigation({ onMore }) {
  const navigate = useNavigate();
  const items = [
    { label: "Home", path: "/", icon: Home, end: true },
    { label: "Jobs", path: "/jobs", icon: Wrench },
    { label: "Messages", path: "/whatsapp", icon: MessageCircle },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-violet-100 bg-white/95 px-3 pt-2 backdrop-blur lg:hidden">
      <div className="grid h-[52px] grid-cols-5 items-center">
        <NavLink
          to={items[0].path}
          end={items[0].end}
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 text-[10px] font-medium ${isActive ? "text-violet-600" : "text-slate-500"}`
          }
        >
          <Home size={18} />
          Home
        </NavLink>
        <NavLink
          to={items[1].path}
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 text-[10px] font-medium ${isActive ? "text-violet-600" : "text-slate-500"}`
          }
        >
          <Wrench size={18} />
          Jobs
        </NavLink>
        <button
          type="button"
          aria-label="Create new job"
          onClick={() => navigate("/jobs-new")}
          className="mx-auto -mt-5 flex h-12 w-12 items-center justify-center rounded-full bg-violet-600 text-white shadow-lg shadow-violet-300 transition hover:bg-violet-700"
        >
          <Plus size={24} />
        </button>
        <NavLink
          to={items[2].path}
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 text-[10px] font-medium ${isActive ? "text-violet-600" : "text-slate-500"}`
          }
        >
          <MessageCircle size={18} />
          Messages
        </NavLink>
        <button
          type="button"
          onClick={onMore}
          className="flex flex-col items-center gap-0.5 text-[10px] font-medium text-slate-500"
        >
          <LayoutGrid size={18} />
          More
        </button>
      </div>
    </nav>
  );
}

function ProtectedRoute({ children }) {
  const { isAuthed } = useAuth();
  return isAuthed ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { isAuthed } = useAuth();
  return isAuthed ? <Navigate to="/" replace /> : children;
}

function Shell() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const title =
    pageInfo[location.pathname] ||
    (location.pathname.startsWith("/customers/")
      ? "Edit Customer"
      : "Dashboard");

  return (
    <div className="min-h-screen bg-[#f7f6fc]">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="min-h-screen lg:pl-[264px]">
        <main className="mx-auto max-w-[1800px] p-4 pb-24 sm:p-6 sm:pb-24 lg:p-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/jobs-new" element={<NewJobs />} />
            <Route path="/customers" element={<CustomerList />} />

            <Route path="/customers/new" element={<Customer />} />
            <Route path="/customers/:customerId/edit" element={<Customer />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/whatsapp" element={<WhatsApp />} />
            <Route
              path="/billing"
              element={
                <Placeholder
                  title="Billing & Invoices"
                  description="Create invoices, record payments and track outstanding balances."
                  actionLabel="Create Invoice"
                  icon={ReceiptText}
                />
              }
            />
            <Route
              path="/expenses"
              element={
                <Placeholder
                  title="Expenses"
                  description="Track shop purchases, operating costs and expenses."
                  actionLabel="Add Expense"
                  icon={Wallet}
                />
              }
            />
            <Route
              path="/technicians"
              element={
                <Placeholder
                  title="Technicians"
                  description="Manage technicians, assignments and workload."
                  actionLabel="Add Technician"
                  icon={HardHat}
                />
              }
            />
            <Route
              path="/reports"
              element={
                <Placeholder
                  title="Reports & Analytics"
                  description="Review shop performance, revenue and repair activity."
                  actionLabel="Export Report"
                  icon={BarChart3}
                />
              }
            />
            <Route
              path="/settings"
              element={
                <Placeholder
                  title="Settings"
                  description="Manage shop profile, preferences and admin settings."
                  actionLabel="Save Settings"
                  icon={Settings}
                />
              }
            />
            <Route
              path="*"
              element={
                <Placeholder
                  title="Page not found"
                  description="The requested page does not exist."
                  icon={FileText}
                />
              }
            />
          </Routes>
          <footer className="mt-8 hidden flex-col justify-between gap-2 border-t border-violet-100/80 pt-5 text-[10px] text-slate-400 sm:flex lg:flex-row">
            <span>© 2026 SBTS · Shree Bhanu Technical Solution</span>
            <span>Repair smarter. Serve better.</span>
          </footer>
        </main>
      </div>
      <MobileNavigation onMore={() => setMenuOpen(true)} />
    </div>
  );
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Shell />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
