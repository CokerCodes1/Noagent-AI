import { motion as Motion } from "framer-motion";
import { FiBarChart2, FiCreditCard, FiHome, FiUsers } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { HOMEPAGE_MEDIA } from "../../utils/siteConfig.js";
import { resolveMediaUrl } from "../../utils/media.js";
import Reveal from "./Reveal.jsx";
import { fadeInUp, staggerChildren } from "./homepageMotion.js";

const landlordHighlights = [
  {
    icon: FiUsers,
    title: "Tenant management",
    description: "Track tenant records and follow-up activity from one organized workspace."
  },
  {
    icon: FiCreditCard,
    title: "Rent tracking",
    description: "Monitor payments, arrears, and revenue patterns with less manual effort."
  },
  {
    icon: FiBarChart2,
    title: "Sales tracking",
    description: "Keep visibility on property performance and decisions that affect growth."
  }
];

export default function LandlordsSection() {
  const navigate = useNavigate();

  return (
    <section className="homepage-section homepage-section-tinted">
      <div className="homepage-container homepage-split-section reverse">
        <Motion.div
          className="homepage-copy-stack"
          variants={staggerChildren}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          <Motion.p className="eyebrow" variants={fadeInUp}>
            For landlords
          </Motion.p>
          <Motion.h2 className="homepage-gradient-title" variants={fadeInUp}>
            Manage Properties Like a Pro
          </Motion.h2>
          <Motion.p className="homepage-section-copy" variants={fadeInUp}>
            Your listings, tenant workflows, payments, and property performance should live in a system designed to move quickly.
            NoAgentNaija keeps the landlord experience direct and operationally sharp.
          </Motion.p>

          <Motion.div className="homepage-highlight-column" variants={staggerChildren}>
            {landlordHighlights.map((item) => {
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
            <button type="button" className="btn primary" onClick={() => navigate("/auth?mode=signup")}>
              List Property
            </button>
          </Motion.div>
        </Motion.div>

        <Reveal className="homepage-landlord-panel">
          <div className="homepage-media-card">
            <img src={HOMEPAGE_MEDIA.landlordsImage} alt="Property exterior for landlord showcase" loading="lazy" />
            <div className="homepage-floating-metric">
              <strong>Manage Listings With Confidence</strong>
              <span>Keep every property visible, organized, and ready for the next tenant without extra hassle.</span>
            </div>
          </div>
          <div className="homepage-dashboard-preview">
            <article className="homepage-dashboard-widget">
              <FiHome />
              <div>
                <strong>Listings in motion</strong>
                <span>Track availability and next best actions without spreadsheet chaos.</span>
              </div>
            </article>
            <article className="homepage-dashboard-widget success">
              <FiBarChart2 />
              <div>
                <strong>Sharper oversight</strong>
                <span>Keep management, rent, and sales momentum moving from one dashboard flow.</span>
              </div>
            </article>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
