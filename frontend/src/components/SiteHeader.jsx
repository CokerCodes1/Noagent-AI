import { FiArrowRight, FiLogIn } from "react-icons/fi";
import { Link, useLocation } from "react-router-dom";
import { SITE_LOGO_PATH } from "../utils/siteConfig.js";

export default function SiteHeader() {
  const location = useLocation();
  const isHomepage = location.pathname === "/";

  return (
    <header className={`site-header${isHomepage ? " site-header-homepage" : ""}`}>
      <div className="site-header-inner">
        <Link to="/" className="site-header-brand" aria-label="NoAgentNaija homepage">
          <img src={SITE_LOGO_PATH} alt="NoAgentNaija logo" />
          <span>
            <strong>NoAgentNaija</strong>
            <small>Rent direct. No agent fees.</small>
          </span>
        </Link>

        {isHomepage ? (
          <div className="site-header-actions">
            <Link to="/auth?mode=login" className="btn secondary">
              <FiLogIn />
              Login
            </Link>
            <Link to="/auth?mode=signup" className="btn primary">
              <FiArrowRight />
              Start Free
            </Link>
          </div>
        ) : null}
      </div>
    </header>
  );
}
