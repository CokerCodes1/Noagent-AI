import { useEffect, useState } from "react";
import api, { extractErrorMessage } from "../../api/axios.js";
import TechnicianCard from "./TechnicianCard.jsx";

export default function TechnicianMarketplaceSection({
  title = "Technician Marketplace",
  subtitle = "Find trusted service providers for maintenance, repairs, and daily property needs."
}) {
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadTechnicians() {
      try {
        const response = await api.get("/technicians");

        if (!isMounted) {
          return;
        }

        setTechnicians(response.data);
        setError("");
      } catch (requestError) {
        if (!isMounted) {
          return;
        }

        setError(extractErrorMessage(requestError));
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadTechnicians();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="dashboard-section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Technicians</p>
          <h2>{title}</h2>
        </div>
        <p>{subtitle}</p>
      </div>

      {error ? <div className="status-card error">{error}</div> : null}

      {loading ? (
        <div className="status-card">Loading technicians...</div>
      ) : technicians.length === 0 ? (
        <div className="status-card">No technicians have completed their profiles yet.</div>
      ) : (
        <div className="grid">
          {technicians.map((technician) => (
            <TechnicianCard key={technician.id} technician={technician} />
          ))}
        </div>
      )}
    </section>
  );
}
