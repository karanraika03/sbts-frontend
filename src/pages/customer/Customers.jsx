import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, RefreshCw, Upload, X } from "lucide-react";
import {
  createCustomer,
  updateCustomer,
  getCustomerById,
  getGenders,
  getStates,
} from "../../services/CustomerService";

const DISTRICT_OPTIONS = [];
const CITY_OPTIONS = [];

const getDropdownRows = (response, label) => {
  if (!Array.isArray(response)) {
    throw new Error(`The ${label} list response must be an array.`);
  }
  return response;
};

const normalizeDropdownOption = ({ id, name }) => {
  if (id == null || name == null || String(name).trim() === "") return null;
  return { value: String(id), text: String(name) };
};

const initialForm = {
  name: "",
  genderId: "",
  email: "",
  mobileNo: "",
  whatsAppMobileNo: "",
  address: "",
  landMark: "",
  stateId: "",
  districtId: "",
  cityId: "",
};

const inputClass =
  "h-11 w-full rounded-xl border border-violet-100 bg-white px-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-violet-300 focus:ring-4 focus:ring-violet-100";

function Field({ label, required, error, children, className = "" }) {
  return (
    <label className={`block min-w-0 ${className}`}>
      <span className="mb-1.5 block text-xs font-bold text-slate-600">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </span>
      {children}
      {error && (
        <span className="mt-1 block text-[11px] text-red-500">{error}</span>
      )}
    </label>
  );
}

