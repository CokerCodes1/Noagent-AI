import { FiArrowUpRight } from "react-icons/fi";
import { motion as Motion } from "framer-motion";
import {
  FaFacebookF,
  FaInstagram,
  FaTiktok,
  FaXTwitter,
  FaYoutube
} from "react-icons/fa6";
import { SITE_SOCIAL_LINKS } from "../../utils/siteConfig.js";
import Reveal from "./Reveal.jsx";
import { fadeInUp, staggerChildren } from "./homepageMotion.js";

const iconMap = {
  tiktok: FaTiktok,
  facebook: FaFacebookF,
  instagram: FaInstagram,
  x: FaXTwitter,
  youtube: FaYoutube
};

export default function SocialMediaSection() {
  return (
    <section className="homepage-section homepage-section-dark">
      <div className="homepage-container">
        <Reveal className="homepage-section-heading">
          <p className="eyebrow">Stay connected</p>
          <h2 className="homepage-gradient-title">Follow the movement beyond the homepage</h2>
          <p>
            Every channel plays a different role in trust, discovery, and social proof. Keep the brand visible where your audience already lives.
          </p>
        </Reveal>

        <Motion.div
          className="homepage-social-grid"
          variants={staggerChildren}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.16 }}
        >
          {SITE_SOCIAL_LINKS.map((platform) => {
            const Icon = iconMap[platform.key];

            return (
              <Motion.a
                key={platform.key}
                href={platform.href}
                target="_blank"
                rel="noreferrer"
                className={`homepage-social-card ${platform.theme}`}
                variants={fadeInUp}
              >
                <span className="homepage-social-icon">
                  <Icon />
                </span>
                <strong>{platform.name}</strong>
                <p>{platform.description}</p>
                <span className="homepage-social-cta">
                  {platform.shortLabel}
                  <FiArrowUpRight />
                </span>
              </Motion.a>
            );
          })}
        </Motion.div>
      </div>
    </section>
  );
}
