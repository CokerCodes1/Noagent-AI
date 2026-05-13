import { useState } from "react";
import { FiMapPin, FiPhone, FiPlayCircle } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa6";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api, { BACKEND_URL, extractErrorMessage } from "../api/axios.js";
import VideoModal from "./VideoModal.jsx";
import {
  formatNaira,
  getContactPersonLabel,
  getContactFeeNaira,
  getListingPurposeLabel
} from "../utils/propertyListing.js";

export default function PropertyCard({ property, onPaymentStateChange }) {
  const navigate = useNavigate();
  const [showVideo, setShowVideo] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [paying, setPaying] = useState(false);

  const images = property.images || [];
  const currentImage = images[currentImageIndex];
  const isUnlocked = property.is_unlocked;
  const contactLabel = property.contact_label || getContactPersonLabel(property.listing_purpose);
  const listingPurposeLabel =
    property.listing_purpose_label || getListingPurposeLabel(property.listing_purpose);

  async function handlePayment() {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/", { replace: true });
      return;
    }

    setPaying(true);

    try {
      const response = await api.post("/payment/initialize", {
        property_id: property.id,
      });

      if (response.data.alreadyUnlocked) {
        toast.info("Contact is already unlocked for this property.");
        onPaymentStateChange?.();
        return;
      }

      const authorizationUrl = response.data?.data?.authorization_url;

      if (!authorizationUrl) {
        throw new Error("Payment link was not returned by the server.");
      }

      window.location.assign(authorizationUrl);
    } catch (error) {
      toast.error(extractErrorMessage(error));
    } finally {
      setPaying(false);
    }
  }

  return (
    <article className="card property-card">
      <div className="property-media">
        <div className="property-media-frame">
          {currentImage ? (
            <img
              src={`${BACKEND_URL}/uploads/${currentImage}`}
              alt={`${property.type} in ${property.location}`}
            />
          ) : (
            <div className="empty-media">No image uploaded</div>
          )}
        </div>

        {images.length > 1 ? (
          <div className="thumb-row">
            {images.slice(0, 5).map((image, index) => (
              <button
                key={`${property.id}-${image}`}
                type="button"
                className={
                  index === currentImageIndex ? "thumb active" : "thumb"
                }
                onClick={() => setCurrentImageIndex(index)}
              >
                <img
                  src={`${BACKEND_URL}/uploads/${image}`}
                  alt={`${property.type} preview ${index + 1}`}
                />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="card-content property-card-shell">
        <div className="property-card-badge-row">
          <span className={`pill ${property.listing_purpose || "rent"}`}>
            {listingPurposeLabel}
          </span>
          <span className={`pill ${property.status || "available"}`}>
            {property.status || "available"}
          </span>
        </div>

        <div className="property-card-title-row">
          <div>
            <h3>{property.type}</h3>
            <p className="section-meta">{property.location}</p>
          </div>
          <strong className="property-card-price">
            {formatNaira(property.price)}
          </strong>
        </div>

        <div className="property-card-meta">
          <div className="property-card-meta-item">
            <span>Location</span>
            <strong>{property.location}</strong>
          </div>
          <div className="property-card-meta-item">
            <span>Access</span>
            <strong>
              {isUnlocked
                ? `Direct ${contactLabel.toLowerCase()} contact`
                : `Unlock ${contactLabel.toLowerCase()} contact`}
            </strong>
          </div>
        </div>

        <p className="property-description">{property.description}</p>

        <div className="property-card-footer">
          <div className="property-card-contact">
            <p className="section-meta">
              <FiMapPin aria-hidden="true" /> {property.location}
            </p>
            <p className="property-fee-note">
              <FiPhone aria-hidden="true" /> Contact fee:{" "}
              {formatNaira(getContactFeeNaira(property))}
            </p>
          </div>

          <div className="property-card-actions">
            <button
              className="btn secondary"
              type="button"
              onClick={() => setShowVideo(true)}
            >
              <FiPlayCircle aria-hidden="true" />
              Watch Video
            </button>

            {isUnlocked ? (
              <>
                <a className="btn primary" href={`tel:${property.phone}`}>
                  <FiPhone aria-hidden="true" />
                  Call {contactLabel}
                </a>
                <a
                  className="btn"
                  href={property.wa_link}
                  target="_blank"
                  rel="noreferrer"
                >
                  <FaWhatsapp aria-hidden="true" />
                  WhatsApp {contactLabel}
                </a>
              </>
            ) : (
              <button
                className="btn primary"
                type="button"
                onClick={handlePayment}
                disabled={paying}
              >
                <FiPhone aria-hidden="true" />
                {paying ? "Redirecting..." : `Contact ${contactLabel}`}
              </button>
            )}
          </div>
        </div>
      </div>

      {showVideo ? (
        <VideoModal
          title={`${property.type} walkthrough`}
          video={property.video}
          close={() => setShowVideo(false)}
        />
      ) : null}
    </article>
  );
}