function SectionTitle({ title, subtitle }) {
  return (
    <div className="mb-4">
      <h2 className="text-base font-bold text-slate-900">{title}</h2>
      {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
    </div>
  );
}

export default function Customer() {
  const navigate = useNavigate();
  const { customerId } = useParams();

  const [form, setForm] = useState(initialForm);
  const [genderOptions, setGenderOptions] = useState([]);
  const [genderLoading, setGenderLoading] = useState(true);
  const [genderError, setGenderError] = useState("");
  const [genderRetry, setGenderRetry] = useState(0);
  const [stateOptions, setStateOptions] = useState([]);
  const [stateLoading, setStateLoading] = useState(true);
  const [stateError, setStateError] = useState("");
  const [stateRetry, setStateRetry] = useState(0);
  const [sameAsMobile, setSameAsMobile] = useState(false);
  const [image, setImage] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");

  useEffect(() => {
    let active = true;

    const fetchGenders = async () => {
      setGenderLoading(true);
      setGenderError("");

      try {
        const response = await getGenders();
        const options = getDropdownRows(response, "gender")
          .map(normalizeDropdownOption)
          .filter(Boolean);

        if (options.length === 0) {
          throw new Error("No gender options are available.");
        }

        if (active) setGenderOptions(options);
      } catch (err) {
        console.error("Get Genders API Error:", err);
        if (active) {
          setGenderOptions([]);
          setGenderError(
            err.response?.data?.message ||
              err.response?.data?.title ||
              err.message ||
              "Unable to load genders. Please try again.",
          );
        }
      } finally {
        if (active) setGenderLoading(false);
      }
    };

    fetchGenders();
    return () => {
      active = false;
    };
  }, [genderRetry]);

  useEffect(() => {
    let active = true;

    const fetchStates = async () => {
      setStateLoading(true);
      setStateError("");

      try {
        const response = await getStates();
        const options = getDropdownRows(response, "state")
          .map(normalizeDropdownOption)
          .filter(Boolean);

        if (options.length === 0) {
          throw new Error("No state options are available.");
        }

        if (active) setStateOptions(options);
      } catch (err) {
        console.error("Get States API Error:", err);
        if (active) {
          setStateOptions([]);
          setStateError(
            err.response?.data?.message ||
              err.response?.data?.title ||
              err.message ||
              "Unable to load states. Please try again.",
          );
        }
      } finally {
        if (active) setStateLoading(false);
      }
    };

    fetchStates();
    return () => {
      active = false;
    };
  }, [stateRetry]);

  const imagePreview = useMemo(
    () => (image ? URL.createObjectURL(image) : ""),
    [image],
  );

  const setValue = (key, value) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "mobileNo" && sameAsMobile) next.whatsAppMobileNo = value;
      if (key === "stateId") {
        next.districtId = "";
        next.cityId = "";
      }
      if (key === "districtId") next.cityId = "";
      return next;
    });
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const handleChange = (key) => (event) => setValue(key, event.target.value);

  const handleDigits = (key) => (event) =>
    setValue(key, event.target.value.replace(/\D/g, "").slice(0, 10));

  const handleSameAsMobile = (event) => {
    const checked = event.target.checked;
    setSameAsMobile(checked);
    if (checked)
      setForm((prev) => ({ ...prev, whatsAppMobileNo: prev.mobileNo }));
  };

  const handleImage = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setErrors((prev) => ({ ...prev, image: "Please select an image file." }));
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, image: "Image must be under 2 MB." }));
      return;
    }
    setErrors((prev) => ({ ...prev, image: "" }));
    setImage(file);
  };

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = "Full name is required.";
    if (!form.genderId) next.genderId = "Select gender.";
    if (form.email.trim() && !/^\S+@\S+\.\S+$/.test(form.email.trim()))
      next.email = "Enter a valid email.";
    if (!/^\d{10}$/.test(form.mobileNo))
      next.mobileNo = "Enter a 10 digit mobile number.";
    if (form.whatsAppMobileNo && !/^\d{10}$/.test(form.whatsAppMobileNo))
      next.whatsAppMobileNo = "Enter a 10 digit WhatsApp number.";
    if (!form.address.trim()) next.address = "Address is required.";

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  useEffect(() => {
    const fetchCustomer = async () => {
      if (!customerId) return;

      try {
        setSubmitting(true);

        const response = await getCustomerById(customerId);

        if (response?.success && response?.data?.length > 0) {
          const customer = response.data[0];

          setForm((prev) => ({
            ...prev,
            name: customer.name || "",
            genderId: String(customer.genderId ?? customer.GenderId ?? ""),
            email: customer.email || "",
            mobileNo: customer.mobileNo || "",
            whatsAppMobileNo: customer.whatsAppMobileNNo || "",
            address: customer.address || "",
            landMark: customer.landMark || "",
            stateId: String(customer.stateId ?? customer.StateId ?? ""),
            districtId: String(customer.districtId ?? customer.DistrictId ?? ""),
            cityId: String(customer.cityId ?? customer.CityId ?? ""),
          }));

          // Existing profile image preview ke liye
          // Agar tumhare form mein image preview state hai:
          // setImagePreview(customer.profilePath || "");
        }
      } catch (err) {
        console.error("Get Customer API Error:", err);
        setApiError(
          err.response?.data?.message || "Unable to fetch customer details.",
        );
      } finally {
        setSubmitting(false);
      }
    };

    fetchCustomer();
  }, [customerId]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setApiError("");

    if (!validate()) return;

    try {
      setSubmitting(true);

      const payload = new FormData();

      // Update ke liye Id
      if (customerId) {
        payload.append("Id", customerId);
      }

      payload.append("Name", form.name.trim());
      payload.append("Email", form.email.trim());
      payload.append("MobileNo", form.mobileNo);
      payload.append("WhatsAppMobileNo", form.whatsAppMobileNo);
      payload.append("Address", form.address.trim());
      payload.append("LandMark", form.landMark.trim());
      payload.append("GenderId", form.genderId);
      payload.append("CityId", form.cityId || 0);
      payload.append("IsActive", 1);

      if (image) {
        payload.append("ImagePath", image);
      }

      if (customerId) {
        await updateCustomer(payload);
      } else {
        await createCustomer(payload);
      }

      navigate("/customers");
    } catch (err) {
      console.error("Customer Save API Error:", err);

      setApiError(
        err.response?.data?.message ||
          err.response?.data?.title ||
          "Unable to save customer. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };
  const handleReset = () => {
    setForm(initialForm);
    setSameAsMobile(false);
    setImage(null);
    setErrors({});
    setApiError("");
  };

  const renderOptions = (options, placeholder) => (
    <>
      <option value="">{placeholder}</option>
      {options.map((item) => (
        <option key={item.value} value={item.value}>
          {item.text}
        </option>
      ))}
    </>
  );

  return (
    <div className="customer-motion w-full min-w-0">
      <header className="mb-6 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate("/customers")}
          className="shrink-0 rounded-full border border-violet-200 p-2 text-violet-600 hover:bg-violet-50"
        >
          <ArrowLeft size={18} />
        </button>

        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl lg:text-[30px]">
            {customerId ? "Edit Customer" : "Add Customer"}
          </h1>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            {customerId
              ? "Update the registered customer details."
              : "Enter customer details to register a new customer."}
          </p>
        </div>
      </header>

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {/* Personal info */}
        <section className="rounded-[18px] border border-violet-100 bg-white p-4 shadow-sm sm:rounded-[22px] sm:p-6">
          <SectionTitle
            title="Personal info"
            subtitle="Basic details of the customer."
          />

          <div className="flex flex-col gap-5 sm:flex-row">
            {/* Photo */}
            <div className="flex shrink-0 flex-col items-center gap-2 sm:w-36">
              <div className="relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-violet-200 bg-violet-50 text-violet-400">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Customer preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Upload size={26} />
                )}
              </div>

              <div className="flex items-center gap-2">
                <label className="cursor-pointer rounded-full border border-violet-200 px-3 py-1.5 text-[11px] font-bold text-violet-700 transition hover:bg-violet-50">
                  {image ? "Change" : "Upload photo"}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImage}
                    className="hidden"
                  />
                </label>
                {image && (
                  <button
                    type="button"
                    onClick={() => setImage(null)}
                    className="rounded-full border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50"
                    title="Remove photo"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
              {errors.image && (
                <span className="text-center text-[11px] text-red-500">
                  {errors.image}
                </span>
              )}
            </div>

            {/* Fields */}
            <div className="grid min-w-0 flex-1 grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Full name" required error={errors.name}>
                <input
                  value={form.name}
                  onChange={handleChange("name")}
                  placeholder="Enter full name"
                  className={inputClass}
                />
              </Field>

              <Field label="Gender" required error={errors.genderId}>
                <select
                  value={form.genderId}
                  onChange={handleChange("genderId")}
                  disabled={genderLoading || Boolean(genderError)}
                  className={inputClass}
                >
                  {renderOptions(
                    genderOptions,
                    genderLoading ? "Loading genders..." : "Select gender",
                  )}
                </select>
                {genderError && (
                  <span className="mt-1 flex items-center justify-between gap-2 text-[11px] text-red-500">
                    <span>{genderError}</span>
                    <button
                      type="button"
                      onClick={() => setGenderRetry((attempt) => attempt + 1)}
                      className="inline-flex shrink-0 items-center gap-1 font-bold text-violet-600 hover:text-violet-800"
                    >
                      <RefreshCw size={12} />
                      Retry
                    </button>
                  </span>
                )}
              </Field>

              <Field label="Email" error={errors.email}>
                <input
                  type="email"
                  value={form.email}
                  onChange={handleChange("email")}
                  placeholder="name@example.com"
                  className={inputClass}
                />
              </Field>

              <Field label="Mobile number" required error={errors.mobileNo}>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={form.mobileNo}
                  onChange={handleDigits("mobileNo")}
                  placeholder="10 digit mobile number"
                  className={inputClass}
                />
              </Field>

              <div className="md:col-span-2">
                <Field label="WhatsApp number" error={errors.whatsAppMobileNo}>
                  <input
                    type="tel"
                    inputMode="numeric"
                    value={form.whatsAppMobileNo}
                    onChange={handleDigits("whatsAppMobileNo")}
                    disabled={sameAsMobile}
                    placeholder="10 digit WhatsApp number"
                    className={`${inputClass} disabled:bg-slate-50 disabled:text-slate-500`}
                  />
                </Field>

                <label className="mt-2 inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-600">
                  <input
                    type="checkbox"
                    checked={sameAsMobile}
                    onChange={handleSameAsMobile}
                    className="h-4 w-4 rounded border-violet-300 accent-violet-600"
                  />
                  Same as mobile number
                </label>
              </div>
            </div>
          </div>
        </section>

        {/* Address info */}
        <section className="rounded-[18px] border border-violet-100 bg-white p-4 shadow-sm sm:rounded-[22px] sm:p-6">
          <SectionTitle
            title="Address info"
            subtitle="Where the customer lives."
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field
              label="Address"
              required
              error={errors.address}
              className="md:col-span-2"
            >
              <textarea
                rows={3}
                value={form.address}
                onChange={handleChange("address")}
                placeholder="House no., street, area"
                className="w-full resize-none rounded-xl border border-violet-100 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
              />
            </Field>

            <Field label="Landmark" className="md:col-span-2">
              <input
                value={form.landMark}
                onChange={handleChange("landMark")}
                placeholder="Nearby landmark"
                className={inputClass}
              />
            </Field>

            <Field label="State">
              <select
                value={form.stateId}
                onChange={handleChange("stateId")}
                disabled={stateLoading || Boolean(stateError)}
                className={inputClass}
              >
                {renderOptions(
                  stateOptions,
                  stateLoading ? "Loading states..." : "Select state",
                )}
              </select>
              {stateError && (
                <span className="mt-1 flex items-center justify-between gap-2 text-[11px] text-red-500">
                  <span>{stateError}</span>
                  <button
                    type="button"
                    onClick={() => setStateRetry((attempt) => attempt + 1)}
                    className="inline-flex shrink-0 items-center gap-1 font-bold text-violet-600 hover:text-violet-800"
                  >
                    <RefreshCw size={12} />
                    Retry
                  </button>
                </span>
              )}
            </Field>

            <Field label="District">
              <select
                value={form.districtId}
                onChange={handleChange("districtId")}
                className={inputClass}
              >
                {renderOptions(DISTRICT_OPTIONS, "Select district")}
              </select>
            </Field>

            <Field label="City / Village">
              <select
                value={form.cityId}
                onChange={handleChange("cityId")}
                className={inputClass}
              >
                {renderOptions(CITY_OPTIONS, "Select city / village")}
              </select>
            </Field>
          </div>
        </section>

        {apiError && (
          <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
            {apiError}
          </p>
        )}

        {/* Actions */}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={handleReset}
            disabled={submitting}
            className="inline-flex items-center justify-center rounded-full border border-violet-200 px-6 py-3 text-sm font-bold text-violet-700 transition hover:bg-violet-50 disabled:opacity-50"
          >
            Reset
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-violet-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-violet-200 transition hover:-translate-y-0.5 hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting && <Loader2 size={16} className="animate-spin" />}
            {submitting
              ? customerId
                ? "Updating..."
                : "Saving..."
              : customerId
                ? "Update Customer"
                : "Save Customer"}
          </button>
        </div>
      </form>
    </div>
  );
}
