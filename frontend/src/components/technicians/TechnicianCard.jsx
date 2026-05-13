import { useState } from "react";
import { FiBriefcase, FiGlobe, FiMapPin, FiPhoneCall } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa6";
import { toast } from "react-toastify";
import api, { BACKEND_URL, extractErrorMessage } from "../../api/axios.js";

function resolveMediaUrl(value = "") {
  if (!value) {
    return "";
  }

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  return `${BACKEND_URL}/uploads/${value}`;
}

export default function TechnicianCard({ technician }) {
  const [recording, setRecording] = useState(false);

  async function recordContact() {
    if (recording) {
      return;
    }

    setRecording(true);

    try {
      await api.post(`/technicians/${technician.id}/contact`);
    } catch (error) {
      const message = extractErrorMessage(error);

      if (!/Authentication required|access/i.test(message)) {
        toast.error(message);
      }
    } finally {
      setRecording(false);
    }
  }

  const profileImage = resolveMediaUrl(technician.profile_image);

  return (
    <article className="card technician-card">
      <div className="technician-media">
        <div className="technician-media-frame">
          {profileImage ? (
            <img src={profileImage} alt={technician.name} />
          ) : (
            <div className="empty-media">No image uploaded</div>
          )}
        </div>
      </div>

      <div className="card-content technician-card-shell">
        <div className="property-card-badge-row">
          <span className="pill neutral">{technician.category || "Technician"}</span>
          <span className="pill available">Available</span>
        </div>

        <div className="property-card-title-row">
          <div>
            <h3>{technician.name}</h3>
            <p className="section-meta">{technician.category}</p>
          </div>
        </div>

        <p className="property-description">{technician.description}</p>

        <div className="technician-card-highlights">
          <div className="technician-card-highlight">
            <span>Office</span>
            <strong>{technician.office_address || "Address not added yet"}</strong>
          </div>
          <div className="technician-card-highlight">
            <span>Contact</span>
            <strong>{technician.phone || "Phone not added yet"}</strong>
          </div>
        </div>

        <div className="property-card-actions">
          {technician.phone ? (
            <a
              className="btn primary"
              href={`tel:${technician.phone}`}
              onClick={recordContact}
            >
              <FiPhoneCall aria-hidden="true" />
              Call
            </a>
          ) : null}

          {technician.wa_link ? (
            <a
              className="btn"
              href={technician.wa_link}
              target="_blank"
              rel="noreferrer"
              onClick={recordContact}
            >
              <FaWhatsapp aria-hidden="true" />
              WhatsApp
            </a>
          ) : null}

          {technician.website ? (
            <a
              className="btn secondary"
              href={technician.website}
              target="_blank"
              rel="noreferrer"
              onClick={recordContact}
            >
              <FiGlobe aria-hidden="true" />
              Website
            </a>
          ) : null}
        </div>

        <div className="property-card-contact">
          <p className="section-meta">
            <FiBriefcase aria-hidden="true" /> {technician.category}
          </p>
          <p className="section-meta">
            <FiMapPin aria-hidden="true" />{" "}
            {technician.office_address || "Address coming soon"}
          </p>
        </div>
      </div>
    </article>
  );
}
