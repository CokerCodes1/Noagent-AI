export default function AdminUsersSection({
  currentUserId,
  deletingUserId,
  filterRole,
  filteredUsers,
  handleDeleteUser,
  handleEditUser,
  handleManagedUserSubmit,
  isEditingUser,
  managedUserForm,
  resetManagedUserForm,
  setFilterRole,
  submittingUser,
  updateUserField,
  usersError,
  usersLoading,
  usersTotal
}) {
  return (
    <div className="grid admin-management-grid">
      <div className="section-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">User Management</p>
            <h2>{isEditingUser ? "Edit account" : "Create account"}</h2>
          </div>
        </div>

        <p className="section-copy">
          Create landlord, renter, technician, or admin accounts, update details,
          and optionally reset passwords from one form.
        </p>

        <form className="property-form" onSubmit={handleManagedUserSubmit}>
          <div className="form-grid">
            <label>
              <span>Full name</span>
              <input
                value={managedUserForm.name}
                onChange={(event) => updateUserField("name", event.target.value)}
                placeholder="Jane Doe"
                required
              />
            </label>

            <label>
              <span>Email</span>
              <input
                type="email"
                value={managedUserForm.email}
                onChange={(event) => updateUserField("email", event.target.value)}
                placeholder="jane@example.com"
                required
              />
            </label>

            <label>
              <span>Phone</span>
              <input
                value={managedUserForm.phone}
                onChange={(event) => updateUserField("phone", event.target.value)}
                placeholder="08012345678"
              />
            </label>

            <label>
              <span>Role</span>
              <select
                value={managedUserForm.role}
                onChange={(event) => updateUserField("role", event.target.value)}
              >
                <option value="landlord">Landlord</option>
                <option value="renter">Renter</option>
                <option value="technician">Technician</option>
                <option value="admin">Admin</option>
              </select>
            </label>
          </div>

          <label>
            <span>{isEditingUser ? "New password" : "Password"}</span>
            <input
              type="password"
              value={managedUserForm.password}
              onChange={(event) => updateUserField("password", event.target.value)}
              placeholder={
                isEditingUser
                  ? "Leave blank to keep the current password"
                  : "Minimum 6 characters"
              }
              required={!isEditingUser}
            />
          </label>

          <div className="button-row">
            <button className="btn primary" type="submit" disabled={submittingUser}>
              {submittingUser
                ? isEditingUser
                  ? "Saving..."
                  : "Creating..."
                : isEditingUser
                  ? "Save Changes"
                  : "Create User"}
            </button>

            {isEditingUser ? (
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
            <p className="eyebrow">Accounts</p>
            <h2>{usersTotal} managed users</h2>
          </div>
        </div>

        <div className="auth-tabs" role="tablist" aria-label="Managed user roles">
          {["all", "admin", "landlord", "technician", "renter"].map((role) => (
            <button
              key={role}
              type="button"
              className={filterRole === role ? "tab active" : "tab"}
              onClick={() => setFilterRole(role)}
            >
              {role === "all" ? "All" : `${role.charAt(0).toUpperCase()}${role.slice(1)}s`}
            </button>
          ))}
        </div>

        {usersError ? <div className="status-card error">{usersError}</div> : null}

        {usersLoading ? (
          <div className="status-card">Loading users...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="status-card">No users found for this filter.</div>
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
                  {managedUser.is_protected ? <p>Reserved admin account</p> : null}
                  <p>{managedUser.phone || "No phone added"}</p>
                  <p>
                    Listings: {managedUser.properties_count} | Successful unlocks:{" "}
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
                    disabled={
                      deletingUserId === managedUser.id ||
                      currentUserId === managedUser.id ||
                      managedUser.is_protected
                    }
                  >
                    {deletingUserId === managedUser.id
                      ? "Deleting..."
                      : managedUser.is_protected
                        ? "Protected"
                        : "Delete"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
