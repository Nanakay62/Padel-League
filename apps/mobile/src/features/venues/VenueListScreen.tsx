import React from 'react';
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MapPin, Star, Navigation } from 'lucide-react-native';
import { Tokens, Typography } from '@/constants/theme';
import { Card, Button, StatusPill } from '@/components/ui';

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
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Padel Venues in Ghana</Text>
      <Text style={styles.subtitle}>
        Discover courts in Accra, Tema, and Kumasi with verified prices in GH₵.
      </Text>

      {venues.map((venue) => (
        <Card key={venue.id} style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.titleCol}>
              <Text style={styles.venueName}>{venue.name}</Text>
              <View style={styles.addressRow}>
                <MapPin size={14} color={Tokens.colors.textMuted} strokeWidth={1.75} />
                <Text style={styles.venueAddress}>{venue.address}</Text>
              </View>
            </View>

            <View style={styles.ratingBadge}>
              <Star size={14} color={Tokens.colors.gold} strokeWidth={1.75} fill={Tokens.colors.gold} />
              <Text style={[styles.ratingNum, Typography.tabularNums]}>
                {(venue.rating ?? 4.8).toFixed(1)}
              </Text>
            </View>
          </View>

          {/* GPS & Court Specs Row */}
          <View style={styles.specsRow}>
            {venue.ghanapostGps ? (
              <StatusPill label={`GPS: ${venue.ghanapostGps}`} variant="neutral" />
            ) : null}

            <StatusPill
              label={`${venue.courtCount} ${venue.courtCount === 1 ? 'Court' : 'Courts'}${
                venue.indoorCourts ? ` (${venue.indoorCourts} Indoor)` : ''
              }`}
              variant="neutral"
            />
          </View>

          {/* Price & Action Row */}
          <View style={styles.priceRow}>
            <View>
              <Text style={styles.priceLabel}>Hourly Court Rate</Text>
              <Text style={[styles.priceValue, Typography.tabularNums]}>
                From {venue.baseRateFormatted}
              </Text>
            </View>

            <View style={styles.actionBtns}>
              {venue.mapsUrl && (
                <Button
                  title="Directions"
                  variant="secondary"
                  size="sm"
                  onPress={() => handleOpenMaps(venue.mapsUrl)}
                  icon={<Navigation size={14} color={Tokens.colors.text} strokeWidth={1.75} />}
                />
              )}

              <Button
                title="Book at Club"
                variant="primary"
                size="sm"
                onPress={() => {
                  if (onSelectVenue) {
                    onSelectVenue(venue.id);
                  } else {
                    handleBookClub(venue.bookingUrl, venue.bookingPhone);
                  }
                }}
              />
            </View>
          </View>
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: Tokens.spacing.xxxl,
    gap: Tokens.spacing.base,
  },
  title: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.xl,
    lineHeight: Tokens.lineHeight.xl,
    color: Tokens.colors.text,
  },
  subtitle: {
    fontFamily: Typography.fontFamily.regular,
    fontWeight: Tokens.fontWeight.regular,
    fontSize: Tokens.fontSize.sm,
    lineHeight: Tokens.lineHeight.sm,
    color: Tokens.colors.textMuted,
    marginTop: -Tokens.spacing.sm,
    marginBottom: Tokens.spacing.xs,
  },
  card: {
    gap: Tokens.spacing.base,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleCol: {
    flex: 1,
    paddingRight: Tokens.spacing.sm,
    gap: Tokens.spacing.xs,
  },
  venueName: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.lg,
    lineHeight: Tokens.lineHeight.lg,
    color: Tokens.colors.text,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.xs,
  },
  venueAddress: {
    fontFamily: Typography.fontFamily.regular,
    fontWeight: Tokens.fontWeight.regular,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.textMuted,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.xs,
    backgroundColor: Tokens.colors.background,
    paddingHorizontal: Tokens.spacing.sm,
    paddingVertical: Tokens.spacing.xs,
    borderRadius: Tokens.radii.pill,
    borderWidth: 1,
    borderColor: Tokens.colors.border,
  },
  ratingNum: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.text,
  },
  specsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Tokens.spacing.sm,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Tokens.spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Tokens.colors.border,
  },
  priceLabel: {
    fontFamily: Typography.fontFamily.regular,
    fontWeight: Tokens.fontWeight.regular,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.textMuted,
  },
  priceValue: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.base,
    lineHeight: Tokens.lineHeight.base,
    color: Tokens.colors.greenText,
  },
  actionBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.sm,
  },
});
