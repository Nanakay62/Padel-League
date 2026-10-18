import {
  UserProfile,
  VenueMembershipInfo,
  CourtItem,
  VenueProfile,
  PricingData,
  ClubStaffResponse,
  AuditLogItem,
  PhotoItem,
  PlatformOverviewData,
  AdminVenueItem,
  PlatformSettingsData,
  ApiError,
} from "./client";

// Storage keys
const DEMO_AUTH_KEY = "padel_demo_auth";
const DEMO_VENUES_KEY = "padel_demo_venues";
const DEMO_COURTS_KEY = "padel_demo_courts";
const DEMO_PRICING_KEY = "padel_demo_pricing";
const DEMO_STAFF_KEY = "padel_demo_staff";
const DEMO_AUDIT_KEY = "padel_demo_audit";
const DEMO_PHOTOS_KEY = "padel_demo_photos";
const DEMO_SETTINGS_KEY = "padel_demo_settings";

interface DemoSession {
  user: UserProfile;
  platform_role: string;
  mfa_verified: boolean;
  memberships: VenueMembershipInfo[];
}

const DEFAULT_SUPER_ADMIN: DemoSession = {
  user: {
    id: "sa-dev",
    name: "Super Administrator",
    email: "admin@padelghana.com",
    role: "SUPER_ADMIN",
  },
  platform_role: "SUPER_ADMIN",
  mfa_verified: true,
  memberships: [],
};

const DEFAULT_CLUB_OWNER: DemoSession = {
  user: {
    id: "owner-dev",
    name: "Kwame Mensah",
    email: "owner@accrapadel.com",
    role: "PLAYER",
  },
  platform_role: "PLAYER",
  mfa_verified: true,
  memberships: [
    {
      venue_id: "v1",
      venue_name: "Accra Padel Club",
      role: "CLUB_OWNER",
    },
  ],
};

function getStored<T>(key: string, fallback: T): T {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : fallback;
  } catch {
    return fallback;
  }
}

function setStored<T>(key: string, val: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {
    // ignore
  }
}

