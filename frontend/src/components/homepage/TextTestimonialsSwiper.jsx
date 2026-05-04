import { useState, useEffect } from "react";
import { FiStar, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { getInitials, resolveMediaUrl } from "../../utils/media.js";
import Reveal from "./Reveal.jsx";

const placeholderTextTestimonials = [
  {
    id: "text-placeholder-1",
    name: "Direct Renters",
    role: "renter",
    rating: 5,
    textContent:
      "The platform removes the biggest source of delay: waiting on middlemen before a real property conversation can start.",
  },
  {
    id: "text-placeholder-2",
    name: "Growth-Ready Landlords",
    role: "landlord",
    rating: 5,
    textContent:
      "A cleaner pipeline means faster decisions, easier listing management, and fewer loose ends when properties need attention.",
  },
  {
    id: "text-placeholder-3",
    name: "Booked Technicians",
    role: "technician",
    rating: 5,
    textContent:
      "Technicians get positioned as a real growth channel, not an afterthought, which makes the homepage pull its weight.",
  },
];

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

export default function TextTestimonialsSwiper({ testimonials, loading }) {
  const items =
    testimonials.length > 0 ? testimonials : placeholderTextTestimonials;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoplayPaused, setIsAutoplayPaused] = useState(false);

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % items.length);
  };

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  // Autoplay functionality
  useEffect(() => {
    if (items.length <= 1 || isAutoplayPaused) return;

    const interval = setInterval(goToNext, 5500);
    return () => clearInterval(interval);
  }, [items.length, isAutoplayPaused, currentIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowLeft") goToPrev();
      if (e.key === "ArrowRight") goToNext();
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
                  className="homepage-slider-arrow left"
                  onClick={goToPrev}
                  aria-label="Previous testimonial"
                >
                  <FiChevronLeft />
                </button>
                <button
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
      </div>
    </section>
  );
}
