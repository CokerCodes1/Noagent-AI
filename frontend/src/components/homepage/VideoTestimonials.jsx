import { useMemo, useState } from "react";
import { motion as Motion } from "framer-motion";
import { FiPlay } from "react-icons/fi";
import { HOMEPAGE_MEDIA } from "../../utils/siteConfig.js";
import { resolveMediaUrl } from "../../utils/media.js";
import Reveal from "./Reveal.jsx";
import { fadeInUp, staggerChildren } from "./homepageMotion.js";
import VideoModal from "./VideoModal.jsx";

export default function VideoTestimonials({
  testimonials = [],
  loading,
  error,
}) {
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [failedVideoIds, setFailedVideoIds] = useState([]);

  const items = useMemo(() => testimonials || [], [testimonials]);
  const hasVideoTestimonials = items.length > 0;
  const fallbackMessage = error
    ? "Unable to load video testimonials. Please try again later."
    : "No video testimonials have been published yet.";

  const handleVideoError = (testimonialId) => {
    setFailedVideoIds((existing) =>
      existing.includes(testimonialId)
        ? existing
        : [...existing, testimonialId],
    );
  };

  const isVideoBroken = (id) => failedVideoIds.includes(id);

  return (
    <section
      id="homepage-testimonials"
      className="homepage-section homepage-section-dark"
    >
      <div className="homepage-container">
        <Reveal className="homepage-section-heading">
          <p className="eyebrow">Video testimonials</p>
          <h2 className="homepage-gradient-title">
            Real people. Clear proof. Direct results.
          </h2>
          <p>
            Watch quick stories from landlords, renters, and technicians using
            NoAgentNaija to move faster without agent friction.
          </p>
        </Reveal>

        {loading ? (
          <div className="homepage-video-grid">
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index} className="homepage-testimonial-skeleton" />
            ))}
          </div>
        ) : hasVideoTestimonials ? (
          <Motion.div
            className="homepage-video-grid"
            variants={staggerChildren}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.18 }}
          >
            {items.map((testimonial) => {
              const broken = isVideoBroken(testimonial.id);

              if (broken) {
                return (
                  <article
                    key={testimonial.id}
                    className="homepage-video-card homepage-video-card-broken"
                  >
                    <div className="homepage-video-frame homepage-video-frame-broken">
                      <div className="homepage-video-broken-message">
                        <p>Video unavailable</p>
                      </div>
                    </div>
                    <div className="homepage-video-card-copy">
                      <strong>{testimonial.name}</strong>
                      <span>{testimonial.role}</span>
                    </div>
                  </article>
                );
              }

              return (
                <Motion.article
                  key={testimonial.id}
                  className="homepage-video-card"
                  variants={fadeInUp}
                  whileHover={{ scale: 1.03 }}
                  onClick={() => setSelectedVideo(testimonial)}
                >
                  <div className="homepage-video-frame">
                    <video
                      muted
                      playsInline
                      preload="metadata"
                      poster={resolveMediaUrl(HOMEPAGE_MEDIA.heroPoster)}
                      onError={() => handleVideoError(testimonial.id)}
                    >
                      <source
                        src={resolveMediaUrl(testimonial.videoUrl)}
                        type="video/mp4"
                      />
                    </video>
                    <div className="homepage-video-overlay">
                      <span className="homepage-video-play">
                        <FiPlay />
                      </span>
                    </div>
                  </div>

                  <div className="homepage-video-card-copy">
                    <strong>{testimonial.name}</strong>
                    <span>{testimonial.role}</span>
                  </div>
                </Motion.article>
              );
            })}
          </Motion.div>
        ) : (
          <div className="homepage-video-empty">
            <p>{fallbackMessage}</p>
          </div>
        )}
      </div>

      <VideoModal
        testimonial={selectedVideo}
        onClose={() => setSelectedVideo(null)}
      />
    </section>
  );
}
