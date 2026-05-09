import { Suspense, lazy, useMemo } from "react";
import HeroSection from "../components/homepage/HeroSection.jsx";
import LoanSupportSection from "../components/homepage/LoanSupportSection.jsx";
import TextTestimonialsSwiper from "../components/homepage/TextTestimonialsSwiper.jsx";
import { useTestimonials } from "../contexts/TestimonialsContext.jsx";

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
  const {
    testimonials,
    loading: testimonialsLoading,
    error: testimonialsError,
  } = useTestimonials();

  const videoTestimonials = useMemo(
    () => testimonials.filter((testimonial) => testimonial.videoUrl).slice(0, 6),
    [testimonials],
  );

  const textTestimonials = useMemo(
    () => testimonials.filter((testimonial) => testimonial.textContent).slice(0, 8),
    [testimonials],
  );

  return (
    <div className="homepage-shell">
      <HeroSection />

      <Suspense fallback={<SectionFallback />}>
        <VideoTestimonials
          testimonials={videoTestimonials}
          loading={testimonialsLoading}
          error={testimonialsError}
        />
        <TextTestimonialsSwiper
          testimonials={textTestimonials}
          loading={testimonialsLoading}
          error={testimonialsError}
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
