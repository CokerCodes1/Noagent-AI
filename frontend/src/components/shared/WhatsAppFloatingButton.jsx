import { AnimatePresence, motion as Motion } from "framer-motion";
import { useState } from "react";
import { FaWhatsapp } from "react-icons/fa";
import { SITE_WHATSAPP_LINK } from "../../utils/siteConfig.js";

export default function WhatsAppFloatingButton() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <>
      <div className="whatsapp-float-pulse" aria-hidden="true" />
      <Motion.a
        href={SITE_WHATSAPP_LINK}
        target="_blank"
        rel="noreferrer"
        className="whatsapp-float"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.96 }}
        aria-label="Chat with us on WhatsApp"
      >
        <span className="whatsapp-float-icon">
          <FaWhatsapp />
        </span>
        <span className="whatsapp-float-label">Chat with us</span>
      </Motion.a>

      <AnimatePresence>
        {isHovered ? (
          <Motion.div
            className="whatsapp-tooltip"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            Chat with us on WhatsApp
          </Motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
