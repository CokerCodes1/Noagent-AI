import { motion as Motion } from "framer-motion";
import { FiAward, FiBriefcase, FiTrendingUp, FiZap } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { HOMEPAGE_MEDIA } from "../../utils/siteConfig.js";
import { technicianCategories } from "../../utils/technicianCategories.js";
import Reveal from "./Reveal.jsx";
import { fadeInUp, staggerChildren } from "./homepageMotion.js";

const technicianBenefits = [
  {
    icon: FiBriefcase,
    title: "Turn visibility into jobs",
    description: "Get discovered by landlords and renters already inside the NoAgentNaija flow."
  },
  {
    icon: FiAward,
    title: "Build a stronger profile",
    description: "Showcase your work, ratings, and service value with a profile designed to convert trust."
  },
  {
    icon: FiTrendingUp,
    title: "Create repeat income",
    description: "Let daily service demand compound into a more stable stream of opportunities."
  },
  {
    icon: FiZap,
    title: "Move faster on mobile",
    description: "Respond, update, and stay visible without needing a complicated workflow."
  }
];

export default function TechniciansSection() {
  const navigate = useNavigate();

  return (
    <section className="homepage-section">
      <div className="homepage-container homepage-split-section">
        <Motion.div
          className="homepage-copy-stack"
          variants={staggerChildren}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          <Motion.p className="eyebrow" variants={fadeInUp}>
            For technicians
          </Motion.p>
          <Motion.h2 className="homepage-gradient-title" variants={fadeInUp}>
            Turn Your Skill Into Daily Income
          </Motion.h2>
          <Motion.p className="homepage-section-copy" variants={fadeInUp}>
            Skilled professionals deserve more than random referrals. NoAgentNaija helps you become visible where real property and service demand already exists.
          </Motion.p>

          <Motion.div className="homepage-highlight-column" variants={staggerChildren}>
            {technicianBenefits.map((item) => {
              const Icon = item.icon;

              return (
                <Motion.article key={item.title} className="homepage-highlight-row" variants={fadeInUp}>
                  <span className="homepage-feature-icon">
                    <Icon />
                  </span>
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                  </div>
                </Motion.article>
              );
            })}
          </Motion.div>

          <Motion.div variants={fadeInUp}>
            <button
              type="button"
              className="btn primary"
              onClick={() => navigate("/auth?mode=signup&role=technician")}
            >
              Join as Technician
            </button>
          </Motion.div>
        </Motion.div>

        <Reveal className="homepage-category-panel">
          <div className="homepage-media-card">
            <img
              src={HOMEPAGE_MEDIA.techniciansImage}
              alt="Technician at work"
              loading="lazy"
            />
            <div className="homepage-floating-metric">
              <strong>Showcase Your Expertise</strong>
              <span>Highlight your services and connect with property owners and renters who need skilled help now.</span>
            </div>
          </div>
          <div className="homepage-category-grid">
            {technicianCategories.slice(0, 12).map((category) => (
              <span key={category} className="homepage-category-chip">
                {category}
              </span>
            ))}
          </div>
          <div className="homepage-category-footer">
            <strong>Popular categories</strong>
            <p>Electricians, plumbers, tilers, painters, dispatch riders, fashion designers, and more.</p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
