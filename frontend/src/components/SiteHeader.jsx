import { FiArrowRight, FiDownload, FiLogIn } from "react-icons/fi";
import { Link, useLocation } from "react-router-dom";
import { usePwa } from "../contexts/PwaContext.jsx";
import { SITE_LOGO_PATH } from "../utils/siteConfig.js";
import { prefetchRoute } from "../utils/routePrefetch.js";

export default function SiteHeader() {
  const location = useLocation();
  const isHomepage = location.pathname === "/";
  const { canInstall, isStandalone, openInstallPrompt } = usePwa();

  function warmRoute(path) {
    prefetchRoute(path);
  }

  return (
    <header className={`site-header${isHomepage ? " site-header-homepage" : ""}`}>
      <div className="site-header-inner">
        <Link
          to="/"
          className="site-header-brand"
          aria-label="NoAgentNaija homepage"
          onMouseEnter={() => warmRoute("/")}
          onFocus={() => warmRoute("/")}
        >
          <img src={SITE_LOGO_PATH} alt="NoAgentNaija logo" />
          <span>
            <strong>NoAgentNaija</strong>
            <small>Rent direct. No agent fees.</small>
          </span>
        </Link>

        {isHomepage ? (
          <div className="site-header-actions">
            {!isStandalone && canInstall ? (
              <button type="button" className="btn secondary" onClick={() => openInstallPrompt()}>
                <FiDownload />
                Install App
              </button>
            ) : null}
            <Link
              to="/auth?mode=login"
              className="btn secondary"
              onMouseEnter={() => warmRoute("/auth")}
              onFocus={() => warmRoute("/auth")}
            >
              <FiLogIn />
              Login
            </Link>
            <Link
              to="/auth?mode=signup"
              className="btn primary"
              onMouseEnter={() => warmRoute("/auth")}
              onFocus={() => warmRoute("/auth")}
            >
              <FiArrowRight />
              Start Free
            </Link>
          </div>
        ) : null}
      </div>
    </header>
  );
}
