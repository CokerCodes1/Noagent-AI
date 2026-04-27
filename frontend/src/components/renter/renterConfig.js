import { FiHome, FiTool } from "react-icons/fi";

export const renterSections = {
  properties: {
    key: "properties",
    label: "Properties",
    description: "Browse available properties for rent and sale.",
    path: "/renter",
    icon: FiHome,
    end: true
  },
  technicians: {
    key: "technicians",
    label: "Technicians",
    description: "View technicians and contact them directly.",
    path: "/renter/technicians",
    icon: FiTool
  }
};

export const renterNavOrder = ["properties", "technicians"];

export function getCurrentRenterSection(pathname) {
  if (pathname === "/renter" || pathname === "/renter/") {
    return "properties";
  }

  return renterNavOrder
    .filter((sectionKey) => sectionKey !== "properties")
    .find((sectionKey) => pathname.startsWith(renterSections[sectionKey].path)) || "";
}
