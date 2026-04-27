import { toast } from "react-toastify";
import { BACKEND_URL, extractErrorMessage } from "../../api/axios.js";
import { formatNaira } from "../../utils/propertyListing.js";

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
          <div className="status-card">No listings found for this category yet.</div>
        ) : (
          <div className="dashboard-list">
            {properties.map((property) => (
              <article key={property.id} className="listing-row">
                {property.images[0] ? (
                  <img src={`${BACKEND_URL}/uploads/${property.images[0]}`} alt={property.type} />
                ) : (
                  <div className="empty-media admin-listing-empty">No image</div>
                )}

                <div className="listing-copy">
                  <div className="admin-user-heading">
                    <h3>{property.type}</h3>
                    <span className={`pill ${property.status}`}>{property.status}</span>
                    <span className={`pill ${property.listing_purpose}`}>{property.listing_purpose_label}</span>
                  </div>
                  <p>{property.location}</p>
                  <p>{formatNaira(property.price)}</p>
                  <p>Contact {property.contact_label}: {formatNaira(property.contact_fee_naira)}</p>
                </div>

                <div className="listing-actions">
                  {property.wa_link ? (
                    <a className="btn secondary" href={property.wa_link} target="_blank" rel="noreferrer">
                      WhatsApp
                    </a>
                  ) : null}
                  <button
                    className="btn"
                    type="button"
                    onClick={() => onStatusChange(property, listingPurpose === "sale" ? "sold" : "rented")}
                    disabled={property.status === (listingPurpose === "sale" ? "sold" : "rented")}
                  >
                    {property.status === (listingPurpose === "sale" ? "sold" : "rented")
                      ? listingPurpose === "sale"
                        ? "Already Sold"
                        : "Already Rented"
                      : listingPurpose === "sale"
                        ? "Mark as Sold"
                        : "Mark as Rented"}
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
