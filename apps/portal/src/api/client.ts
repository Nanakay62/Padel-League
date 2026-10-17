export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface VenueMembershipInfo {
  venue_id: string;
  venue_name: string;
  role: string;
}

export interface PortalMeData {
  user: UserProfile;
  platform_role: string;
  mfa_verified: boolean;
  memberships: VenueMembershipInfo[];
}

export interface LoginResponse {
  requires_mfa?: boolean;
  requires_mfa_setup?: boolean;
  mfa_token?: string;
  user?: UserProfile;
  venues?: Array<{ id: string; name: string }>;
}

export interface MfaSetupData {
  secret: string;
  otpauth_url: string;
  recovery_codes: string[];
}

import { getHostType } from "../utils/host";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (!headers.has("X-Portal-Host")) {
    try {
      headers.set("X-Portal-Host", getHostType());
    } catch {
      // ignore
    }
  }

  const response = await fetch(path, {
    ...options,
    headers,
    credentials: "include", // Ensures SameSite=Strict cookies are sent and received
  });

  if (!response.ok) {
    let errorDetail = `Request failed with status ${response.status}`;
    try {
      const errJson = await response.json();
      if (errJson.detail) {
        errorDetail = typeof errJson.detail === "string" ? errJson.detail : JSON.stringify(errJson.detail);
      }
    } catch {
      // Non-json error
    }
    throw new ApiError(response.status, errorDetail);
  }

  return response.json() as Promise<T>;
}

