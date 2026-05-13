import { useEffect, useEffectEvent, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { io } from "socket.io-client";
import { toast } from "react-toastify";
import api, { BACKEND_URL, extractErrorMessage } from "../api/axios.js";
import DashboardHeader from "../components/DashboardHeader.jsx";
import MobileDashboardLayout from "../components/dashboard/MobileDashboardLayout.jsx";
import Hero from "../components/Hero.jsx";
import {
  getCurrentRenterSection,
  renterNavOrder,
  renterSections
} from "../components/renter/renterConfig.js";
import PropertyCard from "../components/PropertyCard.jsx";
import PaginatedContent from "../components/shared/PaginatedContent.jsx";
import PaginationControls from "../components/shared/PaginationControls.jsx";
import SkeletonCard from "../components/SkeletonCard.jsx";
import TechnicianMarketplaceSection from "../components/technicians/TechnicianMarketplaceSection.jsx";
import WorkspaceSidebar from "../components/workspace/WorkspaceSidebar.jsx";
import usePagination from "../hooks/usePagination.js";
import useIsPhoneViewport from "../hooks/useIsPhoneViewport.js";
import PwaSettings from "../components/settings/PwaSettings.jsx";
import EmptyStateCard from "../components/shared/EmptyStateCard.jsx";
import { clearAuthSession, getStoredUser } from "../utils/session.js";

function applyFilters(properties, filters) {
  const locationFilter = filters.location?.trim().toLowerCase();
  const typeFilter = filters.type?.trim().toLowerCase();
  const maxPrice = filters.price ? Number(filters.price) : null;

  return properties.filter((property) => {
    const locationMatches = locationFilter
      ? property.location.toLowerCase().includes(locationFilter)
      : true;
    const typeMatches = typeFilter
      ? property.type.toLowerCase().includes(typeFilter)
      : true;
    const priceMatches = maxPrice ? Number(property.price) <= maxPrice : true;

    return locationMatches && typeMatches && priceMatches;
  });
}

export default function RenterDashboard() {
  const location = useLocation();
  const user = getStoredUser();
  const isPhoneViewport = useIsPhoneViewport();
  const activeSection = getCurrentRenterSection(location.pathname);
  const [allProperties, setAllProperties] = useState([]);
  const [filters, setFilters] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadProperties() {
    try {
      setError("");
      const response = await api.get("/property");
      setAllProperties(response.data);
    } catch (requestError) {
      const message = extractErrorMessage(requestError);
      setError(message);

      if (requestError.response?.status === 401) {
        clearAuthSession();
      }
    } finally {
      setLoading(false);
    }
  }

  const handleSocketRefresh = useEffectEvent((payload) => {
    if (payload?.message) {
      toast.info(payload.message);
    }

    loadProperties();
  });

  useEffect(() => {
    loadProperties();
  }, []);

  useEffect(() => {
    const socket = io(BACKEND_URL, {
      transports: ["websocket", "polling"]
    });

    socket.on("new_property", handleSocketRefresh);
    socket.on("property_rented", handleSocketRefresh);

    return () => {
      socket.off("new_property", handleSocketRefresh);
      socket.off("property_rented", handleSocketRefresh);
      socket.disconnect();
    };
  }, []);

  const filteredProperties = applyFilters(allProperties, filters);
  const propertiesPagination = usePagination(filteredProperties, {
    resetKey: `${filters.location || ""}-${filters.type || ""}-${filters.price || ""}`
  });

  if (!activeSection) {
    return <Navigate to="/renter" replace />;
  }

  const section = renterSections[activeSection];
  const summary = (
    <>
      <div className="admin-sidebar-pill">
        <span>{allProperties.length} active listings</span>
      </div>
      <div className="admin-sidebar-pill">
        <span>Rent and sale listings in one place</span>
      </div>
    </>
  );
  const mobileItems = renterNavOrder.map((sectionKey) => ({
    key: sectionKey,
    title: renterSections[sectionKey].label,
    description: renterSections[sectionKey].description,
    path: renterSections[sectionKey].path,
    icon: renterSections[sectionKey].icon
  }));
  const sectionContent = (
    <>
      {activeSection === "properties" ? (
        <>
          <Hero
            title={`Welcome back${user?.name ? `, ${user.name}` : ""}`}
            subtitle="Browse verified properties for rent and sale, unlock verified owner contact, and get real-time listing updates."
            onSearch={setFilters}
          />

          <section className="dashboard-section admin-content-section">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Renter Dashboard</p>
                <h2>Available Properties</h2>
              </div>
              <p>{filteredProperties.length} properties match your filters</p>
            </div>

            {error ? <div className="status-card error">{error}</div> : null}

            {loading ? (
              <div className="grid">
                {Array.from({ length: 3 }).map((_, index) => (
                  <SkeletonCard key={index} />
                ))}
              </div>
            ) : filteredProperties.length === 0 ? (
              <EmptyStateCard
                title="No properties matched your filters"
                description="Try widening your location, type, or price range to reveal more listings."
              />
            ) : (
              <>
                <PaginatedContent
                  className="grid"
                  pageKey={`renter-properties-${propertiesPagination.currentPage}`}
                >
                  {propertiesPagination.pageItems.map((property) => (
                    <PropertyCard
                      key={property.id}
                      property={property}
                      onPaymentStateChange={loadProperties}
                    />
                  ))}
                </PaginatedContent>

                <PaginationControls
                  currentPage={propertiesPagination.currentPage}
                  endIndex={propertiesPagination.endIndex}
                  goToNextPage={propertiesPagination.goToNextPage}
                  goToPage={propertiesPagination.goToPage}
                  goToPreviousPage={propertiesPagination.goToPreviousPage}
                  label="properties"
                  pageNumbers={propertiesPagination.pageNumbers}
                  startIndex={propertiesPagination.startIndex}
                  totalItems={propertiesPagination.totalItems}
                  totalPages={propertiesPagination.totalPages}
                />
              </>
            )}

            <PwaSettings role={user?.role || "renter"} />
          </section>
        </>
      ) : null}

      {activeSection === "technicians" ? (
        <TechnicianMarketplaceSection
          title="Technicians You Can Contact"
          subtitle="Browse technicians, view their skills, and contact them directly from your renter workspace."
        />
      ) : null}
    </>
  );

  if (isPhoneViewport) {
    return (
      <div className="dashboard-shell">
        <MobileDashboardLayout
          activeSectionKey={activeSection}
          basePath="/renter"
          defaultSectionKey="properties"
          items={mobileItems}
          sectionDescription={section.description}
          sectionTitle={section.label}
          user={user}
          workspaceDescription="Move between property discovery and technician contacts from one clean mobile workspace."
          workspaceTitle="Renter Workspace"
        >
          {sectionContent}
        </MobileDashboardLayout>
      </div>
    );
  }

  return (
    <div className="dashboard-shell">
      <div className="admin-shell">
        <WorkspaceSidebar
          brand="NoAgentNaija"
          title="Renter Workspace"
          description="Move between property discovery and technician contacts from one clean sidebar."
          items={renterNavOrder.map((sectionKey) => renterSections[sectionKey])}
          summary={summary}
        />

        <main className="admin-content">
          <DashboardHeader
            title={`${section.label} for ${user?.name || "Renter"}`}
            subtitle={section.description}
          />

          {sectionContent}
        </main>
      </div>
    </div>
  );
}
