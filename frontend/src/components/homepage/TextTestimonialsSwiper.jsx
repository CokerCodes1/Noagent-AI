import { motion } from "framer-motion";
import Slider from "react-slick";
import { FaStar, FaChevronLeft, FaChevronRight } from "react-icons/fa";

const TextTestimonialsSwiper = ({ testimonials }) => {
  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000,
    arrows: true,
    prevArrow: <CustomPrevArrow />,
    nextArrow: <CustomNextArrow />,
    responsive: [
      {
        breakpoint: 768,
        settings: {
          arrows: false
        }
      }
    ]
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <FaStar
        key={i}
        className={`text-sm ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}
      />
    ));
  };

  return (
    <section className="py-20 px-6 bg-gradient-to-br from-surface via-surface-strong to-surface">
      <div className="max-w-4xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-accent to-accent-dark bg-clip-text text-transparent">
            What Our Users Say
          </h2>
          <p className="text-xl text-muted max-w-2xl mx-auto">
            Join thousands of satisfied users who have found success on our platform.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <Slider {...settings} className="testimonial-slider">
            {testimonials.map((testimonial) => (
              <div key={testimonial.id} className="px-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 md:p-12 shadow-lg border border-white/20 text-center">
                  <div className="flex justify-center mb-6">
                    {renderStars(testimonial.rating)}
                  </div>

                  <blockquote className="text-lg md:text-xl text-text mb-8 italic leading-relaxed">
                    "{testimonial.textContent}"
                  </blockquote>

                  <div className="flex flex-col items-center">
                    {testimonial.avatarUrl && (
                      <img
                        src={testimonial.avatarUrl}
                        alt={testimonial.name}
                        className="w-16 h-16 rounded-full object-cover mb-4 border-2 border-accent/30"
                      />
                    )}
                    <h3 className="text-xl font-semibold mb-1">{testimonial.name}</h3>
                    <p className="text-accent capitalize">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </Slider>
        </motion.div>
      </div>
    </section>
  );
};

const CustomPrevArrow = ({ onClick }) => (
  <button
    onClick={onClick}
    className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-all duration-200 shadow-lg"
  >
    <FaChevronLeft size={16} />
  </button>
);

const CustomNextArrow = ({ onClick }) => (
  <button
    onClick={onClick}
    className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-all duration-200 shadow-lg"
  >
    <FaChevronRight size={16} />
  </button>
);

export default TextTestimonialsSwiper;