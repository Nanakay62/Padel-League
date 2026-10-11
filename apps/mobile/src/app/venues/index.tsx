import React from 'react';
import { VenueItem, VenueListScreen } from '@/features/venues/VenueListScreen';
import { Screen } from '@/components/ui';

export const SAMPLE_VENUES: VenueItem[] = [
  {
    id: 'v1',
    name: 'Accra City Padel Club',
    address: 'Airport Residential, Accra',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAM6s_WuWCQzL4lY-Fl-CtBlZz4OI_p7sR6cCmh1LD1elOHhL2QWM2UbmAkzrtbLmwLXyLlBcPoXuxBASkUPn932yDZ6xYFx1B40wybcSGCJVXyEtbribyoOmzFIbXMRuFyuy-sdwUOsR3uWhrLe04mGJh8DVfiknnZo6MskbERwsOrQhrIsUD9v8i-ClPH-BS-4Ey7u7Dxe4_h3oP_Q-SOOlaY3QY8wZ-zWgPpGVas_an8seUrWo-z',
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
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCC5wtT8Ocz7nKZG9RGvW5sq38-fbevpCM468qw4ePum5IC7-mMLaMja_dKUVjK5M6ayONP4Yq99sCeM5t75NwkST2q6UEZil8Fk4AXk9vlztEHFUs1IbCvSfl6cOUR42i8gxk-lmhxzwvj0zzpkv4LXWF4UN2QMbPhmyvUF_jYG8OFIiJXou_BPIRHuSWbz2C5gMkaFJixDrBpTxQQ1VI-12OV3rRyn3h9VVUSrGkW4voCH-AMDfrx',
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
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuA1uSDwOiTfLeg8mzYdxD7ngUM4tt1jIAq8yXxrP6U_W0zZj-OHZ7mcpqh0hJxc4XMXEXT09OxS9lXzEjP8vnXi9DN20fkLdA9Wc3N4MDCRd2yczYkydf1ApUPEzL3d5EQONXC8jgxr0WRjZp4GNrb60AiLFQkqDD3-O53ky1JLxKx0uuKdJmIGrb68sK7iGw10TpomQiKzeYALswPoNvS2vH-GptNscy2pQAokkacxmJLM569Oj7qD',
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
      <VenueListScreen venues={SAMPLE_VENUES} />
    </Screen>
  );
}
