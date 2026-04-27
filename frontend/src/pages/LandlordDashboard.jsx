import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import api, { extractErrorMessage } from "../api/axios.js";
import DashboardHeader from "../components/DashboardHeader.jsx";
import LandlordFinanceSection from "../components/landlord/LandlordFinanceSection.jsx";
import LandlordManagementSection from "../components/landlord/LandlordManagementSection.jsx";
import LandlordOverviewSection from "../components/landlord/LandlordOverviewSection.jsx";
import LandlordPropertySection from "../components/landlord/LandlordPropertySection.jsx";
import LandlordTenantsSection from "../components/landlord/LandlordTenantsSection.jsx";
import {
  getCurrentLandlordSection,
  landlordNavOrder,
  landlordSections
} from "../components/landlord/landlordConfig.js";
import TechnicianMarketplaceSection from "../components/technicians/TechnicianMarketplaceSection.jsx";
import WorkspaceSidebar from "../components/workspace/WorkspaceSidebar.jsx";
import { clearAuthSession, getStoredUser } from "../utils/session.js";

const emptyOverview = {
  totalTenants: 0,
  totalApartmentsRented: 0,
  totalPropertiesSold: 0,
  totalRentIncome: 0,
  totalSalesIncome: 0
};

const emptyTenantForm = {
  name: "",
  phone: "",
  whatsapp: "",
  rent_start_date: "",
  rent_expiry_date: "",
  rent_amount: "",
  sanitation_date: ""
};

const emptyFinanceForm = {
  record_type: "rent",
  description: "",
  amount: "",
  payment_date: ""
};

function handleRequestError(requestError, setError) {
  const message = extractErrorMessage(requestError);
  setError(message);

  if (requestError.response?.status === 401) {
    clearAuthSession();
  }
}

