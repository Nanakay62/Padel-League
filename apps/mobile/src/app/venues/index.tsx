import React from 'react';
import { VenueItem, VenueListScreen } from '@/features/venues/VenueListScreen';
import { Screen, PageHeader } from '@/components/ui';

const SAMPLE_VENUES: VenueItem[] = [
  {
    id: 'v1',
    name: 'Accra City Padel Club',
    address: 'Airport Residential, Accra',
    ghanapostGps: 'GA-492-8012',
    courtCount: 4,
    outdoorCourts: 4,
    courtsAvailableToday: 3,
    baseRateFormatted: 'GH₵ 120.00 / 60 min',
    peakRateFormatted: 'GH₵ 150.00',
    description: '4 World Padel Tour spec panoramic glass courts, LED floodlights, pro shop & smoothie bar.',
    mapsUrl: 'https://maps.google.com/?q=accra_padel',
    bookingPhone: '+233240001122',
    rating: 4.9,
    reviewCount: 128,
    verified: true,
  },
  {
    id: 'v2',
    name: 'East Legon Padel Club',
    address: 'Lagos Ave, East Legon',
    ghanapostGps: 'GA-110-3344',
    courtCount: 3,
    outdoorCourts: 3,
    courtsAvailableToday: 2,
    baseRateFormatted: 'GH₵ 110.00 / 60 min',
    description: '3 outdoor courts with lounge, night lights, coaching clinic & social terrace.',
    mapsUrl: 'https://maps.google.com/?q=east_legon_padel',
    bookingPhone: '+233240003344',
    rating: 4.8,
    reviewCount: 94,
    verified: true,
  },
  {
    id: 'v3',
    name: 'Cantonments Club Padel',
    address: 'Switchback Rd, Cantonments',
    ghanapostGps: 'GL-045-8901',
    courtCount: 2,
    outdoorCourts: 2,
    courtsAvailableToday: 1,
    baseRateFormatted: 'GH₵ 130.00 / 60 min',
    description: '2 premium shaded courts, private clubhouse, lockers & recovery plunge pool.',
    mapsUrl: 'https://maps.google.com/?q=cantonments_padel',
    bookingPhone: '+233240005566',
    rating: 4.9,
    reviewCount: 76,
    verified: true,
  },
];

export default function VenuesIndexScreen() {
  return (
    <Screen>
      <PageHeader
        title="Accra Padel Clubs & Booking"
        subtitle="Airport Residential, East Legon & Cantonments"
        showBack
      />
      <VenueListScreen venues={SAMPLE_VENUES} />
    </Screen>
  );
}
