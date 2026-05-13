import { motion as Motion } from "framer-motion";
import { useState } from "react";
import { FiCheck, FiLoader, FiX } from "react-icons/fi";
import api from "../../api/axios.js";

const fieldLabels = {
  name: "Full Name",
  phone: "Phone Number",
  address: "Home Address",
  occupation: "Occupation",
  monthlyIncome: "Monthly Income",
  landlordName: "Landlord Name",
  landlordPhone: "Landlord Phone Number"
};

const loanTypeLabels = {
  land_acquisition: "Land Acquisition Loans",
  building_project: "Building Project Loans",
  house_rent: "House Rent Loans"
};

const fields = [
  { key: "name", type: "text" },
  { key: "phone", type: "tel" },
  { key: "address", type: "text", full: true },
  { key: "occupation", type: "text" },
  { key: "monthlyIncome", type: "number" },
  { key: "landlordName", type: "text" },
  { key: "landlordPhone", type: "tel" }
];

const emptyForm = {
  name: "",
  phone: "",
  address: "",
  occupation: "",
  monthlyIncome: "",
  landlordName: "",
  landlordPhone: ""
};

export default function LoanApplicationModal({ loanType, isOpen, onClose }) {
  const [formData, setFormData] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));

    if (errors[name]) {
      setErrors((previous) => ({ ...previous, [name]: "" }));
    }
  }

  function validateForm() {
    const nextErrors = {};

    fields.forEach(({ key }) => {
      if (!String(formData[key] || "").trim()) {
        nextErrors[key] = `${fieldLabels[key]} is required`;
      }
    });

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!validateForm() || loading) {
      return;
    }

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
        landlordPhone: formData.landlordPhone.trim()
      });

      setSuccess(true);

      window.setTimeout(() => {
        setSuccess(false);
        setFormData(emptyForm);
        setErrors({});
        onClose();
      }, 3000);
    } catch (error) {
      console.error("Loan submission error:", error);
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) {
    return null;
  }

  return (
    <Motion.div
      className="homepage-modal"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      onClick={(event) => {
        if (event.target === event.currentTarget && !loading) {
          onClose();
        }
      }}
    >
      <Motion.div
        className="homepage-modal-card loan-modal"
        initial={{ opacity: 0, scale: 0.92, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 24 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        onClick={(event) => event.stopPropagation()}
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

        <div className="loan-modal-header">
          <div className="loan-modal-header-copy">
            <p className="eyebrow">Loan Application</p>
            <h2>{loanTypeLabels[loanType] || "Apply Now"}</h2>
            <p>
              Complete every field below. The form is fully scrollable so all
              sections remain reachable on smaller screens too.
            </p>
          </div>
        </div>

        <div className="loan-modal-body">
          {success ? (
            <Motion.div
              className="loan-modal-success"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
            >
              <div className="loan-modal-success-mark">
                <FiCheck aria-hidden="true" />
              </div>
              <h3>Request Successful</h3>
              <p>We will contact you shortly.</p>
            </Motion.div>
          ) : (
            <form className="loan-modal-form" onSubmit={handleSubmit}>
              <div className="loan-modal-form-grid">
                {fields.map(({ key, type, full }) => (
                  <div
                    key={key}
                    className={`loan-modal-field${full ? " full" : ""}${errors[key] ? " has-error" : ""}`}
                  >
                    <label htmlFor={key}>{fieldLabels[key]}</label>
                    <input
                      id={key}
                      name={key}
                      type={type}
                      value={formData[key]}
                      onChange={handleChange}
                      placeholder={fieldLabels[key]}
                      disabled={loading}
                    />
                    {errors[key] ? (
                      <span className="form-hint loan-modal-error">
                        {errors[key]}
                      </span>
                    ) : null}
                  </div>
                ))}
              </div>

              <div className="loan-modal-actions">
                <button
                  type="button"
                  className="btn secondary"
                  onClick={onClose}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button type="submit" className="btn primary" disabled={loading}>
                  {loading ? (
                    <>
                      <FiLoader className="animate-spin" aria-hidden="true" />
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
    </Motion.div>
  );
}
