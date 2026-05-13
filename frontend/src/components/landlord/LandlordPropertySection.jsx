import { toast } from "react-toastify";
import { BACKEND_URL, extractErrorMessage } from "../../api/axios.js";
import usePagination from "../../hooks/usePagination.js";
import { formatNaira } from "../../utils/propertyListing.js";
import EmptyStateCard from "../shared/EmptyStateCard.jsx";
import PaginatedContent from "../shared/PaginatedContent.jsx";
import PaginationControls from "../shared/PaginationControls.jsx";

export default function LandlordPropertySection({
  title,
  eyebrow,
  description,
  submitLabel,
  submitting,
  onSubmit,
  properties,
  listingPurpose,
  onStatusChange
}) {
  const propertiesPagination = usePagination(properties, {
    resetKey: listingPurpose
  });

  async function handleSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const selectedImages = form.querySelector('input[name="images"]').files;

    if (selectedImages.length > 5) {
      toast.error("You can upload a maximum of 5 images.");
      return;
    }

    try {
      formData.set("listing_purpose", listingPurpose);
      await onSubmit(formData, form);
      form.reset();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  }

  return (
    <div className="grid admin-management-grid">
      <div className="section-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <h2>{title}</h2>
          </div>
        </div>

        <p className="section-copy">{description}</p>

        <form className="property-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <label>
              <span>Property type</span>
              <input name="type" placeholder="3 Bedroom Duplex" required />
            </label>

            <label>
              <span>Price</span>
              <input
                name="price"
                type="number"
                min="0"
                step="0.01"
                placeholder="250000"
                required
              />
            </label>

            <label>
              <span>Location</span>
              <input name="location" placeholder="Lekki, Lagos" required />
            </label>

            <label>
              <span>WhatsApp phone</span>
              <input name="phone" placeholder="08012345678" required />
            </label>
          </div>

          <label>
            <span>Description</span>
            <textarea
              name="description"
              rows="5"
              placeholder="Highlight the strongest selling points."
              required
            />
          </label>

          <div className="form-grid">
            <label>
              <span>Images</span>
              <input type="file" name="images" accept="image/*" multiple required />
            </label>

            <label>
              <span>Video</span>
              <input type="file" name="video" accept="video/*" required />
            </label>
          </div>

          <button className="btn primary" type="submit" disabled={submitting}>
            {submitting ? "Saving..." : submitLabel}
          </button>
        </form>
      </div>

      <div className="section-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Listings</p>
            <h2>{properties.length} {listingPurpose === "sale" ? "sale" : "rental"} properties</h2>
          </div>
        </div>

        {properties.length === 0 ? (
          <EmptyStateCard
            title={`No ${listingPurpose === "sale" ? "sale" : "rental"} listings yet`}
            description="Create your first listing from the form on the left and it will appear here with responsive actions and cleaner media presentation."
          />
        ) : (
          <>
            <PaginatedContent
              className="dashboard-list"
              pageKey={`${listingPurpose}-properties-${propertiesPagination.currentPage}`}
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
                        {formatNaira(property.price)}
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
                        <span>Location</span>
                        <strong>{property.location}</strong>
                      </div>
                      <div className="listing-row-meta-item">
                        <span>Contact Fee</span>
                        <strong>
                          Contact {property.contact_label}:{" "}
                          {formatNaira(property.contact_fee_naira)}
                        </strong>
                      </div>
                    </div>

                    <p className="listing-row-summary">
                      {property.description || "No description added yet."}
                    </p>
                  </div>

                  <div className="listing-row-side">
                    <div className="listing-actions">
                      <span className="section-meta">
                        {property.status === "available"
                          ? "Currently visible to renters"
                          : "This listing is archived from discovery"}
                      </span>
                    </div>

                    <div className="listing-row-action-group">
                      {property.wa_link ? (
                        <a
                          className="btn secondary"
                          href={property.wa_link}
                          target="_blank"
                          rel="noreferrer"
                        >
                          WhatsApp
                        </a>
                      ) : null}
                      <button
                        className="btn"
                        type="button"
                        onClick={() =>
                          onStatusChange(
                            property,
                            listingPurpose === "sale" ? "sold" : "rented"
                          )
                        }
                        disabled={
                          property.status ===
                          (listingPurpose === "sale" ? "sold" : "rented")
                        }
                      >
                        {property.status ===
                        (listingPurpose === "sale" ? "sold" : "rented")
                          ? listingPurpose === "sale"
                            ? "Already Sold"
                            : "Already Rented"
                          : listingPurpose === "sale"
                            ? "Mark as Sold"
                            : "Mark as Rented"}
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
              label="listings"
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
