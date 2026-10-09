import React from 'react';
import { VenueItem, VenueListScreen } from '@/features/venues/VenueListScreen';
import { Screen, PageHeader } from '@/components/ui';

const SAMPLE_VENUES: VenueItem[] = [
  {
    id: 'v1',
    name: 'Accra City Padel Club',
    address: 'Ring Road Central, Kanda, Accra',
    ghanapostGps: 'GA-492-8012',
    courtCount: 3,
    outdoorCourts: 3,
    baseRateFormatted: 'GH₵ 250 / hr',
    mapsUrl: 'https://maps.google.com/?q=accra_padel',
    bookingPhone: '+233240001122',
  },
  {
    id: 'v2',
    name: 'Trust Sports Emporium Padel',
    address: 'Bukom, High Street, Accra',
    ghanapostGps: 'GA-110-3344',
    courtCount: 2,
    indoorCourts: 2,
    baseRateFormatted: 'GH₵ 300 / hr',
    mapsUrl: 'https://maps.google.com/?q=trust_emporium',
    bookingPhone: '+233240003344',
  },
  {
    id: 'v3',
    name: 'Burma Camp Padel Court',
    address: 'Burma Camp Officers Mess, Accra',
    ghanapostGps: 'GL-045-8901',
    courtCount: 2,
    outdoorCourts: 2,
    baseRateFormatted: 'GH₵ 200 / hr',
    mapsUrl: 'https://maps.google.com/?q=burma_camp',
    bookingPhone: '+233240005566',
  },
];

export default function VenuesIndexScreen() {
  return (
    <Screen>
      <PageHeader
        title="Padel Venues"
        subtitle="Accra, Tema & Kumasi"
        showBack
      />
      <VenueListScreen venues={SAMPLE_VENUES} />
    </Screen>
  );
}
