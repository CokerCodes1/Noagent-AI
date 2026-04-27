import {
  FiCreditCard,
  FiDollarSign,
  FiHome,
  FiTrendingUp,
  FiUsers
} from "react-icons/fi";
import AdminStatCard from "../admin/AdminStatCard.jsx";
import { formatNaira } from "../../utils/propertyListing.js";

const statCards = [
  { key: "totalTenants", label: "Total Tenants", icon: FiUsers },
  { key: "totalApartmentsRented", label: "Apartments Rented", icon: FiHome },
  { key: "totalPropertiesSold", label: "Properties Sold", icon: FiTrendingUp },
  { key: "totalRentIncome", label: "Rent Income", icon: FiDollarSign, money: true },
  { key: "totalSalesIncome", label: "Sales Income", icon: FiCreditCard, money: true }
];

export default function LandlordOverviewSection({ loading, error, stats }) {
  if (loading) {
    return <div className="status-card">Loading landlord dashboard...</div>;
  }

  return (
    <>
      {error ? <div className="status-card error">{error}</div> : null}

      <div className="grid stats-grid admin-stats-grid">
        {statCards.map((card) => (
          <AdminStatCard
            key={card.key}
            icon={card.icon}
            label={card.label}
            value={card.money ? formatNaira(stats[card.key]) : stats[card.key]}
          />
        ))}
      </div>
    </>
  );
}
