import { useEffect, useState } from "react";
import axios from "../api/axios";
import HeroSection from "../components/homepage/HeroSection";
import RentersSection from "../components/homepage/RentersSection";
import LandlordsSection from "../components/homepage/LandlordsSection";
import TechniciansSection from "../components/homepage/TechniciansSection";
import Footer from "../components/homepage/Footer";
import WhatsAppFloatingButton from "../components/shared/WhatsAppFloatingButton";

const HomePage = () => {
  const [testimonials, setTestimonials] = useState([]);

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const response = await axios.get("/api/testimonials");
        setTestimonials(response.data.testimonials || []);
      } catch (error) {
        console.error("Failed to fetch testimonials:", error);
        setTestimonials([]);
      }
    };

    fetchTestimonials();
  }, []);

  return (
    <div className="min-h-screen">
      <HeroSection />
      <RentersSection />
      <LandlordsSection />
      <TechniciansSection />
      <Footer />
      <WhatsAppFloatingButton />
    </div>
  );
};

export default HomePage;