import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import api, { BACKEND_URL, extractErrorMessage } from "../api/axios.js";
import DashboardHeader from "../components/DashboardHeader.jsx";
import { clearAuthSession, getStoredUser } from "../utils/session.js";

export default function LandlordDashboard() {
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState([]);
  const [error, setError] = useState("");
  const user = getStoredUser();

  async function loadProperties() {
    try {
      setError("");
      const response = await api.get("/property/mine");
      setProperties(response.data);
    } catch (requestError) {
      const message = extractErrorMessage(requestError);
      setError(message);

      if (requestError.response?.status === 401) {
        clearAuthSession();
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProperties();
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const selectedImages = form.querySelector('input[name="images"]').files;

    if (selectedImages.length > 5) {
      toast.error("You can upload a maximum of 5 images.");
      return;
    }

    setSubmitting(true);

    try {
      await api.post("/property", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });

      toast.success("Property posted successfully.");
      form.reset();
      await loadProperties();
    } catch (requestError) {
      toast.error(extractErrorMessage(requestError));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleMarkRented(propertyId) {
    try {
      await api.put(`/property/${propertyId}/rented`);
      toast.success("Property marked as rented.");
      await loadProperties();
    } catch (requestError) {
      toast.error(extractErrorMessage(requestError));
    }
  }

  return (
    <div className="dashboard-shell">
      <section className="dashboard-section">
        <DashboardHeader
          title="Manage your property listings"
          subtitle="Post new listings, review your current inventory, and log out securely whenever you are done."
        />
      </section>

      <section className="dashboard-section split-layout">
        <div className="section-card">
          <p className="eyebrow">Landlord Dashboard</p>
          <h1>Post a listing that renters can actually act on.</h1>
          <p className="section-copy">
            Upload up to 5 images and 1 video, publish instantly, and mark the
            property as rented when it is no longer available.
          </p>
          <p className="section-meta">
            Signed in as {user?.name || "Landlord"}.
          </p>

          <form className="property-form" onSubmit={handleSubmit}>
            <div className="form-grid">
              <label>
                <span>Property type</span>
                <input name="type" placeholder="2 Bedroom Flat" required />
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
                placeholder="Highlight features, accessibility, and any important details."
                rows="5"
                required
              />
            </label>

            <div className="form-grid">
              <label>
                <span>Images</span>
                <input
                  type="file"
                  name="images"
                  accept="image/*"
                  multiple
                  required
                />
              </label>

              <label>
                <span>Video</span>
                <input type="file" name="video" accept="video/*" required />
              </label>
            </div>

            <button className="btn primary" type="submit" disabled={submitting}>
              {submitting ? "Posting..." : "Post Property"}
            </button>
          </form>
        </div>

        <div className="section-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Your Listings</p>
              <h2>{properties.length} properties</h2>
            </div>
          </div>

          {error ? <div className="status-card error">{error}</div> : null}

          {loading ? (
            <div className="status-card">Loading your properties...</div>
          ) : properties.length === 0 ? (
            <div className="status-card">You have not posted any properties yet.</div>
          ) : (
            <div className="dashboard-list">
              {properties.map((property) => (
                <article key={property.id} className="listing-row">
                  <img
                    src={`${BACKEND_URL}/uploads/${property.images[0]}`}
                    alt={property.type}
                  />
                  <div className="listing-copy">
                    <h3>{property.type}</h3>
                    <p>{property.location}</p>
                    <p>N{Number(property.price).toLocaleString()}</p>
                    <span className={`pill ${property.status}`}>
                      {property.status}
                    </span>
                  </div>

                  <div className="listing-actions">
                    <a
                      className="btn secondary"
                      href={property.wa_link}
                      target="_blank"
                      rel="noreferrer"
                    >
                      WhatsApp
                    </a>
                    <button
                      className="btn"
                      type="button"
                      onClick={() => handleMarkRented(property.id)}
                      disabled={property.status === "rented"}
                    >
                      {property.status === "rented" ? "Already Rented" : "Mark as Rented"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
