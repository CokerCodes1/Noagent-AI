import {
  FiCreditCard,
  FiDollarSign,
  FiGrid,
  FiHome,
  FiShield,
  FiTool,
  FiUserCheck,
  FiUsers,
  FiMessageSquare
} from "react-icons/fi";

export const adminSections = {
  dashboard: {
    title: "Dashboard",
    subtitle: "Track users, listings, and transactions from one admin workspace.",
    icon: FiGrid,
    path: "/admin"
  },
  users: {
    title: "Users",
    subtitle: "Create, edit, and remove renter, landlord, and admin accounts.",
    icon: FiUsers,
    path: "/admin/users"
  },
  properties: {
    title: "Properties",
    subtitle: "Create, edit, and remove any property listing across the platform.",
    icon: FiHome,
    path: "/admin/properties"
  },
  technicians: {
    title: "Technicians",
    subtitle: "Create, edit, and remove technician marketplace accounts.",
    icon: FiTool,
    path: "/admin/technicians"
  },
  testimonials: {
    title: "Testimonials",
    subtitle: "Manage video and text testimonials for the homepage.",
    icon: FiMessageSquare,
    path: "/admin/testimonials"
  },
  revenue: {
    title: "Revenue",
    subtitle: "Review all successful contact unlock transactions.",
    icon: FiDollarSign,
    path: "/admin/revenue"
  }
};

export const navOrder = ["dashboard", "users", "properties", "technicians", "testimonials", "revenue"];

export const emptyOverview = {
  stats: {
    users: 0,
    admins: 0,
    landlords: 0,
    technicians: 0,
    renters: 0,
    properties: 0,
    availableProperties: 0,
    rentedProperties: 0,
    soldProperties: 0,
    revenue: 0,
    successfulTransactions: 0
  },
  properties: [],
  recentTransactions: []
};

export const emptyManagedUserForm = {
  name: "",
  email: "",
  phone: "",
  password: "",
  role: "landlord"
};

export const emptyManagedPropertyForm = {
  landlord_id: "",
  type: "",
  listing_purpose: "rent",
  description: "",
  location: "",
  price: "",
  phone: "",
  status: "available"
};

export const dashboardStats = [
  { key: "users", label: "Total users", note: "All accounts", icon: FiUsers },
  { key: "admins", label: "Admins", note: "Privileged operators", icon: FiShield },
  { key: "landlords", label: "Landlords", note: "Active property owners", icon: FiUserCheck },
  { key: "technicians", label: "Technicians", note: "Marketplace providers", icon: FiTool },
  { key: "renters", label: "Renters", note: "Property seekers", icon: FiUsers },
  {
    key: "properties",
    label: "Properties",
    noteKey: "availableProperties",
    notePrefix: "",
    noteSuffix: " available",
    icon: FiHome
  },
  { key: "rentedProperties", label: "Rented", note: "No longer available", icon: FiHome },
  {
    key: "revenue",
    label: "Revenue",
    money: true,
    note: "Successful unlocks",
    icon: FiDollarSign
  },
  {
    key: "successfulTransactions",
    label: "Transactions",
    note: "Successful payments",
    icon: FiCreditCard
  }
];

export function getCurrentSection(pathname) {
  if (pathname === "/admin" || pathname === "/admin/") {
    return "dashboard";
  }

  if (pathname.startsWith("/admin/users")) {
    return "users";
  }

  if (pathname.startsWith("/admin/properties")) {
    return "properties";
  }

  if (pathname.startsWith("/admin/technicians")) {
    return "technicians";
  }

  if (pathname.startsWith("/admin/revenue")) {
    return "revenue";
  }

  return "";
}

export function formatCurrency(amount) {
  return `N${Number(amount || 0).toLocaleString()}`;
}

export function formatDate(dateValue) {
  if (!dateValue) {
    return "Not available";
  }

  return new Date(dateValue).toLocaleString();
}

export function roleLabel(role = "") {
  return role ? role.charAt(0).toUpperCase() + role.slice(1) : "";
}
