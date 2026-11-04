import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapPin,
  Phone,
  MessageCircle,
  CalendarDays,
  Plus,
  Search,
  Loader2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { getCustomerList } from "../../services/CustomerService";

const PAGE_SIZE = 10;

const getCustomerRows = (response) => {
  if (Array.isArray(response)) return response;

  const candidates = [
    response?.data,
    response?.data?.data,
    response?.obj,
    response?.result,
    response?.items,
    response?.records,
    response?.data?.items,
    response?.data?.records,
    response?.obj?.items,
    response?.obj?.records,
  ];

  return candidates.find(Array.isArray) || [];
};

const normalizeCustomer = (item, index) => ({
  id: item.id ?? item.Id ?? item.customerId ?? item.CustomerId ?? index,
  name:
    item.name ??
    item.Name ??
    item.customerName ??
    item.CustomerName ??
    "Unnamed Customer",
  code:
    item.code ||
    item.Code ||
    item.customerCode ||
    item.CustomerCode ||
    item.userName ||
    item.UserName ||
    "—",
  phone:
    item.phone ??
    item.Phone ??
    item.mobileNo ??
    item.MobileNo ??
    item.mobileNumber ??
    item.MobileNumber ??
    "—",
  cityName:
    item.cityName ??
    item.CityName ??
    item.city ??
    item.City ??
    item.village ??
    item.Village ??
    "—",
  whatsAppMobileNNo:
    item.whatsAppMobileNNo ??
    item.whatsAppMobileNo ??
    item.WhatsAppMobileNo ??
    item.whatsappMobileNo ??
    item.whatsAppNumber ??
    "",
  isActive: item.isActive ?? item.IsActive ?? null,
  jobs: item.jobs ?? item.Jobs ?? item.jobCount ?? item.JobCount ?? null,
  joined:
    item.joined ??
    item.Joined ??
    item.createdDate ??
    item.CreatedDate ??
    item.registrationDate ??
    item.RegistrationDate ??
    "",
});

const formatVisitDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
};

function CustomerIdentity({ customer }) {
  const initials = customer.name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-100 text-[11px] font-bold text-violet-700">
        {initials || "C"}
      </span>

      <span className="min-w-0">
        <span className="block truncate text-sm font-bold text-slate-800">
          {customer.name}
        </span>
        <span className="mt-0.5 block truncate text-[11px] text-slate-400">
          {customer.code}
        </span>
      </span>
    </div>
  );
}

function CustomerStatus({ isActive }) {
  const active = isActive === 1 || isActive === "1" || isActive === true;

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold ${
        active
          ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-100"
          : "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          active ? "bg-emerald-500" : "bg-slate-400"
        } ${active ? "customer-status-pulse" : ""}`}
      />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function NewJobButton({ onClick, compact = false, className = "" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-full font-bold text-violet-700 transition duration-200 hover:scale-[1.03] hover:bg-violet-600 hover:text-white active:scale-95 ${
        compact
          ? "border border-violet-200 px-3.5 py-2 text-xs"
          : "bg-violet-600 px-5 py-3 text-sm text-white shadow-lg shadow-violet-200 hover:bg-violet-700"
      } ${className}`}
    >
      <Plus size={compact ? 15 : 17} />
      New job
    </button>
  );
}

