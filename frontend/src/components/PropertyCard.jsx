import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api, { BACKEND_URL, extractErrorMessage } from "../api/axios.js";
import VideoModal from "./VideoModal.jsx";

export default function PropertyCard({ property, onPaymentStateChange }) {
  const navigate = useNavigate();
  const [showVideo, setShowVideo] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [paying, setPaying] = useState(false);

  const images = property.images || [];
  const currentImage = images[currentImageIndex];
  const isUnlocked = property.is_unlocked;

  async function handlePayment() {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/", { replace: true });
      return;
    }

    setPaying(true);

    try {
      const response = await api.post("/payment/initialize", {
        property_id: property.id
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
        {currentImage ? (
          <img
            src={`${BACKEND_URL}/uploads/${currentImage}`}
            alt={`${property.type} in ${property.location}`}
          />
        ) : (
          <div className="empty-media">No image uploaded</div>
        )}

        {images.length > 1 ? (
          <div className="thumb-row">
            {images.slice(0, 5).map((image, index) => (
              <button
                key={`${property.id}-${image}`}
                type="button"
                className={index === currentImageIndex ? "thumb active" : "thumb"}
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

      <div className="card-content">
        <div className="property-heading">
          <div>
            <h3>{property.type}</h3>
            <p>{property.location}</p>
          </div>
          <strong>N{Number(property.price).toLocaleString()}</strong>
        </div>

        <p className="property-description">{property.description}</p>

        <div className="button-row">
          <button className="btn secondary" type="button" onClick={() => setShowVideo(true)}>
            Watch Video
          </button>

          {isUnlocked ? (
            <>
              <a className="btn primary" href={`tel:${property.phone}`}>
                Call Landlord
              </a>
              <a
                className="btn"
                href={property.wa_link}
                target="_blank"
                rel="noreferrer"
              >
                WhatsApp
              </a>
            </>
          ) : (
            <button
              className="btn primary"
              type="button"
              onClick={handlePayment}
              disabled={paying}
            >
              {paying ? "Redirecting..." : "Pay N200 to Unlock Contact"}
            </button>
          )}
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
