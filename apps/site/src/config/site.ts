export interface SiteConfig {
  name: string;
  legalName: string;
  registrationNumber: string;
  dpcNumber: string;
  address: string;
  phone: string;
  phoneDisplay: string;
  email: string;
  whatsappUrl: string;
  appUrl: string;
  siteUrl: string;
  clubPortalUrl: string;
  flags: {
    MEXICANO_AVAILABLE: boolean;
    LEGAL_REVIEWED: boolean;
    ALLOW_PLACEHOLDER_IMAGES: boolean;
  };
}

// Read APP_URL and SITE_URL from environment (Astro import.meta.env or Node process.env)
const envAppUrl =
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.APP_URL) ||
  (typeof process !== "undefined" && process.env && process.env.APP_URL) ||
  "http://localhost:8085";

const envSiteUrl =
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.SITE_URL) ||
  (typeof process !== "undefined" && process.env && process.env.SITE_URL) ||
  "http://localhost:4321";

const envClubPortalUrl =
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.CLUB_PORTAL_URL) ||
  (typeof process !== "undefined" && process.env && process.env.CLUB_PORTAL_URL) ||
  "https://padel-ghana-club.vercel.app";

const cleanAppUrl = envAppUrl.trim().replace(/\/+$/, "");
const cleanSiteUrl = envSiteUrl.trim().replace(/\/+$/, "");
const cleanClubPortalUrl = envClubPortalUrl.trim().replace(/\/+$/, "");

export const siteConfig: SiteConfig = {
  name: "Padel Ghana",
  legalName: "Padel Ghana",
  registrationNumber: "[Registration number]",
  dpcNumber: "[Data Protection Commission number]",
  address: "[Address, Cantonments, Accra, Ghana]",
  phone: "+233501234016",
  phoneDisplay: "+233 50 123 4016",
  email: "jlartey10@gmail.com",
  whatsappUrl: "https://wa.me/233501234016?text=Hello%20Padel%20Ghana",
  appUrl: cleanAppUrl,
  siteUrl: cleanSiteUrl,
  clubPortalUrl: cleanClubPortalUrl,
  flags: {
    MEXICANO_AVAILABLE: false, // Set to true when Mexicano checklist items are ticked
    LEGAL_REVIEWED: false,     // Set to true after Ghanaian lawyer review
    ALLOW_PLACEHOLDER_IMAGES: true, // Fail production build if false and placeholders remain
  },
};
