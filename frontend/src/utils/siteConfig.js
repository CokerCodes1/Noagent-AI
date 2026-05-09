import { buildWhatsAppMessageLink, normalizePhone } from "./whatsapp.js";

export const SITE_PHONE_DISPLAY = "08081232613";
export const SITE_PHONE = normalizePhone(SITE_PHONE_DISPLAY);
export const SITE_EMAIL = "hello@noagentnaija.com";
export const SITE_ADDRESS = "Lagos, Nigeria";
export const SITE_WHATSAPP_MESSAGE =
  "Hi NoAgentNaija, I want to get started without agent fees.";

export const SITE_WHATSAPP_LINK = buildWhatsAppMessageLink(
  SITE_PHONE_DISPLAY,
  SITE_WHATSAPP_MESSAGE
);

export const SITE_LOGO_PATH = "/logo.webp";

export const SITE_SOCIAL_LINKS = [
  {
    key: "tiktok",
    name: "TikTok",
    shortLabel: "Watch",
    href: "https://tiktok.com/@noagentai_official",
    description: "Short-form tours, rental tips, and fast wins from our community.",
    theme: "tiktok"
  },
  {
    key: "facebook",
    name: "Facebook",
    shortLabel: "Join",
    href: "https://www.facebook.com/share/1Jaur7x7pX/",
    description: "Stay close to listing drops, updates, and conversations from renters.",
    theme: "facebook"
  },
  {
    key: "instagram",
    name: "Instagram",
    shortLabel: "Explore",
    href: "https://www.instagram.com/noagentai_official?igsh=MWU1ZzM5dGViOHd2cA==",
    description: "Swipe through premium visuals, home inspiration, and technician spotlights.",
    theme: "instagram"
  },
  {
    key: "x",
    name: "X",
    shortLabel: "Follow",
    href: "https://x.com/Cokarproperties",
    description: "Get real-time tips, launch news, and direct connection success stories.",
    theme: "x"
  },
  {
    key: "youtube",
    name: "YouTube",
    shortLabel: "Subscribe",
    href: "https://www.youtube.com/@NoagentAI_Official",
    description: "Long-form walkthroughs, property education, and platform deep dives.",
    theme: "youtube"
  }
];

export const HOMEPAGE_MEDIA = {
  heroVideo: "/hero-clean-optimized.mp4",
  heroPoster: "/landlordphoto.png",
  rentersImage: "/renterphoto.png",
  landlordsImage: "/landlordphoto.png",
  techniciansImage: "/technicianphoto.png",
  testimonialsVideo: "/uploads/1775159435148-tour.mp4"
};