export const api = {
  login: (email: string, password: string, host_type: "CLUB" | "ADMIN") =>
    request<LoginResponse>("/portal/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password, host_type }),
    }),

  setupMfa: (mfa_token: string) =>
    request<MfaSetupData>("/portal/auth/mfa/setup", {
      method: "POST",
      body: JSON.stringify({ mfa_token }),
    }),

  confirmMfaSetup: (mfa_token: string, code: string, host_type: "CLUB" | "ADMIN") =>
    request<{ success: boolean; user: UserProfile; venues: Array<{ id: string; name: string }> }>(
      "/portal/auth/mfa/confirm-setup",
      {
        method: "POST",
        body: JSON.stringify({ mfa_token, code, host_type }),
      }
    ),

  verifyMfa: (mfa_token: string, code: string, host_type: "CLUB" | "ADMIN") =>
    request<{ success: boolean; user: UserProfile; venues: Array<{ id: string; name: string }> }>(
      "/portal/auth/mfa/verify",
      {
        method: "POST",
        body: JSON.stringify({ mfa_token, code, host_type }),
      }
    ),

  getMe: () => request<PortalMeData>("/portal/auth/me"),

  logout: () =>
    request<{ success: boolean }>("/portal/auth/logout", {
      method: "POST",
    }),

  acceptInvite: (token: string, name: string, password: string) =>
    request<{ success: boolean; venue_id: string; email: string }>("/portal/invites/accept", {
      method: "POST",
      body: JSON.stringify({ token, name, password }),
    }),

  // Club Core Endpoints
  getClubProfile: async (venueId?: string): Promise<ClubProfileResponse> => {
    const raw = await request<any>("/portal/club/profile", {
      headers: venueId ? { "X-Venue-Id": venueId } : {},
    });
    const v = raw.venue || raw;
    let draft: Record<string, any> | null = null;
    try {
      const draftRes = await api.getDraft("profile", venueId);
      if (draftRes && draftRes.data && Object.keys(draftRes.data).length > 0) {
        draft = draftRes.data;
      }
    } catch {
      // Draft loading failure should never block profile display
    }
    return {
      venue: {
        id: v.id || venueId || "",
        name: v.name || "",
        slug: v.slug || "",
        description: v.description || "",
        address: v.address || "",
        ghana_gps: v.ghanapost_gps || v.ghana_gps || "",
        google_maps_url: v.maps_url || v.google_maps_url || "",
        phone: v.booking_phone || v.phone || "",
        whatsapp: v.booking_whatsapp || v.whatsapp || "",
        email: v.booking_url || v.email || "",
        amenities: Array.isArray(v.amenities) ? v.amenities : [],
        rules: v.rules || "",
        is_active: v.is_active ?? true,
        opening_hours: v.opening_hours || null,
        base_rate_pesewas: v.base_rate_pesewas_per_hour || v.base_rate_pesewas || 35000,
        currency: "GHS",
        duration_multipliers: v.duration_multipliers || null,
        price_version: v.price_version || 1,
        courts_count: Array.isArray(v.courts) ? v.courts.length : (v.courts_count || 0),
        courts: Array.isArray(v.courts) ? v.courts : [],
        updated_at: v.updated_at || null,
      },
      draft,
      membership_role: raw.membership_role || "CLUB_ADMIN",
      step_in_actor: raw.step_in_actor || null,
    };
  },

  updateClubProfile: async (
    data: Partial<VenueProfile> & { expected_updated_at?: string | null },
    venueId?: string
  ) => {
    const payload = {
      name: data.name || "",
      description: data.description || "",
      booking_phone: data.phone || data.booking_phone || "",
      booking_whatsapp: data.whatsapp || data.booking_whatsapp || "",
      ghanapost_gps: data.ghana_gps || data.ghanapost_gps || "",
      maps_url: data.google_maps_url || data.maps_url || "",
      amenities: Array.isArray(data.amenities) ? data.amenities : [],
      expected_updated_at:
        data.expected_updated_at !== undefined ? data.expected_updated_at : (data.updated_at || null),
    };
    const res = await request<any>("/portal/club/profile", {
      method: "PUT",
      headers: venueId ? { "X-Venue-Id": venueId } : {},
      body: JSON.stringify(payload),
    });
    return {
      success: true,
      venue: {
        ...data,
        ...res,
        id: res.id || data.id,
        name: res.name || data.name,
        updated_at: res.updated_at || data.updated_at || null,
      } as VenueProfile,
      is_step_in: res.is_step_in,
    };
  },

  saveDraft: (section: string, data: any, venueId?: string) =>
    request<{ success: boolean; section: string; updated_at: string }>(
      `/portal/club/drafts/${encodeURIComponent(section)}`,
      {
        method: "PUT",
        headers: venueId ? { "X-Venue-Id": venueId } : {},
        body: JSON.stringify({ draft_payload: data }),
      }
    ),

  getDraft: async (section: string, venueId?: string) => {
    try {
      const res = await request<{ section: string; draft_payload: any }>(
        `/portal/club/drafts/${encodeURIComponent(section)}`,
        {
          headers: venueId ? { "X-Venue-Id": venueId } : {},
        }
      );
      return {
        section: res.section,
        data: res.draft_payload || {},
        updated_at: "",
      };
    } catch {
      return { section, data: {}, updated_at: "" };
    }
  },

  getCourts: async (venueId?: string) => {
    const raw = await request<any>("/portal/club/courts", {
      headers: venueId ? { "X-Venue-Id": venueId } : {},
    });
    const list = Array.isArray(raw) ? raw : (raw.courts || []);
    const courts: CourtItem[] = list.map((c: any) => ({
      id: c.id,
      venue_id: c.venue_id || venueId || "",
      court_number: c.court_number,
      indoor: c.is_indoor ?? c.indoor ?? false,
      surface: c.surface || "Turf",
      lighting: c.lighting || "",
      notes: c.notes || "",
      is_active: c.is_active ?? true,
      custom_rate_pesewas: c.base_rate_pesewas_per_hour ?? null,
      price_bands_count: c.price_bands?.length || 0,
    }));
    return {
      courts,
      price_version: raw.price_version ?? 1,
      timezone: "Africa/Accra",
    };
  },

  createCourt: (
    data: {
      court_number: number;
      indoor?: boolean;
      surface?: string;
      lighting?: string;
      notes?: string;
    },
    venueId?: string
  ) =>
    request<{ success: boolean; court: CourtItem }>("/portal/club/courts", {
      method: "POST",
      headers: venueId ? { "X-Venue-Id": venueId } : {},
      body: JSON.stringify({
        court_number: data.court_number,
        is_indoor: data.indoor ?? false,
        surface: data.surface || "Turf",
        lighting: data.lighting || "",
        notes: data.notes || "",
      }),
    }),

  updateCourt: (
    courtId: string,
    data: {
      court_number?: number;
      indoor?: boolean;
      surface?: string;
      lighting?: string;
      notes?: string;
    },
    venueId?: string
  ) =>
    request<{ success: boolean; court: CourtItem }>(`/portal/club/courts/${courtId}`, {
      method: "PUT",
      headers: venueId ? { "X-Venue-Id": venueId } : {},
      body: JSON.stringify({
        court_number: data.court_number,
        is_indoor: data.indoor ?? false,
        surface: data.surface,
        lighting: data.lighting,
        notes: data.notes,
      }),
    }),

  deleteCourt: (courtId: string, venueId?: string) =>
    request<{ success: boolean; court_id: string }>(`/portal/club/courts/${courtId}`, {
      method: "DELETE",
      headers: venueId ? { "X-Venue-Id": venueId } : {},
    }),

  getPricing: async (venueId?: string): Promise<PricingData> => {
    const raw = await request<any>("/portal/club/pricing", {
      headers: venueId ? { "X-Venue-Id": venueId } : {},
    });
    return {
      venue_id: raw.venue_id || venueId || "",
      base_rate_pesewas: raw.base_rate_pesewas ?? raw.base_rate_pesewas_per_hour ?? 35000,
      currency: raw.currency || "GHS",
      formatted_base_rate: raw.formatted_base_rate || `GH₵ ${( (raw.base_rate_pesewas || 35000) / 100).toFixed(2)}`,
      price_version: raw.price_version || 1,
      duration_multipliers: raw.duration_multipliers || { "60": 1.0, "90": 1.5, "120": 2.0 },
      price_bands: Array.isArray(raw.price_bands) ? raw.price_bands : [],
      opening_hours: raw.opening_hours && typeof raw.opening_hours === "object" ? raw.opening_hours : {},
      step_in_actor: raw.step_in_actor || null,
    };
  },

  updatePricing: (
    data: {
      base_rate_pesewas: number;
      duration_multipliers?: Record<string, number>;
      price_bands?: Array<{
        id?: string;
        label: string;
        start_time: string;
        end_time: string;
        rate_pesewas: number;
      }>;
      opening_hours?: Record<string, string>;
      expected_price_version?: number;
    },
    venueId?: string
  ) => {
    const bpsMultipliers: Record<string, number> = {};
    if (data.duration_multipliers) {
      for (const [k, v] of Object.entries(data.duration_multipliers)) {
        bpsMultipliers[k] = Math.round(v * 10000);
      }
    }
    return request<{ success: boolean; pricing: PricingData }>("/portal/club/pricing", {
      method: "PUT",
      headers: venueId ? { "X-Venue-Id": venueId } : {},
      body: JSON.stringify({
        base_rate_pesewas_per_hour: data.base_rate_pesewas,
        price_bands: data.price_bands || [],
        duration_multipliers_bps: Object.keys(bpsMultipliers).length > 0 ? bpsMultipliers : undefined,
        opening_hours: data.opening_hours || {},
        expected_price_version: data.expected_price_version,
      }),
    });
  },

  getStaff: async (venueId?: string): Promise<ClubStaffResponse> => {
    const raw = await request<any>("/portal/club/staff", {
      headers: venueId ? { "X-Venue-Id": venueId } : {},
    });
    const rawMembers = raw.members || raw.staff || [];
    const rawInvites = raw.invites || raw.pending_invites || [];
    return {
      staff: rawMembers.map((m: any) => ({
        id: m.id,
        user_id: m.user_id,
        name: m.name,
        email: m.email,
        role: m.role,
        joined_at: m.joined_at,
      })),
      pending_invites: rawInvites.map((i: any) => ({
        id: i.id,
        email: i.email,
        role: i.role,
        invited_by_name: i.invited_by_name || "Club Owner",
        created_at: i.created_at || "",
        expires_at: i.expires_at || "",
      })),
      is_owner: raw.is_owner ?? true,
      step_in_actor: raw.step_in_actor || null,
    };
  },

  inviteStaff: (email: string, role: string, venueId?: string) =>
    request<{ success: boolean; invite: InviteItem }>("/portal/club/staff/invite", {
      method: "POST",
      headers: venueId ? { "X-Venue-Id": venueId } : {},
      body: JSON.stringify({ email, role }),
    }),

  removeStaff: (userId: string, venueId?: string) =>
    request<{ success: boolean; removed_user_id: string }>(`/portal/club/staff/${userId}`, {
      method: "DELETE",
      headers: venueId ? { "X-Venue-Id": venueId } : {},
    }),

  getAudit: async (venueId?: string) => {
    const raw = await request<any>("/portal/club/audit", {
      headers: venueId ? { "X-Venue-Id": venueId } : {},
    });
    const list = Array.isArray(raw) ? raw : (raw.items || []);
    const items: AuditLogItem[] = list.map((l: any) => ({
      id: l.id,
      action: l.action,
      entity_name: l.target_type || "Club",
      entity_id: l.target_id || "",
      venue_id: l.venue_id,
      actor_id: l.actor_id,
      actor_name: l.actor_name || (l.actor_kind === "SUPER_ADMIN" ? "Platform Staff" : "Club Staff"),
      actor_role: l.actor_role || l.actor_kind || "STAFF",
      step_in_actor_id: l.step_in_actor_id || null,
      step_in_actor_name: l.step_in_actor_name || null,
      is_step_in: l.actor_kind === "SUPER_ADMIN" || Boolean(l.is_step_in),
      details: l.details || null,
      changes: l.changes || (l.old_value || l.new_value ? { previous: l.old_value, updated: l.new_value } : null),
      is_revertible: l.is_revertible ?? false,
      reverted_at: l.reverted_at || null,
      created_at: l.created_at || new Date().toISOString(),
    }));
    return {
      items,
      total: raw.total ?? items.length,
    };
  },

  revertAudit: (logId: string, reason?: string, venueId?: string) =>
    request<{ success: boolean; original_action: string; reverted_at: string }>(
      `/portal/club/audit/${logId}/revert`,
      {
        method: "POST",
        headers: venueId ? { "X-Venue-Id": venueId } : {},
        body: JSON.stringify({ reason }),
      }
    ),

  getPhotos: (venueId?: string) =>
    request<{ photos: PhotoItem[] }>("/portal/club/photos", {
      headers: venueId ? { "X-Venue-Id": venueId } : {},
    }),

  uploadPhoto: (file: File, caption?: string, displayOrder?: number, venueId?: string) => {
    const formData = new FormData();
    formData.append("file", file);
    if (caption !== undefined && caption !== null) {
      formData.append("caption", caption);
    }
    if (displayOrder !== undefined && displayOrder !== null) {
      formData.append("display_order", String(displayOrder));
    }
    return request<{ success: boolean; photo: PhotoItem }>("/portal/club/photos/upload", {
      method: "POST",
      headers: venueId ? { "X-Venue-Id": venueId } : {},
      body: formData,
    });
  },

  updatePhoto: (
    photoId: string,
    data: { caption?: string; display_order?: number },
    venueId?: string
  ) =>
    request<{ success: boolean; photo: PhotoItem }>(`/portal/club/photos/${photoId}`, {
      method: "PUT",
      headers: venueId ? { "X-Venue-Id": venueId } : {},
      body: JSON.stringify(data),
    }),

  deletePhoto: (photoId: string, venueId?: string) =>
    request<{ success: boolean; deleted_photo_id: string }>(`/portal/club/photos/${photoId}`, {
      method: "DELETE",
      headers: venueId ? { "X-Venue-Id": venueId } : {},
    }),

  // Super Admin Platform Endpoints
  getPlatformOverview: () => request<PlatformOverviewData>("/portal/admin/overview"),

  getAdminVenues: () => request<{ venues: AdminVenueItem[]; total: number }>("/portal/admin/venues"),

  registerVenue: (data: {
    name: string;
    address?: string;
    ghana_gps?: string;
    owner_email: string;
    initial_courts_count: number;
    base_rate_pesewas: number;
  }) =>
    request<{
      venue: {
        id: string;
        name: string;
        address: string;
        base_rate_pesewas: number;
        courts_count: number;
      };
      invite: {
        id: string;
        email: string;
        role: string;
        expires_at: string;
      };
    }>("/portal/admin/venues", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getGlobalAudit: (params: {
    venue_id?: string;
    action?: string;
    actor_id?: string;
    limit?: number;
    offset?: number;
  } = {}) => {
    const q = new URLSearchParams();
    if (params.venue_id) q.set("venue_id", params.venue_id);
    if (params.action) q.set("action", params.action);
    if (params.actor_id) q.set("actor_id", params.actor_id);
    if (params.limit) q.set("limit", String(params.limit));
    if (params.offset) q.set("offset", String(params.offset));
    const qs = q.toString() ? `?${q.toString()}` : "";
    return request<{ items: AuditLogItem[]; total: number }>(`/portal/admin/audit${qs}`);
  },

  getPlatformSettings: () => request<PlatformSettingsData>("/portal/admin/settings"),

  updatePlatformSettings: (data: {
    allow_multi_venue_per_user?: boolean;
    platform_announcement?: string;
  }) =>
    request<{ success: boolean; settings: PlatformSettingsData }>("/portal/admin/settings", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
};

export interface PlatformOverviewData {
  total_venues: number;
  total_courts: number;
  total_users: number;
  total_events: number;
  total_audit_events: number;
  currency: string;
  timezone: string;
  admin_user_id: string;
}

export interface AdminVenueItem {
  id: string;
  name: string;
  address: string;
  ghana_gps: string;
  courts_count: number;
  base_rate_pesewas: number;
  formatted_base_rate: string;
  price_version: number;
  owner_name: string;
  owner_email: string;
  created_at: string | null;
}

export interface PlatformSettingsData {
  allow_multi_venue_per_user: boolean;
  platform_announcement: string;
  currency: string;
  timezone: string;
  club_host?: string;
  admin_host?: string;
  max_venues_per_club_user?: number;
}

export interface CourtItem {
  id: string;
  court_number: number;
  indoor: boolean;
  surface: string | null;
  lighting: string | null;
  notes: string | null;
  created_at: string;
}

export interface VenueProfile {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  address: string | null;
  ghana_gps: string | null;
  google_maps_url: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  amenities: string[] | null;
  rules: string | null;
  opening_hours: Record<string, string> | null;
  base_rate_pesewas: number;
  duration_multipliers: Record<string, number> | null;
  price_version: number;
  courts_count: number;
  courts: CourtItem[];
  is_active?: boolean;
  booking_phone?: string | null;
  booking_whatsapp?: string | null;
  ghanapost_gps?: string | null;
  maps_url?: string | null;
  currency?: string;
  updated_at?: string | null;
}

export interface ClubProfileResponse {
  venue: VenueProfile;
  draft: Record<string, any> | null;
  membership_role: string;
  step_in_actor: string | null;
}

export interface PricingData {
  venue_id: string;
  base_rate_pesewas: number;
  currency: string;
  formatted_base_rate: string;
  price_version: number;
  duration_multipliers: Record<string, number>;
  price_bands: Array<{
    id?: string;
    label: string;
    start_time: string;
    end_time: string;
    rate_pesewas: number;
    formatted_rate?: string;
  }>;
  opening_hours: Record<string, string>;
  step_in_actor: string | null;
}

export interface StaffItem {
  id: string;
  user_id: string;
  name: string;
  email: string;
  role: string;
  joined_at: string;
}

export interface InviteItem {
  id: string;
  email: string;
  role: string;
  invited_by_name: string;
  created_at: string;
  expires_at: string;
}

export interface ClubStaffResponse {
  staff: StaffItem[];
  pending_invites: InviteItem[];
  is_owner: boolean;
  step_in_actor: string | null;
}

export interface AuditLogItem {
  id: string;
  action: string;
  entity_name: string;
  entity_id: string;
  venue_id?: string | null;
  actor_id: string;
  actor_name: string;
  actor_role: string;
  step_in_actor_id?: string | null;
  step_in_actor_name?: string | null;
  is_step_in: boolean;
  details?: string | null;
  changes: Record<string, any> | null;
  is_revertible?: boolean;
  reverted_at?: string | null;
  created_at: string;
}

export interface PhotoItem {
  id: string;
  url: string;
  thumbnail_url?: string | null;
  caption?: string | null;
  display_order: number;
  created_at?: string | null;
}
