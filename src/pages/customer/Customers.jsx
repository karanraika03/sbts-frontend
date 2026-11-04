import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function Customer() {
  const navigate = useNavigate();

  return (
    <div className="customer-motion">
      <header className="mb-6 flex items-center gap-3">
        <button
          onClick={() => navigate("/customers")}
          className="rounded-full border border-violet-200 p-2 text-violet-600 hover:bg-violet-50"
        >
          <ArrowLeft size={18} />
        </button>

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-[30px]">
            Add Customer
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Enter customer details to register a new customer.
          </p>
        </div>
      </header>

      <section className="rounded-[22px] border border-violet-100 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-500">
          Customer form will be added here.
        </p>
      </section>
    </div>
  );
}
