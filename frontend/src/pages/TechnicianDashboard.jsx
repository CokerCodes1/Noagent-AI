import { useEffect, useRef, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { FiBriefcase, FiDollarSign, FiPhoneCall } from "react-icons/fi";
import { toast } from "react-toastify";
import api, { BACKEND_URL, extractErrorMessage } from "../api/axios.js";
import AdminStatCard from "../components/admin/AdminStatCard.jsx";
import DashboardHeader from "../components/DashboardHeader.jsx";
import MobileDashboardLayout from "../components/dashboard/MobileDashboardLayout.jsx";
import PwaSettings from "../components/settings/PwaSettings.jsx";
import TechnicianProfileFields from "../components/technicians/TechnicianProfileFields.jsx";
import {
  emptyTechnicianProfileForm,
  getCurrentTechnicianSection,
  technicianNavOrder,
  technicianSections
} from "../components/technicians/technicianConfig.js";
import WorkspaceSidebar from "../components/workspace/WorkspaceSidebar.jsx";
import useIsPhoneViewport from "../hooks/useIsPhoneViewport.js";
import {
  clearAuthSession,
  getStoredUser,
  updateStoredUser
} from "../utils/session.js";
import { resolveTechnicianCategoryOption } from "../utils/technicianCategories.js";

function mapTechnicianToForm(technician) {
  if (!technician) {
    return { ...emptyTechnicianProfileForm };
  }

  return {
    ...emptyTechnicianProfileForm,
    category: technician.category || "",
    custom_category:
      resolveTechnicianCategoryOption(technician.category) === "Others"
        ? technician.category
        : "",
    name: technician.name || "",
    description: technician.description || "",
    office_address: technician.office_address || "",
    phone: technician.phone || "",
    whatsapp: technician.whatsapp || "",
    website: technician.website || "",
    video_url: technician.video_url || "",
    jobs_completed: String(technician.jobs_completed ?? 0),
    total_earnings: String(technician.total_earnings ?? 0),
    existing_images: Array.isArray(technician.images) ? technician.images : [],
    current_video_url: technician.video_url || ""
  };
}

function resolveSidebarSummary(profile) {
  if (!profile) {
    return null;
  }

  return (
    <>
      <div className="admin-sidebar-pill">
        <FiPhoneCall />
        <span>{profile.phone || "Add a phone number"}</span>
      </div>
      <div className="admin-sidebar-pill">
        <FiBriefcase />
        <span>{profile.category || "Choose a category"}</span>
      </div>
    </>
  );
}

function resolveMediaUrl(value = "") {
  if (!value) {
    return "";
  }

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  return `${BACKEND_URL}/uploads/${value}`;
}

export default function TechnicianDashboard() {
  const location = useLocation();
  const user = getStoredUser();
  const isPhoneViewport = useIsPhoneViewport();
  const activeSection = getCurrentTechnicianSection(location.pathname);
  const imagesInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState("");
  const [stats, setStats] = useState({
    totalContacts: 0,
    jobsDelivered: 0,
    totalEarnings: 0
  });
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ ...emptyTechnicianProfileForm });
  const [savingProfile, setSavingProfile] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      setDashboardLoading(true);

      try {
        const response = await api.get("/technicians/me/dashboard");

        if (!isMounted) {
          return;
        }

        setStats(response.data.stats);
        setProfile(response.data.profile);
        setForm(mapTechnicianToForm(response.data.profile));
        setDashboardError("");
      } catch (requestError) {
        if (!isMounted) {
          return;
        }

        const message = extractErrorMessage(requestError);
        setDashboardError(message);

        if (requestError.response?.status === 401) {
          clearAuthSession();
        }
      } finally {
        if (isMounted) {
          setDashboardLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, [refreshToken]);

  if (!activeSection) {
    return <Navigate to="/technician" replace />;
  }

  function refreshDashboard() {
    setRefreshToken((currentValue) => currentValue + 1);
  }

  function updateField(field, value) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
      ...(field === "category" && value !== "Others"
        ? { custom_category: "" }
        : {})
    }));
  }

  async function handleProfileSubmit(event) {
    event.preventDefault();
    const selectedImages = imagesInputRef.current?.files || [];
    const selectedVideo = videoInputRef.current?.files?.[0] || null;

    if (selectedImages.length > 5) {
      toast.error("You can upload a maximum of 5 images.");
      return;
    }

    setSavingProfile(true);

    try {
      const formData = new FormData();
      const fields = [
        "category",
        "custom_category",
        "name",
        "description",
        "office_address",
        "phone",
        "whatsapp",
        "website",
        "jobs_completed",
        "total_earnings"
      ];

      fields.forEach((field) => formData.append(field, form[field] ?? ""));
      Array.from(selectedImages).forEach((file) => formData.append("images", file));

      if (selectedVideo) {
        formData.append("video", selectedVideo);
      }

      const response = await api.put("/technicians/me/profile", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });

      const nextTechnician = response.data.technician;
      setProfile(nextTechnician);
      setForm(mapTechnicianToForm(nextTechnician));
      setStats((currentStats) => ({
        ...currentStats,
        jobsDelivered: nextTechnician.jobs_completed ?? currentStats.jobsDelivered,
        totalEarnings: nextTechnician.total_earnings ?? currentStats.totalEarnings
      }));
      updateStoredUser({
        name: nextTechnician.name,
        phone: nextTechnician.phone
      });

      if (imagesInputRef.current) {
        imagesInputRef.current.value = "";
      }

      if (videoInputRef.current) {
        videoInputRef.current.value = "";
      }

      toast.success(response.data.message || "Profile updated successfully.");
      refreshDashboard();
    } catch (requestError) {
      toast.error(extractErrorMessage(requestError));

      if (requestError.response?.status === 401) {
        clearAuthSession();
      }
    } finally {
      setSavingProfile(false);
    }
  }

  const section = technicianSections[activeSection];
  const profileImages = Array.isArray(profile?.images) ? profile.images : [];
  const profileVideoUrl = resolveMediaUrl(profile?.video_url);
  const mobileItems = technicianNavOrder.map((sectionKey) => ({
    key: sectionKey,
    title: technicianSections[sectionKey].label,
    description: technicianSections[sectionKey].description,
    path: technicianSections[sectionKey].path,
    icon: technicianSections[sectionKey].icon
  }));
  const sectionContent = (
    <section className="dashboard-section admin-content-section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Technician Dashboard</p>
          <h1>{section.label}</h1>
        </div>
        <p>{section.description}</p>
      </div>

      {dashboardError ? <div className="status-card error">{dashboardError}</div> : null}

      {activeSection === "dashboard" ? (
        dashboardLoading ? (
          <div className="status-card">Loading technician dashboard...</div>
        ) : (
          <>
            <div className="grid stats-grid admin-stats-grid">
              <AdminStatCard
                icon={FiPhoneCall}
                label="Total Contacts"
                value={stats.totalContacts}
                note="Marketplace contact actions"
              />
              <AdminStatCard
                icon={FiBriefcase}
                label="Jobs Delivered"
                value={stats.jobsDelivered}
                note="Completed jobs tracked on profile"
              />
              <AdminStatCard
                icon={FiDollarSign}
                label="Total Earnings"
                value={`N${Number(stats.totalEarnings || 0).toLocaleString()}`}
                note="Self-reported earnings"
              />
            </div>
            <PwaSettings role={user?.role || "technician"} />
          </>
        )
      ) : null}

      {activeSection === "profile" ? (
        dashboardLoading ? (
          <div className="status-card">Loading technician profile...</div>
        ) : (
          <div className="grid admin-management-grid technician-profile-grid">
            <div className="section-card">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Profile</p>
                  <h2>Update your marketplace details</h2>
                </div>
              </div>

              <p className="section-copy">
                Add the information landlords and renters need before reaching out,
                including your service category, office address, images, and a skill
                showcase video uploaded from your files.
              </p>

              <form className="property-form" onSubmit={handleProfileSubmit}>
                <TechnicianProfileFields
                  form={form}
                  onChange={updateField}
                  isEditing
                  imagesInputRef={imagesInputRef}
                  videoInputRef={videoInputRef}
                />

                <button className="btn primary" type="submit" disabled={savingProfile}>
                  {savingProfile ? "Saving..." : "Save Profile"}
                </button>
              </form>
            </div>

            <div className="section-card">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Preview</p>
                  <h2>Your public marketplace card</h2>
                </div>
              </div>

              <div className="technician-preview">
                {profile?.profile_image ? (
                  <img
                    className="technician-preview-image"
                    src={resolveMediaUrl(profile.profile_image)}
                    alt={profile.name}
                  />
                ) : (
                  <div className="empty-media technician-preview-image">
                    No cover image uploaded
                  </div>
                )}

                <div className="dashboard-list">
                  <article className="card technician-card preview-card">
                    <div className="card-content technician-card-shell">
                      <div className="property-card-badge-row">
                        <span className="pill neutral">
                          {profile?.category || "Category"}
                        </span>
                        <span className="pill available">Preview</span>
                      </div>

                      <div className="property-card-title-row">
                        <div>
                          <h3>{profile?.name || "Your business name"}</h3>
                          <p className="section-meta">
                            {profile?.category || "Choose a category"}
                          </p>
                        </div>
                      </div>

                      <p className="property-description">
                        {profile?.description || "Add a short description of your services."}
                      </p>

                      <div className="technician-card-highlights">
                        <div className="technician-card-highlight">
                          <span>Office</span>
                          <strong>
                            {profile?.office_address || "Add your office address"}
                          </strong>
                        </div>
                        <div className="technician-card-highlight">
                          <span>Phone</span>
                          <strong>{profile?.phone || "Add a phone number"}</strong>
                        </div>
                      </div>
                    </div>
                  </article>

                  {profileImages.length > 0 ? (
                    <div className="technician-gallery">
                      {profileImages.map((image) => (
                        <img
                          key={image}
                          src={resolveMediaUrl(image)}
                          alt={`${profile?.name || "Technician"} portfolio`}
                        />
                      ))}
                    </div>
                  ) : null}

                  {profileVideoUrl ? (
                    /^https?:\/\//i.test(profile?.video_url || "") ? (
                      <a
                        className="btn secondary"
                        href={profileVideoUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open current video
                      </a>
                    ) : (
                      <video controls src={profileVideoUrl} className="technician-inline-video" />
                    )
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        )
      ) : null}
    </section>
  );

  if (isPhoneViewport) {
    return (
      <div className="dashboard-shell">
        <MobileDashboardLayout
          activeSectionKey={activeSection}
          basePath="/technician"
          defaultSectionKey="dashboard"
          items={mobileItems}
          sectionDescription={section.description}
          sectionTitle={section.label}
          user={user}
          workspaceDescription="Manage your public profile and track how clients engage with your services."
          workspaceTitle="Technician Workspace"
        >
          {sectionContent}
        </MobileDashboardLayout>
      </div>
    );
  }

  return (
    <div className="dashboard-shell">
      <div className="admin-shell">
        <WorkspaceSidebar
          brand="NoAgentNaija"
          title="Technician Workspace"
          description="Manage your public profile and track how clients engage with your services."
          items={technicianNavOrder.map((sectionKey) => technicianSections[sectionKey])}
          summary={resolveSidebarSummary(profile)}
        />

        <main className="admin-content">
          <DashboardHeader
            title={`${section.label} for ${user?.name || "Technician"}`}
            subtitle={section.description}
          />

          {sectionContent}
        </main>
      </div>
    </div>
  );
}
