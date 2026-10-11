import React from 'react';
import {
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Calendar,
  Clock,
  ExternalLink,
  MapPin,
  MessageCircle,
  Phone,
  Sparkles,
} from 'lucide-react-native';
import { Tokens, Typography } from '@/constants/theme';
import { Button, Card, Screen } from '@/components/ui';
import { useVenue } from '@/hooks/useVenues';
import { SAMPLE_VENUES } from '@/app/venues/index';
import { t } from '@/lib/i18n';
import { formatGhs } from '@/lib/formatting';

export default function VenueDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { venue: apiVenue } = useVenue(id);

  // Fallback to sample data if API is loading or offline
  const fallbackVenue = SAMPLE_VENUES.find((v) => v.id === id) || SAMPLE_VENUES[0];
  const venue = apiVenue || {
    id: fallbackVenue.id,
    name: fallbackVenue.name,
    address: fallbackVenue.address,
    ghanapost_gps: fallbackVenue.ghanapostGps || 'GA-492-8012',
    maps_url: fallbackVenue.mapsUrl || 'https://maps.google.com',
    booking_phone: fallbackVenue.bookingPhone || '+233240001122',
    booking_whatsapp: fallbackVenue.bookingPhone || '+233240001122',
    booking_url: '',
    court_count: fallbackVenue.courtCount,
    base_rate_pesewas_per_hour: 12000,
    base_rate_formatted: fallbackVenue.baseRateFormatted,
    description: fallbackVenue.description || 'Premier padel club in Accra with panoramic glass courts.',
    photos: fallbackVenue.imageUrl ? [{ url: fallbackVenue.imageUrl, alt: `${fallbackVenue.name} exterior` }] : [],
    amenities: ['Pro Shop', 'Locker Rooms', 'Refreshments', 'Floodlights', 'Free Parking'],
    opening_hours: [
      { day: 0, opens_minute: 360, closes_minute: 1380 },
      { day: 1, opens_minute: 360, closes_minute: 1380 },
      { day: 2, opens_minute: 360, closes_minute: 1380 },
      { day: 3, opens_minute: 360, closes_minute: 1380 },
      { day: 4, opens_minute: 360, closes_minute: 120 }, // Overnight: closes 02:00 Sat
      { day: 5, opens_minute: 420, closes_minute: 120 }, // Overnight: closes 02:00 Sun
      { day: 6, opens_minute: 480, closes_minute: 1320 },
    ],
    price_bands: [],
    duration_multipliers_bps: { '60': 10000, '90': 10000, '120': 10000 },
    add_ons_config: [
      { id: 'rackets', name: 'Racket Rental (x2)', price_pesewas: 4000 },
      { id: 'balls', name: 'Head Padel Pro Can (3 Balls)', price_pesewas: 6500 },
    ],
    price_version: 1,
    updated_at: new Date().toISOString(),
    courts: Array.from({ length: fallbackVenue.courtCount }, (_, i) => ({
      id: `c${i + 1}`,
      venue_id: fallbackVenue.id,
      court_number: i + 1,
      is_indoor: false,
      surface: 'Panoramic Glass Turf',
      lighting: 'LED Floodlights',
      photos: fallbackVenue.imageUrl ? [{ url: fallbackVenue.imageUrl, alt: `Court ${i + 1}` }] : [],
      notes: `Court ${i + 1}`,
      base_rate_pesewas_per_hour: 12000,
      price_bands: [],
    })),
    upcoming_events: [
      {
        id: 'ev-1',
        title: 'Friday Night Social Americano',
        format: 'AMERICANO',
        status: 'OPEN',
        start_time: '2026-10-16T18:00:00Z',
      },
      {
        id: 'ev-2',
        title: 'Weekend Morning Ladder',
        format: 'MEXICANO',
        status: 'OPEN',
        start_time: '2026-10-17T08:00:00Z',
      },
    ],
  };

  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const formatMinute = (minute: number) => {
    const h = Math.floor(minute / 60);
    const m = minute % 60;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 === 0 ? 12 : h % 12;
    return `${displayH}:${m.toString().padStart(2, '0')} ${ampm}`;
  };

  const handleCall = () => {
    if (venue.booking_phone) {
      Linking.openURL(`tel:${venue.booking_phone}`).catch(() => {});
    }
  };

  const handleWhatsApp = () => {
    const raw = venue.booking_whatsapp || venue.booking_phone;
    if (raw) {
      const clean = raw.replace(/[^0-9]/g, '');
      const text = encodeURIComponent(`Hi ${venue.name}, I'd like to ask about court availability.`);
      Linking.openURL(`https://wa.me/${clean}?text=${text}`).catch(() => {});
    }
  };

  const handleOpenMaps = () => {
    if (venue.maps_url) {
      Linking.openURL(venue.maps_url).catch(() => {});
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Navigation Bar */}
        <View style={styles.navRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            accessibilityLabel={t('backToClubs')}
          >
            <ArrowLeft size={20} color={Tokens.colors.text} />
            <Text style={styles.backBtnText}>{t('backToClubs')}</Text>
          </TouchableOpacity>
          {venue.updated_at && (
            <Text style={[styles.updatedDateText, Typography.tabularNums]}>
              {t('updatedOn', { date: new Date(venue.updated_at).toLocaleDateString() })}
            </Text>
          )}
        </View>

        {/* Hero Photo & Club Overview */}
        <Card style={styles.heroCard}>
          {venue.photos && venue.photos.length > 0 ? (
            <View style={styles.heroImageContainer}>
              <Image
                source={{ uri: venue.photos[0].url }}
                style={styles.heroImage}
                resizeMode="cover"
                accessibilityLabel={venue.photos[0].alt}
              />
            </View>
          ) : (
            <View style={styles.heroImagePlaceholder}>
              <Text style={styles.placeholderText}>{venue.name}</Text>
            </View>
          )}

          <View style={styles.heroContent}>
            <View style={styles.clubTitleRow}>
              <Text style={styles.clubTitle}>{venue.name}</Text>
              <View style={styles.courtBadge}>
                <Text style={styles.courtBadgeText}>
                  {venue.court_count} {venue.court_count === 1 ? 'Court' : 'Courts'}
                </Text>
              </View>
            </View>

            <View style={styles.locationRow}>
              <MapPin size={16} color={Tokens.colors.textMuted} />
              <Text style={styles.locationText}>{venue.address}</Text>
            </View>

            {venue.description ? (
              <Text style={styles.descriptionText}>{venue.description}</Text>
            ) : null}

            {/* Action Buttons: Call & WhatsApp & Maps */}
            <View style={styles.contactActionsRow}>
              {venue.booking_phone ? (
                <Button
                  title={t('contactClubCall')}
                  variant="primary"
                  size="md"
                  icon={<Phone size={16} color={Tokens.colors.textOnPrimary} />}
                  onPress={handleCall}
                  style={styles.actionBtn}
                />
              ) : null}
              {venue.booking_whatsapp || venue.booking_phone ? (
                <Button
                  title={t('contactClubWhatsApp')}
                  variant="secondary"
                  size="md"
                  icon={<MessageCircle size={16} color={Tokens.colors.text} />}
                  onPress={handleWhatsApp}
                  style={styles.actionBtn}
                />
              ) : null}
              {venue.maps_url ? (
                <Button
                  title="Maps"
                  variant="secondary"
                  size="md"
                  icon={<ExternalLink size={16} color={Tokens.colors.text} />}
                  onPress={handleOpenMaps}
                  style={styles.actionBtnNarrow}
                />
              ) : null}
            </View>

            {/* GhanaPostGPS & Location Metadata */}
            {venue.ghanapost_gps ? (
              <View style={styles.metaStrip}>
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>{t('ghanaPostGpsLabel')}:</Text>
                  <Text style={[styles.metaValue, Typography.tabularNums]}>
                    {venue.ghanapost_gps}
                  </Text>
                </View>
              </View>
            ) : null}
          </View>
        </Card>

        {/* Amenities */}
        {venue.amenities && venue.amenities.length > 0 ? (
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>{t('amenitiesLabel')}</Text>
            <View style={styles.amenitiesWrap}>
              {venue.amenities.map((item, idx) => (
                <View key={idx} style={styles.amenityChip}>
                  <Sparkles size={14} color={Tokens.colors.primary} />
                  <Text style={styles.amenityText}>{item}</Text>
                </View>
              ))}
            </View>
          </Card>
        ) : null}

        {/* Courts List Section */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Courts & Rates</Text>
          <Text style={styles.sectionSubtitle}>
            Select a court to calculate live dynamic pricing and available session times.
          </Text>

          <View style={styles.courtsGrid}>
            {(venue.courts || []).map((court) => {
              const courtRate =
                court.base_rate_pesewas_per_hour !== null && court.base_rate_pesewas_per_hour !== undefined
                  ? `${formatGhs(court.base_rate_pesewas_per_hour)} / hr`
                  : venue.base_rate_pesewas_per_hour !== null && venue.base_rate_pesewas_per_hour !== undefined
                  ? `${formatGhs(venue.base_rate_pesewas_per_hour)} / hr`
                  : t('askTheClub');

              return (
                <Card key={court.id} style={styles.courtRowCard}>
                  <View style={styles.courtHeaderRow}>
                    <View>
                      <Text style={styles.courtNameText}>Court {court.court_number}</Text>
                      <Text style={styles.courtSurfaceText}>
                        {court.surface} • {court.is_indoor ? t('indoorCourt') : t('outdoorCourt')}
                      </Text>
                    </View>
                    <View style={styles.courtRateBadge}>
                      <Text style={[styles.courtRateText, Typography.tabularNums]}>
                        {courtRate}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.courtFooterRow}>
                    <Text style={styles.courtLightingText}>
                      {t('courtLightingLabel')}: {court.lighting || t('askTheClub')}
                    </Text>
                    <Button
                      title={t('viewCourtBtn')}
                      variant="primary"
                      size="sm"
                      onPress={() => router.push(`/venues/${venue.id}/courts/${court.id}` as any)}
                    />
                  </View>
                </Card>
              );
            })}
          </View>
        </Card>

        {/* Structured Opening Hours */}
        {venue.opening_hours && venue.opening_hours.length > 0 ? (
          <Card style={styles.sectionCard}>
            <View style={styles.hoursHeaderRow}>
              <Clock size={18} color={Tokens.colors.primary} />
              <Text style={styles.sectionTitle}>{t('openingHoursLabel')}</Text>
            </View>

            <View style={styles.hoursTable}>
              {venue.opening_hours.map((span, idx) => {
                const dayName = dayNames[span.day] || `Day ${span.day}`;
                const isOvernight = span.opens_minute >= span.closes_minute;
                const closeText = isOvernight
                  ? `${formatMinute(span.closes_minute)} (next day)`
                  : formatMinute(span.closes_minute);

                return (
                  <View key={idx} style={styles.hoursRow}>
                    <Text style={styles.hoursDayText}>{dayName}</Text>
                    <Text style={[styles.hoursTimeText, Typography.tabularNums]}>
                      {formatMinute(span.opens_minute)} – {closeText}
                    </Text>
                  </View>
                );
              })}
            </View>
          </Card>
        ) : null}

        {/* Upcoming Public Events (No Player Names) */}
        {venue.upcoming_events && venue.upcoming_events.length > 0 ? (
          <Card style={styles.sectionCard}>
            <View style={styles.hoursHeaderRow}>
              <Calendar size={18} color={Tokens.colors.primary} />
              <Text style={styles.sectionTitle}>{t('upcomingEventsAtClub')}</Text>
            </View>
            <View style={styles.eventsList}>
              {venue.upcoming_events.map((ev) => (
                <View key={ev.id} style={styles.eventItem}>
                  <View>
                    <Text style={styles.eventTitle}>{ev.title}</Text>
                    <Text style={styles.eventFormat}>{ev.format}</Text>
                  </View>
                  <View style={styles.eventStatusBadge}>
                    <Text style={styles.eventStatusText}>{ev.status}</Text>
                  </View>
                </View>
              ))}
            </View>
          </Card>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Tokens.spacing.lg,
    gap: Tokens.spacing.md,
    maxWidth: 960,
    alignSelf: 'center',
    width: '100%',
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Tokens.spacing.xs,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.xs,
  },
  backBtnText: {
    ...Typography.bodyMd,
    color: Tokens.colors.text,
  },
  updatedDateText: {
    ...Typography.bodySm,
    color: Tokens.colors.textMuted,
  },
  heroCard: {
    padding: 0,
    overflow: 'hidden',
  },
  heroImageContainer: {
    width: '100%',
    height: 220,
    backgroundColor: Tokens.colors.surfaceMuted,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroImagePlaceholder: {
    width: '100%',
    height: 180,
    backgroundColor: Tokens.colors.surfaceMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    ...Typography.headlineSm,
    color: Tokens.colors.textMuted,
  },
  heroContent: {
    padding: Tokens.spacing.lg,
    gap: Tokens.spacing.sm,
  },
  clubTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clubTitle: {
    ...Typography.headlineMd,
    color: Tokens.colors.text,
  },
  courtBadge: {
    backgroundColor: Tokens.colors.surfaceMuted,
    paddingHorizontal: Tokens.spacing.sm,
    paddingVertical: Tokens.spacing.xs,
    borderRadius: Tokens.radii.pill,
  },
  courtBadgeText: {
    ...Typography.labelSm,
    color: Tokens.colors.text,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.xs,
  },
  locationText: {
    ...Typography.bodyMd,
    color: Tokens.colors.textMuted,
  },
  descriptionText: {
    ...Typography.bodyMd,
    color: Tokens.colors.text,
    lineHeight: 22,
  },
  contactActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Tokens.spacing.sm,
    marginTop: Tokens.spacing.xs,
  },
  actionBtn: {
    flexGrow: 1,
  },
  actionBtnNarrow: {
    minWidth: 90,
  },
  metaStrip: {
    flexDirection: 'row',
    gap: Tokens.spacing.md,
    paddingTop: Tokens.spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Tokens.colors.border,
  },
  metaItem: {
    flexDirection: 'row',
    gap: Tokens.spacing.xs,
  },
  metaLabel: {
    ...Typography.labelSm,
    color: Tokens.colors.textMuted,
  },
  metaValue: {
    ...Typography.labelSm,
    color: Tokens.colors.text,
  },
  sectionCard: {
    padding: Tokens.spacing.lg,
    gap: Tokens.spacing.sm,
  },
  sectionTitle: {
    ...Typography.headlineSm,
    color: Tokens.colors.text,
  },
  sectionSubtitle: {
    ...Typography.bodySm,
    color: Tokens.colors.textMuted,
  },
  amenitiesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Tokens.spacing.xs,
    marginTop: Tokens.spacing.xs,
  },
  amenityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Tokens.colors.surfaceMuted,
    paddingHorizontal: Tokens.spacing.sm,
    paddingVertical: Tokens.spacing.xs,
    borderRadius: Tokens.radii.sm,
  },
  amenityText: {
    ...Typography.labelSm,
    color: Tokens.colors.text,
  },
  courtsGrid: {
    gap: Tokens.spacing.sm,
    marginTop: Tokens.spacing.xs,
  },
  courtRowCard: {
    padding: Tokens.spacing.md,
    gap: Tokens.spacing.sm,
    backgroundColor: Tokens.colors.surfaceMuted,
  },
  courtHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  courtNameText: {
    ...Typography.bodyLg,
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    color: Tokens.colors.text,
  },
  courtSurfaceText: {
    ...Typography.bodySm,
    color: Tokens.colors.textMuted,
  },
  courtRateBadge: {
    backgroundColor: Tokens.colors.surface,
    paddingHorizontal: Tokens.spacing.sm,
    paddingVertical: Tokens.spacing.xs,
    borderRadius: Tokens.radii.sm,
  },
  courtRateText: {
    ...Typography.labelSm,
    color: Tokens.colors.primary,
  },
  courtFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Tokens.spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Tokens.colors.border,
  },
  courtLightingText: {
    ...Typography.bodySm,
    color: Tokens.colors.textMuted,
  },
  hoursHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.xs,
  },
  hoursTable: {
    gap: Tokens.spacing.xs,
    marginTop: Tokens.spacing.xs,
  },
  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: Tokens.colors.border,
  },
  hoursDayText: {
    ...Typography.bodySm,
    color: Tokens.colors.text,
  },
  hoursTimeText: {
    ...Typography.bodySm,
    color: Tokens.colors.textMuted,
  },
  eventsList: {
    gap: Tokens.spacing.xs,
    marginTop: Tokens.spacing.xs,
  },
  eventItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Tokens.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Tokens.colors.border,
  },
  eventTitle: {
    ...Typography.bodyMd,
    color: Tokens.colors.text,
  },
  eventFormat: {
    ...Typography.bodySm,
    color: Tokens.colors.textMuted,
  },
  eventStatusBadge: {
    backgroundColor: Tokens.colors.surfaceMuted,
    paddingHorizontal: Tokens.spacing.sm,
    paddingVertical: 2,
    borderRadius: Tokens.radii.sm,
  },
  eventStatusText: {
    ...Typography.labelSm,
    color: Tokens.colors.textMuted,
  },
});
