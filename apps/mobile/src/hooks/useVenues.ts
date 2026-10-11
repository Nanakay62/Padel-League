/**
 * Venues, Courts, and Dynamic Quotes Hooks
 *
 * Implements:
 * - Public venue list & detail fetching
 * - Public court detail fetching
 * - Debounced (300ms) stateless dynamic quote fetching
 * - AbortController request cancellation and monotonic sequence tracking to prevent race conditions
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { apiFetch } from '@/lib/api-client';

export interface PhotoItem {
  url: string;
  alt: string;
}

export interface OpeningHoursSpan {
  day: number; // 0=Mon..6=Sun
  opens_minute: number;
  closes_minute: number;
}

export interface PriceBand {
  name: string;
  days: number[];
  start_minute: number;
  end_minute: number;
  hourly_rate_pesewas: number;
}

export interface AddOnItem {
  id: string;
  name: string;
  price_pesewas: number;
}

export interface CourtDetail {
  id: string;
  venue_id: string;
  court_number: number;
  is_indoor: boolean;
  surface: string;
  lighting: string;
  photos: PhotoItem[];
  notes: string;
  base_rate_pesewas_per_hour: number | null;
  price_bands: PriceBand[];
  duration_multipliers_bps?: Record<string, number> | null;
  updated_at?: string;
}

export interface PublicEventSummary {
  id: string;
  title: string;
  format: string;
  status: string;
  start_time?: string;
}

export interface VenueDetail {
  id: string;
  name: string;
  address: string;
  ghanapost_gps: string;
  maps_url: string;
  booking_phone: string;
  booking_whatsapp: string;
  booking_url: string;
  court_count: number;
  base_rate_pesewas_per_hour: number | null;
  base_rate_formatted: string;
  description: string;
  photos: PhotoItem[];
  amenities: string[];
  opening_hours: OpeningHoursSpan[];
  price_bands: PriceBand[];
  duration_multipliers_bps: Record<string, number>;
  add_ons_config: AddOnItem[];
  price_version: number;
  updated_at?: string;
  courts: CourtDetail[];
  upcoming_events: PublicEventSummary[];
}

export interface QuoteLine {
  label: string;
  amount_pesewas: number;
  line_type: string;
}

export interface QuoteData {
  quote_id: string;
  token: string;
  expires_at: string;
  lines: QuoteLine[];
  total_pesewas: number;
  court_fee_pesewas: number;
  platform_fee_pesewas: number;
  add_ons_pesewas: number;
  tax_pesewas: number;
  price_version: number;
  is_priced: boolean;
}

export interface QuoteParams {
  venueId: string;
  courtId: string;
  start: string; // ISO 8601
  durationMin: number;
  addOns: string[];
}

export function useVenues() {
  const [venues, setVenues] = useState<VenueDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchVenues = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/venues');
      if (!res.ok) {
        throw new Error(`Failed to load venues (${res.status})`);
      }
      const data = await res.json();
      setVenues(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const res = await apiFetch('/venues');
        if (!res.ok) {
          throw new Error(`Failed to load venues (${res.status})`);
        }
        const data = await res.json();
        if (!ignore) {
          setVenues(data);
          setIsLoading(false);
        }
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setIsLoading(false);
        }
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, []);

  return { venues, isLoading, error, refetch: fetchVenues };
}

export function useVenue(venueId: string | undefined) {
  const [venue, setVenue] = useState<VenueDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchVenue = useCallback(async () => {
    if (!venueId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`/venues/${venueId}`);
      if (!res.ok) {
        throw new Error(`Failed to load venue (${res.status})`);
      }
      const data = await res.json();
      setVenue(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [venueId]);

  useEffect(() => {
    if (!venueId) {
      const timer = setTimeout(() => setIsLoading(false), 0);
      return () => clearTimeout(timer);
    }
    let ignore = false;
    async function load() {
      try {
        const res = await apiFetch(`/venues/${venueId}`);
        if (!res.ok) {
          throw new Error(`Failed to load venue (${res.status})`);
        }
        const data = await res.json();
        if (!ignore) {
          setVenue(data);
          setIsLoading(false);
        }
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setIsLoading(false);
        }
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [venueId]);

  return { venue, isLoading, error, refetch: fetchVenue };
}

export function useCourt(venueId: string | undefined, courtId: string | undefined) {
  const [court, setCourt] = useState<CourtDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchCourt = useCallback(async () => {
    if (!venueId || !courtId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`/venues/${venueId}/courts/${courtId}`);
      if (!res.ok) {
        throw new Error(`Failed to load court (${res.status})`);
      }
      const data = await res.json();
      setCourt(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [venueId, courtId]);

  useEffect(() => {
    if (!venueId || !courtId) {
      const timer = setTimeout(() => setIsLoading(false), 0);
      return () => clearTimeout(timer);
    }
    let ignore = false;
    async function load() {
      try {
        const res = await apiFetch(`/venues/${venueId}/courts/${courtId}`);
        if (!res.ok) {
          throw new Error(`Failed to load court (${res.status})`);
        }
        const data = await res.json();
        if (!ignore) {
          setCourt(data);
          setIsLoading(false);
        }
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setIsLoading(false);
        }
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [venueId, courtId]);

  return { court, isLoading, error, refetch: fetchCourt };
}

export function useQuote(params: QuoteParams | null) {
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Monotonic sequence identifier to discard stale, out-of-order responses
  const sequenceIdRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const venueId = params?.venueId;
  const courtId = params?.courtId;
  const start = params?.start;
  const durationMin = params?.durationMin;
  const addOns = params?.addOns;
  const addOnsKey = addOns ? addOns.slice().sort().join(',') : '';

  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!venueId || !courtId || !start || !durationMin) {
      const resetTimer = setTimeout(() => {
        setQuote(null);
        setIsLoading(false);
        setIsUpdating(false);
        setError(null);
      }, 0);
      return () => clearTimeout(resetTimer);
    }

    const updatingTimer = setTimeout(() => {
      setIsUpdating(true);
      setError(null);
    }, 0);

    debounceTimerRef.current = setTimeout(async () => {
      // Abort previous in-flight quote request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const currentSequenceId = ++sequenceIdRef.current;
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      try {
        const res = await apiFetch('/quotes', {
          method: 'POST',
          body: JSON.stringify({
            venue_id: venueId,
            court_id: courtId,
            start,
            duration_min: durationMin,
            add_ons: addOns || [],
          }),
          signal: abortController.signal,
        });

        // Discard response if a newer request was dispatched
        if (currentSequenceId !== sequenceIdRef.current) {
          return;
        }

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          const errMsg = errData.detail || `Quote failed (${res.status})`;
          setError(errMsg);
          return;
        }

        const data: QuoteData = await res.json();
        if (currentSequenceId === sequenceIdRef.current) {
          setQuote(data);
          setError(null);
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') {
          return; // Expected cancellation
        }
        if (currentSequenceId === sequenceIdRef.current) {
          setError(err instanceof Error ? err.message : String(err));
        }
      } finally {
        if (currentSequenceId === sequenceIdRef.current) {
          setIsUpdating(false);
          setIsLoading(false);
        }
      }
    }, 300);

    return () => {
      clearTimeout(updatingTimer);
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [venueId, courtId, start, durationMin, addOns, addOnsKey]);

  return { quote, isLoading, isUpdating, error };
}

export async function verifyCheckoutQuote(token: string) {
  const res = await apiFetch('/checkout/verify-quote', {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
  if (res.status === 409) {
    const errData = await res.json().catch(() => ({}));
    throw new Error('PRICE_CHANGED: ' + (errData.detail?.message || 'Price has changed'));
  }
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || `Verification failed (${res.status})`);
  }
  return res.json();
}
