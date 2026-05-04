import { Suspense, lazy, useEffect, useState } from "react";
import api from "../api/axios.js";
import HeroSection from "../components/homepage/HeroSection.jsx";
import LoanSupportSection from "../components/homepage/LoanSupportSection.jsx";
import TextTestimonialsSwiper from "../components/homepage/TextTestimonialsSwiper.jsx";

const VideoTestimonials = lazy(
  () => import("../components/homepage/VideoTestimonials.jsx"),
);
const RentersSection = lazy(
  () => import("../components/homepage/RentersSection.jsx"),
);
const LandlordsSection = lazy(
  () => import("../components/homepage/LandlordsSection.jsx"),
);
const TechniciansSection = lazy(
  () => import("../components/homepage/TechniciansSection.jsx"),
);
const SocialMediaSection = lazy(
  () => import("../components/homepage/SocialMediaSection.jsx"),
);
const Footer = lazy(() => import("../components/homepage/Footer.jsx"));

function SectionFallback() {
  return <div className="homepage-section-fallback" aria-hidden="true" />;
}

export default function HomePage() {
  const [testimonials, setTestimonials] = useState([]);
  const [testimonialsLoaded, setTestimonialsLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function fetchTestimonials() {
      try {
        const response = await api.get("/testimonials?limit=18");

        if (!isMounted) {
          return;
        }

        setTestimonials(
          Array.isArray(response.data.testimonials)
            ? response.data.testimonials
            : [],
        );
      } catch {
        if (isMounted) {
          setTestimonials([]);
        }
      } finally {
        if (isMounted) {
          setTestimonialsLoaded(true);
        }
      }
    }

    fetchTestimonials();

    return () => {
      isMounted = false;
    };
  }, []);

  const videoTestimonials = testimonials
    .filter((testimonial) => testimonial.videoUrl)
    .slice(0, 6);
  const textTestimonials = testimonials
    .filter((testimonial) => testimonial.textContent)
    .slice(0, 8);

  return (
    <div className="homepage-shell">
      <HeroSection />

      <Suspense fallback={<SectionFallback />}>
        <VideoTestimonials
          testimonials={videoTestimonials}
          loading={!testimonialsLoaded}
        />
        <TextTestimonialsSwiper
          testimonials={textTestimonials}
          loading={!testimonialsLoaded}
        />
        <RentersSection />
        <LandlordsSection />
        <TechniciansSection />
        <SocialMediaSection />
        <LoanSupportSection />
        <Footer />
      </Suspense>
    </div>
  );
}
