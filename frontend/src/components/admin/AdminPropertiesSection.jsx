import { BACKEND_URL } from "../../api/axios.js";
import usePagination from "../../hooks/usePagination.js";
import EmptyStateCard from "../shared/EmptyStateCard.jsx";
import PaginatedContent from "../shared/PaginatedContent.jsx";
import PaginationControls from "../shared/PaginationControls.jsx";
import { formatCurrency } from "./adminConfig.js";
import { formatNaira } from "../../utils/propertyListing.js";

export default function AdminPropertiesSection({
  deletingPropertyId,
  filteredProperties,
  handleDeleteProperty,
  handleEditProperty,
  handleManagedPropertySubmit,
  isEditingProperty,
  landlords,
  managedProperties,
  managedPropertyForm,
  propertiesError,
  propertiesLoading,
  propertyFilter,
  propertyImagesInputRef,
  propertyVideoInputRef,
  resetManagedPropertyForm,
  setPropertyFilter,
  submittingProperty,
  updatePropertyField
}) {
  const canMarkSold = managedPropertyForm.listing_purpose === "sale";
  const propertiesPagination = usePagination(filteredProperties, {
    resetKey: propertyFilter
  });

  return (
    <div className="grid admin-management-grid">
      <div className="section-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Property Management</p>
            <h2>{isEditingProperty ? "Edit property" : "Create property"}</h2>
          </div>
        </div>

        <p className="section-copy">
          Admins can create listings for landlords, update any listing, and remove
          properties even when they were originally posted by landlords. Rent
          listings unlock at N2,000 while sale listings unlock at N10,000.
        </p>

        <form className="property-form" onSubmit={handleManagedPropertySubmit}>
          <div className="form-grid">
            <label>
              <span>Landlord</span>
              <select
                value={managedPropertyForm.landlord_id}
                onChange={(event) => updatePropertyField("landlord_id", event.target.value)}
                required
              >
                <option value="">Select a landlord</option>
                {landlords.map((landlord) => (
                  <option key={landlord.id} value={landlord.id}>
                    {landlord.name} ({landlord.email})
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Listing purpose</span>
              <select
                value={managedPropertyForm.listing_purpose}
                onChange={(event) => updatePropertyField("listing_purpose", event.target.value)}
                required
              >
                <option value="rent">For Rent</option>
                <option value="sale">For Sale</option>
              </select>
            </label>

            <label>
              <span>Status</span>
              <select
                value={managedPropertyForm.status}
                onChange={(event) => updatePropertyField("status", event.target.value)}
              >
                <option value="available">Available</option>
                <option value="rented">Rented</option>
                {canMarkSold ? <option value="sold">Sold</option> : null}
              </select>
            </label>

            <label>
              <span>Property type</span>
              <input
                value={managedPropertyForm.type}
                onChange={(event) => updatePropertyField("type", event.target.value)}
                placeholder="2 Bedroom Flat"
                required
              />
            </label>

            <label>
              <span>Price</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={managedPropertyForm.price}
                onChange={(event) => updatePropertyField("price", event.target.value)}
                placeholder="250000"
                required
              />
            </label>

            <label>
              <span>Location</span>
              <input
                value={managedPropertyForm.location}
                onChange={(event) => updatePropertyField("location", event.target.value)}
                placeholder="Lekki, Lagos"
                required
              />
            </label>

            <label>
              <span>WhatsApp phone</span>
              <input
                value={managedPropertyForm.phone}
                onChange={(event) => updatePropertyField("phone", event.target.value)}
                placeholder="08012345678"
                required
              />
            </label>
          </div>

          <label>
            <span>Description</span>
            <textarea
              rows="5"
              value={managedPropertyForm.description}
              onChange={(event) => updatePropertyField("description", event.target.value)}
              placeholder="Highlight key features and location benefits."
              required
            />
          </label>

          <div className="form-grid">
            <label>
              <span>{isEditingProperty ? "Replace images" : "Images"}</span>
              <input ref={propertyImagesInputRef} type="file" accept="image/*" multiple />
            </label>

            <label>
              <span>{isEditingProperty ? "Replace video" : "Video"}</span>
              <input ref={propertyVideoInputRef} type="file" accept="video/*" />
            </label>
          </div>

          <p className="section-meta">
            {isEditingProperty
              ? "Leave images or video empty if you want to keep the existing media."
              : "Upload up to 5 images and 1 video for a new property."}
          </p>

          <div className="button-row">
            <button className="btn primary" type="submit" disabled={submittingProperty}>
              {submittingProperty
                ? isEditingProperty
                  ? "Saving..."
                  : "Creating..."
                : isEditingProperty
                  ? "Save Property"
                  : "Create Property"}
            </button>

            {isEditingProperty ? (
              <button
                className="btn secondary"
                type="button"
                onClick={resetManagedPropertyForm}
                disabled={submittingProperty}
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
            <p className="eyebrow">Property Inventory</p>
            <h2>{managedProperties.length} total listings</h2>
          </div>
        </div>

        <div className="auth-tabs" role="tablist" aria-label="Property status filter">
          {["all", "available", "rented", "sold"].map((filter) => (
            <button
              key={filter}
              type="button"
              className={propertyFilter === filter ? "tab active" : "tab"}
              onClick={() => setPropertyFilter(filter)}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>

        {propertiesError ? <div className="status-card error">{propertiesError}</div> : null}

        {propertiesLoading ? (
          <div className="status-card">Loading properties...</div>
        ) : filteredProperties.length === 0 ? (
          <EmptyStateCard
            title="No properties match this filter"
            description="Adjust the status tabs or create a new managed property to populate this inventory view."
          />
        ) : (
          <>
            <PaginatedContent
              className="dashboard-list"
              pageKey={`properties-${propertiesPagination.currentPage}`}
            >
              {propertiesPagination.pageItems.map((property) => (
                <article key={property.id} className="listing-row">
                  <div className="listing-row-media">
                    {property.images[0] ? (
                      <img
                        src={`${BACKEND_URL}/uploads/${property.images[0]}`}
                        alt={property.type}
                      />
                    ) : (
                      <div className="empty-media admin-listing-empty">No image</div>
                    )}
                  </div>

                  <div className="listing-row-content">
                    <div className="listing-row-header">
                      <div>
                        <h3>{property.type}</h3>
                        <p>{property.location}</p>
                      </div>
                      <strong className="listing-row-price">
                        {formatCurrency(property.price)}
                      </strong>
                    </div>

                    <div className="listing-tag-row">
                      <span className={`pill ${property.status}`}>{property.status}</span>
                      <span className={`pill ${property.listing_purpose}`}>
                        {property.listing_purpose_label}
                      </span>
                    </div>

                    <div className="listing-row-meta">
                      <div className="listing-row-meta-item">
                        <span>Landlord</span>
                        <strong>{property.landlord_name || "Unknown"}</strong>
                      </div>
                      <div className="listing-row-meta-item">
                        <span>Phone</span>
                        <strong>{property.phone || "No phone added"}</strong>
                      </div>
                      <div className="listing-row-meta-item">
                        <span>Contact Fee</span>
                        <strong>
                          Contact {property.contact_label}:{" "}
                          {formatNaira(property.contact_fee_naira)}
                        </strong>
                      </div>
                      <div className="listing-row-meta-item">
                        <span>Unlocks</span>
                        <strong>{property.unlocks_count}</strong>
                      </div>
                    </div>

                    <p className="listing-row-summary">
                      {property.description || "No description added yet."}
                    </p>
                  </div>

                  <div className="listing-row-side">
                    <div className="listing-actions">
                      <span className="section-meta">
                        Managed listing with synchronized unlock pricing.
                      </span>
                    </div>

                    <div className="listing-row-action-group">
                      <button
                        className="btn secondary"
                        type="button"
                        onClick={() => handleEditProperty(property)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn danger"
                        type="button"
                        onClick={() => handleDeleteProperty(property)}
                        disabled={deletingPropertyId === property.id}
                      >
                        {deletingPropertyId === property.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </PaginatedContent>

            <PaginationControls
              currentPage={propertiesPagination.currentPage}
              endIndex={propertiesPagination.endIndex}
              goToNextPage={propertiesPagination.goToNextPage}
              goToPage={propertiesPagination.goToPage}
              goToPreviousPage={propertiesPagination.goToPreviousPage}
              label="properties"
              pageNumbers={propertiesPagination.pageNumbers}
              startIndex={propertiesPagination.startIndex}
              totalItems={propertiesPagination.totalItems}
              totalPages={propertiesPagination.totalPages}
            />
          </>
        )}
      </div>
    </div>
  );
}
