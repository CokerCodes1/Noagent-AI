import React from "react";
import ReactDOM from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from "./App.jsx";
import "./styles/main.css";
import "react-toastify/dist/ReactToastify.css";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function syncViewportUnits() {
  const viewportHeight = window.visualViewport?.height || window.innerHeight;

  document.documentElement.style.setProperty(
    "--app-height",
    `${window.innerHeight}px`,
  );
  document.documentElement.style.setProperty(
    "--visual-viewport-height",
    `${viewportHeight}px`,
  );
}

syncViewportUnits();
window.addEventListener("resize", syncViewportUnits);
window.visualViewport?.addEventListener("resize", syncViewportUnits);
window.addEventListener("orientationchange", syncViewportUnits);

if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
  document.addEventListener(
    "touchmove",
    (event) => {
      if (event.target.closest(".no-scroll")) {
        event.preventDefault();
      }
    },
    { passive: false },
  );
}

const app = (
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

ReactDOM.createRoot(document.getElementById("root")).render(
  googleClientId ? (
    <GoogleOAuthProvider clientId={googleClientId}>{app}</GoogleOAuthProvider>
  ) : (
    app
  ),
);
