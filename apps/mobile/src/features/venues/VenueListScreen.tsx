import React from 'react';
import {
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { PadelBrand } from '@/constants/theme';

export interface VenueItem {
  id: string;
  name: string;
  address: string;
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
}

interface VenueListScreenProps {
  venues: VenueItem[];
  onSelectVenue?: (venueId: string) => void;
}

export function VenueListScreen({ venues, onSelectVenue }: VenueListScreenProps) {
  const handleOpenMaps = (url?: string) => {
    if (url) {
      Linking.openURL(url).catch(() => {});
    }
  };

  const handleBookClub = (url?: string, phone?: string) => {
    if (url) {
      Linking.openURL(url).catch(() => {});
    } else if (phone) {
      Linking.openURL(`tel:${phone}`).catch(() => {});
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Padel Venues in Ghana</Text>
        <Text style={styles.subtitle}>
          Discover courts in Accra, Tema, and Kumasi with verified prices in GH₵.
        </Text>

        {venues.map((venue) => (
          <View key={venue.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.titleCol}>
                <Text style={styles.venueName}>{venue.name}</Text>
                <Text style={styles.venueAddress}>📍 {venue.address}</Text>
              </View>

              <View style={styles.ratingBadge}>
                <Text style={styles.starText}>★</Text>
                <Text style={styles.ratingNum}>{venue.rating ?? 4.8}</Text>
              </View>
            </View>

            {/* GPS & Court Specs Row */}
            <View style={styles.specsRow}>
              {venue.ghanapostGps ? (
                <View style={styles.gpsBadge}>
                  <Text style={styles.gpsText}>GPS: {venue.ghanapostGps}</Text>
                </View>
              ) : null}

              <View style={styles.courtsBadge}>
                <Text style={styles.courtsText}>
                  🎾 {venue.courtCount} {venue.courtCount === 1 ? 'Court' : 'Courts'}
                  {venue.indoorCourts ? ` (${venue.indoorCourts} Indoor)` : ''}
                </Text>
              </View>
            </View>

            {/* Price & Action Row */}
            <View style={styles.priceRow}>
              <View>
                <Text style={styles.priceLabel}>Hourly Court Rate</Text>
                <Text style={styles.priceValue}>From {venue.baseRateFormatted} / hr</Text>
              </View>

              <View style={styles.actionBtns}>
                {venue.mapsUrl && (
                  <TouchableOpacity
                    style={styles.mapBtn}
                    onPress={() => handleOpenMaps(venue.mapsUrl)}
                  >
                    <Text style={styles.mapBtnText}>Directions 🗺️</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.bookBtn}
                  onPress={() => {
                    if (onSelectVenue) {
                      onSelectVenue(venue.id);
                    } else {
                      handleBookClub(venue.bookingUrl, venue.bookingPhone);
                    }
                  }}
                >
                  <Text style={styles.bookBtnText}>Book at Club →</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: PadelBrand.charcoal,
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 14,
    marginTop: 4,
    marginBottom: 20,
    lineHeight: 20,
  },
  card: {
    backgroundColor: PadelBrand.cardDark,
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: PadelBrand.borderDark,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleCol: {
    flex: 1,
    paddingRight: 10,
  },
  venueName: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '800',
  },
  venueAddress: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 2,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#272212',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3F361C',
  },
  starText: {
    color: PadelBrand.gold,
    fontSize: 13,
  },
  ratingNum: {
    color: PadelBrand.gold,
    fontSize: 13,
    fontWeight: '800',
  },
  specsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  gpsBadge: {
    backgroundColor: '#1E2522',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#293530',
  },
  gpsText: {
    color: PadelBrand.electricGreen,
    fontSize: 12,
    fontWeight: '700',
  },
  courtsBadge: {
    backgroundColor: '#202624',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  courtsText: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '600',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#1F2925',
  },
  priceLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
  },
  priceValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  actionBtns: {
    flexDirection: 'row',
    gap: 8,
  },
  mapBtn: {
    backgroundColor: '#202925',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  mapBtnText: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '700',
  },
  bookBtn: {
    backgroundColor: PadelBrand.electricGreen,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  bookBtnText: {
    color: '#0B0F0E',
    fontSize: 13,
    fontWeight: '800',
  },
});
