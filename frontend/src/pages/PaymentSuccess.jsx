import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import api, { extractErrorMessage } from "../api/axios.js";

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [status, setStatus] = useState("Verifying payment...");

  useEffect(() => {
    async function verify() {
      const reference = params.get("reference");

      if (!reference) {
        setStatus("Missing payment reference.");
        return;
      }

      try {
        const response = await api.get(`/payment/verify/${reference}`);

        if (response.data.success) {
          toast.success("Payment verified. Contact details are now unlocked.");
          navigate("/renter", { replace: true });
          return;
        }

        setStatus("Payment could not be verified.");
      } catch (error) {
        const message = extractErrorMessage(error);
        setStatus(message);
        toast.error(message);
      }
    }

    verify();
  }, [navigate, params]);

  return (
    <div className="dashboard-shell">
      <section className="dashboard-section">
        <div className="status-card">{status}</div>
      </section>
    </div>
  );
}
