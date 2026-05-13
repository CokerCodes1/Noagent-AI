import { startTransition, useEffect, useMemo, useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import {
  FiCheckCircle,
  FiKey,
  FiLock,
  FiMail,
  FiMapPin,
  FiPhone,
  FiShield,
  FiUploadCloud,
  FiUser,
  FiX
} from "react-icons/fi";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api, { extractErrorMessage } from "../api/axios.js";
import { prefetchRoute } from "../utils/routePrefetch.js";
import { getDashboardPath, setAuthSession } from "../utils/session.js";

const MAX_VERIFICATION_FILE_SIZE = 8 * 1024 * 1024;
const ACCEPTED_VERIFICATION_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf"
];

const initialForm = {
  name: "",
  email: "",
  phone: "",
  password: "",
  whatsappNumber: "",
  propertyAddress: "",
  verificationDocument: null
};

const initialResetForm = {
  email: "",
  resetCode: "",
  newPassword: ""
};

const signupRoleOptions = [
  { value: "renter", label: "Signup as Renter" },
  { value: "technician", label: "Signup as Technician" },
  { value: "landlord", label: "Signup as Landlord" }
];

const loginRoleOptions = [
  { value: "renter", label: "Login as Renter" },
  { value: "technician", label: "Login as Technician" },
  { value: "landlord", label: "Login as Landlord/Admin" }
];

const landlordSignupSteps = [
  "Create your landlord account",
  "Upload ownership proof",
  "Wait for admin verification"
];

function AuthField(props) {
  const FieldIcon = props.icon;

  return (
    <label className={`auth-field${props.full ? " auth-field-full" : ""}`}>
      <span>{props.label}</span>
      <div className="input-shell">
        <span className="input-icon" aria-hidden="true">
          <FieldIcon />
        </span>
        {props.children}
      </div>
    </label>
  );
}

function getVerificationFileLabel(file) {
  if (!file) {
    return "Drop ownership proof here or browse";
  }

  return `${file.name} • ${(file.size / (1024 * 1024)).toFixed(2)} MB`;
}

