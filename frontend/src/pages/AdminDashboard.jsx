import { useEffect, useRef, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import api, { extractErrorMessage } from "../api/axios.js";
import AdminTechniciansSection from "../components/admin/AdminTechniciansSection.jsx";
import AdminOverviewSection from "../components/admin/AdminOverviewSection.jsx";
import AdminPropertiesSection from "../components/admin/AdminPropertiesSection.jsx";
import AdminRevenueSection from "../components/admin/AdminRevenueSection.jsx";
import AdminSidebar from "../components/admin/AdminSidebar.jsx";
import AdminTestimonialsSection from "../components/admin/AdminTestimonialsSection.jsx";
import AdminUsersSection from "../components/admin/AdminUsersSection.jsx";
import {
  adminSections,
  emptyManagedPropertyForm,
  emptyManagedUserForm,
  emptyOverview,
  getCurrentSection,
  roleLabel
} from "../components/admin/adminConfig.js";
import { emptyTechnicianProfileForm } from "../components/technicians/technicianConfig.js";
import DashboardHeader from "../components/DashboardHeader.jsx";
import { clearAuthSession, getStoredUser } from "../utils/session.js";
import { resolveTechnicianCategoryOption } from "../utils/technicianCategories.js";

function handleDashboardRequestError(requestError, setError) {
  const message = extractErrorMessage(requestError);
  setError(message);
  toast.error(message);

  if (requestError.response?.status === 401) {
    clearAuthSession();
  }
}

export default function AdminDashboard() {
  const location = useLocation();
  const user = getStoredUser();
  const activeSection = getCurrentSection(location.pathname);
  const propertyImagesInputRef = useRef(null);
  const propertyVideoInputRef = useRef(null);
  const technicianImagesInputRef = useRef(null);
  const technicianVideoInputRef = useRef(null);
  const [overview, setOverview] = useState(emptyOverview);
  const [managedUsers, setManagedUsers] = useState([]);
  const [managedProperties, setManagedProperties] = useState([]);
  const [managedTechnicians, setManagedTechnicians] = useState([]);
  const [revenueSummary, setRevenueSummary] = useState({
    successfulTransactions: 0,
    revenue: 0
  });
  const [transactions, setTransactions] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);
  const [propertiesLoading, setPropertiesLoading] = useState(true);
  const [techniciansLoading, setTechniciansLoading] = useState(true);
  const [revenueLoading, setRevenueLoading] = useState(true);
  const [testimonialsLoading, setTestimonialsLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState("");
  const [usersError, setUsersError] = useState("");
  const [propertiesError, setPropertiesError] = useState("");
  const [techniciansError, setTechniciansError] = useState("");
  const [revenueError, setRevenueError] = useState("");
  const [testimonialsError, setTestimonialsError] = useState("");
  const [managedUserForm, setManagedUserForm] = useState(emptyManagedUserForm);
  const [editingUserId, setEditingUserId] = useState(null);
  const [submittingUser, setSubmittingUser] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState(null);
  const [filterRole, setFilterRole] = useState("all");
  const [managedPropertyForm, setManagedPropertyForm] = useState(emptyManagedPropertyForm);
  const [editingPropertyId, setEditingPropertyId] = useState(null);
  const [submittingProperty, setSubmittingProperty] = useState(false);
  const [deletingPropertyId, setDeletingPropertyId] = useState(null);
  const [propertyFilter, setPropertyFilter] = useState("all");
  const [technicianForm, setTechnicianForm] = useState(emptyTechnicianProfileForm);
  const [editingTechnicianId, setEditingTechnicianId] = useState(null);
  const [submittingTechnician, setSubmittingTechnician] = useState(false);
  const [deletingTechnicianId, setDeletingTechnicianId] = useState(null);
  const [filterCategory, setFilterCategory] = useState("all");
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function loadAdminData() {
      setDashboardLoading(true);
      setUsersLoading(true);
      setPropertiesLoading(true);
      setTechniciansLoading(true);
      setRevenueLoading(true);
      setTestimonialsLoading(true);

      const [overviewResult, usersResult, propertiesResult, techniciansResult, revenueResult, testimonialsResult] =
        await Promise.allSettled([
          api.get("/admin/overview"),
          api.get("/admin/users"),
          api.get("/admin/properties"),
          api.get("/admin/technicians"),
          api.get("/admin/revenue"),
          api.get("/admin/testimonials")
        ]);

      if (!isMounted) {
        return;
      }

      if (overviewResult.status === "fulfilled") {
        setOverview(overviewResult.value.data);
        setDashboardError("");
      } else {
        handleDashboardRequestError(overviewResult.reason, setDashboardError);
      }

      if (usersResult.status === "fulfilled") {
        setManagedUsers(usersResult.value.data);
        setUsersError("");
      } else {
        handleDashboardRequestError(usersResult.reason, setUsersError);
      }

      if (propertiesResult.status === "fulfilled") {
        setManagedProperties(propertiesResult.value.data);
        setPropertiesError("");
      } else {
        handleDashboardRequestError(propertiesResult.reason, setPropertiesError);
      }

      if (techniciansResult.status === "fulfilled") {
        setManagedTechnicians(techniciansResult.value.data);
        setTechniciansError("");
      } else {
        handleDashboardRequestError(techniciansResult.reason, setTechniciansError);
      }

      if (revenueResult.status === "fulfilled") {
        setRevenueSummary(revenueResult.value.data.summary);
        setTransactions(revenueResult.value.data.transactions);
        setRevenueError("");
      } else {
        handleDashboardRequestError(revenueResult.reason, setRevenueError);
      }

      if (testimonialsResult.status === "fulfilled") {
        setTestimonials(testimonialsResult.value.data.testimonials);
        setTestimonialsError("");
      } else {
        handleDashboardRequestError(testimonialsResult.reason, setTestimonialsError);
      }

      setDashboardLoading(false);
      setUsersLoading(false);
      setPropertiesLoading(false);
      setTechniciansLoading(false);
      setRevenueLoading(false);
      setTestimonialsLoading(false);
    }

    loadAdminData();

    return () => {
      isMounted = false;
    };
  }, [refreshToken]);

  if (!activeSection) {
    return <Navigate to="/admin" replace />;
  }

  function refreshAdminData() {
    setRefreshToken((currentValue) => currentValue + 1);
  }

  function updateUserField(field, value) {
    setManagedUserForm((currentForm) => ({ ...currentForm, [field]: value }));
  }

  function resetManagedUserForm() {
    setManagedUserForm({ ...emptyManagedUserForm });
    setEditingUserId(null);
  }

  function updatePropertyField(field, value) {
    setManagedPropertyForm((currentForm) => {
      if (field === "listing_purpose") {
        return {
          ...currentForm,
          [field]: value,
          status:
            value === "sale"
              ? currentForm.status === "rented"
                ? "available"
                : currentForm.status
              : currentForm.status === "sold"
                ? "available"
                : currentForm.status
        };
      }

      return { ...currentForm, [field]: value };
    });
  }

  function resetManagedPropertyForm() {
    setManagedPropertyForm({ ...emptyManagedPropertyForm });
    setEditingPropertyId(null);
    if (propertyImagesInputRef.current) propertyImagesInputRef.current.value = "";
    if (propertyVideoInputRef.current) propertyVideoInputRef.current.value = "";
  }

  function updateTechnicianField(field, value) {
    setTechnicianForm((currentForm) => ({
      ...currentForm,
      [field]: value,
      ...(field === "category" && value !== "Others"
        ? { custom_category: "" }
        : {})
    }));
  }

  function resetTechnicianForm() {
    setTechnicianForm({ ...emptyTechnicianProfileForm });
    setEditingTechnicianId(null);
    if (technicianImagesInputRef.current) technicianImagesInputRef.current.value = "";
    if (technicianVideoInputRef.current) technicianVideoInputRef.current.value = "";
  }

  async function handleManagedUserSubmit(event) {
    event.preventDefault();
    setSubmittingUser(true);

    try {
      const payload = { ...managedUserForm };
      if (editingUserId) {
        await api.put(`/admin/users/${editingUserId}`, payload);
        toast.success("User updated successfully.");
      } else {
        await api.post("/admin/users", payload);
        toast.success(`${roleLabel(managedUserForm.role)} created successfully.`);
      }
      resetManagedUserForm();
      refreshAdminData();
    } catch (requestError) {
      toast.error(extractErrorMessage(requestError));
      if (requestError.response?.status === 401) clearAuthSession();
    } finally {
      setSubmittingUser(false);
    }
  }

  function handleEditUser(managedUser) {
    setEditingUserId(managedUser.id);
    setManagedUserForm({
      name: managedUser.name,
      email: managedUser.email,
      phone: managedUser.phone || "",
      password: "",
      role: managedUser.role
    });
  }

  async function handleDeleteUser(managedUser) {
    if (managedUser.is_protected) {
      toast.error("This reserved admin account cannot be deleted.");
      return;
    }

    const propertyNotice =
      managedUser.properties_count > 0
        ? ` This will also remove ${managedUser.properties_count} linked property listing${managedUser.properties_count === 1 ? "" : "s"}.`
        : "";
    const unlockNotice =
      managedUser.unlocks_count > 0
        ? ` ${managedUser.unlocks_count} successful transaction record${managedUser.unlocks_count === 1 ? "" : "s"} will be removed too.`
        : "";
    const confirmed = window.confirm(
      `Delete ${managedUser.name} (${managedUser.role})?${propertyNotice}${unlockNotice}`
    );

    if (!confirmed) return;

    setDeletingUserId(managedUser.id);
    try {
      await api.delete(`/admin/users/${managedUser.id}`);
      toast.success(`${managedUser.name} deleted successfully.`);
      if (editingUserId === managedUser.id) resetManagedUserForm();
      refreshAdminData();
    } catch (requestError) {
      toast.error(extractErrorMessage(requestError));
      if (requestError.response?.status === 401) clearAuthSession();
    } finally {
      setDeletingUserId(null);
    }
  }

  async function handleManagedPropertySubmit(event) {
    event.preventDefault();
    const selectedImages = propertyImagesInputRef.current?.files || [];
    const selectedVideo = propertyVideoInputRef.current?.files?.[0] || null;

    if (!editingPropertyId && selectedImages.length === 0) {
      toast.error("Please upload at least one property image.");
      return;
    }

    if (!editingPropertyId && !selectedVideo) {
      toast.error("Please upload a property video.");
      return;
    }

    if (selectedImages.length > 5) {
      toast.error("You can upload a maximum of 5 images.");
      return;
    }

    setSubmittingProperty(true);

    try {
      const formData = new FormData();
      Object.entries(managedPropertyForm).forEach(([key, value]) => formData.append(key, value));
      Array.from(selectedImages).forEach((file) => formData.append("images", file));
      if (selectedVideo) formData.append("video", selectedVideo);

      const config = { headers: { "Content-Type": "multipart/form-data" } };
      if (editingPropertyId) {
        await api.put(`/admin/properties/${editingPropertyId}`, formData, config);
        toast.success("Property updated successfully.");
      } else {
        await api.post("/admin/properties", formData, config);
        toast.success("Property created successfully.");
      }

      resetManagedPropertyForm();
      refreshAdminData();
    } catch (requestError) {
      toast.error(extractErrorMessage(requestError));
      if (requestError.response?.status === 401) clearAuthSession();
    } finally {
      setSubmittingProperty(false);
    }
  }

  function handleEditProperty(property) {
    setEditingPropertyId(property.id);
    setManagedPropertyForm({
      landlord_id: String(property.landlord_id),
      type: property.type,
      listing_purpose: property.listing_purpose || "rent",
      description: property.description,
      location: property.location,
      price: String(property.price),
      phone: property.phone || "",
      status: property.status || "available"
    });
    if (propertyImagesInputRef.current) propertyImagesInputRef.current.value = "";
    if (propertyVideoInputRef.current) propertyVideoInputRef.current.value = "";
  }

  async function handleDeleteProperty(property) {
    const confirmed = window.confirm(
      `Delete ${property.type} in ${property.location}? This will also remove related unlock records.`
    );

    if (!confirmed) return;

    setDeletingPropertyId(property.id);
    try {
      await api.delete(`/admin/properties/${property.id}`);
      toast.success("Property deleted successfully.");
      if (editingPropertyId === property.id) resetManagedPropertyForm();
      refreshAdminData();
    } catch (requestError) {
      toast.error(extractErrorMessage(requestError));
      if (requestError.response?.status === 401) clearAuthSession();
    } finally {
      setDeletingPropertyId(null);
    }
  }

  async function handleTechnicianSubmit(event) {
    event.preventDefault();
    const selectedImages = technicianImagesInputRef.current?.files || [];
    const selectedVideo = technicianVideoInputRef.current?.files?.[0] || null;

    if (selectedImages.length > 5) {
      toast.error("You can upload a maximum of 5 images.");
      return;
    }

    setSubmittingTechnician(true);

    try {
      const formData = new FormData();
      const fields = [
        "email",
        "password",
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

      fields.forEach((field) => formData.append(field, technicianForm[field] ?? ""));
      Array.from(selectedImages).forEach((file) => formData.append("images", file));
      if (selectedVideo) formData.append("video", selectedVideo);

      const config = { headers: { "Content-Type": "multipart/form-data" } };
      if (editingTechnicianId) {
        await api.put(`/admin/technicians/${editingTechnicianId}`, formData, config);
        toast.success("Technician updated successfully.");
      } else {
        await api.post("/admin/technicians", formData, config);
        toast.success("Technician created successfully.");
      }

      resetTechnicianForm();
      refreshAdminData();
    } catch (requestError) {
      toast.error(extractErrorMessage(requestError));
      if (requestError.response?.status === 401) clearAuthSession();
    } finally {
      setSubmittingTechnician(false);
    }
  }

  function handleEditTechnician(technician) {
    setEditingTechnicianId(technician.id);
    setTechnicianForm({
      ...emptyTechnicianProfileForm,
      email: technician.email || "",
      password: "",
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
    });
    if (technicianImagesInputRef.current) technicianImagesInputRef.current.value = "";
    if (technicianVideoInputRef.current) technicianVideoInputRef.current.value = "";
  }

  async function handleDeleteTechnician(technician) {
    const confirmed = window.confirm(
      `Delete ${technician.name}? This will remove the technician account and marketplace profile.`
    );

    if (!confirmed) return;

    setDeletingTechnicianId(technician.id);
    try {
      await api.delete(`/admin/technicians/${technician.id}`);
      toast.success(`${technician.name} deleted successfully.`);
      if (editingTechnicianId === technician.id) resetTechnicianForm();
      refreshAdminData();
    } catch (requestError) {
      toast.error(extractErrorMessage(requestError));
      if (requestError.response?.status === 401) clearAuthSession();
    } finally {
      setDeletingTechnicianId(null);
    }
  }

  const filteredUsers = managedUsers.filter((managedUser) =>
    filterRole === "all" ? true : managedUser.role === filterRole
  );
  const filteredProperties = managedProperties.filter((property) =>
    propertyFilter === "all" ? true : property.status === propertyFilter
  );
  const landlords = managedUsers.filter((managedUser) => managedUser.role === "landlord");
  const section = adminSections[activeSection];

  return (
    <div className="dashboard-shell">
      <div className="admin-shell">
        <AdminSidebar overview={overview} />

        <main className="admin-content">
          <DashboardHeader
            title={`${section.title} for ${user?.name || "Admin"}`}
            subtitle={section.subtitle}
          />

          <section className="dashboard-section admin-content-section">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Admin Workspace</p>
                <h1>{section.title}</h1>
              </div>
              <p>{section.subtitle}</p>
            </div>

            {activeSection === "dashboard" ? (
              <AdminOverviewSection
                dashboardError={dashboardError}
                dashboardLoading={dashboardLoading}
                overview={overview}
              />
            ) : null}

            {activeSection === "users" ? (
              <AdminUsersSection
                currentUserId={user?.id}
                deletingUserId={deletingUserId}
                filterRole={filterRole}
                filteredUsers={filteredUsers}
                handleDeleteUser={handleDeleteUser}
                handleEditUser={handleEditUser}
                handleManagedUserSubmit={handleManagedUserSubmit}
                isEditingUser={Boolean(editingUserId)}
                managedUserForm={managedUserForm}
                resetManagedUserForm={resetManagedUserForm}
                setFilterRole={setFilterRole}
                submittingUser={submittingUser}
                updateUserField={updateUserField}
                usersError={usersError}
                usersLoading={usersLoading}
                usersTotal={managedUsers.length}
              />
            ) : null}

            {activeSection === "properties" ? (
              <AdminPropertiesSection
                deletingPropertyId={deletingPropertyId}
                filteredProperties={filteredProperties}
                handleDeleteProperty={handleDeleteProperty}
                handleEditProperty={handleEditProperty}
                handleManagedPropertySubmit={handleManagedPropertySubmit}
                isEditingProperty={Boolean(editingPropertyId)}
                landlords={landlords}
                managedProperties={managedProperties}
                managedPropertyForm={managedPropertyForm}
                propertiesError={propertiesError}
                propertiesLoading={propertiesLoading}
                propertyFilter={propertyFilter}
                propertyImagesInputRef={propertyImagesInputRef}
                propertyVideoInputRef={propertyVideoInputRef}
                resetManagedPropertyForm={resetManagedPropertyForm}
                setPropertyFilter={setPropertyFilter}
                submittingProperty={submittingProperty}
                updatePropertyField={updatePropertyField}
              />
            ) : null}

            {activeSection === "technicians" ? (
              <AdminTechniciansSection
                deletingTechnicianId={deletingTechnicianId}
                editingTechnicianId={editingTechnicianId}
                filterCategory={filterCategory}
                handleDeleteTechnician={handleDeleteTechnician}
                handleEditTechnician={handleEditTechnician}
                handleSubmit={handleTechnicianSubmit}
                imagesInputRef={technicianImagesInputRef}
                resetForm={resetTechnicianForm}
                setFilterCategory={setFilterCategory}
                submittingTechnician={submittingTechnician}
                technicianForm={technicianForm}
                technicians={managedTechnicians}
                techniciansError={techniciansError}
                techniciansLoading={techniciansLoading}
                updateTechnicianField={updateTechnicianField}
                videoInputRef={technicianVideoInputRef}
              />
            ) : null}

            {activeSection === "testimonials" ? (
              <AdminTestimonialsSection
                testimonials={testimonials}
                testimonialsError={testimonialsError}
                testimonialsLoading={testimonialsLoading}
                refreshAdminData={refreshAdminData}
              />
            ) : null}

            {activeSection === "revenue" ? (
              <AdminRevenueSection
                revenueError={revenueError}
                revenueLoading={revenueLoading}
                revenueSummary={revenueSummary}
                transactions={transactions}
              />
            ) : null}
          </section>
        </main>
      </div>
    </div>
  );
}
