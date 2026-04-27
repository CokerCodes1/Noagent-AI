import {
  FiBarChart2,
  FiBriefcase,
  FiCreditCard,
  FiHome,
  FiTool,
  FiTrendingUp,
  FiUsers
} from "react-icons/fi";

export const landlordSections = {
  dashboard: {
    key: "dashboard",
    label: "Dashboard",
    description: "Track tenants, listings, and income in one overview.",
    path: "/landlord",
    icon: FiBarChart2,
    end: true
  },
  rentals: {
    key: "rentals",
    label: "Rentals",
    description: "Keep your rental listings active without breaking the existing flow.",
    path: "/landlord/rentals",
    icon: FiHome
  },
  tenants: {
    key: "tenants",
    label: "Tenants",
    description: "Add, update, and contact tenants from one organized list.",
    path: "/landlord/tenants",
    icon: FiUsers
  },
  management: {
    key: "management",
    label: "Management",
    description: "Watch due dates, overdue tenants, and sanitation schedules.",
    path: "/landlord/management",
    icon: FiBriefcase
  },
  seller: {
    key: "seller",
    label: "Seller",
    description: "Post sale listings and mark them sold when deals close.",
    path: "/landlord/seller",
    icon: FiTrendingUp
  },
  finance: {
    key: "finance",
    label: "Finance",
    description: "Track rent and sales income history.",
    path: "/landlord/finance",
    icon: FiCreditCard
  },
  technicians: {
    key: "technicians",
    label: "Technicians",
    description: "Find service providers for repairs, maintenance, and more.",
    path: "/landlord/technicians",
    icon: FiTool
  }
};

export const landlordNavOrder = [
  "dashboard",
  "rentals",
  "tenants",
  "management",
  "seller",
  "finance",
  "technicians"
];

export function getCurrentLandlordSection(pathname) {
  if (pathname === "/landlord" || pathname === "/landlord/") {
    return "dashboard";
  }

  return landlordNavOrder
    .filter((sectionKey) => sectionKey !== "dashboard")
    .find((sectionKey) =>
    pathname.startsWith(landlordSections[sectionKey].path)
    ) || "";
}