function isValidVerificationFile(file) {
  if (!file) {
    return false;
  }

  return (
    ACCEPTED_VERIFICATION_TYPES.includes(file.type) &&
    file.size <= MAX_VERIFICATION_FILE_SIZE
  );
}

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState("login");
  const [accountRole, setAccountRole] = useState("renter");
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetForm, setResetForm] = useState(initialResetForm);
  const [resetRequesting, setResetRequesting] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [resetCodeSent, setResetCodeSent] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [landlordSuccessOpen, setLandlordSuccessOpen] = useState(false);

  const isSignup = mode === "signup";
  const roleOptions = isSignup ? signupRoleOptions : loginRoleOptions;
  const isTechnicianSelection = accountRole === "technician";
  const isLandlordSelection = accountRole === "landlord";
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const requestedMode = searchParams.get("mode");
    const requestedRole = searchParams.get("role");

    if (requestedMode === "signup" || requestedMode === "login") {
      setMode(requestedMode);
    }

    if (requestedMode === "signup") {
      if (requestedRole === "technician") {
        setAccountRole("technician");
      } else if (requestedRole === "landlord") {
        setAccountRole("landlord");
      } else {
        setAccountRole("renter");
      }
      return;
    }

    if (requestedMode === "login") {
      if (requestedRole === "technician") {
        setAccountRole("technician");
      } else if (
        requestedRole === "landlord" ||
        requestedRole === "property_manager"
      ) {
        setAccountRole("landlord");
      } else {
        setAccountRole("renter");
      }
    }
  }, [location.search]);

  const verificationFileLabel = useMemo(
    () => getVerificationFileLabel(form.verificationDocument),
    [form.verificationDocument]
  );

  function resetSignupFields() {
    setForm(initialForm);
    setDragActive(false);
  }

  function updateField(field, value) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value
    }));
  }

  function updateResetField(field, value) {
    setResetForm((currentForm) => ({
      ...currentForm,
      [field]: value
    }));
  }

  function handleModeChange(nextMode) {
    setMode(nextMode);
    setAccountRole("renter");
    resetSignupFields();
  }

  function handleRoleChange(nextRole) {
    setAccountRole(nextRole);
    if (nextRole !== "landlord") {
      updateField("whatsappNumber", "");
      updateField("propertyAddress", "");
      updateField("verificationDocument", null);
    }
  }

  function openResetModal() {
    setResetForm({
      ...initialResetForm,
      email: form.email.trim()
    });
    setResetCodeSent(false);
    setResetModalOpen(true);
  }

  function closeResetModal(force = false) {
    if (!force && (resetRequesting || resettingPassword)) {
      return;
    }

    setResetModalOpen(false);
    setResetCodeSent(false);
    setResetForm({
      ...initialResetForm,
      email: form.email.trim()
    });
  }

  useEffect(() => {
    if (!resetModalOpen && !landlordSuccessOpen) {
      return undefined;
    }

    function handleKeyDown(event) {
      if (event.key === "Escape" && !resetRequesting && !resettingPassword) {
        if (landlordSuccessOpen) {
          setLandlordSuccessOpen(false);
          navigate("/", { replace: true });
          return;
        }

        setResetModalOpen(false);
        setResetCodeSent(false);
        setResetForm({
          ...initialResetForm,
          email: form.email.trim()
        });
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    form.email,
    landlordSuccessOpen,
    navigate,
    resetModalOpen,
    resetRequesting,
    resettingPassword
  ]);

  function handleVerificationFileSelection(file) {
    if (!file) {
      updateField("verificationDocument", null);
      return;
    }

    if (!isValidVerificationFile(file)) {
      toast.error(
        "Upload a JPG, PNG, WEBP, or PDF file no larger than 8 MB."
      );
      return;
    }

    updateField("verificationDocument", file);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);

    try {
      let response;

      if (isSignup) {
        if (isLandlordSelection) {
          if (!form.verificationDocument) {
            toast.error("Upload your ownership verification document.");
            setSubmitting(false);
            return;
          }

          const formData = new FormData();
          formData.append("name", form.name);
          formData.append("email", form.email);
          formData.append("phone", form.phone);
          formData.append("password", form.password);
          formData.append("role", accountRole);
          formData.append("whatsappNumber", form.whatsappNumber);
          formData.append("propertyAddress", form.propertyAddress);
          formData.append(
            "verificationDocument",
            form.verificationDocument
          );

          response = await api.post("/auth/signup", formData, {
            headers: {
              "Content-Type": "multipart/form-data"
            }
          });
        } else {
          response = await api.post("/auth/signup", {
            name: form.name,
            email: form.email,
            phone: form.phone,
            password: form.password,
            role: accountRole
          });
        }
      } else {
        response = await api.post("/auth/login", {
          email: form.email,
          password: form.password
        });
      }

      if (response.data.requiresVerification) {
        resetSignupFields();
        setLandlordSuccessOpen(true);
        return;
      }

      const destination = getDashboardPath(response.data.user.role);
      prefetchRoute(destination);
      setAuthSession(response.data);
      toast.success(
        isSignup ? "Account created successfully." : "Login successful."
      );
      startTransition(() => {
        navigate(destination, { replace: true });
      });
    } catch (error) {
      toast.error(extractErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRequestResetCode() {
    if (!resetForm.email.trim()) {
      toast.error("Enter the email address attached to your account.");
      return;
    }

    setResetRequesting(true);

    try {
      const response = await api.post("/auth/forgot-password", {
        email: resetForm.email
      });

      setResetCodeSent(true);
      toast.success(response.data.message);
    } catch (error) {
      toast.error(extractErrorMessage(error));
    } finally {
      setResetRequesting(false);
    }
  }

  async function handleResetPassword(event) {
    event.preventDefault();
    setResettingPassword(true);

    try {
      const response = await api.post("/auth/reset-password", {
        email: resetForm.email,
        resetCode: resetForm.resetCode,
        newPassword: resetForm.newPassword
      });

      if (!response.data.token) {
        toast.success(
          response.data.message || "Password reset successful."
        );
        closeResetModal(true);
        return;
      }

      const destination = getDashboardPath(response.data.user.role);
      prefetchRoute(destination);
      setAuthSession(response.data);
      toast.success("Password reset successful. You are now logged in.");
      closeResetModal(true);
      startTransition(() => {
        navigate(destination, { replace: true });
      });
    } catch (error) {
      toast.error(extractErrorMessage(error));
    } finally {
      setResettingPassword(false);
    }
  }

  async function handleGoogleSuccess(credentialResponse) {
    if (!credentialResponse.credential) {
      toast.error("Google login did not return a credential.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await api.post("/auth/google", {
        token: credentialResponse.credential
      });

      const destination = getDashboardPath(response.data.user.role);
      prefetchRoute(destination);
      setAuthSession(response.data);
      toast.success("Google login successful.");
      startTransition(() => {
        navigate(destination, { replace: true });
      });
    } catch (error) {
      toast.error(extractErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  function handleSuccessModalClose() {
    setLandlordSuccessOpen(false);
    navigate("/", { replace: true });
  }

  return (
    <div className={`auth-page${isLandlordSelection && isSignup ? " auth-page-landlord" : ""}`}>
      <div className={`auth-panel${isLandlordSelection && isSignup ? " auth-panel-landlord" : ""}`}>
        <div className="auth-hero-band">
          <div>
            <p className="eyebrow">NoAgentNaija</p>
            <h1>
              {isLandlordSelection && isSignup
                ? "Secure landlord onboarding with verification-first trust."
                : "Property rentals without the HIGH COST and STRESS of agents."}
            </h1>
            <p className="auth-copy">
              {isSignup
                ? isLandlordSelection
                  ? "Open your landlord account, upload proof of ownership, and let our verification team activate your workspace once your documents are approved."
                  : isTechnicianSelection
                    ? "Create a technician account, complete your service profile, and get discovered by landlords and renters across NoAgentNaija."
                    : "Create a renter account and rent directly from verified landlords without agent stress."
                : isTechnicianSelection
                  ? "Login as a technician to manage your service profile, portfolio, and marketplace performance."
                  : isLandlordSelection
                    ? "Landlords and property operators can sign in here to check approval status and access the workspace once verified."
                    : "Sign in as a renter and rent directly from verified landlords."}
            </p>
          </div>

          {isLandlordSelection && isSignup ? (
            <div className="auth-hero-aside">
              <div className="auth-feature-chip">
                <FiShield aria-hidden="true" />
                <span>Ownership proof required</span>
              </div>
              <div className="auth-feature-chip">
                <FiCheckCircle aria-hidden="true" />
                <span>Admin approval before access</span>
              </div>
            </div>
          ) : null}
        </div>

        {isLandlordSelection && isSignup ? (
          <div className="auth-progress-strip">
            {landlordSignupSteps.map((step, index) => (
              <div key={step} className="auth-progress-step">
                <span>{index + 1}</span>
                <strong>{step}</strong>
              </div>
            ))}
          </div>
        ) : null}

        <div
          className="auth-tabs"
          role="tablist"
          aria-label="Authentication mode"
        >
          <button
            type="button"
            className={mode === "login" ? "tab active" : "tab"}
            onClick={() => handleModeChange("login")}
          >
            Login
          </button>
          <button
            type="button"
            className={mode === "signup" ? "tab active" : "tab"}
            onClick={() => handleModeChange("signup")}
          >
            Sign Up
          </button>
        </div>

        <div
          className="auth-tabs auth-role-tabs"
          role="tablist"
          aria-label="Account type"
        >
          {roleOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={accountRole === option.value ? "tab active" : "tab"}
              onClick={() => handleRoleChange(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {isSignup ? (
            <div className="form-grid">
              <AuthField icon={FiUser} label="Full name">
                <input
                  value={form.name}
                  onChange={(event) => updateField("name", event.target.value)}
                  placeholder="Jane Doe"
                  autoComplete="name"
                  required
                />
              </AuthField>

              <AuthField icon={FiPhone} label="Phone Number">
                <input
                  value={form.phone}
                  onChange={(event) => updateField("phone", event.target.value)}
                  placeholder="08012345678"
                  autoComplete="tel"
                  required={isLandlordSelection}
                />
              </AuthField>
            </div>
          ) : null}

          <AuthField icon={FiMail} label="Email">
            <input
              type="email"
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </AuthField>

          <AuthField icon={FiLock} label="Password">
            <input
              type="password"
              value={form.password}
              onChange={(event) => updateField("password", event.target.value)}
              placeholder="Minimum 6 characters"
              autoComplete={isSignup ? "new-password" : "current-password"}
              required
            />
          </AuthField>

          {isSignup && isLandlordSelection ? (
            <>
              <div className="form-grid">
                <AuthField icon={FiPhone} label="WhatsApp Number">
                  <input
                    value={form.whatsappNumber}
                    onChange={(event) =>
                      updateField("whatsappNumber", event.target.value)
                    }
                    placeholder="08012345678"
                    autoComplete="tel"
                    required
                  />
                </AuthField>

                <AuthField icon={FiMapPin} label="Property Address" full>
                  <input
                    value={form.propertyAddress}
                    onChange={(event) =>
                      updateField("propertyAddress", event.target.value)
                    }
                    placeholder="Lekki Phase 1, Lagos"
                    autoComplete="street-address"
                    required
                  />
                </AuthField>
              </div>

              <label className="auth-upload-card">
                <div className="auth-upload-copy">
                  <span className="auth-upload-label">
                    Property Ownership Verification Document
                  </span>
                  <p>
                    Accepted: C of O, deed of assignment, survey plan, tenancy
                    ownership proof, allocation paper, or utility ownership proof.
                  </p>
                </div>

                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,.pdf"
                  onChange={(event) =>
                    handleVerificationFileSelection(
                      event.target.files?.[0] || null
                    )
                  }
                  hidden
                />

                <div
                  className={`auth-upload-dropzone${dragActive ? " drag-active" : ""}${form.verificationDocument ? " has-file" : ""}`}
                  onDragEnter={(event) => {
                    event.preventDefault();
                    setDragActive(true);
                  }}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDragActive(true);
                  }}
                  onDragLeave={(event) => {
                    event.preventDefault();
                    if (event.currentTarget === event.target) {
                      setDragActive(false);
                    }
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    setDragActive(false);
                    handleVerificationFileSelection(
                      event.dataTransfer.files?.[0] || null
                    );
                  }}
                >
                  <div className="auth-upload-icon">
                    {form.verificationDocument ? (
                      <FiCheckCircle aria-hidden="true" />
                    ) : (
                      <FiUploadCloud aria-hidden="true" />
                    )}
                  </div>
                  <strong>{verificationFileLabel}</strong>
                  <span>JPG, PNG, WEBP, or PDF up to 8 MB</span>
                </div>
              </label>
            </>
          ) : null}

          {!isSignup ? (
            <div className="auth-support-row">
              <button
                type="button"
                className="auth-link-button"
                onClick={openResetModal}
              >
                Forgot password?
              </button>
            </div>
          ) : (
            <p className="auth-note">
              {isLandlordSelection
                ? "Landlord accounts stay pending until our verification team reviews the ownership documents you submit."
                : isTechnicianSelection
                  ? "Technician accounts can sign up directly and complete their public profile after login."
                  : "Renter accounts are activated immediately so you can start exploring listings right away."}
            </p>
          )}

          <button className="btn primary" type="submit" disabled={submitting}>
            {submitting
              ? "Please wait..."
              : isSignup
                ? isLandlordSelection
                  ? "Submit Landlord Registration"
                  : isTechnicianSelection
                    ? "Create Technician Account"
                    : "Create Account"
                : isTechnicianSelection
                  ? "Login as Technician"
                  : isLandlordSelection
                    ? "Login as Landlord"
                    : "Login"}
          </button>
        </form>

        {googleClientId && accountRole === "renter" ? (
          <div className="google-auth">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => toast.error("Google login failed.")}
            />
          </div>
        ) : null}
      </div>

      {resetModalOpen ? (
        <div
          className="modal auth-modal"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              closeResetModal();
            }
          }}
        >
          <div
            className="auth-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reset-password-title"
          >
            <div className="auth-dialog-header">
              <div>
                <p className="eyebrow">Reset Password</p>
                <h2 id="reset-password-title">Email code verification</h2>
              </div>
              <button
                type="button"
                className="icon-btn auth-dialog-close"
                onClick={() => closeResetModal()}
                aria-label="Close reset password dialog"
              >
                <FiX />
              </button>
            </div>

            <p className="auth-dialog-copy">
              Request a one-time reset code, paste it below, choose a new
              password, and we will log you in immediately after verification
              whenever the account is eligible for access.
            </p>

            <form className="auth-form" onSubmit={handleResetPassword}>
              <AuthField icon={FiMail} label="Email">
                <input
                  type="email"
                  value={resetForm.email}
                  onChange={(event) =>
                    updateResetField("email", event.target.value)
                  }
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </AuthField>

              <div className="auth-inline-action">
                <button
                  type="button"
                  className="btn secondary"
                  onClick={handleRequestResetCode}
                  disabled={resetRequesting || resettingPassword}
                >
                  {resetRequesting
                    ? "Sending..."
                    : resetCodeSent
                      ? "Resend Reset Code"
                      : "Send Reset Code"}
                </button>
                <p className="auth-note">
                  Use the same email address tied to your NoAgentNaija account.
                </p>
              </div>

              {resetCodeSent ? (
                <p className="auth-banner success">
                  Your 6-digit reset code has been sent. Check your inbox and
                  spam folder once if it does not appear right away.
                </p>
              ) : null}

              <AuthField icon={FiKey} label="Reset code">
                <input
                  value={resetForm.resetCode}
                  onChange={(event) =>
                    updateResetField("resetCode", event.target.value)
                  }
                  placeholder="6-digit code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                />
              </AuthField>

              <AuthField icon={FiLock} label="New password">
                <input
                  type="password"
                  value={resetForm.newPassword}
                  onChange={(event) =>
                    updateResetField("newPassword", event.target.value)
                  }
                  placeholder="Minimum 6 characters"
                  autoComplete="new-password"
                  required
                />
              </AuthField>

              <div className="auth-dialog-actions">
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => closeResetModal()}
                  disabled={resetRequesting || resettingPassword}
                >
                  Cancel
                </button>
                <button
                  className="btn primary"
                  type="submit"
                  disabled={resetRequesting || resettingPassword}
                >
                  {resettingPassword
                    ? "Verifying..."
                    : "Reset Password & Continue"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {landlordSuccessOpen ? (
        <div
          className="modal auth-modal auth-success-modal"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              handleSuccessModalClose();
            }
          }}
        >
          <div
            className="auth-dialog auth-success-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="landlord-success-title"
          >
            <div className="auth-success-icon">
              <FiCheckCircle aria-hidden="true" />
            </div>
            <p className="eyebrow">Verification Queue</p>
            <h2 id="landlord-success-title">Registration Successful</h2>
            <p className="auth-dialog-copy">
              Your request has been sent successfully. You will be contacted by
              a member of our verification team shortly.
            </p>
            <button
              type="button"
              className="btn primary"
              onClick={handleSuccessModalClose}
            >
              OK
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
