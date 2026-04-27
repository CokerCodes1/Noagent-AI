import { useState } from "react";
import { motion } from "framer-motion";
import { FaPlay } from "react-icons/fa";
import VideoModal from "./VideoModal";

const VideoTestimonials = ({ testimonials }) => {
  const [selectedVideo, setSelectedVideo] = useState(null);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <section className="py-20 px-6 bg-surface">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-accent to-accent-dark bg-clip-text text-transparent">
            Real Stories from Our Community
          </h2>
          <p className="text-xl text-muted max-w-2xl mx-auto">
            Hear directly from landlords, renters, and technicians who have transformed their experience with NoAgentNaija.
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {testimonials.slice(0, 6).map((testimonial) => (
            <motion.div
              key={testimonial.id}
              className="group relative overflow-hidden rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer"
              variants={itemVariants}
              whileHover={{ scale: 1.03 }}
              onClick={() => setSelectedVideo(testimonial)}
            >
              <div className="aspect-video relative">
                <video
                  className="w-full h-full object-cover"
                  muted
                  preload="metadata"
                >
                  <source src={testimonial.videoUrl} type="video/mp4" />
                </video>
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <FaPlay className="text-white ml-1" size={20} />
                  </div>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2">{testimonial.name}</h3>
                <p className="text-accent capitalize">{testimonial.role}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {selectedVideo && (
        <VideoModal
          testimonial={selectedVideo}
          onClose={() => setSelectedVideo(null)}
        />
      )}
    </section>
  );
};

export default VideoTestimonials;