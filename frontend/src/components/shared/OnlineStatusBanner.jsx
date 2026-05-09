import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiCloudOff, FiWifi } from "react-icons/fi";
import { usePwa } from "../../contexts/PwaContext.jsx";

export default function OnlineStatusBanner() {
  const { isOnline } = usePwa();
  const [showReconnectState, setShowReconnectState] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setShowReconnectState(false);
      return;
    }

    setShowReconnectState(true);

    const timeoutId = window.setTimeout(() => {
      setShowReconnectState(false);
    }, 2400);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isOnline]);

  const shouldRender = !isOnline || showReconnectState;

  return (
    <AnimatePresence initial={false}>
      {shouldRender ? (
        <motion.div
          className={`network-status-banner ${isOnline ? "online" : "offline"}`}
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -14 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          {isOnline ? <FiWifi aria-hidden="true" /> : <FiCloudOff aria-hidden="true" />}
          <span>
            {isOnline
              ? "Back online. Fresh content will sync automatically."
              : "You are offline. Cached pages and public listings are still available."}
          </span>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
