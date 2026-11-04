import { useState, useMemo } from 'react';
import { formatAccraDate } from '@/lib/formatting';

export interface VenueItem {
  id: string;
  name: string;
  address: string;
  imageUrl?: string;
  ghanapostGps?: string;
  mapsUrl?: string;
  bookingPhone?: string;
  bookingWhatsapp?: string;
  bookingUrl?: string;
  courtCount: number;
  indoorCourts?: number;
  outdoorCourts?: number;
  baseRateFormatted: string;
  rating?: number;
  reviewCount?: number;
  description?: string;
  courtsAvailableToday?: number;
  peakRateFormatted?: string;
  surface?: string;
  verified?: boolean;
}

export interface VenueCourt {
  id: string;
  name: string;
  turf: string;
  hourlyRateCedis: number;
}

export const VENUE_COURTS_MAP: Record<string, VenueCourt[]> = {
  v1: [
    { id: 'c1', name: 'Court 1 (Panoramic)', turf: 'Turf: Blue Mondo 12mm', hourlyRateCedis: 120 },
    { id: 'c2', name: 'Court 2 (Center Court)', turf: 'Turf: Red Clay Spec', hourlyRateCedis: 140 },
    { id: 'c3', name: 'Court 3 (Outdoor Pro)', turf: 'Turf: Green Pro Turf', hourlyRateCedis: 110 },
    { id: 'c4', name: 'Court 4 (Standard Glass)', turf: 'Turf: Blue Mondo 12mm', hourlyRateCedis: 120 },
  ],
  v2: [
    { id: 'c1', name: 'Court 1 (Covered Lounge)', turf: 'Turf: Blue Mondo 12mm', hourlyRateCedis: 110 },
    { id: 'c2', name: 'Court 2 (Outdoor Pro)', turf: 'Turf: Supercourt 12mm', hourlyRateCedis: 110 },
    { id: 'c3', name: 'Court 3 (Social Court)', turf: 'Turf: Classic Turf', hourlyRateCedis: 100 },
  ],
  v3: [
    { id: 'c1', name: 'Court 1 (Premium Shaded)', turf: 'Turf: Blue Mondo 12mm', hourlyRateCedis: 130 },
    { id: 'c2', name: 'Court 2 (Tournament Spec)', turf: 'Turf: Panoramic Glass', hourlyRateCedis: 140 },
  ],
};

export interface TimeSlot {
  time: string;
  status: 'available' | 'booked';
}

export const TIME_SLOTS: TimeSlot[] = [
  { time: '4:00 PM', status: 'available' },
  { time: '5:00 PM', status: 'booked' },
  { time: '6:00 PM', status: 'available' },
  { time: '7:00 PM', status: 'available' },
  { time: '8:00 PM', status: 'available' },
];

export function useVenueFilters(venues: VenueItem[]) {
  const [selectedVenueId, setSelectedVenueId] = useState<string>(venues[0]?.id || 'v1');
  const [selectedCourtId, setSelectedCourtId] = useState<string>('c1');
  const [selectedSlot, setSelectedSlot] = useState<string>('6:00 PM');
  const [selectedDuration, setSelectedDuration] = useState<number>(90); // 60, 90, 120
  const [includeBalls, setIncludeBalls] = useState<boolean>(true);
  const [includeRackets, setIncludeRackets] = useState<boolean>(false);
  const [matchType, setMatchType] = useState<'private' | 'public'>('private');
  const [paymentMethod, setPaymentMethod] = useState<'mtn' | 'telecel' | 'at' | 'card' | 'club'>('mtn');
  const [momoPhone, setMomoPhone] = useState<string>('');
  const [showBookingOpensModal, setShowBookingOpensModal] = useState<boolean>(false);

  const todayDateString = useMemo(() => {
    return formatAccraDate(new Date().toISOString());
  }, []);

  const selectedVenue = venues.find((v) => v.id === selectedVenueId) || venues[0];

  const availableCourts = useMemo(() => {
    if (selectedVenue && VENUE_COURTS_MAP[selectedVenue.id]) {
      return VENUE_COURTS_MAP[selectedVenue.id];
    }
    const parsedRate = parseInt(selectedVenue?.baseRateFormatted?.replace(/[^0-9]/g, '') || '120', 10) || 120;
    return Array.from({ length: selectedVenue?.courtCount || 2 }).map((_, idx) => ({
      id: `c${idx + 1}`,
      name: `Court ${idx + 1} (${idx === 0 ? 'Panoramic' : 'Standard'})`,
      turf: 'Turf: Blue Mondo 12mm',
      hourlyRateCedis: parsedRate,
    }));
  }, [selectedVenue]);

  const activeCourt = availableCourts.find((c) => c.id === selectedCourtId) || availableCourts[0];

  const baseHourlyCedis = activeCourt.hourlyRateCedis;
  const courtFeeCedis = (baseHourlyCedis * selectedDuration) / 60;
  const lightingFeeCedis = 20;
  const ballsFeeCedis = includeBalls ? 65 : 0;
  const racketsFeeCedis = includeRackets ? 40 : 0;
  const totalCedis = courtFeeCedis + lightingFeeCedis + ballsFeeCedis + racketsFeeCedis;

  const handleVenueSelect = (venueId: string) => {
    setSelectedVenueId(venueId);
    setSelectedCourtId('c1');
  };

  return {
    selectedVenueId,
    setSelectedVenueId: handleVenueSelect,
    selectedCourtId,
    setSelectedCourtId,
    selectedSlot,
    setSelectedSlot,
    selectedDuration,
    setSelectedDuration,
    includeBalls,
    setIncludeBalls,
    includeRackets,
    setIncludeRackets,
    matchType,
    setMatchType,
    paymentMethod,
    setPaymentMethod,
    momoPhone,
    setMomoPhone,
    showBookingOpensModal,
    setShowBookingOpensModal,
    todayDateString,
    selectedVenue,
    availableCourts,
    activeCourt,
    baseHourlyCedis,
    courtFeeCedis,
    lightingFeeCedis,
    ballsFeeCedis,
    racketsFeeCedis,
    totalCedis,
  };
}