export default function CustomerList() {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [customers, setCustomers] = useState([]);
  const [pageNumber, setPageNumber] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchCustomers = async (
    searchKey = search.trim(),
    requestedPage = pageNumber,
  ) => {
    try {
      setLoading(true);
      setError("");

      const response = await getCustomerList({
        pageSize: PAGE_SIZE,
        pageNumber: requestedPage,
        searchKey,
      });

      const rows = getCustomerRows(response);
      setCustomers(rows.map(normalizeCustomer));
      const recordCount = Number(
        response?.totalRecords ??
          response?.totalCount ??
          response?.totalItems ??
          response?.recordCount ??
          response?.total ??
          response?.data?.totalRecords ??
          response?.data?.totalCount ??
          response?.data?.totalItems ??
          response?.obj?.totalRecords ??
          response?.obj?.totalCount,
      );
      setTotalRecords(Number.isFinite(recordCount) ? recordCount : null);
      setTotalPages(
        Math.max(
          1,
          Number(
            response?.totalPages ??
              response?.data?.totalPages ??
              response?.obj?.totalPages ??
              1,
          ) || 1,
        ),
      );
    } catch (err) {
      console.error("Customer List API Error:", err);

      setCustomers([]);
      setTotalPages(1);
      setTotalRecords(null);
      setError(
        err.response?.data?.message ||
          err.response?.data?.title ||
          "Unable to load customers. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(
      () => {
        fetchCustomers(search.trim(), pageNumber);
      },
      search.trim() ? 400 : 0,
    );

    return () => clearTimeout(timer);
  }, [search, pageNumber]);

  const startNewJob = () => navigate("/jobs-new");

  const filtered = useMemo(() => customers, [customers]);

  const summary = [
    { label: "Customers loaded", value: customers.length },
    { label: "Showing on this page", value: filtered.length },
    { label: "Pages available", value: totalPages },
  ];

  return (
    <div className="customer-motion w-full min-w-0">
      <header className="mb-5 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 gap-y-2 sm:flex sm:justify-between sm:items-center sm:gap-4">
        <div className="contents sm:block sm:min-w-0">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl lg:text-[30px]">
            Customers
          </h1>
          <p className="col-span-2 mt-0.5 text-xs text-slate-500 sm:mt-1 sm:text-sm">
            Manage and view your registered customers.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate("/customers/new")}
          className="col-start-2 row-start-1 inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-violet-600 px-3 py-2.5 text-xs font-bold text-white shadow-lg shadow-violet-200 transition hover:-translate-y-0.5 hover:bg-violet-700 sm:px-5 sm:py-3 sm:text-sm"
        >
          <Plus size={15} className="sm:h-[17px] sm:w-[17px]" />
          Add Customer
        </button>
      </header>

      <div className="customer-stagger mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        {summary.map((item, index) => (
          <div
            key={item.label}
            style={{ animationDelay: `${index * 70}ms` }}
            className={`customer-card min-w-0 rounded-[18px] border border-violet-100 bg-white p-3.5 shadow-sm sm:rounded-[20px] sm:p-5 ${
              index === 2 ? "col-span-2 sm:col-span-1" : ""
            }`}
          >
            <p className="truncate text-xs font-medium text-slate-500 sm:text-sm">
              {item.label}
            </p>
            <p className="mt-1.5 text-xl font-bold tracking-tight text-slate-900 sm:text-[28px]">
              {item.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mb-4 flex items-center gap-3 sm:justify-between">
        <label className="relative block min-w-0 flex-1 sm:max-w-sm">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPageNumber(1);
            }}
            placeholder="Search name, phone, code or village"
            className="h-11 w-full truncate rounded-full border border-violet-100 bg-white pl-11 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
          />
        </label>

        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={() => fetchCustomers(search.trim(), pageNumber)}
            disabled={loading}
            className="rounded-full border border-violet-200 bg-white p-2.5 text-violet-600 transition hover:bg-violet-50 disabled:opacity-50"
            title="Refresh customers"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      <section className="customer-panel overflow-hidden rounded-[18px] border border-violet-100 bg-white shadow-sm sm:rounded-[22px]">
        {loading ? (
          <div className="flex min-h-56 items-center justify-center gap-2 p-6 text-sm font-medium text-violet-600">
            <Loader2 size={20} className="animate-spin" />
            Loading customers...
          </div>
        ) : error ? (
          <div className="flex min-h-56 flex-col items-center justify-center gap-3 p-6 text-center">
            <p className="text-sm text-red-600">{error}</p>
            <button
              onClick={() => fetchCustomers(search.trim(), pageNumber)}
              className="rounded-full bg-violet-600 px-5 py-2 text-xs font-bold text-white hover:bg-violet-700"
            >
              Try Again
            </button>
          </div>
        ) : (
          <>
            {/* Desktop table (lg and up) */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[800px] text-left">
                <thead className="border-b border-violet-100 text-[11px] font-bold uppercase text-slate-400">
                  <tr>
                    {[
                      "Customer",
                      "Phone",
                      "Village",
                      "Status",
                      "Last visit",
                      "",
                    ].map((heading) => (
                      <th key={heading || "action"} className="px-5 py-4">
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-violet-100">
                  {filtered.map((customer, index) => (
                    <tr
                      key={customer.id}
                      style={{
                        animationDelay: `${Math.min(index, 8) * 45}ms`,
                      }}
                      className="customer-row transition-colors hover:bg-violet-50/40"
                    >
                      <td className="max-w-[260px] px-5 py-3.5">
                        <CustomerIdentity customer={customer} />
                      </td>

                      <td className="whitespace-nowrap px-5 py-3.5 text-sm text-slate-700">
                        {customer.phone}
                      </td>

                      <td className="max-w-[180px] truncate px-5 py-3.5 text-sm text-slate-800">
                        {customer.cityName}
                      </td>

                      <td className="px-5 py-3.5">
                        <CustomerStatus isActive={customer.isActive} />
                      </td>

                      <td className="whitespace-nowrap px-5 py-3.5 text-sm text-slate-600">
                        {formatVisitDate(customer.joined)}
                      </td>

                      {/* <td className="px-5 py-3.5 text-sm text-slate-400">
                        {customer.whatsAppMobileNNo || "—"}
                      </td> */}

                      <td className="px-5 py-3.5 text-right">
                        <NewJobButton compact onClick={startNewJob} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile + tablet cards (below lg) */}
            <div className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2 sm:gap-4 sm:p-4 lg:hidden">
              {filtered.map((customer, index) => (
                <article
                  key={customer.id}
                  style={{
                    animationDelay: `${Math.min(index, 8) * 45}ms`,
                  }}
                  className="customer-row flex min-w-0 flex-col gap-3 rounded-2xl border border-violet-100 bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <CustomerIdentity customer={customer} />
                    <CustomerStatus isActive={customer.isActive} />
                  </div>

                  <div className="grid grid-cols-1 gap-2 text-xs min-[400px]:grid-cols-2">
                    <span className="flex min-w-0 items-center gap-1.5 text-slate-600">
                      <Phone size={13} className="shrink-0 text-violet-500" />
                      <span className="truncate">{customer.phone}</span>
                    </span>

                    <span className="flex min-w-0 items-center gap-1.5 text-slate-600">
                      <MapPin size={13} className="shrink-0 text-violet-500" />
                      <span className="truncate">{customer.cityName}</span>
                    </span>

                    <span className="flex min-w-0 items-center gap-1.5 text-slate-600">
                      <MessageCircle
                        size={13}
                        className="shrink-0 text-violet-500"
                      />
                      <span className="truncate">
                        {customer.whatsAppMobileNNo || "—"}
                      </span>
                    </span>

                    <span className="flex min-w-0 items-center gap-1.5 text-slate-600">
                      <CalendarDays
                        size={13}
                        className="shrink-0 text-violet-500"
                      />
                      <span className="truncate">
                        {formatVisitDate(customer.joined)}
                      </span>
                    </span>
                  </div>

                  <NewJobButton
                    compact
                    onClick={startNewJob}
                    className="w-full"
                  />
                </article>
              ))}
            </div>

            {filtered.length === 0 && (
              <div className="p-10 text-center text-sm text-slate-400">
                No customers found.
              </div>
            )}
            {!loading && !error && (
              <div className="flex flex-col gap-3 border-t border-violet-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <span className="min-w-0 text-center text-xs text-slate-500 sm:text-left">
                  {filtered.length === 0
                    ? "Showing 0 records"
                    : `Showing ${(pageNumber - 1) * PAGE_SIZE + 1}–${Math.min(
                        (pageNumber - 1) * PAGE_SIZE + filtered.length,
                        totalRecords ?? Infinity,
                      )}${
                        totalRecords != null
                          ? ` of ${totalRecords}`
                          : ` records · Page ${pageNumber} of ${totalPages}`
                      }`}
                </span>
                <div className="flex w-full shrink-0 items-center gap-2 sm:w-auto">
                  <button
                    type="button"
                    onClick={() =>
                      setPageNumber((page) => Math.max(1, page - 1))
                    }
                    disabled={pageNumber === 1 || loading}
                    className="inline-flex flex-1 items-center justify-center gap-1 rounded-full border border-violet-200 px-3 py-2 text-xs font-bold text-violet-700 transition hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none"
                  >
                    <ChevronLeft size={15} />
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setPageNumber((page) => Math.min(totalPages, page + 1))
                    }
                    disabled={pageNumber === totalPages || loading}
                    className="inline-flex flex-1 items-center justify-center gap-1 rounded-full border border-violet-200 px-3 py-2 text-xs font-bold text-violet-700 transition hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none"
                  >
                    Next
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
