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
  Eye,
  Pencil,
  X,
  Trash2,
} from "lucide-react";
import {
  getCustomerList,
  getCustomerById,
  deleteCustomer,
} from "../../services/CustomerService";
import { useToast } from "../../context/ToastContext";
import ConfirmDialog from "../../components/ConfirmDialog";

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
  districtId: item.districtId ?? item.DistrictId ?? "",
  districtName:
    item.districtName ??
    item.DistrictName ??
    item.district ??
    item.District ??
    "",
  cityId: item.cityId ?? item.CityId ?? "",
  whatsAppMobileNNo:
    item.whatsAppMobileNNo ??
    item.whatsAppMobileNo ??
    item.WhatsAppMobileNo ??
    item.whatsappMobileNo ??
    item.whatsAppNumber ??
    "",
  email: item.email ?? item.Email ?? "",
  gender:
    item.genderName ?? item.GenderName ?? item.gender ?? item.Gender ?? "",
  address: item.address ?? item.Address ?? "",
  landMark: item.landMark ?? item.LandMark ?? "",
  profilePath: item.profilePath ?? item.ProfilePath ?? "",
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

  const hasCode = customer.code && customer.code !== "—";

  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-100 to-violet-200 text-[11px] font-bold text-violet-700 ring-2 ring-white">
        {initials || "C"}
      </span>

      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold capitalize text-slate-800">
          {customer.name.toLowerCase()}
        </span>
        {hasCode && (
          <span className="mt-0.5 block truncate text-[11px] text-slate-400">
            {customer.code}
          </span>
        )}
      </span>
    </div>
  );
}

function CustomerStatus({ isActive }) {
  const active = isActive === 1 || isActive === "1" || isActive === true;

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
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

/* Compact icon buttons (table) */
function IconActions({ onView, onEdit, onDelete, deleting }) {
  return (
    <div className="flex items-center justify-end gap-1.5">
      <button
        type="button"
        onClick={onView}
        title="View details"
        aria-label="View details"
        className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600 ring-1 ring-inset ring-violet-100 transition duration-200 hover:bg-violet-600 hover:text-white hover:shadow-md hover:shadow-violet-200 active:scale-95"
      >
        <Eye size={16} strokeWidth={1.8} />
      </button>
      <button
        type="button"
        onClick={onEdit}
        title="Edit customer"
        aria-label="Edit customer"
        className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-600 ring-1 ring-inset ring-slate-200 transition duration-200 hover:bg-violet-600 hover:text-white hover:ring-violet-600 hover:shadow-md hover:shadow-violet-200 active:scale-95"
      >
        <Pencil size={16} strokeWidth={1.8} />
      </button>
      <button
        type="button"
        onClick={onDelete}
        disabled={deleting}
        title="Delete customer"
        aria-label="Delete customer"
        className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600 ring-1 ring-inset ring-rose-100 transition hover:bg-rose-600 hover:text-white hover:ring-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {deleting ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Trash2 size={16} strokeWidth={1.8} />
        )}
      </button>
    </div>
  );
}

/* Labeled buttons (mobile cards) */
function CardActions({ onView, onEdit, onDelete, deleting }) {
  return (
    <div className="flex w-full items-center gap-2">
      <button
        type="button"
        onClick={onView}
        className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl bg-violet-50 text-xs font-semibold leading-none text-violet-700 ring-1 ring-inset ring-violet-100 transition hover:bg-violet-100 active:scale-95"
      >
        <Eye size={15} strokeWidth={1.8} />
        View
      </button>
      <button
        type="button"
        onClick={onEdit}
        disabled={deleting}
        className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl bg-violet-600 text-xs font-semibold leading-none text-white transition hover:bg-violet-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Pencil size={15} strokeWidth={1.8} />
        Edit
      </button>
      <button
        type="button"
        onClick={onDelete}
        disabled={deleting}
        className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl bg-rose-50 text-xs font-semibold leading-none text-rose-700 ring-1 ring-inset ring-rose-100 transition hover:bg-rose-100 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {deleting ? (
          <Loader2 size={15} className="animate-spin" />
        ) : (
          <Trash2 size={15} strokeWidth={1.8} />
        )}
        Delete
      </button>
    </div>
  );
}

