import { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api, { extractErrorMessage } from "../api/axios.js";
import { getDashboardPath, setAuthSession } from "../utils/session.js";

const initialForm = {
  name: "",
  email: "",
  phone: "",
  password: "",
  role: "renter"
};

export default function Auth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);

  const isSignup = mode === "signup";
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  function updateField(field, value) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);

    try {
      const endpoint = isSignup ? "/auth/signup" : "/auth/login";
      const payload = isSignup
        ? form
        : {
            email: form.email,
            password: form.password
          };

      const response = await api.post(endpoint, payload);
      setAuthSession(response.data);
      toast.success(
        isSignup ? "Account created successfully." : "Login successful."
      );
      navigate(getDashboardPath(response.data.user.role), { replace: true });
    } catch (error) {
      toast.error(extractErrorMessage(error));
    } finally {
      setSubmitting(false);
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
        <h1>Property rentals without dead links or broken pages.</h1>
        <p className="auth-copy">
          Sign in as a renter, landlord, or admin and move through the app with
          the same API contracts the backend now enforces.
        </p>

        <div className="auth-tabs" role="tablist" aria-label="Authentication mode">
          <button
            type="button"
            className={mode === "login" ? "tab active" : "tab"}
            onClick={() => setMode("login")}
          >
            Login
          </button>
          <button
            type="button"
            className={mode === "signup" ? "tab active" : "tab"}
            onClick={() => setMode("signup")}
          >
            Sign Up
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {isSignup ? (
            <>
              <label>
                <span>Full name</span>
                <input
                  value={form.name}
                  onChange={(event) => updateField("name", event.target.value)}
                  placeholder="Jane Doe"
                  required
                />
              </label>

              <label>
                <span>Phone</span>
                <input
                  value={form.phone}
                  onChange={(event) => updateField("phone", event.target.value)}
                  placeholder="08012345678"
                />
              </label>

              <label>
                <span>Role</span>
                <select
                  value={form.role}
                  onChange={(event) => updateField("role", event.target.value)}
                >
                  <option value="renter">Renter</option>
                  <option value="landlord">Landlord</option>
                </select>
              </label>
            </>
          ) : null}

          <label>
            <span>Email</span>
            <input
              type="email"
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
              placeholder="you@example.com"
              required
            />
          </label>

          <label>
            <span>Password</span>
            <input
              type="password"
              value={form.password}
              onChange={(event) => updateField("password", event.target.value)}
              placeholder="Minimum 6 characters"
              required
            />
          </label>

          <button className="btn primary" type="submit" disabled={submitting}>
            {submitting ? "Please wait..." : isSignup ? "Create Account" : "Login"}
          </button>
        </form>

        {googleClientId ? (
          <div className="google-auth">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => toast.error("Google login failed.")}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
