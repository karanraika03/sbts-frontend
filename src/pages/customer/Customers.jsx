import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, RefreshCw, Upload, X } from "lucide-react";
import {
  createCustomer,
  updateCustomer,
  getCustomerById,
  getGenders,
  getCitiesByDistrict,
  getDistricts,
} from "../../services/CustomerService";
import { useToast } from "../../context/ToastContext";

const getDropdownRows = (response, label) => {
  if (Array.isArray(response)) return response;
  if (response && typeof response === "object" && "id" in response) {
    return [response];
  }
  throw new Error(`The ${label} list response must be an array or an option.`);
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
  isActive: true,
};

const inputClass =
  "h-11 w-full rounded-xl border border-violet-100 bg-white px-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-violet-200 focus:border-violet-300 focus:ring-4 focus:ring-violet-100";

/* stagger helper: delay in ms */
const dly = (ms) => ({ animationDelay: `${ms}ms` });

function Field({
  label,
  required,
  error,
  children,
  className = "",
  delay = 0,
}) {
  return (
    <label style={dly(delay)} className={`cm-up block min-w-0 ${className}`}>
      <span className="mb-1.5 block text-xs font-bold text-slate-600">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </span>
      {children}
      {error && (
        <span className="cm-err mt-1 block text-[11px] text-red-500">
          {error}
        </span>
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
  const showToast = useToast();

  const [form, setForm] = useState(initialForm);
  const [genderOptions, setGenderOptions] = useState([]);
  const [genderLoading, setGenderLoading] = useState(true);
  const [genderError, setGenderError] = useState("");
  const [genderRetry, setGenderRetry] = useState(0);
  const [districtOptions, setDistrictOptions] = useState([]);
  const [districtLoading, setDistrictLoading] = useState(true);
  const [districtError, setDistrictError] = useState("");
  const [districtRetry, setDistrictRetry] = useState(0);
  const [cityOptions, setCityOptions] = useState([]);
  const [cityLoading, setCityLoading] = useState(false);
  const [cityError, setCityError] = useState("");
  const [cityRetry, setCityRetry] = useState(0);
  const [image, setImage] = useState(null);
  const [profilePath, setProfilePath] = useState("");
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

    const fetchDistricts = async () => {
      setDistrictLoading(true);
      setDistrictError("");

      try {
        const response = await getDistricts();
        const options = getDropdownRows(response, "district")
          .map(normalizeDropdownOption)
          .filter(Boolean);

        if (active) setDistrictOptions(options);
      } catch (err) {
        console.error("Get Districts API Error:", err);
        if (active) {
          setDistrictOptions([]);
          setDistrictError(
            err.response?.data?.message ||
              err.response?.data?.title ||
              err.message ||
              "Unable to load districts. Please try again.",
          );
        }
      } finally {
        if (active) setDistrictLoading(false);
      }
    };

    fetchDistricts();
    return () => {
      active = false;
    };
  }, [districtRetry]);

  useEffect(() => {
    let active = true;

    const fetchCities = async () => {
      setCityOptions([]);
      setCityError("");

      if (!form.districtId) {
        setCityLoading(false);
        return;
      }

      setCityLoading(true);
      try {
        const response = await getCitiesByDistrict(form.districtId);
        const options = getDropdownRows(response, "city")
          .map(normalizeDropdownOption)
          .filter(Boolean);

        if (active) setCityOptions(options);
      } catch (err) {
        console.error("Get Cities By District API Error:", err);
        if (active) {
          setCityOptions([]);
          setCityError(
            err.response?.data?.message ||
              err.response?.data?.title ||
              err.message ||
              "Unable to load cities. Please try again.",
          );
        }
      } finally {
        if (active) setCityLoading(false);
      }
    };

    fetchCities();
    return () => {
      active = false;
    };
  }, [form.districtId, cityRetry]);

  const imagePreview = useMemo(
    () => (image ? URL.createObjectURL(image) : profilePath),
    [image, profilePath],
  );

  const setValue = (key, value) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "whatsAppMobileNo") next.mobileNo = value;
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
    let active = true;

    const fetchCustomer = async () => {
      if (!customerId) return;

      try {
        setSubmitting(true);

        const response = await getCustomerById(customerId);

        const customerRows = Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response?.data?.data)
            ? response.data.data
            : [];
        const customer = customerRows[0];

        if (response?.success === false || !customer) {
          throw new Error(
            response?.message || "Customer details were not found.",
          );
        }

        if (!active) return;

        setForm((prev) => ({
          ...prev,
          name: customer.name ?? customer.Name ?? "",
          genderId: String(customer.genderId ?? customer.GenderId ?? ""),
          email: customer.email ?? customer.Email ?? "",
          mobileNo: customer.mobileNo ?? customer.MobileNo ?? "",
          whatsAppMobileNo:
            customer.whatsAppMobileNNo ??
            customer.whatsAppMobileNo ??
            customer.WhatsAppMobileNo ??
            "",
          address: customer.address ?? customer.Address ?? "",
          landMark: customer.landMark ?? customer.LandMark ?? "",
          stateId: String(customer.stateId ?? customer.StateId ?? ""),
          districtId: String(customer.districtId ?? customer.DistrictId ?? ""),
          cityId: String(customer.cityId ?? customer.CityId ?? ""),
          isActive:
            (customer.isActive ?? customer.IsActive) === true ||
            (customer.isActive ?? customer.IsActive) === 1 ||
            (customer.isActive ?? customer.IsActive) === "1",
        }));
        setProfilePath(customer.profilePath ?? customer.ProfilePath ?? "");
      } catch (err) {
        console.error("Get Customer API Error:", err);
        if (active) {
          setApiError(
            err.response?.data?.message ||
              err.response?.data?.title ||
              err.message ||
              "Unable to fetch customer details.",
          );
        }
      } finally {
        if (active) setSubmitting(false);
      }
    };

    fetchCustomer();
    return () => {
      active = false;
    };
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
      payload.append("IsActive", form.isActive ? 1 : 0);

      if (image) {
        payload.append("ImagePath", image);
      }

      if (customerId) {
        await updateCustomer(payload);
      } else {
        await createCustomer(payload);
      }

      showToast(
        customerId
          ? "Customer updated successfully."
          : "Customer created successfully.",
      );
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
    setImage(null);
    setProfilePath("");
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
      <style>{`
        @keyframes cmDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: none; } }
        @keyframes cmUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
        @keyframes cmZoom { from { opacity: 0; transform: scale(.6); } to { opacity: 1; transform: none; } }
        @keyframes cmPop { from { opacity: 0; transform: scale(.85); } to { opacity: 1; transform: none; } }
        @keyframes cmShake { 0%, 100% { transform: translateX(0); } 20% { transform: translateX(-5px); } 40% { transform: translateX(5px); } 60% { transform: translateX(-3px); } 80% { transform: translateX(3px); } }
        .cm-down { animation: cmDown .45s cubic-bezier(.2,.8,.2,1) backwards; }
        .cm-up { animation: cmUp .5s cubic-bezier(.2,.8,.2,1) backwards; }
        .cm-zoom { animation: cmZoom .55s cubic-bezier(.34,1.56,.64,1) backwards; }
        .cm-pop { animation: cmPop .3s cubic-bezier(.34,1.56,.64,1) backwards; }
        .cm-err { animation: cmShake .35s ease-in-out; }
        @media (prefers-reduced-motion: reduce) {
          .cm-down, .cm-up, .cm-zoom, .cm-pop, .cm-err { animation: none; }
        }
      `}</style>

      <header className="cm-down mb-6 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate("/customers")}
          className="shrink-0 rounded-full border border-violet-200 p-2 text-violet-600 transition duration-200 hover:-translate-x-0.5 hover:bg-violet-50 active:scale-90"
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
        <section
          style={dly(100)}
          className="cm-up rounded-[18px] border border-violet-100 bg-white p-4 shadow-sm transition duration-300 hover:shadow-md sm:rounded-[22px] sm:p-6"
        >
          <SectionTitle
            title="Personal info"
            subtitle="Basic details of the customer."
          />

          <div className="flex flex-col gap-5 sm:flex-row">
            {/* Photo */}
            <div className="flex shrink-0 flex-col items-center gap-2 sm:w-36">
              <div
                style={dly(220)}
                className="cm-zoom relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-violet-200 bg-violet-50 text-violet-400 transition duration-300 hover:scale-105 hover:border-violet-400"
              >
                {imagePreview ? (
                  <img
                    key={imagePreview}
                    src={imagePreview}
                    alt="Customer preview"
                    className="cm-pop h-full w-full object-cover"
                  />
                ) : (
                  <Upload size={26} />
                )}
              </div>

              <div className="flex items-center gap-2">
                <label className="cursor-pointer rounded-full border border-violet-200 px-3 py-1.5 text-[11px] font-bold text-violet-700 transition duration-200 hover:-translate-y-0.5 hover:bg-violet-50 active:scale-95">
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
                    className="cm-pop rounded-full border border-slate-200 p-1.5 text-slate-500 transition duration-200 hover:rotate-90 hover:bg-slate-50 active:scale-90"
                    title="Remove photo"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
              {errors.image && (
                <span className="cm-err text-center text-[11px] text-red-500">
                  {errors.image}
                </span>
              )}
            </div>

            {/* Fields */}
            <div className="grid min-w-0 flex-1 grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Full name" required error={errors.name} delay={200}>
                <input
                  value={form.name}
                  onChange={handleChange("name")}
                  placeholder="Enter full name"
                  className={inputClass}
                />
              </Field>

              <Field
                label="Gender"
                required
                error={errors.genderId}
                delay={260}
              >
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
                  <span className="cm-err mt-1 flex items-center justify-between gap-2 text-[11px] text-red-500">
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

              <Field label="Email" error={errors.email} delay={320}>
                <input
                  type="email"
                  value={form.email}
                  onChange={handleChange("email")}
                  placeholder="name@example.com"
                  className={inputClass}
                />
              </Field>

              <Field
                label="WhatsApp number"
                required
                error={errors.whatsAppMobileNo}
                delay={380}
              >
                <input
                  type="tel"
                  inputMode="numeric"
                  value={form.whatsAppMobileNo}
                  onChange={handleDigits("whatsAppMobileNo")}
                  placeholder="10 digit WhatsApp number"
                  className={inputClass}
                />
              </Field>

              <div className="md:col-span-2">
                <Field
                  label="Mobile number"
                  required
                  error={errors.mobileNo}
                  delay={440}
                >
                  <input
                    type="tel"
                    inputMode="numeric"
                    value={form.mobileNo}
                    readOnly
                    placeholder="10 digit mobile number"
                    className={`${inputClass} read-only:cursor-not-allowed read-only:bg-slate-50 read-only:text-slate-500`}
                  />
                </Field>
              </div>
            </div>
          </div>
        </section>

        {/* Address info */}
        <section
          style={dly(220)}
          className="cm-up rounded-[18px] border border-violet-100 bg-white p-4 shadow-sm transition duration-300 hover:shadow-md sm:rounded-[22px] sm:p-6"
        >
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
              delay={360}
            >
              <textarea
                rows={3}
                value={form.address}
                onChange={handleChange("address")}
                placeholder="House no., street, area"
                className="w-full resize-none rounded-xl border border-violet-100 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-violet-200 focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
              />
            </Field>

            <Field label="Landmark" className="md:col-span-2" delay={420}>
              <input
                value={form.landMark}
                onChange={handleChange("landMark")}
                placeholder="Nearby landmark"
                className={inputClass}
              />
            </Field>

            {/* <Field label="State">
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
            </Field> */}

            <Field label="District" delay={480}>
              <select
                value={form.districtId}
                onChange={handleChange("districtId")}
                disabled={districtLoading || Boolean(districtError)}
                className={inputClass}
              >
                {renderOptions(
                  districtOptions,
                  districtLoading ? "Loading districts..." : "Select district",
                )}
              </select>
              {districtError && (
                <span className="cm-err mt-1 flex items-center justify-between gap-2 text-[11px] text-red-500">
                  <span>{districtError}</span>
                  <button
                    type="button"
                    onClick={() => setDistrictRetry((attempt) => attempt + 1)}
                    className="inline-flex shrink-0 items-center gap-1 font-bold text-violet-600 hover:text-violet-800"
                  >
                    <RefreshCw size={12} />
                    Retry
                  </button>
                </span>
              )}
            </Field>

            <Field label="City / Village" delay={540}>
              <select
                value={form.cityId}
                onChange={handleChange("cityId")}
                disabled={!form.districtId || cityLoading || Boolean(cityError)}
                className={inputClass}
              >
                {renderOptions(
                  cityOptions,
                  cityLoading ? "Loading cities..." : "Select city / village",
                )}
              </select>
              {cityError && (
                <span className="cm-err mt-1 flex items-center justify-between gap-2 text-[11px] text-red-500">
                  <span>{cityError}</span>
                  <button
                    type="button"
                    onClick={() => setCityRetry((attempt) => attempt + 1)}
                    className="inline-flex shrink-0 items-center gap-1 font-bold text-violet-600 hover:text-violet-800"
                  >
                    <RefreshCw size={12} />
                    Retry
                  </button>
                </span>
              )}
            </Field>

            <div
              style={dly(600)}
              className="cm-up flex items-center justify-between gap-4 rounded-xl border border-violet-100 bg-violet-50/50 px-4 py-3 transition-colors hover:bg-violet-50 md:col-span-2"
            >
              <div>
                <p className="text-xs font-bold text-slate-700">
                  Customer status
                </p>
                <p
                  key={String(form.isActive)}
                  className="cm-pop mt-0.5 text-[11px] text-slate-500"
                >
                  {form.isActive
                    ? "Customer is active"
                    : "Customer is inactive"}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={form.isActive}
                aria-label="Customer active status"
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    isActive: !prev.isActive,
                  }))
                }
                className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-300 active:scale-90 focus:outline-none focus:ring-4 focus:ring-violet-100 ${
                  form.isActive ? "bg-emerald-500" : "bg-slate-300"
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform duration-300 ${
                    form.isActive ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>
        </section>

        {apiError && (
          <p className="cm-err rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
            {apiError}
          </p>
        )}

        {/* Actions */}
        <div
          style={dly(660)}
          className="cm-up flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"
        >
          <button
            type="button"
            onClick={handleReset}
            disabled={submitting}
            className="inline-flex items-center justify-center rounded-full border border-violet-200 px-6 py-3 text-sm font-bold text-violet-700 transition duration-200 hover:-translate-y-0.5 hover:bg-violet-50 active:scale-95 disabled:opacity-50 disabled:hover:translate-y-0"
          >
            Reset
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-violet-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-violet-200 transition duration-200 hover:-translate-y-0.5 hover:bg-violet-700 hover:shadow-xl active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
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
