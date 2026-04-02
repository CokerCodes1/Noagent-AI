import { BACKEND_URL } from "../api/axios.js";

export default function VideoModal({ title, video, close }) {
  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
      <div className="modal-content">
        <div className="modal-header">
          <h3>{title}</h3>
          <button type="button" className="icon-btn" onClick={close}>
            Close
          </button>
        </div>

        <video
          src={`${BACKEND_URL}/uploads/${video}`}
          controls
          autoPlay
          style={{ width: "100%" }}
        />
      </div>
    </div>
  );
}
