import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import api, { extractErrorMessage } from "../api/axios.js";
import DashboardHeader from "../components/DashboardHeader.jsx";
import { clearAuthSession, getStoredUser } from "../utils/session.js";

const emptyManagedUserForm = {
  name: "",
  email: "",
  phone: "",
  password: "",
  role: "landlord"
};

const emptyOverview = {
  stats: {
    users: 0,
    landlords: 0,
    renters: 0,
    properties: 0,
    availableProperties: 0,
    rentedProperties: 0,
    revenue: 0
  },
  properties: []
};

function handleDashboardRequestError(requestError, setError) {
  const message = extractErrorMessage(requestError);
  setError(message);
  toast.error(message);

  if (requestError.response?.status === 401) {
    clearAuthSession();
  }
}

export default function AdminDashboard() {
  const [overview, setOverview] = useState(emptyOverview);
  const [managedUsers, setManagedUsers] = useState([]);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);
  const [overviewError, setOverviewError] = useState("");
  const [usersError, setUsersError] = useState("");
  const [managedUserForm, setManagedUserForm] = useState(emptyManagedUserForm);
  const [editingUserId, setEditingUserId] = useState(null);
  const [filterRole, setFilterRole] = useState("all");
  const [submittingUser, setSubmittingUser] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const user = getStoredUser();
  const isEditing = Boolean(editingUserId);

  function updateField(field, value) {
    setManagedUserForm((currentForm) => ({
      ...currentForm,
      [field]: value
    }));
  }

  function resetManagedUserForm() {
    setManagedUserForm({ ...emptyManagedUserForm });
    setEditingUserId(null);
  }

  useEffect(() => {
    let isMounted = true;

    async function loadDashboardData() {
      setOverviewLoading(true);
      setUsersLoading(true);

      const [overviewResult, usersResult] = await Promise.allSettled([
        api.get("/admin/overview"),
        api.get("/admin/users")
      ]);

      if (!isMounted) {
        return;
      }

      if (overviewResult.status === "fulfilled") {
        setOverview(overviewResult.value.data);
        setOverviewError("");
      } else {
        handleDashboardRequestError(overviewResult.reason, setOverviewError);
      }

      if (usersResult.status === "fulfilled") {
        setManagedUsers(usersResult.value.data);
        setUsersError("");
      } else {
        handleDashboardRequestError(usersResult.reason, setUsersError);
      }

      setOverviewLoading(false);
      setUsersLoading(false);
    }

    loadDashboardData();

    return () => {
      isMounted = false;
    };
  }, [refreshToken]);

  async function handleManagedUserSubmit(event) {
    event.preventDefault();
    setSubmittingUser(true);

    const payload = {
      name: managedUserForm.name,
      email: managedUserForm.email,
      phone: managedUserForm.phone,
      password: managedUserForm.password,
      role: managedUserForm.role
    };

    try {
      if (isEditing) {
        await api.put(`/admin/users/${editingUserId}`, payload);
        toast.success("User updated successfully.");
      } else {
        await api.post("/admin/users", payload);
        toast.success(
          `${managedUserForm.role === "landlord" ? "Landlord" : "Renter"} created successfully.`
        );
      }

      resetManagedUserForm();
      setRefreshToken((currentValue) => currentValue + 1);
    } catch (requestError) {
      toast.error(extractErrorMessage(requestError));

      if (requestError.response?.status === 401) {
        clearAuthSession();
      }
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
    const roleLabel = managedUser.role === "landlord" ? "landlord" : "renter";
    const propertyNotice =
      managedUser.properties_count > 0
        ? ` This will also remove ${managedUser.properties_count} linked property listing${managedUser.properties_count === 1 ? "" : "s"}.`
        : "";
    const unlockNotice =
      managedUser.unlocks_count > 0
        ? ` ${managedUser.unlocks_count} contact unlock record${managedUser.unlocks_count === 1 ? "" : "s"} will be removed as well.`
        : "";

    const confirmed = window.confirm(
      `Delete ${managedUser.name} (${roleLabel})?${propertyNotice}${unlockNotice}`
    );

    if (!confirmed) {
      return;
    }

    setDeletingUserId(managedUser.id);

    try {
      await api.delete(`/admin/users/${managedUser.id}`);
      toast.success(`${managedUser.name} deleted successfully.`);

      if (editingUserId === managedUser.id) {
        resetManagedUserForm();
      }

      setRefreshToken((currentValue) => currentValue + 1);
    } catch (requestError) {
      toast.error(extractErrorMessage(requestError));

      if (requestError.response?.status === 401) {
        clearAuthSession();
      }
    } finally {
      setDeletingUserId(null);
    }
  }

  const filteredUsers = managedUsers.filter((managedUser) => {
    if (filterRole === "all") {
      return true;
    }

    return managedUser.role === filterRole;
  });

  return (
    <div className="dashboard-shell">
      <section className="dashboard-section">
        <DashboardHeader
          title={`Operations overview for ${user?.name || "Admin"}`}
          subtitle="Monitor users, listings, and revenue from one place, then manage landlords and renters without leaving the dashboard."
        />

        <div className="section-heading">
          <div>
            <p className="eyebrow">Admin Dashboard</p>
            <h1>Operations overview for {user?.name || "Admin"}</h1>
          </div>
          <p>Visibility across users, listings, revenue, and account management.</p>
        </div>

        {overviewError ? <div className="status-card error">{overviewError}</div> : null}

        {overviewLoading ? (
          <div className="status-card">Loading admin overview...</div>
        ) : (
          <>
            <div className="grid stats-grid">
              <div className="card stat-card">
                <p>Users</p>
                <strong>{overview.stats.users}</strong>
              </div>
              <div className="card stat-card">
                <p>Landlords</p>
                <strong>{overview.stats.landlords}</strong>
              </div>
              <div className="card stat-card">
                <p>Renters</p>
                <strong>{overview.stats.renters}</strong>
              </div>
              <div className="card stat-card">
                <p>Total Properties</p>
                <strong>{overview.stats.properties}</strong>
              </div>
              <div className="card stat-card">
                <p>Available</p>
                <strong>{overview.stats.availableProperties}</strong>
              </div>
              <div className="card stat-card">
                <p>Rented</p>
                <strong>{overview.stats.rentedProperties}</strong>
              </div>
              <div className="card stat-card">
                <p>Revenue</p>
                <strong>N{Number(overview.stats.revenue / 100).toLocaleString()}</strong>
              </div>
            </div>

            <div className="grid admin-management-grid">
              <div className="section-card">
                <div className="section-heading">
                  <div>
                    <p className="eyebrow">User Management</p>
                    <h2>{isEditing ? "Edit landlord or renter" : "Create landlord or renter"}</h2>
                  </div>
                </div>

                <p className="section-copy">
                  Create new landlord or renter accounts, update their details, and optionally
                  reset their password from here.
                </p>

                <form className="property-form" onSubmit={handleManagedUserSubmit}>
                  <div className="form-grid">
                    <label>
                      <span>Full name</span>
                      <input
                        value={managedUserForm.name}
                        onChange={(event) => updateField("name", event.target.value)}
                        placeholder="Jane Doe"
                        required
                      />
                    </label>

                    <label>
                      <span>Email</span>
                      <input
                        type="email"
                        value={managedUserForm.email}
                        onChange={(event) => updateField("email", event.target.value)}
                        placeholder="jane@example.com"
                        required
                      />
                    </label>

                    <label>
                      <span>Phone</span>
                      <input
                        value={managedUserForm.phone}
                        onChange={(event) => updateField("phone", event.target.value)}
                        placeholder="08012345678"
                      />
                    </label>

                    <label>
                      <span>Role</span>
                      <select
                        value={managedUserForm.role}
                        onChange={(event) => updateField("role", event.target.value)}
                      >
                        <option value="landlord">Landlord</option>
                        <option value="renter">Renter</option>
                      </select>
                    </label>
                  </div>

                  <label>
                    <span>{isEditing ? "New password" : "Password"}</span>
                    <input
                      type="password"
                      value={managedUserForm.password}
                      onChange={(event) => updateField("password", event.target.value)}
                      placeholder={
                        isEditing
                          ? "Leave blank to keep the current password"
                          : "Minimum 6 characters"
                      }
                      required={!isEditing}
                    />
                  </label>

                  <div className="button-row">
                    <button className="btn primary" type="submit" disabled={submittingUser}>
                      {submittingUser
                        ? isEditing
                          ? "Saving..."
                          : "Creating..."
                        : isEditing
                          ? "Save Changes"
                          : "Create User"}
                    </button>

                    {isEditing ? (
                      <button
                        className="btn secondary"
                        type="button"
                        onClick={resetManagedUserForm}
                        disabled={submittingUser}
                      >
                        Cancel Editing
                      </button>
                    ) : null}
                  </div>
                </form>
              </div>

              <div className="section-card">
                <div className="section-heading">
                  <div>
                    <p className="eyebrow">Managed Accounts</p>
                    <h2>{managedUsers.length} landlord and renter accounts</h2>
                  </div>
                </div>

                <div className="auth-tabs" role="tablist" aria-label="Managed user roles">
                  <button
                    type="button"
                    className={filterRole === "all" ? "tab active" : "tab"}
                    onClick={() => setFilterRole("all")}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    className={filterRole === "landlord" ? "tab active" : "tab"}
                    onClick={() => setFilterRole("landlord")}
                  >
                    Landlords
                  </button>
                  <button
                    type="button"
                    className={filterRole === "renter" ? "tab active" : "tab"}
                    onClick={() => setFilterRole("renter")}
                  >
                    Renters
                  </button>
                </div>

                {usersError ? <div className="status-card error">{usersError}</div> : null}

                {usersLoading ? (
                  <div className="status-card">Loading landlords and renters...</div>
                ) : filteredUsers.length === 0 ? (
                  <div className="status-card">No managed users found for this filter.</div>
                ) : (
                  <div className="dashboard-list">
                    {filteredUsers.map((managedUser) => (
                      <article key={managedUser.id} className="listing-row compact admin-user-row">
                        <div className="listing-copy">
                          <div className="admin-user-heading">
                            <h3>{managedUser.name}</h3>
                            <span className="pill neutral">{managedUser.role}</span>
                          </div>
                          <p>{managedUser.email}</p>
                          <p>{managedUser.phone || "No phone added"}</p>
                          <p>
                            Listings: {managedUser.properties_count} | Contact unlocks:{" "}
                            {managedUser.unlocks_count}
                          </p>
                        </div>

                        <div className="listing-actions admin-user-actions">
                          <button
                            className="btn secondary"
                            type="button"
                            onClick={() => handleEditUser(managedUser)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn danger"
                            type="button"
                            onClick={() => handleDeleteUser(managedUser)}
                            disabled={deletingUserId === managedUser.id}
                          >
                            {deletingUserId === managedUser.id ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="section-card">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Property Activity</p>
                  <h2>All listings</h2>
                </div>
              </div>

              {overview.properties.length === 0 ? (
                <div className="status-card">No properties found.</div>
              ) : (
                <div className="dashboard-list">
                  {overview.properties.map((property) => (
                    <article key={property.id} className="listing-row compact">
                      <div className="listing-copy">
                        <h3>{property.type}</h3>
                        <p>{property.location}</p>
                        <p>Landlord: {property.landlord_name || "Unknown"}</p>
                      </div>

                      <div className="listing-actions">
                        <span className={`pill ${property.status}`}>
                          {property.status}
                        </span>
                        <strong>N{Number(property.price).toLocaleString()}</strong>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
