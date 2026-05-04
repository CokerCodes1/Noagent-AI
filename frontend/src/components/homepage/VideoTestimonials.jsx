import { useState } from "react";
import { motion as Motion } from "framer-motion";
import { FiPlay } from "react-icons/fi";
import { HOMEPAGE_MEDIA } from "../../utils/siteConfig.js";
import { resolveMediaUrl } from "../../utils/media.js";
import Reveal from "./Reveal.jsx";
import { fadeInUp, staggerChildren } from "./homepageMotion.js";
import VideoModal from "./VideoModal.jsx";

const placeholderTestimonials = [
  { id: "placeholder-1", name: "Landlord Story Slot", role: "landlord", videoUrl: HOMEPAGE_MEDIA.testimonialsVideo },
  { id: "placeholder-2", name: "Tenant Story Slot", role: "renter", videoUrl: HOMEPAGE_MEDIA.testimonialsVideo },
  { id: "placeholder-3", name: "Technician Story Slot", role: "technician", videoUrl: HOMEPAGE_MEDIA.testimonialsVideo },
  { id: "placeholder-4", name: "Direct Rent Win", role: "renter", videoUrl: HOMEPAGE_MEDIA.testimonialsVideo },
  { id: "placeholder-5", name: "Repair Job Win", role: "technician", videoUrl: HOMEPAGE_MEDIA.testimonialsVideo },
  { id: "placeholder-6", name: "Portfolio Growth Win", role: "landlord", videoUrl: HOMEPAGE_MEDIA.testimonialsVideo }
];

export default function VideoTestimonials({ testimonials, loading }) {
  const [selectedVideo, setSelectedVideo] = useState(null);
  const items = testimonials.length > 0 ? testimonials : placeholderTestimonials;

  return (
    <section id="homepage-testimonials" className="homepage-section homepage-section-dark">
      <div className="homepage-container">
        <Reveal className="homepage-section-heading">
          <p className="eyebrow">Video testimonials</p>
          <h2 className="homepage-gradient-title">Real people. Clear proof. Direct results.</h2>
          <p>
            Watch quick stories from landlords, renters, and technicians using NoAgentNaija to move faster without agent friction.
          </p>
        </Reveal>

        {loading ? (
          <div className="homepage-video-grid">
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index} className="homepage-testimonial-skeleton" />
            ))}
          </div>
        ) : (
          <Motion.div
            className="homepage-video-grid"
            variants={staggerChildren}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.18 }}
          >
            {items.map((testimonial) => (
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
                  >
                    <source src={resolveMediaUrl(testimonial.videoUrl)} type="video/mp4" />
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
            ))}
          </Motion.div>
        )}
      </div>

      <VideoModal testimonial={selectedVideo} onClose={() => setSelectedVideo(null)} />
    </section>
  );
}
