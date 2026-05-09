import { motion as Motion } from "framer-motion";
import { useEffect, useEffectEvent, useRef } from "react";
import { FiArrowRight, FiPlayCircle, FiTool } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { fadeInUp, staggerChildren } from "./homepageMotion.js";
import { resolveMediaUrl } from "../../utils/media.js";
import { prefetchRoute } from "../../utils/routePrefetch.js";
import { HOMEPAGE_MEDIA } from "../../utils/siteConfig.js";
import Reveal from "./Reveal.jsx";

const heroHighlights = [
  "Direct landlord access",
  "Verified renters",
  "Technician demand on standby",
];

const heroStats = [
  {
    value: "Zero agent fees",
    label: "Rent directly from verified landlords and escape costly agent fees.",
  },
  {
    value: "One platform",
    label: "Landlords, tenants, and technicians meet in one trusted flow.",
  },
  {
    value: "Mobile first",
    label: "Fast, clean actions for signups, listings, and service requests.",
  },
];

export default function HeroSection() {
  const navigate = useNavigate();
  const heroVideoRef = useRef(null);

  function warmRoute(path) {
    prefetchRoute(path);
  }

  const keepHeroVideoPlaying = useEffectEvent(() => {
    const video = heroVideoRef.current;

    if (!video || document.hidden) {
      return;
    }

    const playPromise = video.play();

    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {});
    }
  });

  useEffect(() => {
    const video = heroVideoRef.current;

    if (!video) {
      return undefined;
    }

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        keepHeroVideoPlaying();
      }
    };

    const handleVideoLoop = () => {
      video.currentTime = 0;
      keepHeroVideoPlaying();
    };

    keepHeroVideoPlaying();

    video.addEventListener("canplay", keepHeroVideoPlaying);
    video.addEventListener("waiting", keepHeroVideoPlaying);
    video.addEventListener("stalled", keepHeroVideoPlaying);
    video.addEventListener("suspend", keepHeroVideoPlaying);
    video.addEventListener("pause", keepHeroVideoPlaying);
    video.addEventListener("ended", handleVideoLoop);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      video.removeEventListener("canplay", keepHeroVideoPlaying);
      video.removeEventListener("waiting", keepHeroVideoPlaying);
      video.removeEventListener("stalled", keepHeroVideoPlaying);
      video.removeEventListener("suspend", keepHeroVideoPlaying);
      video.removeEventListener("pause", keepHeroVideoPlaying);
      video.removeEventListener("ended", handleVideoLoop);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return (
    <section className="homepage-hero">
      <video
        ref={heroVideoRef}
        className="homepage-hero-video"
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        aria-hidden="true"
        poster={resolveMediaUrl(HOMEPAGE_MEDIA.heroPoster)}
      >
        <source src={HOMEPAGE_MEDIA.heroVideo} type="video/mp4" />
      </video>
      <div className="homepage-hero-overlay" />

      <div className="homepage-hero-inner">
        <div className="homepage-hero-content">
          <Motion.div
            className="homepage-hero-copy"
            variants={staggerChildren}
            initial="hidden"
            animate="visible"
          >
            <Motion.div className="homepage-hero-pills" variants={fadeInUp}>
              {heroHighlights.map((item) => (
                <span key={item} className="homepage-pill">
                  {item}
                </span>
              ))}
            </Motion.div>

            <Motion.p className="homepage-kicker" variants={fadeInUp}>
              NoAgentNaija Premium Access
            </Motion.p>

            <Motion.h1 className="homepage-gradient-title" variants={fadeInUp}>
              No Agents. Just Direct Transactions.
            </Motion.h1>

            <Motion.h2 className="homepage-hero-subtitle" variants={fadeInUp}>
              For landlords renting faster, tenants finding homes cheaper, and
              technicians turning skill into daily income.
            </Motion.h2>

            <Motion.p className="homepage-hero-description" variants={fadeInUp}>
              NoAgentNaija helps people connect directly across rentals,
              property operations, and trusted repairs. No friction, no inflated
              commissions, and no wasted back-and-forth before the real
              conversation begins.
            </Motion.p>

            <Motion.div className="homepage-hero-actions" variants={fadeInUp}>
              <button
                type="button"
                className="btn primary homepage-cta-primary"
                onClick={() => navigate("/auth?mode=signup")}
                onMouseEnter={() => warmRoute("/auth")}
                onFocus={() => warmRoute("/auth")}
                onTouchStart={() => warmRoute("/auth")}
              >
                <FiArrowRight />
                Get Started
              </button>
              <button
                type="button"
                className="btn secondary homepage-cta-secondary"
                onClick={() => navigate("/auth?mode=login")}
                onMouseEnter={() => warmRoute("/auth")}
                onFocus={() => warmRoute("/auth")}
                onTouchStart={() => warmRoute("/auth")}
              >
                <FiPlayCircle />
                Login
              </button>
              <button
                type="button"
                className="btn secondary homepage-cta-secondary"
                onClick={() => navigate("/auth?mode=signup&role=technician")}
                onMouseEnter={() => warmRoute("/auth")}
                onFocus={() => warmRoute("/auth")}
                onTouchStart={() => warmRoute("/auth")}
              >
                <FiTool />
                Join as Technician
              </button>
            </Motion.div>
          </Motion.div>

          <Reveal className="homepage-hero-panel">
            <div className="homepage-hero-panel-card">
              <p className="eyebrow">Built for conversion</p>
              <h3>Move from discovery to direct action in minutes.</h3>
              <div className="homepage-hero-stats">
                {heroStats.map((stat) => (
                  <article key={stat.value} className="homepage-hero-stat-card">
                    <strong>{stat.value}</strong>
                    <p>{stat.label}</p>
                  </article>
                ))}
              </div>
            </div>
          </Reveal>
        </div>

        <a
          href="#homepage-testimonials"
          className="homepage-scroll-indicator"
          aria-label="Scroll to testimonials"
        >
          <span />
          <small>Scroll</small>
        </a>
      </div>
    </section>
  );
}
