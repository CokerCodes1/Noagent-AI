import { useEffect, useMemo, useState } from "react";
import {
  FiCamera,
  FiEye,
  FiEyeOff,
  FiHome,
  FiLock,
  FiMail,
  FiPhone,
  FiSave,
  FiUser
} from "react-icons/fi";
import { toast } from "react-toastify";
import api, { extractErrorMessage } from "../../api/axios.js";
import useCurrentUser from "../../hooks/useCurrentUser.js";
import { setAuthSession } from "../../utils/session.js";
import UserAvatar from "../shared/UserAvatar.jsx";

const emptyPasswordForm = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: ""
};

function buildProfileForm(user) {
  return {
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    home_address: user?.home_address || "",
    avatar_url: user?.avatar_url || ""
  };
}

function isEmailValid(email = "") {
  return /\S+@\S+\.\S+/.test(String(email).trim());
}

function PasswordField({
  autoComplete,
  label,
  onChange,
  placeholder,
  show,
  toggle,
  value
}) {
  return (
    <label className="settings-field">
      <span>{label}</span>
      <div className="input-shell settings-password-shell">
        <FiLock className="input-icon" />
        <input
          autoComplete={autoComplete}
          type={show ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required
        />
        <button
          type="button"
          className="settings-visibility-button"
          onClick={toggle}
          aria-label={show ? `Hide ${label}` : `Show ${label}`}
        >
          {show ? <FiEyeOff /> : <FiEye />}
        </button>
      </div>
    </label>
  );
}

export default function AccountSettingsSection({ roleLabel = "User" }) {
  const storedUser = useCurrentUser();
  const [profileForm, setProfileForm] = useState(() => buildProfileForm(storedUser));
  const [passwordForm, setPasswordForm] = useState(emptyPasswordForm);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState("");
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false
  });

  useEffect(() => {
    let isMounted = true;

    async function loadCurrentUser() {
      try {
        const response = await api.get("/auth/me");

        if (!isMounted) {
          return;
        }

        setProfileForm(buildProfileForm(response.data.user));
        setAvatarPreviewUrl("");
      } catch (error) {
        if (isMounted) {
          toast.error(extractErrorMessage(error));
        }
      } finally {
        if (isMounted) {
          setLoadingProfile(false);
        }
      }
    }

    loadCurrentUser();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!avatarPreviewUrl) {
      return undefined;
    }

    return () => {
      URL.revokeObjectURL(avatarPreviewUrl);
    };
  }, [avatarPreviewUrl]);

  const previewAvatar = useMemo(
    () => avatarPreviewUrl || profileForm.avatar_url || storedUser?.avatar_url || "",
    [avatarPreviewUrl, profileForm.avatar_url, storedUser?.avatar_url]
  );

  function updateProfileField(field, value) {
    setProfileForm((currentForm) => ({
      ...currentForm,
      [field]: value
    }));
  }

  function updatePasswordField(field, value) {
    setPasswordForm((currentForm) => ({
      ...currentForm,
      [field]: value
    }));
  }

  function togglePassword(field) {
    setShowPasswords((currentValue) => ({
      ...currentValue,
      [field]: !currentValue[field]
    }));
  }

  function handleAvatarSelection(event) {
    const selectedFile = event.target.files?.[0] || null;

    setAvatarFile(selectedFile);

    if (avatarPreviewUrl) {
      URL.revokeObjectURL(avatarPreviewUrl);
    }

    if (!selectedFile) {
      setAvatarPreviewUrl("");
      return;
    }

    setAvatarPreviewUrl(URL.createObjectURL(selectedFile));
  }

  async function handleProfileSubmit(event) {
    event.preventDefault();

    if (!profileForm.name.trim()) {
      toast.error("Enter your full name.");
      return;
    }

    if (!isEmailValid(profileForm.email)) {
      toast.error("Enter a valid email address.");
      return;
    }

    setSavingProfile(true);

    try {
      const formData = new FormData();
      formData.append("name", profileForm.name.trim());
      formData.append("email", profileForm.email.trim());
      formData.append("phone", profileForm.phone.trim());
      formData.append("home_address", profileForm.home_address.trim());
      formData.append("avatar_url", profileForm.avatar_url || "");

      if (avatarFile) {
        formData.append("avatar", avatarFile);
      }

      const response = await api.put("/auth/me", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });

      setAuthSession(response.data);
      setProfileForm(buildProfileForm(response.data.user));
      setAvatarFile(null);
      setAvatarPreviewUrl("");
      toast.success(response.data.message || "Settings updated successfully.");
    } catch (error) {
      toast.error(extractErrorMessage(error));
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePasswordSubmit(event) {
    event.preventDefault();

    if (passwordForm.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters long.");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New password and confirmation do not match.");
      return;
    }

    setChangingPassword(true);

    try {
      const response = await api.put("/auth/change-password", {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });

      setAuthSession(response.data);
      setPasswordForm(emptyPasswordForm);
      toast.success(response.data.message || "Password updated successfully.");
    } catch (error) {
      toast.error(extractErrorMessage(error));
    } finally {
      setChangingPassword(false);
    }
  }

  if (loadingProfile) {
    return (
      <div className="settings-layout">
        <div className="section-card settings-card">
          <div className="status-card">Loading account settings...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-layout">
      <section className="section-card settings-card settings-profile-card glass">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Account Settings</p>
            <h2>Your profile</h2>
          </div>
          <p className="section-meta">
            Update the personal details used across your {roleLabel.toLowerCase()} workspace.
          </p>
        </div>

        <form className="property-form" onSubmit={handleProfileSubmit}>
          <div className="settings-avatar-row">
            <label className="settings-avatar-editor">
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarSelection}
                hidden
              />
              <UserAvatar
                className="settings-avatar"
                src={previewAvatar}
                text={profileForm.name || roleLabel}
              />
              <span className="settings-avatar-overlay">
                <FiCamera />
              </span>
            </label>

            <div className="settings-avatar-copy">
              <h3>{profileForm.name || "Your profile"}</h3>
              <p>{profileForm.email || "Add an email address"}</p>
              <span className="pill neutral">{roleLabel}</span>
            </div>
          </div>

          <div className="form-grid">
            <label className="settings-field">
              <span>Full name</span>
              <div className="input-shell">
                <FiUser className="input-icon" />
                <input
                  value={profileForm.name}
                  onChange={(event) => updateProfileField("name", event.target.value)}
                  placeholder="Enter your full name"
                  required
                />
              </div>
            </label>

            <label className="settings-field">
              <span>Email address</span>
              <div className="input-shell">
                <FiMail className="input-icon" />
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(event) => updateProfileField("email", event.target.value)}
                  placeholder="Enter your email"
                  required
                />
              </div>
            </label>

            <label className="settings-field">
              <span>Phone number</span>
              <div className="input-shell">
                <FiPhone className="input-icon" />
                <input
                  value={profileForm.phone}
                  onChange={(event) => updateProfileField("phone", event.target.value)}
                  placeholder="Enter your phone number"
                />
              </div>
            </label>

            <label className="settings-field settings-field-full">
              <span>Home address</span>
              <div className="input-shell settings-textarea-shell">
                <FiHome className="input-icon" />
                <textarea
                  rows="4"
                  value={profileForm.home_address}
                  onChange={(event) => updateProfileField("home_address", event.target.value)}
                  placeholder="Enter your home address"
                />
              </div>
            </label>
          </div>

          <button className="btn primary settings-save-button" type="submit" disabled={savingProfile}>
            <FiSave />
            <span>{savingProfile ? "Saving..." : "Save profile"}</span>
          </button>
        </form>
      </section>

      <section className="section-card settings-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Security</p>
            <h2>Change password</h2>
          </div>
          <p className="section-meta">
            Use your current password to set a new one securely.
          </p>
        </div>

        <form className="property-form" onSubmit={handlePasswordSubmit}>
          <PasswordField
            autoComplete="current-password"
            label="Current password"
            onChange={(event) => updatePasswordField("currentPassword", event.target.value)}
            placeholder="Enter your current password"
            show={showPasswords.currentPassword}
            toggle={() => togglePassword("currentPassword")}
            value={passwordForm.currentPassword}
          />

          <div className="form-grid">
            <PasswordField
              autoComplete="new-password"
              label="New password"
              onChange={(event) => updatePasswordField("newPassword", event.target.value)}
              placeholder="At least 6 characters"
              show={showPasswords.newPassword}
              toggle={() => togglePassword("newPassword")}
              value={passwordForm.newPassword}
            />

            <PasswordField
              autoComplete="new-password"
              label="Confirm password"
              onChange={(event) => updatePasswordField("confirmPassword", event.target.value)}
              placeholder="Re-enter your new password"
              show={showPasswords.confirmPassword}
              toggle={() => togglePassword("confirmPassword")}
              value={passwordForm.confirmPassword}
            />
          </div>

          <button className="btn secondary settings-save-button" type="submit" disabled={changingPassword}>
            <FiLock />
            <span>{changingPassword ? "Updating..." : "Update password"}</span>
          </button>
        </form>
      </section>
    </div>
  );
}
