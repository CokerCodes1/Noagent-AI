import { useEffect, useState } from "react";
import api, { extractErrorMessage } from "../../api/axios.js";
import usePagination from "../../hooks/usePagination.js";
import TechnicianCard from "./TechnicianCard.jsx";
import PaginatedContent from "../shared/PaginatedContent.jsx";
import PaginationControls from "../shared/PaginationControls.jsx";

export default function TechnicianMarketplaceSection({
  title = "Technician Marketplace",
  subtitle = "Find trusted service providers for maintenance, repairs, and daily property needs."
}) {
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const techniciansPagination = usePagination(technicians);

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
        <>
          <PaginatedContent
            className="grid"
            pageKey={`marketplace-technicians-${techniciansPagination.currentPage}`}
          >
            {techniciansPagination.pageItems.map((technician) => (
              <TechnicianCard key={technician.id} technician={technician} />
            ))}
          </PaginatedContent>

          <PaginationControls
            currentPage={techniciansPagination.currentPage}
            endIndex={techniciansPagination.endIndex}
            goToNextPage={techniciansPagination.goToNextPage}
            goToPage={techniciansPagination.goToPage}
            goToPreviousPage={techniciansPagination.goToPreviousPage}
            label="technicians"
            pageNumbers={techniciansPagination.pageNumbers}
            startIndex={techniciansPagination.startIndex}
            totalItems={techniciansPagination.totalItems}
            totalPages={techniciansPagination.totalPages}
          />
        </>
      )}
    </section>
  );
}
