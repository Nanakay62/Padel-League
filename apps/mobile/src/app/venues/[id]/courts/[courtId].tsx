import React, { useMemo, useState } from 'react';
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
  Check,
  Clock,
  Lock,
  MessageCircle,
  Phone,
  Sparkles,
  Zap,
} from 'lucide-react-native';
import { Tokens, Typography, useResponsiveLayout } from '@/constants/theme';
import { Button, Card, Screen } from '@/components/ui';
import { useCourt, useQuote, useVenue } from '@/hooks/useVenues';
import { SAMPLE_VENUES } from '@/app/venues/index';
import { t } from '@/lib/i18n';
import { formatGhs } from '@/lib/formatting';

export default function CourtDetailScreen() {
  const { id: venueId, courtId } = useLocalSearchParams<{ id: string; courtId: string }>();
  const router = useRouter();
  const { isDesktop, isTablet } = useResponsiveLayout();

  const { venue: apiVenue } = useVenue(venueId);
  const { court: apiCourt } = useCourt(venueId, courtId);

  // Fallback data
  const fallbackVenue = SAMPLE_VENUES.find((v) => v.id === venueId) || SAMPLE_VENUES[0];
  const venue = apiVenue || {
    id: fallbackVenue.id,
    name: fallbackVenue.name,
    address: fallbackVenue.address,
    booking_phone: fallbackVenue.bookingPhone || '+233240001122',
    booking_whatsapp: fallbackVenue.bookingPhone || '+233240001122',
    base_rate_pesewas_per_hour: 12000,
    add_ons_config: [
      { id: 'rackets', name: 'Racket Rental (x2)', price_pesewas: 4000 },
      { id: 'balls', name: 'Head Padel Pro Can (3 Balls)', price_pesewas: 6500 },
    ],
  };

  const court = apiCourt || {
    id: courtId || 'c1',
    venue_id: venue.id,
    court_number: 1,
    is_indoor: false,
    surface: 'Panoramic Glass Turf',
    lighting: '', // Empty lighting defaults to "Ask the club", never invented
    photos: fallbackVenue.imageUrl ? [{ url: fallbackVenue.imageUrl, alt: `Court 1` }] : [],
    notes: 'Panoramic court',
    base_rate_pesewas_per_hour: 12000,
    price_bands: [],
  };

  // State for dynamic quote
  const [selectedDuration, setSelectedDuration] = useState<number>(90);
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>(['balls']);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number>(2); // 6:00 PM
  const [showBookingOpensModal, setShowBookingOpensModal] = useState<boolean>(false);

  // Candidate session times (tomorrow at :00 or :30 boundaries in UTC ISO)
  const candidateSlots = useMemo(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const slotConfigs = [
      { hour: 15, minute: 0, label: '3:00 PM' },
      { hour: 16, minute: 30, label: '4:30 PM' },
      { hour: 18, minute: 0, label: '6:00 PM' },
      { hour: 19, minute: 30, label: '7:30 PM' },
      { hour: 21, minute: 0, label: '9:00 PM' },
    ];

    return slotConfigs.map((cfg) => {
      const dt = new Date(Date.UTC(
        tomorrow.getFullYear(),
        tomorrow.getMonth(),
        tomorrow.getDate(),
        cfg.hour,
        cfg.minute,
        0,
        0
      ));
      return {
        label: cfg.label,
        isoString: dt.toISOString(),
      };
    });
  }, []);

  const activeSlot = candidateSlots[selectedSlotIndex] || candidateSlots[0];

  // Live dynamic quote hook with debounce & race prevention
  const quoteParams = useMemo(() => {
    return {
      venueId: venue.id,
      courtId: court.id,
      start: activeSlot.isoString,
      durationMin: selectedDuration,
      addOns: selectedAddOns,
    };
  }, [venue.id, court.id, activeSlot.isoString, selectedDuration, selectedAddOns]);

  const { quote, isUpdating } = useQuote(quoteParams);

  const toggleAddOn = (addOnId: string) => {
    setSelectedAddOns((prev) =>
      prev.includes(addOnId) ? prev.filter((id) => id !== addOnId) : [...prev, addOnId]
    );
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
      const text = encodeURIComponent(
        `Hi ${venue.name}, I would like to book Court ${court.court_number} on ${activeSlot.label} (${selectedDuration} mins).`
      );
      Linking.openURL(`https://wa.me/${clean}?text=${text}`).catch(() => {});
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
            accessibilityLabel={t('backToClub')}
          >
            <ArrowLeft size={20} color={Tokens.colors.text} />
            <Text style={styles.backBtnText}>{venue.name}</Text>
          </TouchableOpacity>
        </View>

        {/* Court Header Card */}
        <Card style={styles.courtHeaderCard}>
          {court.photos && court.photos.length > 0 ? (
            <View style={styles.courtPhotoContainer}>
              <Image
                source={{ uri: court.photos[0].url }}
                style={styles.courtPhoto}
                resizeMode="cover"
                accessibilityLabel={court.photos[0].alt}
              />
            </View>
          ) : null}

          <View style={styles.courtHeaderContent}>
            <View style={styles.courtTitleRow}>
              <Text style={styles.courtTitle}>Court {court.court_number}</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {court.is_indoor ? t('indoorCourt') : t('outdoorCourt')}
                </Text>
              </View>
            </View>

            <View style={styles.featuresRow}>
              <View style={styles.featurePill}>
                <Text style={styles.featureLabel}>{t('courtSurfaceLabel')}:</Text>
                <Text style={styles.featureValue}>{court.surface}</Text>
              </View>
              <View style={styles.featurePill}>
                <Text style={styles.featureLabel}>{t('courtLightingLabel')}:</Text>
                <Text style={styles.featureValue}>
                  {court.lighting || t('askTheClub')}
                </Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Dynamic Quote & Slot Selector */}
        <View style={[styles.mainLayout, (isDesktop || isTablet) && styles.mainLayoutRow]}>
          {/* Left Column: Interactive Configuration */}
          <View style={[styles.leftColumn, (isDesktop || isTablet) && styles.leftColumnExpanded]}>
            {/* Step 1: Session Time Selection */}
            <Card style={styles.configCard}>
              <View style={styles.cardHeaderRow}>
                <Calendar size={18} color={Tokens.colors.primary} />
                <View>
                  <Text style={styles.cardHeaderTitle}>{t('requestTimeTitle')}</Text>
                  <Text style={styles.cardHeaderSub}>30-minute boundary booking slots</Text>
                </View>
              </View>

              <View style={styles.slotsGrid}>
                {candidateSlots.map((slot, idx) => {
                  const isSelected = idx === selectedSlotIndex;
                  return (
                    <TouchableOpacity
                      key={slot.isoString}
                      style={[styles.slotBtn, isSelected && styles.slotBtnSelected]}
                      onPress={() => setSelectedSlotIndex(idx)}
                      accessibilityLabel={`Select time ${slot.label}`}
                    >
                      <Text
                        style={[
                          styles.slotTimeText,
                          isSelected && styles.slotTimeTextSelected,
                          Typography.tabularNums,
                        ]}
                      >
                        {slot.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Card>

            {/* Step 2: Duration Selector */}
            <Card style={styles.configCard}>
              <View style={styles.cardHeaderRow}>
                <Clock size={18} color={Tokens.colors.primary} />
                <Text style={styles.cardHeaderTitle}>{t('selectDuration')}</Text>
              </View>

              <View style={styles.durationRow}>
                {[60, 90, 120].map((dur) => {
                  const isSelected = selectedDuration === dur;
                  return (
                    <TouchableOpacity
                      key={dur}
                      style={[styles.durationBox, isSelected && styles.durationBoxSelected]}
                      onPress={() => setSelectedDuration(dur)}
                      accessibilityLabel={`${dur} minutes`}
                    >
                      <Text style={[styles.durationText, isSelected && styles.durationTextSelected]}>
                        {dur} min
                      </Text>
                      {dur === 90 && (
                        <View style={styles.popularBadge}>
                          <Text style={styles.popularBadgeText}>Popular</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Card>

            {/* Step 3: Add-ons & Equipment */}
            {venue.add_ons_config && venue.add_ons_config.length > 0 ? (
              <Card style={styles.configCard}>
                <View style={styles.cardHeaderRow}>
                  <Sparkles size={18} color={Tokens.colors.primary} />
                  <Text style={styles.cardHeaderTitle}>{t('addOnsTitle')}</Text>
                </View>

                <View style={styles.addOnsList}>
                  {venue.add_ons_config.map((item) => {
                    const isChecked = selectedAddOns.includes(item.id);
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[styles.addOnItem, isChecked && styles.addOnItemSelected]}
                        onPress={() => toggleAddOn(item.id)}
                        accessibilityLabel={`Add on ${item.name}`}
                      >
                        <View style={styles.addOnLeft}>
                          <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
                            {isChecked ? <Check size={14} color={Tokens.colors.textOnPrimary} /> : null}
                          </View>
                          <Text style={styles.addOnName}>{item.name}</Text>
                        </View>
                        <Text style={[styles.addOnPrice, Typography.tabularNums]}>
                          +{formatGhs(item.price_pesewas)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </Card>
            ) : null}
          </View>

          {/* Right Column: Live Price Quote Summary */}
          <View style={[styles.rightColumn, (isDesktop || isTablet) && styles.rightColumnNarrow]}>
            <Card style={styles.quoteSummaryCard}>
              <View style={styles.quoteHeaderRow}>
                <Text style={styles.quoteCardTitle}>Quote Summary</Text>
                {isUpdating ? (
                  <Text style={styles.updatingIndicator}>{t('pricingUpdating')}</Text>
                ) : null}
              </View>

              {/* Pricing Lines */}
              {quote && quote.is_priced ? (
                <View style={styles.quoteLinesContainer}>
                  {quote.lines.map((line, idx) => (
                    <View key={idx} style={styles.quoteLineRow}>
                      <Text style={styles.quoteLineLabel}>{line.label}</Text>
                      <Text style={[styles.quoteLineAmount, Typography.tabularNums]}>
                        {formatGhs(line.amount_pesewas)}
                      </Text>
                    </View>
                  ))}

                  <View style={styles.totalDivider} />

                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>{t('totalAmount')}</Text>
                    <Text style={[styles.totalAmount, Typography.tabularNums]}>
                      {formatGhs(quote.total_pesewas)}
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={styles.unpricedContainer}>
                  <Text style={styles.unpricedText}>{t('askTheClub')}</Text>
                  <Text style={styles.unpricedSub}>
                    Hourly rates for this court or time band are customized by the club.
                  </Text>
                </View>
              )}

              {/* Action Button: Pay or Contact */}
              <View style={styles.quoteActionContainer}>
                <Button
                  title={
                    quote && quote.is_priced
                      ? `Book & Pay ${formatGhs(quote.total_pesewas)}`
                      : t('contactClubCall')
                  }
                  variant="primary"
                  size="lg"
                  icon={<Lock size={18} color={Tokens.colors.textOnPrimary} />}
                  onPress={() => setShowBookingOpensModal(true)}
                  style={styles.bookBtn}
                />
              </View>
            </Card>

            {/* "Court Booking Opens Soon" Contact Card */}
            {showBookingOpensModal && (
              <Card style={styles.bookingModalCard}>
                <View style={styles.modalHeader}>
                  <Zap size={22} color={Tokens.colors.primary} />
                  <Text style={styles.modalTitle}>{t('bookingOpensSoon')}</Text>
                </View>
                <Text style={styles.modalDesc}>{t('bookingOpensSoonDesc')}</Text>

                <View style={styles.modalActions}>
                  {venue.booking_phone ? (
                    <Button
                      title={t('contactClubCall')}
                      variant="primary"
                      size="md"
                      icon={<Phone size={16} color={Tokens.colors.textOnPrimary} />}
                      onPress={handleCall}
                      style={styles.modalBtn}
                    />
                  ) : null}
                  {venue.booking_whatsapp || venue.booking_phone ? (
                    <Button
                      title={t('contactClubWhatsApp')}
                      variant="secondary"
                      size="md"
                      icon={<MessageCircle size={16} color={Tokens.colors.text} />}
                      onPress={handleWhatsApp}
                      style={styles.modalBtn}
                    />
                  ) : null}
                </View>
              </Card>
            )}
          </View>
        </View>
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
  courtHeaderCard: {
    padding: 0,
    overflow: 'hidden',
  },
  courtPhotoContainer: {
    width: '100%',
    height: 180,
    backgroundColor: Tokens.colors.surfaceMuted,
  },
  courtPhoto: {
    width: '100%',
    height: '100%',
  },
  courtHeaderContent: {
    padding: Tokens.spacing.lg,
    gap: Tokens.spacing.sm,
  },
  courtTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  courtTitle: {
    ...Typography.headlineMd,
    color: Tokens.colors.text,
  },
  badge: {
    backgroundColor: Tokens.colors.surfaceMuted,
    paddingHorizontal: Tokens.spacing.sm,
    paddingVertical: Tokens.spacing.xs,
    borderRadius: Tokens.radii.pill,
  },
  badgeText: {
    ...Typography.labelSm,
    color: Tokens.colors.text,
  },
  featuresRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Tokens.spacing.md,
  },
  featurePill: {
    flexDirection: 'row',
    gap: 4,
  },
  featureLabel: {
    ...Typography.labelSm,
    color: Tokens.colors.textMuted,
  },
  featureValue: {
    ...Typography.labelSm,
    color: Tokens.colors.text,
  },
  mainLayout: {
    gap: Tokens.spacing.md,
  },
  mainLayoutRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  leftColumn: {
    gap: Tokens.spacing.md,
    width: '100%',
  },
  leftColumnExpanded: {
    flex: 7,
  },
  rightColumn: {
    gap: Tokens.spacing.md,
    width: '100%',
  },
  rightColumnNarrow: {
    flex: 5,
  },
  configCard: {
    padding: Tokens.spacing.md,
    gap: Tokens.spacing.sm,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.xs,
  },
  cardHeaderTitle: {
    ...Typography.headlineSm,
    color: Tokens.colors.text,
  },
  cardHeaderSub: {
    ...Typography.bodySm,
    color: Tokens.colors.textMuted,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Tokens.spacing.xs,
    marginTop: Tokens.spacing.xs,
  },
  slotBtn: {
    paddingVertical: Tokens.spacing.sm,
    paddingHorizontal: Tokens.spacing.md,
    borderRadius: Tokens.radii.card,
    backgroundColor: Tokens.colors.surfaceMuted,
    borderWidth: 1,
    borderColor: Tokens.colors.border,
  },
  slotBtnSelected: {
    backgroundColor: Tokens.colors.primary,
    borderColor: Tokens.colors.primary,
  },
  slotTimeText: {
    ...Typography.bodyMd,
    color: Tokens.colors.text,
  },
  slotTimeTextSelected: {
    color: Tokens.colors.textOnPrimary,
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
  },
  durationRow: {
    flexDirection: 'row',
    gap: Tokens.spacing.sm,
    marginTop: Tokens.spacing.xs,
  },
  durationBox: {
    flex: 1,
    paddingVertical: Tokens.spacing.md,
    alignItems: 'center',
    borderRadius: Tokens.radii.card,
    backgroundColor: Tokens.colors.surfaceMuted,
    borderWidth: 1,
    borderColor: Tokens.colors.border,
    position: 'relative',
  },
  durationBoxSelected: {
    borderColor: Tokens.colors.primary,
    backgroundColor: Tokens.colors.surface,
  },
  durationText: {
    ...Typography.bodyMd,
    color: Tokens.colors.text,
  },
  durationTextSelected: {
    color: Tokens.colors.primary,
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    backgroundColor: Tokens.colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Tokens.radii.chip,
  },
  popularBadgeText: {
    ...Typography.labelSm,
    color: Tokens.colors.textOnPrimary,
  },
  addOnsList: {
    gap: Tokens.spacing.xs,
    marginTop: Tokens.spacing.xs,
  },
  addOnItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Tokens.spacing.sm,
    borderRadius: Tokens.radii.sm,
    backgroundColor: Tokens.colors.surfaceMuted,
    borderWidth: 1,
    borderColor: Tokens.colors.border,
  },
  addOnItemSelected: {
    borderColor: Tokens.colors.primary,
  },
  addOnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.xs,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: Tokens.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: Tokens.colors.primary,
    borderColor: Tokens.colors.primary,
  },
  addOnName: {
    ...Typography.bodyMd,
    color: Tokens.colors.text,
  },
  addOnPrice: {
    ...Typography.bodyMd,
    color: Tokens.colors.textMuted,
  },
  quoteSummaryCard: {
    padding: Tokens.spacing.lg,
    gap: Tokens.spacing.md,
  },
  quoteHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quoteCardTitle: {
    ...Typography.headlineSm,
    color: Tokens.colors.text,
  },
  updatingIndicator: {
    ...Typography.bodySm,
    color: Tokens.colors.primary,
    fontStyle: 'italic',
  },
  quoteLinesContainer: {
    gap: Tokens.spacing.sm,
  },
  quoteLineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quoteLineLabel: {
    ...Typography.bodyMd,
    color: Tokens.colors.textMuted,
  },
  quoteLineAmount: {
    ...Typography.bodyMd,
    color: Tokens.colors.text,
  },
  totalDivider: {
    height: 1,
    backgroundColor: Tokens.colors.border,
    marginVertical: Tokens.spacing.xs,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    ...Typography.headlineSm,
    color: Tokens.colors.text,
  },
  totalAmount: {
    ...Typography.headlineMd,
    color: Tokens.colors.primary,
  },
  unpricedContainer: {
    padding: Tokens.spacing.md,
    backgroundColor: Tokens.colors.surfaceMuted,
    borderRadius: Tokens.radii.card,
    gap: Tokens.spacing.xs,
  },
  unpricedText: {
    ...Typography.bodyLg,
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    color: Tokens.colors.text,
  },
  unpricedSub: {
    ...Typography.bodySm,
    color: Tokens.colors.textMuted,
  },
  quoteActionContainer: {
    marginTop: Tokens.spacing.xs,
  },
  bookBtn: {
    width: '100%',
  },
  bookingModalCard: {
    padding: Tokens.spacing.lg,
    backgroundColor: Tokens.colors.surface,
    borderColor: Tokens.colors.primary,
    gap: Tokens.spacing.sm,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.xs,
  },
  modalTitle: {
    ...Typography.headlineSm,
    color: Tokens.colors.text,
  },
  modalDesc: {
    ...Typography.bodySm,
    color: Tokens.colors.textMuted,
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Tokens.spacing.sm,
    marginTop: Tokens.spacing.xs,
  },
  modalBtn: {
    flex: 1,
  },
});
