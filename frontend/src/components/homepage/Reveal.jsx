import { motion as Motion } from "framer-motion";
import { fadeInUp } from "./homepageMotion.js";

export default function Reveal({
  children,
  className = "",
  amount = 0.2,
  once = true
}) {
  return (
    <Motion.div
      className={className}
      variants={fadeInUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount }}
    >
      {children}
    </Motion.div>
  );
}
