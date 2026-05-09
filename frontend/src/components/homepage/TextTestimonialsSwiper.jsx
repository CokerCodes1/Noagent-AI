import { useEffect, useState, useEffectEvent } from "react";
import { FiStar, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { getInitials, resolveMediaUrl } from "../../utils/media.js";
import Reveal from "./Reveal.jsx";

function StarRow({ rating }) {
  return (
    <div className="homepage-star-row" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, index) => (
        <FiStar key={index} className={index < rating ? "is-filled" : ""} />
      ))}
    </div>
  );
}

function TestimonialSlide({ testimonial }) {
  return (
    <div className="homepage-slide">
      <article className="homepage-text-card">
        <StarRow rating={testimonial.rating || 5} />
        <blockquote>{testimonial.textContent}</blockquote>
        <div className="homepage-text-card-footer">
          <div className="homepage-avatar">
            {testimonial.avatarUrl ? (
              <img
                src={resolveMediaUrl(testimonial.avatarUrl)}
                alt={testimonial.name}
                loading="lazy"
              />
            ) : (
              <span>{getInitials(testimonial.name)}</span>
            )}
          </div>
          <div>
            <strong>{testimonial.name}</strong>
            <span>{testimonial.role}</span>
          </div>
        </div>
      </article>
    </div>
  );
}

export default function TextTestimonialsSwiper({ testimonials = [], loading, error }) {
  const items = testimonials || [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoplayPaused, setIsAutoplayPaused] = useState(false);

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % items.length);
  };

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  const autoplayNext = useEffectEvent(() => {
    setCurrentIndex((prev) => (prev + 1) % items.length);
  });

  const handleArrowNavigation = useEffectEvent((key) => {
    if (key === "ArrowLeft") {
      setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
    }

    if (key === "ArrowRight") {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }
  });

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  useEffect(() => {
    setCurrentIndex((previousIndex) =>
      items.length > 0 ? Math.min(previousIndex, items.length - 1) : 0,
    );
  }, [items.length]);

  // Autoplay functionality
  useEffect(() => {
    if (items.length <= 1 || isAutoplayPaused) return;

    const interval = setInterval(autoplayNext, 5500);
    return () => clearInterval(interval);
  }, [items.length, isAutoplayPaused]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      handleArrowNavigation(e.key);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (loading) {
    return (
      <section className="homepage-section">
        <div className="homepage-container">
          <Reveal className="homepage-section-heading">
            <p className="eyebrow">Text testimonials</p>
            <h2 className="homepage-gradient-title">
              What users remember after the click
            </h2>
            <p>
              Trust compounds when the message is simple: faster connections,
              less stress, and cleaner execution for everyone involved.
            </p>
          </Reveal>
          <div className="homepage-text-slider-skeleton" />
        </div>
      </section>
    );
  }

  return (
    <section className="homepage-section">
      <div className="homepage-container">
        <Reveal className="homepage-section-heading">
          <p className="eyebrow">Text testimonials</p>
          <h2 className="homepage-gradient-title">
            What users remember after the click
          </h2>
          <p>
            Trust compounds when the message is simple: faster connections, less
            stress, and cleaner execution for everyone involved.
          </p>
        </Reveal>

        {items.length === 0 ? (
          <div className="homepage-text-empty">
            <p>
              {error
                ? "Unable to load testimonials right now. Please try again later."
                : "No text testimonials have been published yet."}
            </p>
          </div>
        ) : (
          <div
            className="homepage-text-slider-shell"
            onMouseEnter={() => setIsAutoplayPaused(true)}
            onMouseLeave={() => setIsAutoplayPaused(false)}
          >
            {/* Main slider container */}
            <div
              className="testimonial-slider"
              role="region"
              aria-label="Testimonials carousel"
            >
              {/* Current slide */}
              <div className="testimonial-slider-track">
                <TestimonialSlide testimonial={items[currentIndex]} />
              </div>

              {/* Navigation arrows */}
              {items.length > 1 && (
                <>
                  <button
                    type="button"
                    className="homepage-slider-arrow left"
                    onClick={goToPrev}
                    aria-label="Previous testimonial"
                  >
                    <FiChevronLeft />
                  </button>
                  <button
                    type="button"
                    className="homepage-slider-arrow right"
                    onClick={goToNext}
                    aria-label="Next testimonial"
                  >
                    <FiChevronRight />
                  </button>
                </>
              )}

              {/* Dots indicator */}
              {items.length > 1 && (
                <div
                  className="slick-dots"
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    gap: "0.5rem",
                    marginTop: "1rem",
                  }}
                >
                  {items.map((_, index) => (
                    <button
                      type="button"
                      key={index}
                      onClick={() => goToSlide(index)}
                      aria-label={`Go to testimonial ${index + 1}`}
                      style={{
                        width: "10px",
                        height: "10px",
                        borderRadius: "50%",
                        border: "none",
                        padding: 0,
                        cursor: "pointer",
                        background:
                          index === currentIndex
                            ? "var(--accent)"
                            : "rgba(89, 52, 24, 0.2)",
                        transition: "background 0.2s ease",
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
