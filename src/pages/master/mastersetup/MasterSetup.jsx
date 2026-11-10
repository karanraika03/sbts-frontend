import { useEffect, useMemo, useRef, useState } from "react";
import {
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
  Info,
  Layers,
  CalendarDays,
  Hash,
} from "lucide-react";
import {
  deleteMasterType,
  getMasterTypeById,
  getMasterTypeList,
  createMasterType,
  updateMasterType,
} from "../../../services/MasterSetupService";
import { useToast } from "../../../context/ToastContext";
import ConfirmDialog from "../../../components/ConfirmDialog";

const PAGE_SIZE = 10;

const EMPTY_FORM = {
  name: "",
  parentId: "",
  serialNumber: "",
  isActive: true,
};

const getMasterRows = (response) => {
  return Array.isArray(response?.data?.list) ? response.data.list : null;
};

const normalizeMaster = (item) => ({
  id: item.id,
  name: item.name ?? "Unnamed Master",
  parentId: item.parentId ?? "",
  parentName: item.parent ?? "",
  serialNumber: item.serialNumber ?? "",
  isActive: item.isActive ?? null,
  created: item.createdDate ?? "",
});

const isActiveValue = (value) => value === 1 || value === "1" || value === true;

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const getApiError = (err, fallback) =>
  err.response?.data?.message ||
  err.response?.data?.title ||
  err.message ||
  fallback;

const buildPayload = (form, editingId) => ({
  ...(editingId ? { id: editingId } : {}),
  name: form.name.trim(),
  parentId: form.parentId === "" ? null : Number(form.parentId),
  serialNumber: form.serialNumber === "" ? null : Number(form.serialNumber),
  isActive: form.isActive ? 1 : 0,
});

function MasterIdentity({ master, parentLabel }) {
  const initials = master.name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-100 to-violet-200 text-[11px] font-bold text-violet-700 ring-2 ring-white">
        {initials || "M"}
      </span>

      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold capitalize text-slate-800">
          {master.name.toLowerCase()}
        </span>
        {parentLabel !== "—" && (
          <span className="mt-0.5 block truncate text-[11px] text-slate-400">
            {parentLabel}
          </span>
        )}
      </span>
    </div>
  );
}

