import {
  FaFacebookF,
  FaInstagram,
  FaTiktok,
  FaXTwitter,
  FaYoutube,
} from "react-icons/fa6";
import { FiMail, FiMapPin, FiPhone } from "react-icons/fi";
import { Link } from "react-router-dom";
import {
  SITE_ADDRESS,
  SITE_EMAIL,
  SITE_PHONE_DISPLAY,
  SITE_SOCIAL_LINKS,
} from "../../utils/siteConfig.js";

const iconMap = {
  tiktok: FaTiktok,
  facebook: FaFacebookF,
  instagram: FaInstagram,
  x: FaXTwitter,
  youtube: FaYoutube,
};

const quickLinks = [
  { label: "Rent", href: "/auth?mode=signup" },
  { label: "Sell", href: "/auth?mode=signup" },
  { label: "Technicians", href: "/auth?mode=signup&role=technician" },
];

export default function Footer() {
  return (
    <footer className="homepage-footer">
      <div className="homepage-container homepage-footer-grid">
        <div className="homepage-footer-brand">
          <p className="eyebrow">NoAgentNaija</p>
          <h2>No agents. Just direct transactions.</h2>
          <p>
            A production-focused property and service platform for Nigerians who
            want cleaner, faster, more direct outcomes.
          </p>
        </div>

        <div className="homepage-footer-column">
          <h3>Contact</h3>
          <a
            href={`tel:${SITE_PHONE_DISPLAY}`}
            className="homepage-footer-link"
          >
            <FiPhone />
            {SITE_PHONE_DISPLAY}
          </a>
          <a href={`mailto:${SITE_EMAIL}`} className="homepage-footer-link">
            <FiMail />
            {SITE_EMAIL}
          </a>
          <span className="homepage-footer-link">
            <FiMapPin />
            {SITE_ADDRESS}
          </span>
        </div>

        <div className="homepage-footer-column">
          <h3>Quick links</h3>
          {quickLinks.map((link) => (
            <Link
              key={link.label}
              to={link.href}
              className="homepage-footer-nav"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="homepage-footer-column">
          <h3>Social links</h3>
          <div className="homepage-footer-socials">
            {SITE_SOCIAL_LINKS.map((item) => {
              const Icon = iconMap[item.key];

              return (
                <a
                  key={item.key}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  className="homepage-footer-social"
                  aria-label={item.name}
                >
                  <Icon />
                </a>
              );
            })}
          </div>
        </div>
      </div>

      <div className="homepage-footer-bottom">
        <div className="homepage-container homepage-footer-bottom-inner">
          <p>
            Copyright © {new Date().getFullYear()} NoAgentNaija. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