function CustomerDetailsModal({ customer, onClose, onEdit }) {
  const [detailsCustomer, setDetailsCustomer] = useState(customer);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");

  useEffect(() => {
    let active = true;

    const fetchCustomerDetails = async () => {
      if (!customer) return;

      setDetailsCustomer(customer);
      setDetailsLoading(true);
      setDetailsError("");

      try {
        const response = await getCustomerById(customer.id);
        const rows = getCustomerRows(response);
        if (response?.success === false || rows.length === 0) {
          throw new Error(
            response?.message || "Customer details were not found.",
          );
        }

        if (active) {
          setDetailsCustomer(normalizeCustomer(rows[0], customer.id));
        }
      } catch (error) {
        console.error("Get Customer Details API Error:", error);
        if (active) {
          setDetailsError(
            error.response?.data?.message ||
              error.response?.data?.title ||
              error.message ||
              "Unable to load customer details. Please try again.",
          );
        }
      } finally {
        if (active) setDetailsLoading(false);
      }
    };

    fetchCustomerDetails();
    return () => {
      active = false;
    };
  }, [customer?.id]);

  if (!customer) return null;

  const detail = detailsCustomer || customer;
  const details = [
    ["Phone number", detail.phone],
    ["Email", detail.email],
    ["Gender", detail.gender],
    ["District", detail.districtName],
    ["City", detail.cityName],
    ["Status", detail.isActive ? "Active" : "Inactive"],
    ["Address", detail.address],
  ];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="customer-details-title"
        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-violet-100 bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-7"
      >
        <div className="mb-6 flex items-start justify-between gap-4 border-b border-violet-100 pb-4">
          <div className="min-w-0">
            <h2
              id="customer-details-title"
              className="truncate text-xl font-bold text-slate-900 sm:text-2xl"
            >
              {detail.name}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Customer information
              {detail.code && detail.code !== "—" ? ` · ${detail.code}` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close customer details"
            className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid gap-5 sm:grid-cols-[190px_minmax(0,1fr)] sm:gap-6">
          <div>
            {detail.profilePath ? (
              <img
                src={detail.profilePath}
                alt={`${detail.name} profile`}
                className="aspect-[4/5] w-full rounded-2xl bg-violet-50 object-cover ring-1 ring-inset ring-violet-100"
              />
            ) : (
              <div className="flex aspect-[4/5] w-full items-center justify-center rounded-2xl bg-gradient-to-br from-violet-100 to-violet-200 text-4xl font-bold text-violet-700">
                {detail.name
                  .split(" ")
                  .filter(Boolean)
                  .map((part) => part[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase() || "C"}
              </div>
            )}
            {detailsLoading && (
              <p
                className="mt-2 text-center text-xs text-slate-500"
                role="status"
              >
                Loading details...
              </p>
            )}
          </div>

          <div className="grid content-start grid-cols-1 gap-3 sm:grid-cols-2">
            {details.map(([label, value]) => (
              <div
                key={label}
                className={`min-w-0 rounded-xl border border-violet-100 bg-violet-50/60 p-3.5 ${
                  label === "Address" ? "sm:col-span-2" : ""
                }`}
              >
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  {label}
                </p>
                <p className="mt-1.5 break-words text-sm font-medium text-slate-800">
                  {value || "—"}
                </p>
              </div>
            ))}
            {detailsError && (
              <p className="text-xs text-red-600 sm:col-span-2" role="alert">
                {detailsError}
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2 border-t border-violet-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
          >
            Close
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-1.5 rounded-full bg-violet-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-violet-700"
          >
            <Pencil size={14} strokeWidth={1.8} />
            Edit customer
          </button>
        </div>
      </section>
    </div>
  );
}

export default function CustomerList() {
  const navigate = useNavigate();
  const showToast = useToast();

  const [search, setSearch] = useState("");
  const [customers, setCustomers] = useState([]);
  const [pageNumber, setPageNumber] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewingCustomer, setViewingCustomer] = useState(null);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [deletingCustomerId, setDeletingCustomerId] = useState(null);
  const [deleteError, setDeleteError] = useState("");

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

  const editCustomer = (customer) => {
    setViewingCustomer(null);
    navigate(`/customers/${customer.id}/edit`);
  };

  const handleDeleteCustomer = (customer) => {
    setDeleteError("");
    setCustomerToDelete(customer);
  };

  const confirmDeleteCustomer = async () => {
    if (!customerToDelete) return;
    const customer = customerToDelete;
    setDeletingCustomerId(customer.id);
    setDeleteError("");

    try {
      await deleteCustomer(customer.id);
      setCustomerToDelete(null);
      if (viewingCustomer?.id === customer.id) setViewingCustomer(null);
      showToast("Customer deleted successfully.");

      if (customers.length === 1 && pageNumber > 1) {
        setPageNumber((page) => page - 1);
      } else {
        await fetchCustomers(search.trim(), pageNumber);
      }
    } catch (err) {
      console.error("Delete Customer API Error:", err);
      setDeleteError(
        err.response?.data?.message ||
          err.response?.data?.title ||
          err.message ||
          "Unable to delete customer. Please try again.",
      );
    } finally {
      setDeletingCustomerId(null);
    }
  };

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
              <table className="w-full min-w-[820px] table-fixed text-left">
                <colgroup>
                  <col className="w-[28%]" />
                  <col className="w-[16%]" />
                  <col className="w-[18%]" />
                  <col className="w-[13%]" />
                  <col className="w-[13%]" />
                  <col className="w-[12%]" />
                </colgroup>

                <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur">
                  <tr className="border-b border-violet-100 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-3.5">Customer</th>
                    <th className="px-5 py-3.5">Phone</th>
                    <th className="px-5 py-3.5">Location</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Last visit</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-violet-50">
                  {filtered.map((customer, index) => (
                    <tr
                      key={customer.id}
                      style={{
                        animationDelay: `${Math.min(index, 8) * 45}ms`,
                      }}
                      className="customer-row transition-colors hover:bg-violet-50/50"
                    >
                      <td className="px-5 py-3">
                        <CustomerIdentity customer={customer} />
                      </td>

                      <td className="whitespace-nowrap px-5 py-3 text-sm font-medium tabular-nums text-slate-700">
                        {customer.phone}
                      </td>

                      <td className="px-5 py-3">
                        <span className="flex min-w-0 items-center gap-1.5 text-sm text-slate-700">
                          <MapPin
                            size={14}
                            strokeWidth={1.8}
                            className="shrink-0 text-violet-400"
                          />
                          <span className="truncate">{customer.cityName}</span>
                        </span>
                      </td>

                      <td className="px-5 py-3">
                        <CustomerStatus isActive={customer.isActive} />
                      </td>

                      <td className="whitespace-nowrap px-5 py-3 text-sm text-slate-500">
                        {formatVisitDate(customer.joined)}
                      </td>

                      <td className="px-5 py-3">
                        <IconActions
                          onView={() => setViewingCustomer(customer)}
                          onEdit={() => editCustomer(customer)}
                          onDelete={() => handleDeleteCustomer(customer)}
                          deleting={deletingCustomerId === customer.id}
                        />
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
                      <Phone
                        size={13}
                        strokeWidth={1.8}
                        className="shrink-0 text-violet-500"
                      />
                      <span className="truncate">{customer.phone}</span>
                    </span>

                    <span className="flex min-w-0 items-center gap-1.5 text-slate-600">
                      <MapPin
                        size={13}
                        strokeWidth={1.8}
                        className="shrink-0 text-violet-500"
                      />
                      <span className="truncate">{customer.cityName}</span>
                    </span>

                    <span className="flex min-w-0 items-center gap-1.5 text-slate-600">
                      <MessageCircle
                        size={13}
                        strokeWidth={1.8}
                        className="shrink-0 text-violet-500"
                      />
                      <span className="truncate">
                        {customer.whatsAppMobileNNo || "—"}
                      </span>
                    </span>

                    <span className="flex min-w-0 items-center gap-1.5 text-slate-600">
                      <CalendarDays
                        size={13}
                        strokeWidth={1.8}
                        className="shrink-0 text-violet-500"
                      />
                      <span className="truncate">
                        {formatVisitDate(customer.joined)}
                      </span>
                    </span>
                  </div>

                  <CardActions
                    onView={() => setViewingCustomer(customer)}
                    onEdit={() => editCustomer(customer)}
                    onDelete={() => handleDeleteCustomer(customer)}
                    deleting={deletingCustomerId === customer.id}
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
      <CustomerDetailsModal
        customer={viewingCustomer}
        onClose={() => setViewingCustomer(null)}
        onEdit={() => editCustomer(viewingCustomer)}
      />
      <ConfirmDialog
        open={Boolean(customerToDelete)}
        title="Delete customer?"
        description="Are you sure you want to delete"
        itemName={customerToDelete?.name}
        itemMeta={`ID: ${customerToDelete?.id ?? ""}`}
        warning="This will permanently remove the customer from your records."
        confirmText="Delete Customer"
        loading={deletingCustomerId === customerToDelete?.id}
        error={deleteError}
        onCancel={() => {
          setCustomerToDelete(null);
          setDeleteError("");
        }}
        onConfirm={confirmDeleteCustomer}
      />
    </div>
  );
}
