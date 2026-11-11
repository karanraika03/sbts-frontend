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
  Tag,
} from "lucide-react";
import {
  getMasterTypeDetailList,
  getMasterTypeDetailById,
  createMasterTypeDetail,
  updateMasterTypeDetail,
  deleteMasterTypeDetail,
} from "../../../services/MasterDetailService";

import { getMasterTypeList } from "../../../services/MasterSetupService";
import { useToast } from "../../../context/ToastContext";
import ConfirmDialog from "../../../components/ConfirmDialog";

const PAGE_SIZE = 10;

const EMPTY_FORM = {
  name: "",
  masterTypeId: "",
  parentId: "",
  title: "",
  image: null,
  isActive: true,
};

const getDetailRows = (response) =>
  Array.isArray(response?.data?.list) ? response.data.list : null;

const normalizeDetail = (item) => ({
  id: item.id,
  name: item.name ?? "Unnamed Detail",
  title: item.title ?? "",
  masterTypeId: item.masterTypeId ?? "",
  masterTypeName: item.masterType ?? "",
  parentId: item.parentId ?? "",
  parentName: item.parent ?? "",
  imagePath: item.path ?? item.image ?? "",
  isActive: item.isActive ?? null,
});

const isActiveValue = (value) => value === 1 || value === "1" || value === true;

const getApiError = (err, fallback) =>
  err.response?.data?.message ||
  err.response?.data?.title ||
  err.message ||
  fallback;

const getInitials = (name, fallback) =>
  name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || fallback;

const buildPayload = (form, editingId, masterTypeName, parentName) => ({
  ...(editingId ? { id: editingId } : {}),
  serialNumber: 0,
  code: "",
  name: form.name.trim(),
  title: form.title.trim(),
  parentId: form.parentId === "" ? null : Number(form.parentId),
  staffId: 0,
  parentN: parentName,
  image: "",
  path: "",
  masterTypeId: Number(form.masterTypeId),
  masterTypeN: masterTypeName,
  isActive: form.isActive ? 1 : 0,
});

function DetailIdentity({ detail }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      {detail.imagePath ? (
        <img
          src={detail.imagePath}
          alt={detail.name}
          className="h-10 w-10 shrink-0 rounded-full bg-violet-50 object-cover ring-2 ring-white"
        />
      ) : (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-100 to-violet-200 text-[11px] font-bold text-violet-700 ring-2 ring-white">
          {getInitials(detail.name, "D")}
        </span>
      )}

      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold capitalize text-slate-800">
          {detail.name.toLowerCase()}
        </span>
        {detail.title && (
          <span className="mt-0.5 block truncate text-[11px] text-slate-400">
            {detail.title}
          </span>
        )}
      </span>
    </div>
  );
}

