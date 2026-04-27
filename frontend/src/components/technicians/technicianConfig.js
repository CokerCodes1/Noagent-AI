import { FiBarChart2, FiUser } from "react-icons/fi";

export const technicianSections = {
  dashboard: {
    key: "dashboard",
    label: "Dashboard",
    description: "Track contacts, completed jobs, and earnings.",
    path: "/technician",
    icon: FiBarChart2,
    end: true
  },
  profile: {
    key: "profile",
    label: "Profile",
    description: "Update your service details, media, and contact channels.",
    path: "/technician/profile",
    icon: FiUser
  }
};

export const technicianNavOrder = ["dashboard", "profile"];

export function getCurrentTechnicianSection(pathname) {
  if (pathname === "/technician" || pathname === "/technician/") {
    return "dashboard";
  }

  return technicianNavOrder
    .filter((sectionKey) => sectionKey !== "dashboard")
    .find((sectionKey) =>
    pathname.startsWith(technicianSections[sectionKey].path)
    ) || "";
}

export const emptyTechnicianProfileForm = {
  email: "",
  password: "",
  category: "",
  custom_category: "",
  name: "",
  description: "",
  office_address: "",
  phone: "",
  whatsapp: "",
  website: "",
  video_url: "",
  jobs_completed: "0",
  total_earnings: "0",
  existing_images: [],
  current_video_url: ""
};