function MasterStatus({ isActive }) {
  const active = isActiveValue(isActive);

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
function IconActions({ onView, onEdit, onDelete, deleting, editing }) {
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
        disabled={editing || deleting}
        title="Edit master"
        aria-label="Edit master"
        className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-600 ring-1 ring-inset ring-slate-200 transition duration-200 hover:bg-violet-600 hover:text-white hover:ring-violet-600 hover:shadow-md hover:shadow-violet-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {editing ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Pencil size={16} strokeWidth={1.8} />
        )}
      </button>
      <button
        type="button"
        onClick={onDelete}
        disabled={deleting}
        title="Delete master"
        aria-label="Delete master"
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
function CardActions({ onView, onEdit, onDelete, deleting, editing }) {
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
        disabled={deleting || editing}
        className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl bg-violet-600 text-xs font-semibold leading-none text-white transition hover:bg-violet-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {editing ? (
          <Loader2 size={15} className="animate-spin" />
        ) : (
          <Pencil size={15} strokeWidth={1.8} />
        )}
        {editing ? "Loading..." : "Edit"}
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

function MasterDetailsModal({ master, parentLabel, onClose, onEdit }) {
  const [detailsMaster, setDetailsMaster] = useState(master);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");

  useEffect(() => {
    let active = true;

    const fetchMasterDetails = async () => {
      if (!master) return;

      setDetailsMaster(master);
      setDetailsLoading(true);
      setDetailsError("");

      try {
        const response = await getMasterTypeById(master.id);
        const detail =
          response?.data?.data ??
          response?.data ??
          response?.result ??
          response;

        if (!detail || !detail.id) {
          throw new Error("Master details were not found.");
        }

        if (active) {
          setDetailsMaster(normalizeMaster(detail));
        }
      } catch (error) {
        console.error("Get Master Details API Error:", error);
        if (active) {
          setDetailsError(
            getApiError(
              error,
              "Unable to load master details. Please try again.",
            ),
          );
        }
      } finally {
        if (active) setDetailsLoading(false);
      }
    };

    fetchMasterDetails();
    return () => {
      active = false;
    };
  }, [master?.id]);

  if (!master) return null;

  const detail = detailsMaster || master;
  const details = [
    ["Name", detail.name],
    ["Parent", detail.parentName || parentLabel],
    ["Serial number", detail.serialNumber],
    ["Status", isActiveValue(detail.isActive) ? "Active" : "Inactive"],
    ["Created on", formatDate(detail.created)],
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
        aria-labelledby="master-details-title"
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-violet-100 bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-7"
      >
        <div className="mb-6 flex items-start justify-between gap-4 border-b border-violet-100 pb-4">
          <div className="min-w-0">
            <h2
              id="master-details-title"
              className="truncate text-xl font-bold text-slate-900 sm:text-2xl"
            >
              {detail.name}
            </h2>
            <p className="mt-1 text-xs text-slate-500">Master information</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close master details"
            className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid content-start grid-cols-1 gap-3 sm:grid-cols-2">
          {details.map(([label, value]) => (
            <div
              key={label}
              className="min-w-0 rounded-xl border border-violet-100 bg-violet-50/60 p-3.5"
            >
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                {label}
              </p>
              <p className="mt-1.5 break-words text-sm font-medium text-slate-800">
                {value || "—"}
              </p>
            </div>
          ))}
          {detailsLoading && (
            <p className="text-xs text-slate-500 sm:col-span-2" role="status">
              Loading details...
            </p>
          )}
          {detailsError && (
            <p className="text-xs text-red-600 sm:col-span-2" role="alert">
              {detailsError}
            </p>
          )}
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
            disabled={detailsLoading}
            className="inline-flex items-center gap-1.5 rounded-full bg-violet-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-violet-700"
          >
            <Pencil size={14} strokeWidth={1.8} />
            Edit master
          </button>
        </div>
      </section>
    </div>
  );
}

export default function MasterSetupList() {
  const showToast = useToast();
  const formRef = useRef(null);

  /* Form state */
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [nameError, setNameError] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [editLoadingId, setEditLoadingId] = useState(null);
  const [parentOptions, setParentOptions] = useState([]);

  /* List state */
  const [search, setSearch] = useState("");
  const [masters, setMasters] = useState([]);
  const [pageNumber, setPageNumber] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewingMaster, setViewingMaster] = useState(null);
  const [masterToDelete, setMasterToDelete] = useState(null);
  const [deletingMasterId, setDeletingMasterId] = useState(null);
  const [deleteError, setDeleteError] = useState("");

  const parentNameById = useMemo(() => {
    const map = {};
    parentOptions.forEach((option) => {
      map[String(option.id)] = option.name;
    });
    return map;
  }, [parentOptions]);

  const getParentLabel = (master) =>
    master.parentName ||
    (master.parentId !== "" && master.parentId !== null
      ? parentNameById[String(master.parentId)]
      : "") ||
    "—";

  const loadParentOptions = async () => {
    try {
      const response = await getMasterTypeList({
        pageSize: 1000,
        pageNumber: 1,
        searchKey: "",
      });
      const rows = getMasterRows(response);
      if (response?.success !== true || !rows) {
        throw new Error(response?.message || "Unable to load master options.");
      }
      setParentOptions(rows.map(normalizeMaster));
    } catch (err) {
      console.error("Parent Options API Error:", err);
      setParentOptions([]);
    }
  };

  const fetchMasters = async (
    searchKey = search.trim(),
    requestedPage = pageNumber,
  ) => {
    try {
      setLoading(true);
      setError("");

      const response = await getMasterTypeList({
        pageSize: PAGE_SIZE,
        pageNumber: requestedPage,
        searchKey,
      });

      const rows = getMasterRows(response);
      if (response?.success !== true || !rows) {
        throw new Error(
          response?.message || "Unexpected master list response.",
        );
      }
      setMasters(rows.map(normalizeMaster));
      setTotalPages(Math.max(1, Number(response.data.totalPages) || 1));
      setTotalRecords(null);
    } catch (err) {
      console.error("Master Setup List API Error:", err);

      setMasters([]);
      setTotalPages(1);
      setTotalRecords(null);
      setError(
        getApiError(err, "Unable to load master setup. Please try again."),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadParentOptions();
  }, []);

  useEffect(() => {
    const timer = setTimeout(
      () => {
        fetchMasters(search.trim(), pageNumber);
      },
      search.trim() ? 400 : 0,
    );

    return () => clearTimeout(timer);
  }, [search, pageNumber]);

  /* Form handlers */
  const updateForm = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === "name") setNameError("");
    setFormError("");
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setNameError("");
    setFormError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.name.trim()) {
      setNameError("Name is required.");
      return;
    }

    setSaving(true);
    setFormError("");

    try {
      const payload = buildPayload(form, editingId);
      const response = editingId
        ? await updateMasterType(payload)
        : await createMasterType(payload);

      if (response?.success === false) {
        throw new Error(response?.message || "Unable to save master setup.");
      }

      showToast(
        editingId
          ? "Master updated successfully."
          : "Master created successfully.",
      );
      resetForm();
      loadParentOptions();

      if (editingId || pageNumber === 1) {
        await fetchMasters(search.trim(), pageNumber);
      } else {
        setPageNumber(1);
      }
    } catch (err) {
      console.error("Save Master Setup API Error:", err);
      setFormError(
        getApiError(err, "Unable to save master setup. Please try again."),
      );
    } finally {
      setSaving(false);
    }
  };

  const editMaster = async (master) => {
    setViewingMaster(null);
    setNameError("");
    setFormError("");
    setEditLoadingId(master.id);

    try {
      const response = await getMasterTypeById(master.id);

      // API direct object ya wrapped object dono handle karega
      const detail =
        response?.data?.data ?? response?.data ?? response?.result ?? response;

      if (!detail || !detail.id) {
        throw new Error("Master details were not found.");
      }

      setEditingId(detail.id);

      setForm({
        name: detail.name ?? "",
        parentId:
          detail.parentId === null || detail.parentId === undefined
            ? ""
            : String(detail.parentId),
        serialNumber: detail.serialNumber ?? "",
        isActive: isActiveValue(detail.isActive),
      });

      formRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    } catch (error) {
      console.error("Get Master Type By ID API Error:", error);

      setFormError(
        getApiError(error, "Unable to load master details. Please try again."),
      );

      formRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    } finally {
      setEditLoadingId(null);
    }
  };

  /* Delete handlers */
  const handleDeleteMaster = (master) => {
    setDeleteError("");
    setMasterToDelete(master);
  };

  const confirmDeleteMaster = async () => {
    if (!masterToDelete) return;
    const master = masterToDelete;
    setDeletingMasterId(master.id);
    setDeleteError("");

    try {
      const response = await deleteMasterType(master.id);
      if (response?.success === false) {
        throw new Error(response.message || "Unable to delete master.");
      }
      setMasterToDelete(null);
      if (viewingMaster?.id === master.id) setViewingMaster(null);
      if (editingId === master.id) resetForm();
      showToast("Master deleted successfully.");
      loadParentOptions();

      if (masters.length === 1 && pageNumber > 1) {
        setPageNumber((page) => page - 1);
      } else {
        await fetchMasters(search.trim(), pageNumber);
      }
    } catch (err) {
      console.error("Delete Master Setup API Error:", err);
      setDeleteError(
        getApiError(err, "Unable to delete master. Please try again."),
      );
    } finally {
      setDeletingMasterId(null);
    }
  };

  const filtered = useMemo(() => masters, [masters]);

  const summary = [
    { label: "Masters loaded", value: masters.length },
    { label: "Showing on this page", value: filtered.length },
    { label: "Pages available", value: totalPages },
  ];

  const availableParents = parentOptions.filter(
    (option) => String(option.id) !== String(editingId ?? ""),
  );

  return (
    <div className="customer-motion w-full min-w-0">
      <header className="mb-5">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl lg:text-[30px]">
          Master Setup
        </h1>
        <p className="mt-0.5 text-xs text-slate-500 sm:mt-1 sm:text-sm">
          Create and manage your master setup records.
        </p>
      </header>

      {/* Create / Edit form */}
      <section
        ref={formRef}
        className="customer-panel mb-6 overflow-hidden rounded-[18px] border border-violet-100 bg-white shadow-sm sm:rounded-[22px]"
      >
        <div className="flex items-center justify-between gap-3 border-b border-violet-100 bg-violet-50/60 px-4 py-3.5 sm:px-6">
          <h2 className="text-sm font-bold text-slate-800 sm:text-base">
            {editingId ? "Master setup edit" : "Master setup create"}
          </h2>
          {editingId && (
            <span className="rounded-full bg-violet-100 px-2.5 py-1 text-[11px] font-semibold text-violet-700">
              Editing ID: {editingId}
            </span>
          )}
        </div>

        <form onSubmit={handleSubmit} noValidate className="p-4 sm:p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Name */}
            <label className="block min-w-0">
              <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                <span>
                  Name<span className="text-rose-500">*</span>
                </span>
                <span
                  title="e.g., Category / LocationType / Department"
                  className="text-slate-400"
                >
                  <Info size={14} strokeWidth={1.8} />
                </span>
              </span>
              <input
                value={form.name}
                onChange={(event) => updateForm("name", event.target.value)}
                placeholder="e.g., Category/LocationType/Department"
                className={`h-11 w-full rounded-xl border bg-white px-4 text-sm outline-none transition placeholder:text-slate-400 focus:ring-4 ${
                  nameError
                    ? "border-rose-300 focus:border-rose-300 focus:ring-rose-100"
                    : "border-violet-100 focus:border-violet-300 focus:ring-violet-100"
                }`}
              />
              {nameError && (
                <span
                  className="mt-1 block text-[11px] text-rose-600"
                  role="alert"
                >
                  {nameError}
                </span>
              )}
            </label>

            {/* Parent */}
            <label className="block min-w-0">
              <span className="mb-1.5 block text-xs font-semibold text-slate-700">
                Parent
              </span>
              <select
                value={form.parentId}
                onChange={(event) => updateForm("parentId", event.target.value)}
                className="h-11 w-full rounded-xl border border-violet-100 bg-white px-4 text-sm text-slate-800 outline-none transition focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
              >
                <option value="">choose option</option>
                {availableParents.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </label>

            {/* Serial Number */}
            <label className="block min-w-0">
              <span className="mb-1.5 block text-xs font-semibold text-slate-700">
                Serial Number
              </span>
              <input
                type="number"
                step="any"
                value={form.serialNumber}
                onChange={(event) =>
                  updateForm("serialNumber", event.target.value)
                }
                placeholder="e.g., 1.23"
                className="h-11 w-full rounded-xl border border-violet-100 bg-white px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
              />
            </label>
          </div>

          {/* IsActive toggle */}
          <div className="mt-4">
            <span className="mb-2 block text-xs font-semibold text-slate-700">
              IsActive
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                role="switch"
                aria-checked={form.isActive}
                aria-label="Toggle active status"
                onClick={() => updateForm("isActive", !form.isActive)}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-violet-100 ${
                  form.isActive ? "bg-emerald-500" : "bg-slate-300"
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ${
                    form.isActive ? "translate-x-[22px]" : "translate-x-0.5"
                  }`}
                />
              </button>
              <span
                className={`text-xs font-bold ${
                  form.isActive ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                {form.isActive ? "Enabled" : "Disabled"}
              </span>
            </div>
          </div>

          {formError && (
            <p className="mt-4 text-xs text-red-600" role="alert">
              {formError}
            </p>
          )}

          <div className="mt-5 flex items-center gap-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-1.5 rounded-full bg-violet-600 px-5 py-2.5 text-xs font-bold uppercase tracking-wide text-white shadow-lg shadow-violet-200 transition hover:-translate-y-0.5 hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {saving ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Plus size={15} />
              )}
              {editingId ? "Update" : "Submit"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              disabled={saving}
              className="rounded-full border border-slate-200 px-5 py-2.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </section>

      {/* Summary cards */}
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

      {/* Search + refresh */}
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
            placeholder="Search name or parent"
            className="h-11 w-full truncate rounded-full border border-violet-100 bg-white pl-11 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
          />
        </label>

        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={() => fetchMasters(search.trim(), pageNumber)}
            disabled={loading}
            className="rounded-full border border-violet-200 bg-white p-2.5 text-violet-600 transition hover:bg-violet-50 disabled:opacity-50"
            title="Refresh master setup"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* List */}
      <section className="customer-panel overflow-hidden rounded-[18px] border border-violet-100 bg-white shadow-sm sm:rounded-[22px]">
        {loading ? (
          <div className="flex min-h-56 items-center justify-center gap-2 p-6 text-sm font-medium text-violet-600">
            <Loader2 size={20} className="animate-spin" />
            Loading master setup...
          </div>
        ) : error ? (
          <div className="flex min-h-56 flex-col items-center justify-center gap-3 p-6 text-center">
            <p className="text-sm text-red-600">{error}</p>
            <button
              onClick={() => fetchMasters(search.trim(), pageNumber)}
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
                  <col className="w-[18%]" />
                  <col className="w-[12%]" />
                  <col className="w-[13%]" />
                  <col className="w-[15%]" />
                  <col className="w-[14%]" />
                </colgroup>

                <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur">
                  <tr className="border-b border-violet-100 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-3.5">Name</th>
                    <th className="px-5 py-3.5">Parent</th>
                    <th className="px-5 py-3.5">Serial no.</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Created</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-violet-50">
                  {filtered.map((master, index) => (
                    <tr
                      key={master.id}
                      style={{
                        animationDelay: `${Math.min(index, 8) * 45}ms`,
                      }}
                      className="customer-row transition-colors hover:bg-violet-50/50"
                    >
                      <td className="px-5 py-3">
                        <MasterIdentity master={master} parentLabel="—" />
                      </td>

                      <td className="px-5 py-3">
                        <span className="flex min-w-0 items-center gap-1.5 text-sm text-slate-700">
                          <Layers
                            size={14}
                            strokeWidth={1.8}
                            className="shrink-0 text-violet-400"
                          />
                          <span className="truncate">
                            {getParentLabel(master)}
                          </span>
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-5 py-3 text-sm font-medium tabular-nums text-slate-700">
                        {master.serialNumber !== "" &&
                        master.serialNumber !== null
                          ? master.serialNumber
                          : "—"}
                      </td>

                      <td className="px-5 py-3">
                        <MasterStatus isActive={master.isActive} />
                      </td>

                      <td className="whitespace-nowrap px-5 py-3 text-sm text-slate-500">
                        {formatDate(master.created)}
                      </td>

                      <td className="px-5 py-3">
                        <IconActions
                          onView={() => setViewingMaster(master)}
                          onEdit={() => editMaster(master)}
                          onDelete={() => handleDeleteMaster(master)}
                          deleting={deletingMasterId === master.id}
                          editing={editLoadingId === master.id}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile + tablet cards (below lg) */}
            <div className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2 sm:gap-4 sm:p-4 lg:hidden">
              {filtered.map((master, index) => (
                <article
                  key={master.id}
                  style={{
                    animationDelay: `${Math.min(index, 8) * 45}ms`,
                  }}
                  className="customer-row flex min-w-0 flex-col gap-3 rounded-2xl border border-violet-100 bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <MasterIdentity master={master} parentLabel="—" />
                    <MasterStatus isActive={master.isActive} />
                  </div>

                  <div className="grid grid-cols-1 gap-2 text-xs min-[400px]:grid-cols-2">
                    <span className="flex min-w-0 items-center gap-1.5 text-slate-600">
                      <Layers
                        size={13}
                        strokeWidth={1.8}
                        className="shrink-0 text-violet-500"
                      />
                      <span className="truncate">{getParentLabel(master)}</span>
                    </span>

                    <span className="flex min-w-0 items-center gap-1.5 text-slate-600">
                      <Hash
                        size={13}
                        strokeWidth={1.8}
                        className="shrink-0 text-violet-500"
                      />
                      <span className="truncate">
                        {master.serialNumber !== "" &&
                        master.serialNumber !== null
                          ? master.serialNumber
                          : "—"}
                      </span>
                    </span>

                    <span className="flex min-w-0 items-center gap-1.5 text-slate-600">
                      <CalendarDays
                        size={13}
                        strokeWidth={1.8}
                        className="shrink-0 text-violet-500"
                      />
                      <span className="truncate">
                        {formatDate(master.created)}
                      </span>
                    </span>
                  </div>

                  <CardActions
                    onView={() => setViewingMaster(master)}
                    onEdit={() => editMaster(master)}
                    onDelete={() => handleDeleteMaster(master)}
                    deleting={deletingMasterId === master.id}
                    editing={editLoadingId === master.id}
                  />
                </article>
              ))}
            </div>

            {filtered.length === 0 && (
              <div className="p-10 text-center text-sm text-slate-400">
                No master setup found.
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

      <MasterDetailsModal
        master={viewingMaster}
        parentLabel={viewingMaster ? getParentLabel(viewingMaster) : "—"}
        onClose={() => setViewingMaster(null)}
        onEdit={() => editMaster(viewingMaster)}
      />
      <ConfirmDialog
        open={Boolean(masterToDelete)}
        title="Delete master?"
        description="Are you sure you want to delete"
        itemName={masterToDelete?.name}
        itemMeta={`ID: ${masterToDelete?.id ?? ""}`}
        warning="This will permanently remove the master from your records."
        confirmText="Delete Master"
        loading={deletingMasterId === masterToDelete?.id}
        error={deleteError}
        onCancel={() => {
          setMasterToDelete(null);
          setDeleteError("");
        }}
        onConfirm={confirmDeleteMaster}
      />
    </div>
  );
}
