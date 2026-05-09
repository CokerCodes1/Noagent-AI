import { BACKEND_URL } from "../../api/axios.js";
import usePagination from "../../hooks/usePagination.js";
import PaginatedContent from "../shared/PaginatedContent.jsx";
import PaginationControls from "../shared/PaginationControls.jsx";
import TechnicianProfileFields from "../technicians/TechnicianProfileFields.jsx";

function resolveTechnicianImage(technician) {
  if (!technician?.profile_image) {
    return "";
  }

  return `${BACKEND_URL}/uploads/${technician.profile_image}`;
}

export default function AdminTechniciansSection({
  deletingTechnicianId,
  editingTechnicianId,
  filterCategory,
  handleDeleteTechnician,
  handleEditTechnician,
  handleSubmit,
  imagesInputRef,
  resetForm,
  setFilterCategory,
  submittingTechnician,
  technicianForm,
  technicians,
  techniciansError,
  techniciansLoading,
  updateTechnicianField,
  videoInputRef
}) {
  const filteredTechnicians = technicians.filter((technician) => {
    if (filterCategory === "all") {
      return true;
    }

    return technician.category === filterCategory;
  });
  const categories = Array.from(
    new Set(
      technicians
        .map((technician) => technician.category)
        .filter(Boolean)
    )
  ).sort((left, right) => left.localeCompare(right));
  const techniciansPagination = usePagination(filteredTechnicians, {
    resetKey: filterCategory
  });

  return (
    <div className="grid admin-management-grid">
      <div className="section-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Technician Accounts</p>
            <h2>{editingTechnicianId ? "Edit technician" : "Create technician"}</h2>
          </div>
        </div>

        <p className="section-copy">
          Create technician accounts manually, update marketplace details, and keep
          public technician profiles complete and trustworthy.
        </p>

        <form className="property-form" onSubmit={handleSubmit}>
          <TechnicianProfileFields
            form={technicianForm}
            onChange={updateTechnicianField}
            isAdmin
            isEditing={Boolean(editingTechnicianId)}
            imagesInputRef={imagesInputRef}
            videoInputRef={videoInputRef}
          />

          <div className="button-row">
            <button className="btn primary" type="submit" disabled={submittingTechnician}>
              {submittingTechnician
                ? editingTechnicianId
                  ? "Saving..."
                  : "Creating..."
                : editingTechnicianId
                  ? "Save Technician"
                  : "Create Technician"}
            </button>

            {editingTechnicianId ? (
              <button
                className="btn secondary"
                type="button"
                onClick={resetForm}
                disabled={submittingTechnician}
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
            <p className="eyebrow">Technician Directory</p>
            <h2>{technicians.length} total technicians</h2>
          </div>
        </div>

        <div className="auth-tabs" role="tablist" aria-label="Technician category filter">
          <button
            type="button"
            className={filterCategory === "all" ? "tab active" : "tab"}
            onClick={() => setFilterCategory("all")}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              className={filterCategory === category ? "tab active" : "tab"}
              onClick={() => setFilterCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>

        {techniciansError ? <div className="status-card error">{techniciansError}</div> : null}

        {techniciansLoading ? (
          <div className="status-card">Loading technicians...</div>
        ) : filteredTechnicians.length === 0 ? (
          <div className="status-card">No technicians found for this filter.</div>
        ) : (
          <>
            <PaginatedContent
              className="dashboard-list"
              pageKey={`technicians-${techniciansPagination.currentPage}`}
            >
              {techniciansPagination.pageItems.map((technician) => {
              const imageUrl = resolveTechnicianImage(technician);

              return (
                <article key={technician.id} className="listing-row technician-admin-row">
                  {imageUrl ? (
                    <img src={imageUrl} alt={technician.name} />
                  ) : (
                    <div className="empty-media admin-listing-empty">No image</div>
                  )}

                  <div className="listing-copy">
                    <div className="admin-user-heading">
                      <h3>{technician.name}</h3>
                      <span className="pill neutral">{technician.category || "Uncategorized"}</span>
                    </div>
                    <p>{technician.email || "No email"}</p>
                    <p>{technician.phone || "No phone"}</p>
                    <p>{technician.office_address || "No office address"}</p>
                    <p>{technician.description || "No description added yet."}</p>
                  </div>

                  <div className="listing-actions">
                    <strong>{technician.total_contacts} contacts</strong>
                    <span>{technician.jobs_completed} jobs delivered</span>
                    <span>N{Number(technician.total_earnings || 0).toLocaleString()}</span>
                    <button
                      className="btn secondary"
                      type="button"
                      onClick={() => handleEditTechnician(technician)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn danger"
                      type="button"
                      onClick={() => handleDeleteTechnician(technician)}
                      disabled={deletingTechnicianId === technician.id}
                    >
                      {deletingTechnicianId === technician.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </article>
              );
              })}
            </PaginatedContent>

            <PaginationControls
              currentPage={techniciansPagination.currentPage}
              endIndex={techniciansPagination.endIndex}
              goToNextPage={techniciansPagination.goToNextPage}
              goToPage={techniciansPagination.goToPage}
              goToPreviousPage={techniciansPagination.goToPreviousPage}
              label="technicians"
              pageNumbers={techniciansPagination.pageNumbers}
              startIndex={techniciansPagination.startIndex}
              totalItems={techniciansPagination.totalItems}
              totalPages={techniciansPagination.totalPages}
            />
          </>
        )}
      </div>
    </div>
  );
}
