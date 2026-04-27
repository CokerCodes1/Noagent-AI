import { useState } from "react";
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
        {profileImage ? (
          <img src={profileImage} alt={technician.name} />
        ) : (
          <div className="empty-media">No image uploaded</div>
        )}
      </div>

      <div className="card-content">
        <div className="property-heading">
          <div>
            <h3>{technician.name}</h3>
            <p>{technician.category}</p>
          </div>
        </div>

        <p className="property-description">{technician.description}</p>
        <p className="section-meta">{technician.office_address}</p>

        <div className="button-row">
          {technician.phone ? (
            <a
              className="btn primary"
              href={`tel:${technician.phone}`}
              onClick={recordContact}
            >
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
              Website
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}