function DetailStatus({ isActive }) {
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
        title="Edit detail"
        aria-label="Edit detail"
        className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-600 ring-1 ring-inset ring-slate-200 transition duration-200 hover:bg-violet-600 hover:text-white hover:ring-violet-600 hover:shadow-md hover:shadow-violet-200 active:scale-95"
      >
        <Pencil size={16} strokeWidth={1.8} />
      </button>
      <button
        type="button"
        onClick={onDelete}
        disabled={deleting}
        title="Delete detail"
        aria-label="Delete detail"
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

function DetailViewModal({
  detailItem,
  masterTypeLabel,
  parentLabel,
  onClose,
  onEdit,
}) {
  const [fullDetail, setFullDetail] = useState(detailItem);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");

  useEffect(() => {
    let active = true;

    const fetchDetails = async () => {
      if (!detailItem) return;

      setFullDetail(detailItem);
      setDetailsLoading(true);
      setDetailsError("");

      try {
        const response = await getMasterTypeDetailById(detailItem.id);
        if (response?.success !== true || !response.data) {
          throw new Error(response?.message || "Details were not found.");
        }

        if (active) {
          setFullDetail(normalizeDetail(response.data));
        }
      } catch (error) {
        console.error("Get Master Detail API Error:", error);
        if (active) {
          setDetailsError(
            getApiError(error, "Unable to load details. Please try again."),
          );
        }
      } finally {
        if (active) setDetailsLoading(false);
      }
    };

    fetchDetails();
    return () => {
      active = false;
    };
  }, [detailItem?.id]);

  if (!detailItem) return null;

  const detail = fullDetail || detailItem;
  const rows = [
    ["Name", detail.name],
    ["Title", detail.title],
    ["Master type", detail.masterTypeName || masterTypeLabel],
    ["Parent", detail.parentName || parentLabel],
    ["Status", isActiveValue(detail.isActive) ? "Active" : "Inactive"],
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
        aria-labelledby="master-detail-title"
        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-violet-100 bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-7"
      >
        <div className="mb-6 flex items-start justify-between gap-4 border-b border-violet-100 pb-4">
          <div className="min-w-0">
            <h2
              id="master-detail-title"
              className="truncate text-xl font-bold text-slate-900 sm:text-2xl"
            >
              {detail.name}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Master detail information
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close master detail"
            className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid gap-5 sm:grid-cols-[190px_minmax(0,1fr)] sm:gap-6">
          <div>
            {detail.imagePath ? (
              <img
                src={detail.imagePath}
                alt={detail.name}
                className="aspect-[4/5] w-full rounded-2xl bg-violet-50 object-cover ring-1 ring-inset ring-violet-100"
              />
            ) : (
              <div className="flex aspect-[4/5] w-full items-center justify-center rounded-2xl bg-gradient-to-br from-violet-100 to-violet-200 text-4xl font-bold text-violet-700">
                {getInitials(detail.name, "D")}
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
            {rows.map(([label, value]) => (
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
            Edit detail
          </button>
        </div>
      </section>
    </div>
  );
}

export default function MasterDetails() {
  const showToast = useToast();
  const formRef = useRef(null);
  const fileInputRef = useRef(null);

  /* Form state */
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [existingImage, setExistingImage] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [masterTypeOptions, setMasterTypeOptions] = useState([]);
  const [parentOptions, setParentOptions] = useState([]);

  /* List state */
  const [search, setSearch] = useState("");
  const [details, setDetails] = useState([]);
  const [pageNumber, setPageNumber] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewingDetail, setViewingDetail] = useState(null);
  const [detailToDelete, setDetailToDelete] = useState(null);
  const [deletingDetailId, setDeletingDetailId] = useState(null);
  const [deleteError, setDeleteError] = useState("");

  const masterTypeNameById = useMemo(() => {
    const map = {};
    masterTypeOptions.forEach((option) => {
      map[String(option.id)] = option.name;
    });
    return map;
  }, [masterTypeOptions]);

  const parentNameById = useMemo(() => {
    const map = {};
    parentOptions.forEach((option) => {
      map[String(option.id)] = option.name;
    });
    return map;
  }, [parentOptions]);

  const getMasterTypeLabel = (item) =>
    item.masterTypeName ||
    (item.masterTypeId !== "" && item.masterTypeId !== null
      ? masterTypeNameById[String(item.masterTypeId)]
      : "") ||
    "—";

  const getParentLabel = (item) =>
    item.parentName ||
    (item.parentId !== "" && item.parentId !== null
      ? parentNameById[String(item.parentId)]
      : "") ||
    "—";

  /* Image preview for newly chosen file */
  useEffect(() => {
    if (!form.image) {
      setPreviewUrl("");
      return undefined;
    }
    const url = URL.createObjectURL(form.image);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [form.image]);

  const loadMasterTypeOptions = async () => {
    try {
      const response = await getMasterTypeList({
        pageSize: 1000,
        pageNumber: 1,
        searchKey: "",
      });
      if (response?.success !== true || !Array.isArray(response?.data?.list)) {
        throw new Error(
          response?.message || "Unexpected master type response.",
        );
      }
      setMasterTypeOptions(
        response.data.list.map(({ id, name }) => ({ id, name })),
      );
    } catch (err) {
      console.error("Master Type Options API Error:", err);
      setMasterTypeOptions([]);
    }
  };

  const loadParentOptions = async () => {
    try {
      const response = await getMasterTypeDetailList({
        pageSize: 1000,
        pageNumber: 1,
        searchKey: "",
      });
      const rows = getDetailRows(response);
      if (response?.success !== true || !rows) {
        throw new Error(
          response?.message || "Unexpected detail list response.",
        );
      }
      setParentOptions(rows.map(normalizeDetail));
    } catch (err) {
      console.error("Parent Options API Error:", err);
      setParentOptions([]);
    }
  };

  const fetchDetails = async (
    searchKey = search.trim(),
    requestedPage = pageNumber,
  ) => {
    try {
      setLoading(true);
      setError("");

      const response = await getMasterTypeDetailList({
        pageSize: PAGE_SIZE,
        pageNumber: requestedPage,
        searchKey,
      });

      const rows = getDetailRows(response);
      if (response?.success !== true || !rows) {
        throw new Error(
          response?.message || "Unexpected detail list response.",
        );
      }
      setDetails(rows.map(normalizeDetail));
      setTotalRecords(null);
      setTotalPages(Math.max(1, Number(response.data.totalPages) || 1));
    } catch (err) {
      console.error("Master Detail List API Error:", err);

      setDetails([]);
      setTotalPages(1);
      setTotalRecords(null);
      setError(
        getApiError(err, "Unable to load master details. Please try again."),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMasterTypeOptions();
    loadParentOptions();
  }, []);

  useEffect(() => {
    const timer = setTimeout(
      () => {
        fetchDetails(search.trim(), pageNumber);
      },
      search.trim() ? 400 : 0,
    );

    return () => clearTimeout(timer);
  }, [search, pageNumber]);

  /* Form handlers */
  const updateForm = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
    setFormError("");
  };

  const clearFileInput = () => {
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setExistingImage("");
    setErrors({});
    setFormError("");
    clearFileInput();
  };

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = "Name is required.";
    if (!form.masterTypeId) next.masterTypeId = "Master type is required.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    setSaving(true);
    setFormError("");

    try {
      const payload = buildPayload(
        form,
        editingId,
        masterTypeNameById[String(form.masterTypeId)] ?? "",
        parentNameById[String(form.parentId)] ?? "",
      );
      const response = editingId
        ? await updateMasterTypeDetail(payload)
        : await createMasterTypeDetail(payload);

      if (response?.success === false) {
        throw new Error(response?.message || "Unable to save master detail.");
      }

      showToast(
        editingId
          ? "Master detail updated successfully."
          : "Master detail created successfully.",
      );
      resetForm();
      loadParentOptions();

      if (editingId || pageNumber === 1) {
        await fetchDetails(search.trim(), pageNumber);
      } else {
        setPageNumber(1);
      }
    } catch (err) {
      console.error("Save Master Detail API Error:", err);
      setFormError(
        getApiError(err, "Unable to save master detail. Please try again."),
      );
    } finally {
      setSaving(false);
    }
  };

  const editDetail = async (item) => {
    setViewingDetail(null);
    setErrors({});
    setFormError("");

    try {
      const response = await getMasterTypeDetailById(item.id);

      if (response?.success !== true || !response?.data) {
        throw new Error(response?.message || "Master details were not found.");
      }

      const detail = normalizeDetail(response.data);

      setEditingId(detail.id);
      setExistingImage(detail.imagePath || "");
      clearFileInput();

      setForm({
        name: detail.name === "Unnamed Detail" ? "" : detail.name,
        masterTypeId: detail.masterTypeId ? String(detail.masterTypeId) : "",
        parentId: detail.parentId ? String(detail.parentId) : "",
        title: detail.title ?? "",
        image: null,
        isActive: isActiveValue(detail.isActive),
      });

      formRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    } catch (error) {
      console.error("Get Master Detail By ID API Error:", error);

      showToast(getApiError(error, "Unable to load master detail."));
    }
  };

  /* Delete handlers */
  const handleDeleteDetail = (item) => {
    setDeleteError("");
    setDetailToDelete(item);
  };

  const confirmDeleteDetail = async () => {
    if (!detailToDelete) return;
    const item = detailToDelete;
    setDeletingDetailId(item.id);
    setDeleteError("");

    try {
      const response = await deleteMasterTypeDetail(item.id);
      if (response?.success === false) {
        throw new Error(response.message || "Unable to delete master detail.");
      }
      setDetailToDelete(null);
      if (viewingDetail?.id === item.id) setViewingDetail(null);
      if (editingId === item.id) resetForm();
      showToast("Master detail deleted successfully.");
      loadParentOptions();

      if (details.length === 1 && pageNumber > 1) {
        setPageNumber((page) => page - 1);
      } else {
        await fetchDetails(search.trim(), pageNumber);
      }
    } catch (err) {
      console.error("Delete Master Detail API Error:", err);
      setDeleteError(
        getApiError(err, "Unable to delete master detail. Please try again."),
      );
    } finally {
      setDeletingDetailId(null);
    }
  };

  const filtered = useMemo(() => details, [details]);

  const summary = [
    { label: "Details loaded", value: details.length },
    { label: "Showing on this page", value: filtered.length },
    { label: "Pages available", value: totalPages },
  ];

  const availableParents = parentOptions.filter(
    (option) => String(option.id) !== String(editingId ?? ""),
  );

  const inputBase =
    "h-11 w-full rounded-xl border bg-white px-4 text-sm outline-none transition placeholder:text-slate-400 focus:ring-4";
  const inputOk =
    "border-violet-100 focus:border-violet-300 focus:ring-violet-100";
  const inputBad = "border-rose-300 focus:border-rose-300 focus:ring-rose-100";

  const shownPreview = previewUrl || existingImage;

  return (
    <div className="customer-motion w-full min-w-0">
      <header className="mb-5">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl lg:text-[30px]">
          Master Details
        </h1>
        <p className="mt-0.5 text-xs text-slate-500 sm:mt-1 sm:text-sm">
          Create and manage your master detail records.
        </p>
      </header>

      {/* Create / Edit form */}
      <section
        ref={formRef}
        className="customer-panel mb-6 overflow-hidden rounded-[18px] border border-violet-100 bg-white shadow-sm sm:rounded-[22px]"
      >
        <div className="flex items-center justify-between gap-3 border-b border-violet-100 bg-violet-50/60 px-4 py-3.5 sm:px-6">
          <h2 className="text-sm font-bold text-slate-800 sm:text-base">
            {editingId
              ? "Master detail setup edit"
              : "Master detail setup create"}
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
                  title="e.g., City / Faculty / University at a Glance / Trends"
                  className="text-slate-400"
                >
                  <Info size={14} strokeWidth={1.8} />
                </span>
              </span>
              <input
                value={form.name}
                onChange={(event) => updateForm("name", event.target.value)}
                placeholder="e.g., City/FacultyUniversity at a Glance/Trends"
                className={`${inputBase} ${errors.name ? inputBad : inputOk}`}
              />
              {errors.name && (
                <span
                  className="mt-1 block text-[11px] text-rose-600"
                  role="alert"
                >
                  {errors.name}
                </span>
              )}
            </label>

            {/* Master type */}
            <label className="block min-w-0">
              <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                <span>
                  MasterType<span className="text-rose-500">*</span>
                </span>
                <span title="Select the master type" className="text-slate-400">
                  <Info size={14} strokeWidth={1.8} />
                </span>
              </span>
              <select
                value={form.masterTypeId}
                onChange={(event) =>
                  updateForm("masterTypeId", event.target.value)
                }
                className={`${inputBase} text-slate-800 ${
                  errors.masterTypeId ? inputBad : inputOk
                }`}
              >
                <option value="">Choose option</option>
                {masterTypeOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
              {errors.masterTypeId && (
                <span
                  className="mt-1 block text-[11px] text-rose-600"
                  role="alert"
                >
                  {errors.masterTypeId}
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
                className={`${inputBase} text-slate-800 ${inputOk}`}
              >
                <option value="">Choose option</option>
                {availableParents.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </label>

            {/* Title */}
            <label className="block min-w-0">
              <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                <span>Title</span>
                <span
                  title="e.g., City / Faculty / University at a Glance / Trends"
                  className="text-slate-400"
                >
                  <Info size={14} strokeWidth={1.8} />
                </span>
              </span>
              <input
                value={form.title}
                onChange={(event) => updateForm("title", event.target.value)}
                placeholder="e.g., City/FacultyUniversity at a Glance/Trends"
                className={`${inputBase} ${inputOk}`}
              />
            </label>

            {/* Image */}
            <div className="min-w-0">
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Image
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    updateForm("image", event.target.files?.[0] || null)
                  }
                  className="block h-11 w-full cursor-pointer rounded-xl border border-violet-100 bg-white text-sm text-slate-600 outline-none transition file:mr-3 file:h-full file:cursor-pointer file:border-0 file:bg-violet-50 file:px-4 file:text-xs file:font-semibold file:text-violet-700 hover:file:bg-violet-100 focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
                />
              </label>
              <p className="mt-1.5 text-[11px] text-slate-500">
                Upload image (JPG, PNG, etc.)
              </p>
              {shownPreview && (
                <div className="mt-2 flex items-center gap-3">
                  <img
                    src={shownPreview}
                    alt="Preview"
                    className="h-14 w-14 rounded-xl bg-violet-50 object-cover ring-1 ring-inset ring-violet-100"
                  />
                  {form.image && (
                    <button
                      type="button"
                      onClick={() => {
                        updateForm("image", null);
                        clearFileInput();
                      }}
                      className="text-[11px] font-semibold text-rose-600 hover:underline"
                    >
                      Remove selected
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* IsActive toggle */}
            <div className="min-w-0">
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
              className="inline-flex items-center justify-center gap-1.5 rounded-full bg-violet-600 px-5 py-2 text-xs font-bold uppercase tracking-wide text-white shadow-lg shadow-violet-200 transition hover:-translate-y-0.5 hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
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
              className="rounded-full border border-slate-200 px-5 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
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
            placeholder="Search name, title or type"
            className="h-11 w-full truncate rounded-full border border-violet-100 bg-white pl-11 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
          />
        </label>

        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={() => fetchDetails(search.trim(), pageNumber)}
            disabled={loading}
            className="rounded-full border border-violet-200 bg-white p-2.5 text-violet-600 transition hover:bg-violet-50 disabled:opacity-50"
            title="Refresh master details"
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
            Loading master details...
          </div>
        ) : error ? (
          <div className="flex min-h-56 flex-col items-center justify-center gap-3 p-6 text-center">
            <p className="text-sm text-red-600">{error}</p>
            <button
              onClick={() => fetchDetails(search.trim(), pageNumber)}
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
                  <col className="w-[30%]" />
                  <col className="w-[20%]" />
                  <col className="w-[20%]" />
                  <col className="w-[14%]" />
                  <col className="w-[16%]" />
                </colgroup>

                <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur">
                  <tr className="border-b border-violet-100 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-3.5">Detail</th>
                    <th className="px-5 py-3.5">Master type</th>
                    <th className="px-5 py-3.5">Parent</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-violet-50">
                  {filtered.map((item, index) => (
                    <tr
                      key={item.id}
                      style={{
                        animationDelay: `${Math.min(index, 8) * 45}ms`,
                      }}
                      className="customer-row transition-colors hover:bg-violet-50/50"
                    >
                      <td className="px-5 py-3">
                        <DetailIdentity detail={item} />
                      </td>

                      <td className="px-5 py-3">
                        <span className="flex min-w-0 items-center gap-1.5 text-sm text-slate-700">
                          <Tag
                            size={14}
                            strokeWidth={1.8}
                            className="shrink-0 text-violet-400"
                          />
                          <span className="truncate">
                            {getMasterTypeLabel(item)}
                          </span>
                        </span>
                      </td>

                      <td className="px-5 py-3">
                        <span className="flex min-w-0 items-center gap-1.5 text-sm text-slate-700">
                          <Layers
                            size={14}
                            strokeWidth={1.8}
                            className="shrink-0 text-violet-400"
                          />
                          <span className="truncate">
                            {getParentLabel(item)}
                          </span>
                        </span>
                      </td>

                      <td className="px-5 py-3">
                        <DetailStatus isActive={item.isActive} />
                      </td>

                      <td className="px-5 py-3">
                        <IconActions
                          onView={() => setViewingDetail(item)}
                          onEdit={() => editDetail(item)}
                          onDelete={() => handleDeleteDetail(item)}
                          deleting={deletingDetailId === item.id}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile + tablet cards (below lg) */}
            <div className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2 sm:gap-4 sm:p-4 lg:hidden">
              {filtered.map((item, index) => (
                <article
                  key={item.id}
                  style={{
                    animationDelay: `${Math.min(index, 8) * 45}ms`,
                  }}
                  className="customer-row flex min-w-0 flex-col gap-3 rounded-2xl border border-violet-100 bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <DetailIdentity detail={item} />
                    <DetailStatus isActive={item.isActive} />
                  </div>

                  <div className="grid grid-cols-1 gap-2 text-xs min-[400px]:grid-cols-2">
                    <span className="flex min-w-0 items-center gap-1.5 text-slate-600">
                      <Tag
                        size={13}
                        strokeWidth={1.8}
                        className="shrink-0 text-violet-500"
                      />
                      <span className="truncate">
                        {getMasterTypeLabel(item)}
                      </span>
                    </span>

                    <span className="flex min-w-0 items-center gap-1.5 text-slate-600">
                      <Layers
                        size={13}
                        strokeWidth={1.8}
                        className="shrink-0 text-violet-500"
                      />
                      <span className="truncate">{getParentLabel(item)}</span>
                    </span>
                  </div>

                  <CardActions
                    onView={() => setViewingDetail(item)}
                    onEdit={() => editDetail(item)}
                    onDelete={() => handleDeleteDetail(item)}
                    deleting={deletingDetailId === item.id}
                  />
                </article>
              ))}
            </div>

            {filtered.length === 0 && (
              <div className="p-10 text-center text-sm text-slate-400">
                No master details found.
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

      <DetailViewModal
        detailItem={viewingDetail}
        masterTypeLabel={
          viewingDetail ? getMasterTypeLabel(viewingDetail) : "—"
        }
        parentLabel={viewingDetail ? getParentLabel(viewingDetail) : "—"}
        onClose={() => setViewingDetail(null)}
        onEdit={() => editDetail(viewingDetail)}
      />
      <ConfirmDialog
        open={Boolean(detailToDelete)}
        title="Delete master detail?"
        description="Are you sure you want to delete"
        itemName={detailToDelete?.name}
        itemMeta={`ID: ${detailToDelete?.id ?? ""}`}
        warning="This will permanently remove the master detail from your records."
        confirmText="Delete Detail"
        loading={deletingDetailId === detailToDelete?.id}
        error={deleteError}
        onCancel={() => {
          setDetailToDelete(null);
          setDeleteError("");
        }}
        onConfirm={confirmDeleteDetail}
      />
    </div>
  );
}
