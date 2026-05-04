import { AnimatePresence, motion as Motion } from "framer-motion";
import { FiX } from "react-icons/fi";
import { resolveMediaUrl } from "../../utils/media.js";

export default function VideoModal({ testimonial, onClose }) {
  return (
    <AnimatePresence>
      {testimonial ? (
        <Motion.div
          className="homepage-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <Motion.div
            className="homepage-modal-card"
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="homepage-modal-close"
              onClick={onClose}
              aria-label="Close testimonial video"
            >
              <FiX />
            </button>

            <div className="homepage-modal-video-wrap">
              <video controls autoPlay playsInline preload="metadata">
                <source src={resolveMediaUrl(testimonial.videoUrl)} type="video/mp4" />
              </video>
            </div>

            <div className="homepage-modal-copy">
              <h3>{testimonial.name}</h3>
              <p>{testimonial.role}</p>
            </div>
          </Motion.div>
        </Motion.div>
      ) : null}
    </AnimatePresence>
  );
}
