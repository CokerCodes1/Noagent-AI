import { AnimatePresence, motion as Motion } from "framer-motion";

export default function PaginatedContent({ children, className, pageKey }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <Motion.div
        key={pageKey}
        className={className}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        {children}
      </Motion.div>
    </AnimatePresence>
  );
}