// Initial Demo Venues
const INITIAL_VENUES: AdminVenueItem[] = [
  {
    id: "v1",
    name: "Accra Padel Club",
    address: "Airport Residential Area, Accra, Ghana",
    ghana_gps: "GA-123-4567",
    courts_count: 2,
    base_rate_pesewas: 35000,
    formatted_base_rate: "GH₵ 350.00",
    price_version: 1,
    owner_name: "Kwame Mensah",
    owner_email: "owner@accrapadel.com",
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: "v2",
    name: "Cantonments Padel Club",
    address: "Cantonments, Accra, Ghana",
    ghana_gps: "GL-456-7890",
    courts_count: 3,
    base_rate_pesewas: 40000,
    formatted_base_rate: "GH₵ 400.00",
    price_version: 1,
    owner_name: "David Mensah",
    owner_email: "david@cantonmentspadel.com",
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
];

const INITIAL_COURTS: CourtItem[] = [
  {
    id: "c1",
    court_number: 1,
    indoor: false,
    surface: "Panoramic Supercourt Pro Blue",
    lighting: "LED Floodlights 400 Lux",
    notes: "Centre Court with spectator seating",
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: "c2",
    court_number: 2,
    indoor: false,
    surface: "Panoramic Supercourt Pro Blue",
    lighting: "LED Floodlights 400 Lux",
    notes: "Court 2 (training and league matches)",
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
];

const INITIAL_STAFF: ClubStaffResponse = {
  staff: [
    {
      id: "mem-owner-dev",
      user_id: "owner-dev",
      name: "Kwame Mensah",
      email: "owner@accrapadel.com",
      role: "CLUB_OWNER",
      joined_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    },
    {
      id: "mem-staff-1",
      user_id: "staff-1",
      name: "Kofi Boateng",
      email: "kofi@accrapadel.com",
      role: "CLUB_ADMIN",
      joined_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    },
    {
      id: "mem-staff-2",
      user_id: "staff-2",
      name: "Ama Osei",
      email: "ama@accrapadel.com",
      role: "STAFF",
      joined_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    },
  ],
  pending_invites: [],
  is_owner: true,
  step_in_actor: null,
};

const INITIAL_AUDIT: AuditLogItem[] = [
  {
    id: "log-1",
    action: "VENUE_PROFILE_UPDATED",
    entity_name: "Club Profile",
    entity_id: "v1",
    venue_id: "v1",
    actor_id: "owner-dev",
    actor_name: "Kwame Mensah",
    actor_role: "CLUB_OWNER",
    is_step_in: false,
    details: "Updated booking contact and operational hours",
    changes: null,
    is_revertible: false,
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: "log-2",
    action: "PRICING_UPDATED",
    entity_name: "Court Pricing",
    entity_id: "v1",
    venue_id: "v1",
    actor_id: "owner-dev",
    actor_name: "Kwame Mensah",
    actor_role: "CLUB_OWNER",
    is_step_in: false,
    details: "Base rate verified at GH₵ 350.00 / hr",
    changes: { previous: 30000, updated: 35000 },
    is_revertible: true,
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
];

export async function handleDemoRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method || "GET").toUpperCase();
  const body = options.body ? JSON.parse(String(options.body)) : {};

  // 1. Auth: Login
  if (path === "/portal/auth/login" && method === "POST") {
    const email = (body.email || "").trim().toLowerCase();
    const password = body.password || "";

    if (
      (email === "admin@padelghana.com" && password === "PadelGhana2026!") ||
      (email === "owner@accrapadel.com" && password === "PadelGhana2026!")
    ) {
      const isSuperAdmin = email === "admin@padelghana.com";
      return {
        requires_mfa: true,
        requires_mfa_setup: false,
        mfa_token: isSuperAdmin ? "demo-mfa-token-admin" : "demo-mfa-token-club",
        user: isSuperAdmin ? DEFAULT_SUPER_ADMIN.user : DEFAULT_CLUB_OWNER.user,
        venues: isSuperAdmin ? [] : [{ id: "v1", name: "Accra Padel Club" }],
      } as unknown as T;
    }

    throw new ApiError(401, "Invalid email or password. Use demo credentials from the helper card.");
  }

  // 2. Auth: MFA Verification
  if ((path === "/portal/auth/mfa/verify" || path === "/portal/auth/mfa/confirm-setup") && method === "POST") {
    const token = body.mfa_token || "";
    const code = (body.code || "").trim();

    if (!code || code.length !== 6) {
      throw new ApiError(400, "Invalid 6-digit MFA code. Enter 123456 to verify in demo mode.");
    }

    const isSuperAdmin = token.includes("admin");
    const session = isSuperAdmin ? DEFAULT_SUPER_ADMIN : DEFAULT_CLUB_OWNER;
    setStored(DEMO_AUTH_KEY, session);

    return {
      success: true,
      user: session.user,
      venues: isSuperAdmin ? [] : [{ id: "v1", name: "Accra Padel Club" }],
    } as unknown as T;
  }

  // 3. Auth: MFA Setup info
  if (path === "/portal/auth/mfa/setup" && method === "POST") {
    return {
      secret: "JBSWY3DPEHPK3PXP",
      otpauth_url: "otpauth://totp/PadelGhana:admin?secret=JBSWY3DPEHPK3PXP&issuer=PadelGhana",
      recovery_codes: ["DEMO-1234", "DEMO-5678", "DEMO-9012"],
    } as unknown as T;
  }

  // 4. Auth: Get Me
  if (path === "/portal/auth/me" && method === "GET") {
    const session = getStored<DemoSession | null>(DEMO_AUTH_KEY, null);
    if (!session) {
      throw new ApiError(401, "Not authenticated");
    }
    return session as unknown as T;
  }

  // 5. Auth: Logout
  if (path === "/portal/auth/logout" && method === "POST") {
    localStorage.removeItem(DEMO_AUTH_KEY);
    return { success: true } as unknown as T;
  }

  // 6. Club: Profile
  if (path === "/portal/club/profile") {
    if (method === "GET") {
      const courts = getStored(DEMO_COURTS_KEY, INITIAL_COURTS);
      const profile: VenueProfile = {
        id: "v1",
        name: "Accra Padel Club",
        slug: "accra-padel-club",
        description: "Ghana's premier padel destination located in the heart of Airport Residential Area.",
        address: "Airport Residential Area, Accra, Ghana",
        ghana_gps: "GA-123-4567",
        google_maps_url: "https://maps.google.com/?q=Accra+Padel+Club",
        phone: "+233 24 123 4567",
        whatsapp: "+233 24 123 4567",
        email: "bookings@accrapadel.com",
        amenities: ["Floodlights", "Pro Shop", "Locker Rooms", "Café & Lounge", "Secure Parking"],
        rules: "Standard non-marking sports shoes required. Arrive 10 minutes prior to booking slot.",
        opening_hours: {
          mon: "06:00 - 23:00",
          tue: "06:00 - 23:00",
          wed: "06:00 - 23:00",
          thu: "06:00 - 23:00",
          fri: "06:00 - 23:00",
          sat: "06:00 - 23:00",
          sun: "06:00 - 23:00",
        },
        base_rate_pesewas: 35000,
        duration_multipliers: { "60": 1.0, "90": 1.5, "120": 2.0 },
        price_version: 1,
        courts_count: courts.length,
        courts,
        is_active: true,
        booking_phone: "+233 24 123 4567",
        booking_whatsapp: "+233 24 123 4567",
      };
      return {
        venue: profile,
        draft: null,
        membership_role: "CLUB_OWNER",
        step_in_actor: null,
      } as unknown as T;
    }

    if (method === "PUT") {
      return {
        success: true,
        venue: body,
        is_step_in: false,
      } as unknown as T;
    }
  }

  // 7. Club: Courts
  if (path === "/portal/club/courts") {
    if (method === "GET") {
      const courts = getStored(DEMO_COURTS_KEY, INITIAL_COURTS);
      return courts as unknown as T;
    }

    if (method === "POST") {
      const courts = getStored<CourtItem[]>(DEMO_COURTS_KEY, INITIAL_COURTS);
      const newCourt: CourtItem = {
        id: `c${Date.now()}`,
        court_number: body.court_number || courts.length + 1,
        indoor: Boolean(body.is_indoor),
        surface: body.surface || "Turf",
        lighting: body.lighting || "LED Floodlights",
        notes: body.notes || "",
        created_at: new Date().toISOString(),
      };
      courts.push(newCourt);
      setStored(DEMO_COURTS_KEY, courts);
      return { success: true, court: newCourt } as unknown as T;
    }
  }

  if (path.startsWith("/portal/club/courts/") && method === "DELETE") {
    const courtId = path.split("/").pop();
    const courts = getStored<CourtItem[]>(DEMO_COURTS_KEY, INITIAL_COURTS).filter((c) => c.id !== courtId);
    setStored(DEMO_COURTS_KEY, courts);
    return { success: true, court_id: courtId } as unknown as T;
  }

  // 8. Club: Pricing
  if (path === "/portal/club/pricing") {
    if (method === "GET") {
      const pricing: PricingData = getStored(DEMO_PRICING_KEY, {
        venue_id: "v1",
        base_rate_pesewas: 35000,
        currency: "GHS",
        formatted_base_rate: "GH₵ 350.00",
        price_version: 1,
        duration_multipliers: { "60": 1.0, "90": 1.5, "120": 2.0 },
        price_bands: [
          {
            id: "pb-1",
            label: "Prime Evening (Floodlit)",
            start_time: "17:00",
            end_time: "22:00",
            rate_pesewas: 45000,
          },
        ],
        opening_hours: {
          mon: "06:00 - 23:00",
          tue: "06:00 - 23:00",
          wed: "06:00 - 23:00",
          thu: "06:00 - 23:00",
          fri: "06:00 - 23:00",
          sat: "06:00 - 23:00",
          sun: "06:00 - 23:00",
        },
        step_in_actor: null,
      });
      return pricing as unknown as T;
    }

    if (method === "PUT") {
      const updatedPricing: PricingData = {
        venue_id: "v1",
        base_rate_pesewas: body.base_rate_pesewas_per_hour || 35000,
        currency: "GHS",
        formatted_base_rate: `GH₵ ${((body.base_rate_pesewas_per_hour || 35000) / 100).toFixed(2)}`,
        price_version: (body.expected_price_version || 1) + 1,
        duration_multipliers: { "60": 1.0, "90": 1.5, "120": 2.0 },
        price_bands: body.price_bands || [],
        opening_hours: body.opening_hours || {},
        step_in_actor: null,
      };
      setStored(DEMO_PRICING_KEY, updatedPricing);
      return { success: true, pricing: updatedPricing } as unknown as T;
    }
  }

  // 9. Club: Staff
  if (path === "/portal/club/staff" && method === "GET") {
    return getStored(DEMO_STAFF_KEY, INITIAL_STAFF) as unknown as T;
  }

  if (path === "/portal/club/staff/invite" && method === "POST") {
    const currentStaff = getStored<ClubStaffResponse>(DEMO_STAFF_KEY, INITIAL_STAFF);
    const newInvite = {
      id: `inv-${Date.now()}`,
      email: body.email,
      role: body.role,
      invited_by_name: "Kwame Mensah",
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
    };
    currentStaff.pending_invites.push(newInvite);
    setStored(DEMO_STAFF_KEY, currentStaff);
    return { success: true, invite: newInvite } as unknown as T;
  }

  // 10. Club: Audit
  if (path === "/portal/club/audit" && method === "GET") {
    const items = getStored(DEMO_AUDIT_KEY, INITIAL_AUDIT);
    return { items, total: items.length } as unknown as T;
  }

  // 11. Club: Photos
  if (path === "/portal/club/photos" && method === "GET") {
    const photos: PhotoItem[] = getStored(DEMO_PHOTOS_KEY, [
      {
        id: "p1",
        url: "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=800&q=80",
        caption: "Centre Court Panoramic View",
        display_order: 1,
        created_at: new Date().toISOString(),
      },
    ]);
    return { photos } as unknown as T;
  }

  // 12. Super Admin: Platform Overview
  if (path === "/portal/admin/overview" && method === "GET") {
    const venues = getStored(DEMO_VENUES_KEY, INITIAL_VENUES);
    const courts = getStored(DEMO_COURTS_KEY, INITIAL_COURTS);
    const overview: PlatformOverviewData = {
      total_venues: venues.length,
      total_courts: courts.length + 3,
      total_users: 14,
      total_events: 8,
      total_audit_events: 24,
      currency: "GHS",
      timezone: "Africa/Accra",
      admin_user_id: "sa-dev",
    };
    return overview as unknown as T;
  }

  // 13. Super Admin: Venues Directory
  if (path === "/portal/admin/venues") {
    if (method === "GET") {
      const venues = getStored(DEMO_VENUES_KEY, INITIAL_VENUES);
      return { venues, total: venues.length } as unknown as T;
    }

    if (method === "POST") {
      const venues = getStored<AdminVenueItem[]>(DEMO_VENUES_KEY, INITIAL_VENUES);
      const newVenue: AdminVenueItem = {
        id: `v${Date.now()}`,
        name: body.name,
        address: body.address || "Accra, Ghana",
        ghana_gps: body.ghana_gps || "GA-000-0000",
        courts_count: body.initial_courts_count || 2,
        base_rate_pesewas: body.base_rate_pesewas || 35000,
        formatted_base_rate: `GH₵ ${((body.base_rate_pesewas || 35000) / 100).toFixed(2)}`,
        price_version: 1,
        owner_name: "Venue Owner",
        owner_email: body.owner_email,
        created_at: new Date().toISOString(),
      };
      venues.push(newVenue);
      setStored(DEMO_VENUES_KEY, venues);
      return {
        venue: newVenue,
        invite: {
          id: `inv-${Date.now()}`,
          email: body.owner_email,
          role: "CLUB_OWNER",
          expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
        },
      } as unknown as T;
    }
  }

  // 14. Super Admin: Global Audit
  if (path.startsWith("/portal/admin/audit") && method === "GET") {
    const items = getStored(DEMO_AUDIT_KEY, INITIAL_AUDIT);
    return { items, total: items.length } as unknown as T;
  }

  // 15. Super Admin: Settings
  if (path === "/portal/admin/settings") {
    if (method === "GET") {
      const settings: PlatformSettingsData = getStored(DEMO_SETTINGS_KEY, {
        allow_multi_venue_per_user: true,
        platform_announcement: "Welcome to Padel Ghana - Official League Season 2026",
        currency: "GHS",
        timezone: "Africa/Accra",
        max_venues_per_club_user: 3,
      });
      return settings as unknown as T;
    }

    if (method === "PUT") {
      const current = getStored(DEMO_SETTINGS_KEY, {
        allow_multi_venue_per_user: true,
        platform_announcement: "Welcome to Padel Ghana - Official League Season 2026",
        currency: "GHS",
        timezone: "Africa/Accra",
        max_venues_per_club_user: 3,
      });
      const updated = { ...current, ...body };
      setStored(DEMO_SETTINGS_KEY, updated);
      return { success: true, settings: updated } as unknown as T;
    }
  }

  // Fallback for draft saves or other calls
  if (path.includes("/drafts/")) {
    return { success: true, section: "draft", updated_at: new Date().toISOString() } as unknown as T;
  }

  return { success: true } as unknown as T;
}
