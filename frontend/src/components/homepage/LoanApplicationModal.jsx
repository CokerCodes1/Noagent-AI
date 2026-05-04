import { motion as Motion } from "framer-motion";
import { useState } from "react";
import { FiX, FiLoader } from "react-icons/fi";
import api from "../../api/axios.js";

const fieldLabels = {
  name: "Full Name",
  phone: "Phone Number",
  address: "Home Address",
  occupation: "Occupation",
  monthlyIncome: "Monthly Income",
  landlordName: "Landlord Name",
  landlordPhone: "Landlord Phone Number",
};

const loanTypeLabels = {
  land_acquisition: "Land Acquisition Loans",
  building_project: "Building Project Loans",
  house_rent: "House Rent Loans",
};

export default function LoanApplicationModal({ loanType, isOpen, onClose }) {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    occupation: "",
    monthlyIncome: "",
    landlordName: "",
    landlordPhone: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = "Full name is required";
    }
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    }
    if (!formData.address.trim()) {
      newErrors.address = "Home address is required";
    }
    if (!formData.occupation.trim()) {
      newErrors.occupation = "Occupation is required";
    }
    if (!formData.monthlyIncome.trim()) {
      newErrors.monthlyIncome = "Monthly income is required";
    }
    if (!formData.landlordName.trim()) {
      newErrors.landlordName = "Landlord name is required";
    }
    if (!formData.landlordPhone.trim()) {
      newErrors.landlordPhone = "Landlord phone is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    if (loading) return;

    setLoading(true);
    try {
      await api.post("/loan-support", {
        loanType,
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        occupation: formData.occupation.trim(),
        monthlyIncome: Number(formData.monthlyIncome),
        landlordName: formData.landlordName.trim(),
        landlordPhone: formData.landlordPhone.trim(),
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setFormData({
          name: "",
          phone: "",
          address: "",
          occupation: "",
          monthlyIncome: "",
          landlordName: "",
          landlordPhone: "",
        });
        onClose();
      }, 3000);
    } catch (error) {
      console.error("Loan submission error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Motion.div
      className="homepage-modal"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) {
          onClose();
        }
      }}
    >
      <Motion.div
        className="homepage-modal-card"
        initial={{ opacity: 0, scale: 0.92, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 24 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="homepage-modal-close"
          onClick={onClose}
          disabled={loading}
          aria-label="Close modal"
        >
          <FiX />
        </button>

        <div style={{ padding: "1.5rem 1.75rem" }}>
          <p className="eyebrow">Loan Application</p>
          <h2 style={{ marginTop: "0.35rem", marginBottom: "0" }}>
            {loanTypeLabels[loanType] || "Apply Now"}
          </h2>

          {success ? (
            <Motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              style={{
                padding: "2rem 1rem",
                textAlign: "center",
                color: "#d6ff7c",
              }}
            >
              <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>✓</div>
              <h3 style={{ color: "#fff", marginBottom: "0.5rem" }}>
                Request Successful
              </h3>
              <p style={{ color: "rgba(255,239,224,0.78)" }}>
                We will contact you shortly.
              </p>
            </Motion.div>
          ) : (
            <form onSubmit={handleSubmit} style={{ marginTop: "1.5rem" }}>
              <div className="admin-form">
                <div className="admin-two-column-grid">
                  {[
                    "name",
                    "phone",
                    "address",
                    "occupation",
                    "monthlyIncome",
                    "landlordName",
                    "landlordPhone",
                  ].map((field, index) => (
                    <div
                      key={field}
                      className={`admin-field ${index % 2 === 0 ? "" : "admin-field-full-mobile"}`}
                      style={{
                        gridColumn: index >= 5 ? "1 / -1" : "auto",
                      }}
                    >
                      <label htmlFor={field}>{fieldLabels[field]}</label>
                      <input
                        type={
                          field === "monthlyIncome"
                            ? "number"
                            : field === "phone" || field === "landlordPhone"
                              ? "tel"
                              : "text"
                        }
                        id={field}
                        name={field}
                        value={formData[field]}
                        onChange={handleChange}
                        placeholder={fieldLabels[field]}
                        disabled={loading}
                        style={
                          errors[field] ? { borderColor: "var(--danger)" } : {}
                        }
                      />
                      {errors[field] && (
                        <span
                          className="form-hint"
                          style={{ color: "var(--danger)" }}
                        >
                          {errors[field]}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div
                className="form-actions"
                style={{ marginTop: "1.5rem", justifyContent: "flex-end" }}
              >
                <button
                  type="button"
                  className="btn secondary"
                  onClick={onClose}
                  disabled={loading}
                  style={{ minWidth: "120px" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn primary"
                  disabled={loading}
                  style={{ minWidth: "160px" }}
                >
                  {loading ? (
                    <>
                      <FiLoader
                        className="animate-spin"
                        style={{
                          animation: "spin 1s linear infinite",
                        }}
                      />
                      Submitting...
                    </>
                  ) : (
                    "Submit Application"
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </Motion.div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        .admin-field {
          display: grid;
          gap: 0.45rem;
        }
        .admin-field label {
          font-weight: 600;
          color: rgba(255,239,224,0.88);
        }
        .admin-field input {
          padding: 0.85rem 1rem;
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,0.14);
          background: rgba(255,255,255,0.08);
          color: #fff7ed;
          font-size: 1rem;
        }
        .admin-field input::placeholder {
          color: rgba(255,239,224,0.45);
        }
        .admin-field input:focus {
          outline: none;
          border-color: rgba(184,92,56,0.55);
          background: rgba(255,255,255,0.12);
        }
        .admin-field input:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .form-hint {
          font-size: 0.85rem;
          color: rgba(255,239,224,0.65);
        }
        .admin-form {
          display: grid;
          gap: 1.25rem;
        }
        .admin-two-column-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
        }
        @media (max-width: 640px) {
          .admin-two-column-grid {
            grid-template-columns: 1fr;
          }
          .admin-field[style*="grid-column: 1 / -1"] {
            grid-column: auto !important;
          }
        }
      `}</style>
    </Motion.div>
  );
}
