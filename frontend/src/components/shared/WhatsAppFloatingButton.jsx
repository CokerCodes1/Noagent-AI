import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaWhatsapp } from "react-icons/fa";

const WhatsAppFloatingButton = () => {
  const [isHovered, setIsHovered] = useState(false);

  const handleWhatsAppClick = () => {
    const phoneNumber = "234XXXXXXXXXX"; // Replace with actual number
    const message = encodeURIComponent("Hi! I'm interested in learning more about NoAgentNaija.");
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <>
      <motion.button
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-green-500 hover:bg-green-600 rounded-full shadow-lg flex items-center justify-center text-white transition-all duration-300"
        onClick={handleWhatsAppClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        animate={{
          boxShadow: isHovered
            ? "0 0 20px rgba(34, 197, 94, 0.4)"
            : "0 4px 12px rgba(0, 0, 0, 0.15)"
        }}
      >
        <FaWhatsapp size={24} />
      </motion.button>

      {/* Pulse animation */}
      <div className="fixed bottom-6 right-6 z-40">
        <div className="w-14 h-14 bg-green-500 rounded-full animate-ping opacity-20"></div>
      </div>

      {/* Tooltip */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            className="fixed bottom-20 right-6 z-50 bg-text text-hero-copy px-4 py-2 rounded-lg shadow-lg text-sm whitespace-nowrap"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            Chat with us on WhatsApp
            <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-text"></div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default WhatsAppFloatingButton;