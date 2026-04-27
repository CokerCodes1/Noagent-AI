import { useEffect, useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { FiKey, FiLock, FiMail, FiPhone, FiUser, FiX } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api, { extractErrorMessage } from "../api/axios.js";
import { getDashboardPath, setAuthSession } from "../utils/session.js";

const initialForm = {
  name: "",
  email: "",
  phone: "",
  password: "",
};

const initialResetForm = {
  email: "",
  resetCode: "",
  newPassword: "",
};

const signupRoleOptions = [
  { value: "renter", label: "Signup as Renter" },
  { value: "technician", label: "Signup as Technician" },
];

const loginRoleOptions = [
  { value: "renter", label: "Login as Renter" },
  { value: "technician", label: "Login as Technician" },
  { value: "property_manager", label: "Login as Landlord" },
];

function AuthField(props) {
  const FieldIcon = props.icon;

  return (
    <label className="auth-field">
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

export default function Auth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [accountRole, setAccountRole] = useState("renter");
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetForm, setResetForm] = useState(initialResetForm);
  const [resetRequesting, setResetRequesting] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [resetCodeSent, setResetCodeSent] = useState(false);

  const isSignup = mode === "signup";
  const roleOptions = isSignup ? signupRoleOptions : loginRoleOptions;
  const isTechnicianSelection = accountRole === "technician";
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  function updateField(field, value) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  }

  function updateResetField(field, value) {
    setResetForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  }

  function openResetModal() {
    setResetForm({
      ...initialResetForm,
      email: form.email.trim(),
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
      email: form.email.trim(),
    });
  }

  useEffect(() => {
    if (!resetModalOpen) {
      return undefined;
    }

    function handleKeyDown(event) {
      if (event.key === "Escape" && !resetRequesting && !resettingPassword) {
        setResetModalOpen(false);
        setResetCodeSent(false);
        setResetForm({
          ...initialResetForm,
          email: form.email.trim(),
        });
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [form.email, resetModalOpen, resetRequesting, resettingPassword]);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);

    try {
      const endpoint = isSignup ? "/auth/signup" : "/auth/login";
      const payload = isSignup
        ? {
            name: form.name,
            email: form.email,
            phone: form.phone,
            password: form.password,
            role: accountRole,
          }
        : {
            email: form.email,
            password: form.password,
          };

      const response = await api.post(endpoint, payload);
      setAuthSession(response.data);
      toast.success(
        isSignup ? "Account created successfully." : "Login successful.",
      );
      navigate(getDashboardPath(response.data.user.role), { replace: true });
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
        email: resetForm.email,
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
        newPassword: resetForm.newPassword,
      });

      setAuthSession(response.data);
      toast.success("Password reset successful. You are now logged in.");
      closeResetModal(true);
      navigate(getDashboardPath(response.data.user.role), { replace: true });
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
        token: credentialResponse.credential,
      });

      setAuthSession(response.data);
      toast.success("Google login successful.");
      navigate(getDashboardPath(response.data.user.role), { replace: true });
    } catch (error) {
      toast.error(extractErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-panel">
        <p className="eyebrow">NoAgentNaija</p>
        <h1>Property rentals without the HIGH COST and STRESS of agents.</h1>
        <p className="auth-copy">
          {isSignup
            ? isTechnicianSelection
              ? "Create a technician account, complete your service profile, and get discovered by landlords and renters across NoAgentNaija."
              : "Create a renter account and rent directly from verified landlords without agent stress."
            : isTechnicianSelection
              ? "Login as a technician to manage your service profile, portfolio, and marketplace performance."
              : accountRole === "property_manager"
                ? "Landlord and admin accounts can sign in here to manage listings, tenants, revenue, and technician access."
                : "Sign in as a renter and rent directly from verified landlords. Landlord accounts are created by admins to keep listings trusted and easier to manage."}
        </p>

        <div
          className="auth-tabs"
          role="tablist"
          aria-label="Authentication mode"
        >
          <button
            type="button"
            className={mode === "login" ? "tab active" : "tab"}
            onClick={() => {
              setMode("login");
              setAccountRole("renter");
            }}
          >
            Login
          </button>
          <button
            type="button"
            className={mode === "signup" ? "tab active" : "tab"}
            onClick={() => {
              setMode("signup");
              setAccountRole("renter");
            }}
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
              onClick={() => setAccountRole(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {isSignup ? (
            <>
              <AuthField icon={FiUser} label="Full name">
                <input
                  value={form.name}
                  onChange={(event) => updateField("name", event.target.value)}
                  placeholder="Jane Doe"
                  autoComplete="name"
                  required
                />
              </AuthField>

              <AuthField icon={FiPhone} label="Phone">
                <input
                  value={form.phone}
                  onChange={(event) => updateField("phone", event.target.value)}
                  placeholder="08012345678"
                  autoComplete="tel"
                />
              </AuthField>
            </>
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
              {isTechnicianSelection
                ? "Technician accounts can sign up directly and complete their public profile after login."
                : "Need a landlord account? Contact an admin to get one created for you @ 08081232613."}
            </p>
          )}

          <button className="btn primary" type="submit" disabled={submitting}>
            {submitting
              ? "Please wait..."
              : isSignup
                ? isTechnicianSelection
                  ? "Create Technician Account"
                  : "Create Account"
                : isTechnicianSelection
                  ? "Login as Technician"
                  : accountRole === "property_manager"
                    ? "Login as Landlord/Admin"
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
              password, and we will log you in immediately after verification.
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
                    : "Reset Password & Login"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