export default function LandlordDashboard() {
  const location = useLocation();
  const user = getStoredUser();
  const activeSection = getCurrentLandlordSection(location.pathname);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [propertiesLoading, setPropertiesLoading] = useState(true);
  const [tenantsLoading, setTenantsLoading] = useState(true);
  const [financeLoading, setFinanceLoading] = useState(true);
  const [overviewError, setOverviewError] = useState("");
  const [propertiesError, setPropertiesError] = useState("");
  const [tenantsError, setTenantsError] = useState("");
  const [financeError, setFinanceError] = useState("");
  const [overview, setOverview] = useState(emptyOverview);
  const [properties, setProperties] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [finance, setFinance] = useState({
    summary: {
      rentIncome: 0,
      salesIncome: 0,
      totalIncome: 0
    },
    records: []
  });
  const [tenantForm, setTenantForm] = useState(emptyTenantForm);
  const [editingTenantId, setEditingTenantId] = useState(null);
  const [submittingTenant, setSubmittingTenant] = useState(false);
  const [messageTemplate, setMessageTemplate] = useState(
    "Hello, this is a quick update from your landlord regarding your apartment."
  );
  const [reminderMessage, setReminderMessage] = useState(
    "Hello, this is a friendly reminder that your rent payment is due. Please reach out if you need any clarification."
  );
  const [financeForm, setFinanceForm] = useState(emptyFinanceForm);
  const [editingFinanceId, setEditingFinanceId] = useState(null);
  const [submittingFinance, setSubmittingFinance] = useState(false);
  const [submittingProperty, setSubmittingProperty] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function loadLandlordWorkspace() {
      setOverviewLoading(true);
      setPropertiesLoading(true);
      setTenantsLoading(true);
      setFinanceLoading(true);

      const [overviewResult, propertiesResult, tenantsResult, financeResult] =
        await Promise.allSettled([
          api.get("/landlord/overview"),
          api.get("/property/mine"),
          api.get("/landlord/tenants"),
          api.get("/landlord/finance")
        ]);

      if (!isMounted) {
        return;
      }

      if (overviewResult.status === "fulfilled") {
        setOverview(overviewResult.value.data.stats || emptyOverview);
        setOverviewError("");
      } else {
        handleRequestError(overviewResult.reason, setOverviewError);
      }

      if (propertiesResult.status === "fulfilled") {
        setProperties(propertiesResult.value.data);
        setPropertiesError("");
      } else {
        handleRequestError(propertiesResult.reason, setPropertiesError);
      }

      if (tenantsResult.status === "fulfilled") {
        setTenants(tenantsResult.value.data);
        setTenantsError("");
      } else {
        handleRequestError(tenantsResult.reason, setTenantsError);
      }

      if (financeResult.status === "fulfilled") {
        setFinance(financeResult.value.data);
        setFinanceError("");
      } else {
        handleRequestError(financeResult.reason, setFinanceError);
      }

      setOverviewLoading(false);
      setPropertiesLoading(false);
      setTenantsLoading(false);
      setFinanceLoading(false);
    }

    loadLandlordWorkspace();

    return () => {
      isMounted = false;
    };
  }, [refreshToken]);

  if (!activeSection) {
    return <Navigate to="/landlord" replace />;
  }

  function refreshWorkspace() {
    setRefreshToken((currentValue) => currentValue + 1);
  }

  function updateTenantField(field, value) {
    setTenantForm((currentForm) => ({
      ...currentForm,
      [field]: value
    }));
  }

  function resetTenantForm() {
    setTenantForm(emptyTenantForm);
    setEditingTenantId(null);
  }

  async function handleTenantSubmit(event) {
    event.preventDefault();
    setSubmittingTenant(true);

    try {
      if (editingTenantId) {
        await api.put(`/landlord/tenants/${editingTenantId}`, tenantForm);
        toast.success("Tenant updated successfully.");
      } else {
        await api.post("/landlord/tenants", tenantForm);
        toast.success("Tenant added successfully.");
      }

      resetTenantForm();
      refreshWorkspace();
    } catch (requestError) {
      toast.error(extractErrorMessage(requestError));

      if (requestError.response?.status === 401) {
        clearAuthSession();
      }
    } finally {
      setSubmittingTenant(false);
    }
  }

  function handleEditTenant(tenant) {
    setEditingTenantId(tenant.id);
    setTenantForm({
      name: tenant.name || "",
      phone: tenant.phone || "",
      whatsapp: tenant.whatsapp || "",
      rent_start_date: tenant.rent_start_date || "",
      rent_expiry_date: tenant.rent_expiry_date || "",
      rent_amount: String(tenant.rent_amount ?? ""),
      sanitation_date: tenant.sanitation_date || ""
    });
  }

  async function handleDeleteTenant(tenant) {
    const confirmed = window.confirm(`Delete ${tenant.name} from your tenant list?`);

    if (!confirmed) {
      return;
    }

    try {
      await api.delete(`/landlord/tenants/${tenant.id}`);
      toast.success(`${tenant.name} removed successfully.`);

      if (editingTenantId === tenant.id) {
        resetTenantForm();
      }

      refreshWorkspace();
    } catch (requestError) {
      toast.error(extractErrorMessage(requestError));

      if (requestError.response?.status === 401) {
        clearAuthSession();
      }
    }
  }

  function updateFinanceField(field, value) {
    setFinanceForm((currentForm) => ({
      ...currentForm,
      [field]: value
    }));
  }

  function resetFinanceForm() {
    setFinanceForm(emptyFinanceForm);
    setEditingFinanceId(null);
  }

  async function handleFinanceSubmit(event) {
    event.preventDefault();
    setSubmittingFinance(true);

    try {
      if (editingFinanceId) {
        await api.put(`/landlord/finance/${editingFinanceId}`, financeForm);
        toast.success("Finance record updated successfully.");
      } else {
        await api.post("/landlord/finance", financeForm);
        toast.success("Finance record added successfully.");
      }

      resetFinanceForm();
      refreshWorkspace();
    } catch (requestError) {
      toast.error(extractErrorMessage(requestError));

      if (requestError.response?.status === 401) {
        clearAuthSession();
      }
    } finally {
      setSubmittingFinance(false);
    }
  }

  function handleEditFinanceRecord(record) {
    setEditingFinanceId(record.id);
    setFinanceForm({
      record_type: record.record_type || "rent",
      description: record.description || "",
      amount: String(record.amount ?? ""),
      payment_date: record.payment_date || ""
    });
  }

  async function handleDeleteFinanceRecord(record) {
    const confirmed = window.confirm(`Delete "${record.description}" from finance history?`);

    if (!confirmed) {
      return;
    }

    try {
      await api.delete(`/landlord/finance/${record.id}`);
      toast.success("Finance record deleted successfully.");

      if (editingFinanceId === record.id) {
        resetFinanceForm();
      }

      refreshWorkspace();
    } catch (requestError) {
      toast.error(extractErrorMessage(requestError));

      if (requestError.response?.status === 401) {
        clearAuthSession();
      }
    }
  }

  async function handlePropertySubmit(formData) {
    setSubmittingProperty(true);

    try {
      await api.post("/property", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });

      toast.success("Property posted successfully.");
      refreshWorkspace();
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        clearAuthSession();
      }

      throw requestError;
    } finally {
      setSubmittingProperty(false);
    }
  }

  async function handlePropertyStatusChange(property, nextStatus) {
    try {
      await api.put(`/property/${property.id}/status`, { status: nextStatus });
      toast.success(
        nextStatus === "sold"
          ? "Property marked as sold."
          : "Property marked as rented."
      );
      refreshWorkspace();
    } catch (requestError) {
      toast.error(extractErrorMessage(requestError));

      if (requestError.response?.status === 401) {
        clearAuthSession();
      }
    }
  }

  const rentalProperties = properties.filter(
    (property) => (property.listing_purpose || "rent") === "rent"
  );
  const saleProperties = properties.filter(
    (property) => property.listing_purpose === "sale"
  );
  const section = landlordSections[activeSection];
  const summary = (
    <>
      <div className="admin-sidebar-pill">
        <span>{overview.totalTenants} tenants</span>
      </div>
      <div className="admin-sidebar-pill">
        <span>{properties.length} listings</span>
      </div>
    </>
  );

  return (
    <div className="dashboard-shell">
      <div className="admin-shell">
        <WorkspaceSidebar
          brand="NoAgentNaija"
          title="Landlord Workspace"
          description="Manage rentals, sales, tenants, income, and technician discovery from one organized dashboard."
          items={landlordNavOrder.map((sectionKey) => landlordSections[sectionKey])}
          summary={summary}
        />

        <main className="admin-content">
          <DashboardHeader
            title={`${section.label} for ${user?.name || "Landlord"}`}
            subtitle={section.description}
          />

          <section className="dashboard-section admin-content-section">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Landlord Dashboard</p>
                <h1>{section.label}</h1>
              </div>
              <p>{section.description}</p>
            </div>

            {activeSection === "dashboard" ? (
              <LandlordOverviewSection
                loading={overviewLoading}
                error={overviewError}
                stats={overview}
              />
            ) : null}

            {activeSection === "rentals" ? (
              <>
                {propertiesError ? <div className="status-card error">{propertiesError}</div> : null}
                {propertiesLoading ? (
                  <div className="status-card">Loading rental listings...</div>
                ) : (
                  <LandlordPropertySection
                    title="Keep your rental listings moving"
                    eyebrow="Rental Listings"
                    description="Post properties for rent exactly the way the original flow worked, then mark them rented when they are no longer available."
                    submitLabel="Post Rental Listing"
                    submitting={submittingProperty}
                    onSubmit={handlePropertySubmit}
                    properties={rentalProperties}
                    listingPurpose="rent"
                    onStatusChange={handlePropertyStatusChange}
                  />
                )}
              </>
            ) : null}

            {activeSection === "tenants" ? (
              <>
                {tenantsError ? <div className="status-card error">{tenantsError}</div> : null}
                {tenantsLoading ? (
                  <div className="status-card">Loading tenants...</div>
                ) : (
                  <LandlordTenantsSection
                    form={tenantForm}
                    tenants={tenants}
                    editingTenantId={editingTenantId}
                    onChange={updateTenantField}
                    onDelete={handleDeleteTenant}
                    onEdit={handleEditTenant}
                    onSubmit={handleTenantSubmit}
                    onReset={resetTenantForm}
                    submitting={submittingTenant}
                    messageTemplate={messageTemplate}
                    setMessageTemplate={setMessageTemplate}
                  />
                )}
              </>
            ) : null}

            {activeSection === "management" ? (
              <>
                {tenantsError ? <div className="status-card error">{tenantsError}</div> : null}
                {tenantsLoading ? (
                  <div className="status-card">Loading management data...</div>
                ) : (
                  <LandlordManagementSection
                    tenants={tenants}
                    reminderMessage={reminderMessage}
                    setReminderMessage={setReminderMessage}
                  />
                )}
              </>
            ) : null}

            {activeSection === "seller" ? (
              <>
                {propertiesError ? <div className="status-card error">{propertiesError}</div> : null}
                {propertiesLoading ? (
                  <div className="status-card">Loading sale listings...</div>
                ) : (
                  <LandlordPropertySection
                    title="Manage properties for sale"
                    eyebrow="Seller Page"
                    description="Post properties for sale, keep their details current, and mark them sold so they disappear from renter listings automatically."
                    submitLabel="Post Property for Sale"
                    submitting={submittingProperty}
                    onSubmit={handlePropertySubmit}
                    properties={saleProperties}
                    listingPurpose="sale"
                    onStatusChange={handlePropertyStatusChange}
                  />
                )}
              </>
            ) : null}

            {activeSection === "finance" ? (
              <>
                {financeError ? <div className="status-card error">{financeError}</div> : null}
                {financeLoading ? (
                  <div className="status-card">Loading finance records...</div>
                ) : (
                  <LandlordFinanceSection
                    summary={finance.summary}
                    records={finance.records}
                    form={financeForm}
                    editingRecordId={editingFinanceId}
                    onChange={updateFinanceField}
                    onDelete={handleDeleteFinanceRecord}
                    onEdit={handleEditFinanceRecord}
                    onSubmit={handleFinanceSubmit}
                    onReset={resetFinanceForm}
                    submitting={submittingFinance}
                  />
                )}
              </>
            ) : null}

            {activeSection === "technicians" ? (
              <TechnicianMarketplaceSection
                title="Technician Marketplace"
                subtitle="Reach plumbers, electricians, dispatch riders, food vendors, and other service providers directly from your landlord workspace."
              />
            ) : null}
          </section>
        </main>
      </div>
    </div>
  );
}
