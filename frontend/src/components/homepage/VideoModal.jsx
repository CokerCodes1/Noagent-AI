import { motion, AnimatePresence } from "framer-motion";
import { FaTimes } from "react-icons/fa";

const VideoModal = ({ testimonial, onClose }) => {
  if (!testimonial) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="relative max-w-4xl w-full max-h-[90vh] bg-surface rounded-2xl overflow-hidden shadow-2xl"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors duration-200"
          >
            <FaTimes size={16} />
          </button>

          <div className="aspect-video">
            <video
              className="w-full h-full object-cover"
              controls
              autoPlay
            >
              <source src={testimonial.videoUrl} type="video/mp4" />
            </video>
          </div>

          <div className="p-6">
            <h3 className="text-2xl font-bold mb-2">{testimonial.name}</h3>
            <p className="text-accent capitalize text-lg">{testimonial.role}</p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default VideoModal;