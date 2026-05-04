import { motion as Motion } from "framer-motion";
import { FiClock, FiHome, FiMapPin, FiShield } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { HOMEPAGE_MEDIA } from "../../utils/siteConfig.js";
import { resolveMediaUrl } from "../../utils/media.js";
import Reveal from "./Reveal.jsx";
import { fadeInUp, staggerChildren } from "./homepageMotion.js";

const benefits = [
  {
    icon: FiHome,
    title: "Direct property access",
    description: "Browse homes from landlords without added agent commission pressure."
  },
  {
    icon: FiShield,
    title: "Cleaner trust signals",
    description: "Reduce guesswork with a platform built around direct communication and verified actions."
  },
  {
    icon: FiMapPin,
    title: "Search with clarity",
    description: "Move from discovery to a real conversation faster when listing intent is obvious."
  },
  {
    icon: FiClock,
    title: "Less wasted time",
    description: "Skip the loops, delays, and unnecessary negotiation layers that slow renters down."
  }
];

export default function RentersSection() {
  const navigate = useNavigate();

  return (
    <section className="homepage-section">
      <div className="homepage-container homepage-split-section">
        <Reveal className="homepage-media-stack">
          <div className="homepage-media-card">
            <img src={HOMEPAGE_MEDIA.rentersImage} alt="Interior property view for renters" loading="lazy" />
          </div>
          <div className="homepage-floating-metric">
            <strong>Find Homes Without Agents</strong>
            <span>Cleaner discovery. Direct contact. More control.</span>
          </div>
        </Reveal>

        <Motion.div
          className="homepage-copy-stack"
          variants={staggerChildren}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          <Motion.p className="eyebrow" variants={fadeInUp}>
            For renters
          </Motion.p>
          <Motion.h2 className="homepage-gradient-title" variants={fadeInUp}>
            Find Homes Without Agents
          </Motion.h2>
          <Motion.p className="homepage-section-copy" variants={fadeInUp}>
            Renters should be able to see, compare, and connect without paying extra just to start the conversation.
            NoAgentNaija puts the direct path back in your hands.
          </Motion.p>

          <Motion.div className="homepage-feature-list" variants={staggerChildren}>
            {benefits.map((benefit) => {
              const Icon = benefit.icon;

              return (
                <Motion.article key={benefit.title} className="homepage-feature-card" variants={fadeInUp}>
                  <span className="homepage-feature-icon">
                    <Icon />
                  </span>
                  <div>
                    <h3>{benefit.title}</h3>
                    <p>{benefit.description}</p>
                  </div>
                </Motion.article>
              );
            })}
          </Motion.div>

          <Motion.div variants={fadeInUp}>
            <button type="button" className="btn primary" onClick={() => navigate("/auth?mode=signup")}>
              Find a Home
            </button>
          </Motion.div>
        </Motion.div>
      </div>
    </section>
  );
}
