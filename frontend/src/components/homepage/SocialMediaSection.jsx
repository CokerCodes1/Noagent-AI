import { motion } from "framer-motion";
import { FaFacebook, FaInstagram, FaTwitter, FaYoutube, FaTiktok } from "react-icons/fa";

const SocialMediaSection = () => {
  const socialPlatforms = [
    {
      name: "TikTok",
      icon: <FaTiktok className="text-3xl" />,
      color: "from-black to-gray-800",
      textColor: "text-white",
      description: "Watch property tours & success stories",
      link: "https://tiktok.com/@noagentnaija"
    },
    {
      name: "Facebook",
      icon: <FaFacebook className="text-3xl" />,
      color: "from-blue-600 to-blue-800",
      textColor: "text-white",
      description: "Join our community discussions",
      link: "https://facebook.com/noagentnaija"
    },
    {
      name: "Instagram",
      icon: <FaInstagram className="text-3xl" />,
      color: "from-pink-500 via-red-500 via-yellow-500 via-purple-500 via-blue-500 to-indigo-500",
      textColor: "text-white",
      description: "Beautiful property showcases",
      link: "https://instagram.com/noagentnaija"
    },
    {
      name: "X (Twitter)",
      icon: <FaTwitter className="text-3xl" />,
      color: "from-black to-gray-800",
      textColor: "text-white",
      description: "Real-time updates & tips",
      link: "https://twitter.com/noagentnaija"
    },
    {
      name: "YouTube",
      icon: <FaYoutube className="text-3xl" />,
      color: "from-red-600 to-red-800",
      textColor: "text-white",
      description: "In-depth tutorials & guides",
      link: "https://youtube.com/@noagentnaija"
    }
  ];

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

  const handleSocialClick = (link) => {
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  return (
    <section className="py-20 px-6 bg-gradient-to-br from-surface via-surface-strong to-surface">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-accent to-accent-dark bg-clip-text text-transparent">
            Follow Our Journey
          </h2>
          <p className="text-xl text-muted max-w-2xl mx-auto">
            Stay connected and get the latest updates on properties, tips, and success stories from our community.
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {socialPlatforms.map((platform, index) => (
            <motion.div
              key={platform.name}
              className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${platform.color} p-8 text-center cursor-pointer transform hover:scale-105 transition-all duration-500 shadow-lg hover:shadow-2xl`}
              variants={itemVariants}
              onClick={() => handleSocialClick(platform.link)}
            >
              <div className="relative z-10">
                <div className={`${platform.textColor} mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  {platform.icon}
                </div>
                <h3 className={`text-xl font-bold mb-3 ${platform.textColor}`}>
                  {platform.name}
                </h3>
                <p className={`${platform.textColor} opacity-90 text-sm leading-relaxed`}>
                  {platform.description}
                </p>
                <div className={`mt-4 text-sm font-medium ${platform.textColor} opacity-75 group-hover:opacity-100 transition-opacity`}>
                  Follow Us →
                </div>
              </div>

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          className="text-center mt-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
        >
          <p className="text-muted">
            Join our growing community across all platforms
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default SocialMediaSection;