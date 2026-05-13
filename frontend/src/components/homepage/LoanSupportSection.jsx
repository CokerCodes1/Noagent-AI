import { motion as Motion } from "framer-motion";
import { useState } from "react";
import {
  FiMapPin,
  FiHome,
  FiFileText,
  FiArrowRight,
  FiUser,
  FiShield,
} from "react-icons/fi";
import Reveal from "./Reveal.jsx";
import LoanApplicationModal from "./LoanApplicationModal.jsx";

const loanCards = [
  {
    id: "land_acquisition",
    title: "Land Acquisition Loans",
    description:
      "Secure funding support to acquire land faster and begin your property ownership journey without unnecessary delays.",
    icon: FiMapPin,
  },
  {
    id: "building_project",
    title: "Building Project Loans",
    description:
      "Get financial assistance for residential and commercial building projects with flexible support options.",
    icon: FiHome,
  },
  {
    id: "house_rent",
    title: "House Rent Loans",
    description:
      "Access quick rent support and spread your payment burden with our caretaker-friendly assistance program.",
    icon: FiFileText,
  },
];

export default function LoanSupportSection() {
  const [selectedLoanType, setSelectedLoanType] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleApplyNow = (loanType) => {
    setSelectedLoanType(loanType);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedLoanType(null);
  };

  return (
    <>
      <section className="homepage-section homepage-section-dark">
        <div className="homepage-container">
          <Reveal className="homepage-section-heading">
            <p className="eyebrow">Loan Support</p>
            <h2 className="homepage-gradient-title">
              Join Hundreds Of Other Caretakers Benefiting From Our Loan Support
            </h2>
            <p>
              Flexible financing solutions designed to help you achieve your
              property goals faster. Apply today and take the first step toward
              owning your dream home.
            </p>
          </Reveal>

          <div className="grid loan-support-grid">
            {loanCards.map((card, index) => (
              <Motion.article
                key={card.id}
                className="homepage-feature-card loan-support-card"
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{
                  duration: 0.55,
                  delay: index * 0.12,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <div className="homepage-feature-icon">
                  <card.icon size={28} />
                </div>

                <div className="loan-support-card-copy">
                  <h3>{card.title}</h3>
                  <p>{card.description}</p>

                  <button
                    type="button"
                    className="btn primary"
                    onClick={() => handleApplyNow(card.id)}
                  >
                    Apply Now
                    <FiArrowRight />
                  </button>
                </div>
              </Motion.article>
            ))}
          </div>

          <div className="homepage-feature-list loan-support-note-grid">
            <div className="homepage-feature-card loan-support-note-card">
              <div className="homepage-feature-icon">
                <FiShield size={28} />
              </div>
              <div>
                <h3>Trusted & Secure</h3>
                <p>
                  Your information is protected with enterprise-grade security.
                </p>
              </div>
            </div>

            <div className="homepage-feature-card loan-support-note-card">
              <div className="homepage-feature-icon">
                <FiUser size={28} />
              </div>
              <div>
                <h3>Personalized Support</h3>
                <p>
                  Dedicated assistance throughout your application journey.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div
          className="homepage-background-accent"
          style={{
            position: "absolute",
            top: "-20%",
            right: "-10%",
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(184,92,56,0.15) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <div
          className="homepage-background-accent"
          style={{
            position: "absolute",
            bottom: "-15%",
            left: "-8%",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(47,122,83,0.12) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
      </section>

      <LoanApplicationModal
        loanType={selectedLoanType}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </>
  );
}
