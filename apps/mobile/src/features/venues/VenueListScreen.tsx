import React, { useState } from 'react';
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  MapPin,
  Navigation,
  CheckCircle2,
  Calendar,
  Lock,
  Zap,
  Info,
  Check,
  Phone,
} from 'lucide-react-native';
import { Tokens, Typography, useResponsiveLayout } from '@/constants/theme';
import { Card, Button } from '@/components/ui';

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
  description?: string;
  courtsAvailableToday?: number;
  peakRateFormatted?: string;
  surface?: string;
  verified?: boolean;
}

export interface VenueListScreenProps {
  venues: VenueItem[];
  onSelectVenue?: (venueId: string) => void;
  onBookSlot?: (bookingDetails: any) => void;
}

interface TimeSlot {
  time: string;
  status: 'available' | 'booked';
}

const TIME_SLOTS: TimeSlot[] = [
  { time: '4:00 PM', status: 'available' },
  { time: '5:00 PM', status: 'booked' },
  { time: '6:00 PM', status: 'available' },
  { time: '7:00 PM', status: 'available' },
  { time: '8:00 PM', status: 'available' },
];

export function VenueListScreen({ venues, onSelectVenue, onBookSlot }: VenueListScreenProps) {
  const { isDesktop, isTablet } = useResponsiveLayout();
  const [selectedVenueId, setSelectedVenueId] = useState<string>(venues[0]?.id || 'v1');
  const [selectedSlot, setSelectedSlot] = useState<string>('6:00 PM');
  const [selectedDuration, setSelectedDuration] = useState<number>(90); // 60, 90, 120
  const [includeBalls, setIncludeBalls] = useState<boolean>(true);
  const [includeRackets, setIncludeRackets] = useState<boolean>(false);
  const [matchType, setMatchType] = useState<'private' | 'public'>('private');
  const [paymentMethod, setPaymentMethod] = useState<'mtn' | 'telecel' | 'wallet'>('mtn');
  const [momoPhone, setMomoPhone] = useState<string>('024 412 3456');

  const selectedVenue = venues.find((v) => v.id === selectedVenueId) || venues[0];

  const handleOpenMaps = (url?: string) => {
    if (url) {
      Linking.openURL(url).catch(() => {});
    }
  };

  const handleCallClub = (phone?: string) => {
    if (phone) {
      Linking.openURL(`tel:${phone}`).catch(() => {});
    }
  };

  // Price calculations in Pesewas & Cedis
  const baseHourlyCedis = 120;
  const courtFeeCedis = (baseHourlyCedis * selectedDuration) / 60;
  const lightingFeeCedis = 20;
  const ballsFeeCedis = includeBalls ? 65 : 0;
  const racketsFeeCedis = includeRackets ? 40 : 0;
  const totalCedis = courtFeeCedis + lightingFeeCedis + ballsFeeCedis + racketsFeeCedis;

  const handleVenueClick = (venueId: string) => {
    setSelectedVenueId(venueId);
    if (onSelectVenue) {
      onSelectVenue(venueId);
    }
  };

  const handleCheckout = () => {
    if (onBookSlot) {
      onBookSlot({
        venueId: selectedVenue.id,
        slot: selectedSlot,
        duration: selectedDuration,
        totalGhs: totalCedis,
        phone: momoPhone,
        paymentMethod,
      });
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* Top Section Header */}
      <View style={styles.topHeader}>
        <View style={styles.headerInfo}>
          <View style={styles.circuitLiveRow}>
            <View style={styles.circuitBadge}>
              <View style={styles.pulseDot} />
              <Text style={styles.circuitBadgeText}>Accra Circuit Live</Text>
            </View>
            <Text style={styles.circuitSubtitle}>• Instant MTN / Telecel MoMo Confirmation</Text>
          </View>
          <Text style={styles.mainTitle}>Accra Padel Clubs & Court Booking</Text>
          <Text style={styles.mainSubtitle}>
            Book panoramic glass courts with instant Mobile Money confirmation across Airport Residential, East Legon, and Cantonments.
          </Text>
        </View>

        {/* Quick Summary Stats Pill */}
        <View style={styles.summaryStatsPill}>
          <View style={styles.summaryStatItem}>
            <Text style={styles.summaryStatLabel}>Available Today</Text>
            <Text style={[styles.summaryStatVal, Typography.tabularNums]}>6 Courts</Text>
          </View>
          <View style={[styles.summaryStatItem, styles.summaryStatItemBorder]}>
            <Text style={styles.summaryStatLabel}>Active Venues</Text>
            <Text style={[styles.summaryStatVal, Typography.tabularNums]}>3 Premier</Text>
          </View>
        </View>
      </View>

      {/* Filter Strip */}
      <Card style={styles.filterStrip}>
        <View style={styles.filterChipsRow}>
          <View style={styles.filterPill}>
            <MapPin size={14} color={Tokens.colors.textMuted} />
            <Text style={styles.filterPillLabel}>Location:</Text>
            <Text style={styles.filterPillValue}>All Accra Hubs</Text>
          </View>
          <View style={styles.filterPill}>
            <Calendar size={14} color={Tokens.colors.textMuted} />
            <Text style={styles.filterPillValue}>Today, Thu Oct 24</Text>
          </View>
          <View style={styles.filterPill}>
            <Text style={styles.filterPillLabel}>Surface:</Text>
            <Text style={styles.filterPillValue}>Panoramic Glass</Text>
          </View>
        </View>
      </Card>

      {/* Main Responsive Grid Layout */}
      <View style={[styles.mainLayout, (isDesktop || isTablet) && styles.mainLayoutRow]}>
        {/* LEFT COLUMN: Club Cards & Court Slot Configuration (7 Cols) */}
        <View style={[styles.leftColumn, (isDesktop || isTablet) && styles.leftColumnExpanded]}>
          <View style={styles.clubsListSection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeading}>Accra Padel Clubs</Text>
              <Text style={styles.sectionSubheading}>Select club to preview slots</Text>
            </View>

            {/* Club Cards */}
            {venues.map((venue) => {
              const isSelected = venue.id === selectedVenueId;
              return (
                <TouchableOpacity
                  key={venue.id}
                  activeOpacity={0.85}
                  onPress={() => handleVenueClick(venue.id)}
                >
                  <Card style={[styles.clubCard, isSelected && styles.clubCardSelected]}>
                    <View style={styles.clubCardContent}>
                      <View style={styles.clubTitleRow}>
                        <View style={styles.clubNameWrapper}>
                          <Text style={styles.clubName}>{venue.name}</Text>
                          <CheckCircle2 size={16} color={Tokens.colors.greenText} />
                        </View>
                        <View style={styles.openCourtsBadge}>
                          <Text style={styles.openCourtsText}>
                            {venue.courtsAvailableToday || venue.courtCount} courts open
                          </Text>
                        </View>
                      </View>

                      <View style={styles.addressRow}>
                        <MapPin size={14} color={Tokens.colors.textMuted} />
                        <Text style={styles.addressText}>{venue.address}</Text>
                      </View>

                      <Text style={styles.descriptionText} numberOfLines={2}>
                        {venue.description ||
                          `${venue.courtCount} panoramic glass courts with LED floodlights, pro shop & lounge.`}
                      </Text>

                      <View style={styles.clubCardFooter}>
                        <View style={styles.rateCol}>
                          <Text style={[styles.rateAmount, Typography.tabularNums]}>
                            {venue.baseRateFormatted}
                          </Text>
                          {venue.peakRateFormatted && (
                            <Text style={styles.peakSubtext}>
                              (Peak: {venue.peakRateFormatted})
                            </Text>
                          )}
                        </View>

                        <View style={styles.clubActions}>
                          {venue.mapsUrl && (
                            <Button
                              title="Directions"
                              variant="secondary"
                              size="sm"
                              icon={<Navigation size={14} color={Tokens.colors.text} />}
                              onPress={(e) => {
                                e?.stopPropagation?.();
                                handleOpenMaps(venue.mapsUrl);
                              }}
                            />
                          )}
                          <Button
                            title={isSelected ? 'Selected' : 'Select'}
                            variant={isSelected ? 'primary' : 'secondary'}
                            size="sm"
                            onPress={(e) => {
                              e?.stopPropagation?.();
                              handleVenueClick(venue.id);
                            }}
                          />
                        </View>
                      </View>
                    </View>
                  </Card>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Slot & Configuration Matrix */}
          <Card style={styles.matrixCard}>
            <View style={styles.matrixHeader}>
              <View>
                <Text style={styles.matrixSubheader}>Configuring Court Session</Text>
                <Text style={styles.matrixTitle}>
                  Court 1 (Panoramic)
                </Text>
              </View>
              <View style={styles.turfBadge}>
                <View style={styles.turfDot} />
                <Text style={styles.turfText}>Turf: Blue Mondo 12mm</Text>
              </View>
            </View>

            {/* Time Slots Grid */}
            <View style={styles.slotsSection}>
              <View style={styles.slotsLabelRow}>
                <Text style={styles.fieldLabel}>Available Time Slots (Thu, Oct 24)</Text>
                <View style={styles.slotLegend}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, styles.legendDotSelected]} />
                    <Text style={styles.legendText}>Selected</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, styles.legendDotOpen]} />
                    <Text style={styles.legendText}>Open</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, styles.legendDotBooked]} />
                    <Text style={styles.legendText}>Booked</Text>
                  </View>
                </View>
              </View>

              <View style={styles.slotsGrid}>
                {TIME_SLOTS.map((slot) => {
                  const isBooked = slot.status === 'booked';
                  const isSlotSelected = selectedSlot === slot.time;
                  return (
                    <TouchableOpacity
                      key={slot.time}
                      disabled={isBooked}
                      style={[
                        styles.slotBtn,
                        isSlotSelected && styles.slotBtnSelected,
                        isBooked && styles.slotBtnBooked,
                      ]}
                      onPress={() => setSelectedSlot(slot.time)}
                    >
                      <Text
                        style={[
                          styles.slotTimeText,
                          isSlotSelected && styles.slotTimeTextSelected,
                          isBooked && styles.slotTimeTextBooked,
                          Typography.tabularNums,
                        ]}
                      >
                        {slot.time}
                      </Text>
                      <Text
                        style={[
                          styles.slotStatusText,
                          isSlotSelected && styles.slotStatusTextSelected,
                          isBooked && styles.slotStatusTextBooked,
                        ]}
                      >
                        {isBooked ? 'Booked' : isSlotSelected ? 'Selected' : 'Available'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Match Duration Selector */}
            <View style={styles.durationSection}>
              <Text style={styles.fieldLabel}>Match Duration</Text>
              <View style={styles.durationOptionsRow}>
                {[
                  { mins: 60, rate: 'GH₵ 120.00' },
                  { mins: 90, rate: 'GH₵ 180.00', recommended: true },
                  { mins: 120, rate: 'GH₵ 240.00' },
                ].map((dur) => {
                  const isDurSelected = selectedDuration === dur.mins;
                  return (
                    <TouchableOpacity
                      key={dur.mins}
                      style={[
                        styles.durationBox,
                        isDurSelected && styles.durationBoxSelected,
                      ]}
                      onPress={() => setSelectedDuration(dur.mins)}
                    >
                      {dur.recommended && (
                        <View style={styles.recommendedBadge}>
                          <Text style={styles.recommendedBadgeText}>Recommended</Text>
                        </View>
                      )}
                      <Text style={[styles.durationTitle, isDurSelected && styles.boldText]}>
                        {dur.mins} mins
                      </Text>
                      <Text style={[styles.durationRate, Typography.tabularNums]}>
                        {dur.rate}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Club Gear & Add-ons */}
            <View style={styles.addonsSection}>
              <Text style={styles.fieldLabel}>Club Gear & Add-ons</Text>
              <View style={styles.addonsGrid}>
                {/* Balls */}
                <TouchableOpacity
                  style={[styles.addonBox, includeBalls && styles.addonBoxSelected]}
                  onPress={() => setIncludeBalls(!includeBalls)}
                >
                  <View style={styles.addonInfo}>
                    <Text style={styles.addonTitle}>Head Padel Pro Can (x3)</Text>
                    <Text style={styles.addonSub}>New pressurized tube</Text>
                  </View>
                  <Text style={[styles.addonPrice, Typography.tabularNums]}>+GH₵ 65.00</Text>
                </TouchableOpacity>

                {/* Rackets */}
                <TouchableOpacity
                  style={[styles.addonBox, includeRackets && styles.addonBoxSelected]}
                  onPress={() => setIncludeRackets(!includeRackets)}
                >
                  <View style={styles.addonInfo}>
                    <Text style={styles.addonTitle}>Racket Rental (x2)</Text>
                    <Text style={styles.addonSub}>Babolat Air Viper Pro</Text>
                  </View>
                  <Text style={[styles.addonPrice, Typography.tabularNums]}>+GH₵ 40.00</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Game Format & Match Type */}
            <View style={styles.formatSection}>
              <View style={styles.formatHeader}>
                <Text style={styles.fieldLabel}>Game Format & Match Type</Text>
                <Text style={styles.formatSub}>Split billing via MoMo</Text>
              </View>
              <View style={styles.toggleRow}>
                <TouchableOpacity
                  style={[styles.toggleBtn, matchType === 'private' && styles.toggleBtnActive]}
                  onPress={() => setMatchType('private')}
                >
                  <Text
                    style={[
                      styles.toggleBtnText,
                      matchType === 'private' && styles.toggleBtnTextActive,
                    ]}
                  >
                    Private Match (Sole Host)
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleBtn, matchType === 'public' && styles.toggleBtnActive]}
                  onPress={() => setMatchType('public')}
                >
                  <Text
                    style={[
                      styles.toggleBtnText,
                      matchType === 'public' && styles.toggleBtnTextActive,
                    ]}
                  >
                    Open to Public (Needs 4th)
                  </Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.splitNoticeText}>
                You are paying reservation fees upfront. Invite links allow friends to refund you directly via MoMo.
              </Text>
            </View>
          </Card>
        </View>

        {/* RIGHT COLUMN: Mobile Money Checkout Drawer (5 Cols) */}
        <View style={[styles.rightColumn, (isDesktop || isTablet) && styles.rightColumnNarrow]}>
          <Card style={styles.checkoutCard}>
            <View style={styles.checkoutHeader}>
              <View style={styles.checkoutTitleRow}>
                <Text style={styles.checkoutTitle}>Mobile Money Checkout</Text>
              </View>
              <View style={styles.instantReleaseBadge}>
                <Text style={styles.instantReleaseText}>Instant Release</Text>
              </View>
            </View>

            {/* Payment Method Selector */}
            <View style={styles.paymentSection}>
              <Text style={styles.fieldLabel}>Select Payment Method</Text>
              <View style={styles.paymentMethodsCol}>
                {/* MTN MoMo */}
                <TouchableOpacity
                  style={[
                    styles.paymentMethodBox,
                    paymentMethod === 'mtn' && styles.paymentMethodBoxSelected,
                  ]}
                  onPress={() => setPaymentMethod('mtn')}
                >
                  <View style={styles.paymentMethodLeft}>
                    <View style={[styles.providerLogo, styles.mtnLogo]}>
                      <Text style={styles.providerLogoTextMtn}>M</Text>
                    </View>
                    <Text style={styles.paymentMethodName}>MTN MoMo</Text>
                  </View>
                  <View style={styles.fastPromptBadge}>
                    <View style={styles.fastPromptDot} />
                    <Text style={styles.fastPromptText}>Fast Prompt</Text>
                  </View>
                </TouchableOpacity>

                {/* Telecel Cash */}
                <TouchableOpacity
                  style={[
                    styles.paymentMethodBox,
                    paymentMethod === 'telecel' && styles.paymentMethodBoxSelected,
                  ]}
                  onPress={() => setPaymentMethod('telecel')}
                >
                  <View style={styles.paymentMethodLeft}>
                    <View style={[styles.providerLogo, styles.telecelLogo]}>
                      <Text style={styles.providerLogoTextTelecel}>T</Text>
                    </View>
                    <Text style={styles.paymentMethodName}>Telecel Cash</Text>
                  </View>
                  <Text style={styles.activeText}>Active</Text>
                </TouchableOpacity>

                {/* Padel Ghana Wallet */}
                <TouchableOpacity
                  style={[
                    styles.paymentMethodBox,
                    paymentMethod === 'wallet' && styles.paymentMethodBoxSelected,
                  ]}
                  onPress={() => setPaymentMethod('wallet')}
                >
                  <View style={styles.paymentMethodLeft}>
                    <View style={[styles.providerLogo, styles.walletLogo]}>
                      <Text style={styles.providerLogoTextWallet}>PG</Text>
                    </View>
                    <View>
                      <Text style={styles.paymentMethodName}>Padel Ghana Wallet</Text>
                      <Text style={[styles.walletBalText, Typography.tabularNums]}>
                        Bal: GH₵ 340.00
                      </Text>
                    </View>
                  </View>
                  <View style={styles.readyBadge}>
                    <Text style={styles.readyBadgeText}>Ready</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {/* MoMo Phone Number Field */}
            <View style={styles.phoneSection}>
              <View style={styles.phoneLabelRow}>
                <Text style={styles.fieldLabel}>Mobile Money Number</Text>
                <Text style={styles.ghanaCodeLabel}>Ghana (+233)</Text>
              </View>
              <View style={styles.phoneInputRow}>
                <Text style={styles.phonePrefixText}>+233</Text>
                <TextInput
                  value={momoPhone}
                  onChangeText={setMomoPhone}
                  style={[styles.phoneInput, Typography.tabularNums]}
                  placeholder="024 XXX XXXX"
                  placeholderTextColor={Tokens.colors.textMuted}
                  keyboardType="phone-pad"
                />
                <CheckCircle2 size={16} color={Tokens.colors.greenText} />
              </View>
              <Text style={styles.registeredNameText}>
                Registered: Kwame Antwi-Boasiako
              </Text>
            </View>

            {/* Price Breakdown Table */}
            <View style={styles.breakdownSection}>
              <Text style={styles.fieldLabel}>Reservation Breakdown</Text>
              <View style={styles.breakdownRowsCol}>
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>
                    Court Fee ({selectedDuration} min session)
                  </Text>
                  <Text style={[styles.breakdownVal, Typography.tabularNums]}>
                    GH₵ {courtFeeCedis.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Court Lighting & Maintenance</Text>
                  <Text style={[styles.breakdownVal, Typography.tabularNums]}>
                    GH₵ {lightingFeeCedis.toFixed(2)}
                  </Text>
                </View>
                {includeBalls && (
                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>Head Padel Pro Can (3 Balls)</Text>
                    <Text style={[styles.breakdownVal, Typography.tabularNums]}>
                      GH₵ {ballsFeeCedis.toFixed(2)}
                    </Text>
                  </View>
                )}
                {includeRackets && (
                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>Racket Rental (x2 Babolat Pro)</Text>
                    <Text style={[styles.breakdownVal, Typography.tabularNums]}>
                      GH₵ {racketsFeeCedis.toFixed(2)}
                    </Text>
                  </View>
                )}
              </View>

              {/* Total Payable */}
              <View style={styles.totalRow}>
                <View>
                  <Text style={styles.totalLabel}>Total Payable</Text>
                  <Text style={styles.vatSubtext}>VAT & NHIL Inclusive</Text>
                </View>
                <Text style={[styles.totalAmount, Typography.tabularNums]}>
                  GH₵ {totalCedis.toFixed(2)}
                </Text>
              </View>
            </View>

            {/* Primary Action Button */}
            <View style={styles.checkoutActionCol}>
              <Button
                title={`Pay GH₵ ${totalCedis.toFixed(2)} via ${
                  paymentMethod === 'mtn' ? 'MTN MoMo' : paymentMethod === 'telecel' ? 'Telecel Cash' : 'Wallet'
                }`}
                variant="primary"
                size="lg"
                icon={<Lock size={18} color={Tokens.colors.textOnPrimary} />}
                onPress={handleCheckout}
              />

              <View style={styles.promptSecurityNote}>
                <Info size={16} color={Tokens.colors.textMuted} />
                <Text style={styles.promptSecurityText}>
                  Prompt will be sent to your phone for mobile money PIN confirmation. Court slot held for 5 mins.
                </Text>
              </View>
            </View>

            {/* Venue Guarantee */}
            <View style={styles.guaranteeRow}>
              <View style={styles.guaranteeItem}>
                <Check size={14} color={Tokens.colors.greenText} />
                <Text style={styles.guaranteeText}>Guaranteed Floodlight Power</Text>
              </View>
              <View style={styles.guaranteeItem}>
                <Zap size={14} color={Tokens.colors.greenText} />
                <Text style={styles.guaranteeText}>Automatic Backup</Text>
              </View>
            </View>
          </Card>

          {/* Venue Access / Directions Snip */}
          <Card style={styles.accessCard}>
            <View style={styles.accessLeft}>
              <View style={styles.accessIconContainer}>
                <Navigation size={18} color={Tokens.colors.text} />
              </View>
              <View style={styles.accessInfo}>
                <Text style={styles.accessTitle}>Venue Access & Parking</Text>
                <Text style={styles.accessSubtitle}>
                  8 mins from Kotoka Int Airport • Valet Parking
                </Text>
              </View>
            </View>
            {selectedVenue.bookingPhone && (
              <Button
                title="Call"
                variant="secondary"
                size="sm"
                icon={<Phone size={14} color={Tokens.colors.text} />}
                onPress={() => handleCallClub(selectedVenue.bookingPhone)}
              />
            )}
          </Card>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: Tokens.spacing.xxxl,
    gap: Tokens.spacing.lg,
  },
  topHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: Tokens.spacing.base,
    paddingBottom: Tokens.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Tokens.colors.border,
  },
  headerInfo: {
    flex: 1,
    minWidth: 280,
    gap: Tokens.spacing.xs,
  },
  circuitLiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.xs,
    flexWrap: 'wrap',
  },
  circuitBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.xs,
    paddingHorizontal: Tokens.spacing.sm,
    paddingVertical: 2,
    borderRadius: Tokens.radii.pill,
    backgroundColor: Tokens.colors.primaryLight,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Tokens.colors.primary,
  },
  circuitBadgeText: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.primaryText,
  },
  circuitSubtitle: {
    ...Typography.bodySm,
    color: Tokens.colors.textMuted,
  },
  mainTitle: {
    ...Typography.headlineLg,
    color: Tokens.colors.text,
  },
  mainSubtitle: {
    ...Typography.bodyMd,
    color: Tokens.colors.textMuted,
  },
  summaryStatsPill: {
    flexDirection: 'row',
    backgroundColor: Tokens.colors.surface,
    borderRadius: Tokens.radii.card,
    borderWidth: 1,
    borderColor: Tokens.colors.border,
    padding: Tokens.spacing.xs,
  },
  summaryStatItem: {
    paddingHorizontal: Tokens.spacing.sm,
    paddingVertical: Tokens.spacing.xs,
    gap: 2,
  },
  summaryStatItemBorder: {
    borderLeftWidth: 1,
    borderLeftColor: Tokens.colors.border,
  },
  summaryStatLabel: {
    ...Typography.labelSm,
    color: Tokens.colors.textMuted,
    textTransform: 'uppercase',
  },
  summaryStatVal: {
    ...Typography.labelMd,
    color: Tokens.colors.text,
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
  },
  filterStrip: {
    padding: Tokens.spacing.sm,
  },
  filterChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Tokens.spacing.sm,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.xs,
    paddingHorizontal: Tokens.spacing.sm,
    paddingVertical: Tokens.spacing.xs,
    borderRadius: Tokens.radii.sm,
    backgroundColor: Tokens.colors.surfaceMuted,
    borderWidth: 1,
    borderColor: Tokens.colors.border,
  },
  filterPillLabel: {
    ...Typography.labelSm,
    color: Tokens.colors.textMuted,
  },
  filterPillValue: {
    ...Typography.labelSm,
    color: Tokens.colors.text,
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
  },
  mainLayout: {
    flexDirection: 'column',
    gap: Tokens.spacing.lg,
  },
  mainLayoutRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  leftColumn: {
    flex: 1,
    gap: Tokens.spacing.lg,
  },
  leftColumnExpanded: {
    flex: 7,
  },
  rightColumn: {
    flex: 1,
    gap: Tokens.spacing.lg,
  },
  rightColumnNarrow: {
    flex: 5,
  },
  clubsListSection: {
    gap: Tokens.spacing.sm,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: Tokens.spacing.xs,
  },
  sectionHeading: {
    ...Typography.labelSm,
    color: Tokens.colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionSubheading: {
    ...Typography.bodySm,
    color: Tokens.colors.textMuted,
  },
  clubCard: {
    padding: Tokens.spacing.base,
    borderWidth: 1,
    borderColor: Tokens.colors.border,
  },
  clubCardSelected: {
    borderColor: Tokens.colors.text,
    borderWidth: 2,
  },
  clubCardContent: {
    gap: Tokens.spacing.sm,
  },
  clubTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Tokens.spacing.sm,
  },
  clubNameWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.xs,
    flex: 1,
  },
  clubName: {
    ...Typography.headlineSm,
    color: Tokens.colors.text,
  },
  openCourtsBadge: {
    paddingHorizontal: Tokens.spacing.sm,
    paddingVertical: 2,
    borderRadius: Tokens.radii.chip,
    backgroundColor: Tokens.colors.primaryLight,
  },
  openCourtsText: {
    ...Typography.labelSm,
    color: Tokens.colors.greenText,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.xs,
  },
  addressText: {
    ...Typography.bodySm,
    color: Tokens.colors.textMuted,
  },
  descriptionText: {
    ...Typography.bodySm,
    color: Tokens.colors.textMuted,
    lineHeight: Tokens.lineHeight.sm,
  },
  clubCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Tokens.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Tokens.colors.border,
  },
  rateCol: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Tokens.spacing.xs,
  },
  rateAmount: {
    ...Typography.labelMd,
    color: Tokens.colors.text,
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
  },
  peakSubtext: {
    ...Typography.bodySm,
    color: Tokens.colors.textMuted,
  },
  clubActions: {
    flexDirection: 'row',
    gap: Tokens.spacing.sm,
  },
  matrixCard: {
    padding: Tokens.spacing.base,
    gap: Tokens.spacing.lg,
  },
  matrixHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: Tokens.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Tokens.colors.border,
  },
  matrixSubheader: {
    ...Typography.bodySm,
    color: Tokens.colors.textMuted,
  },
  matrixTitle: {
    ...Typography.headlineSm,
    color: Tokens.colors.text,
  },
  turfBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.xs,
    paddingHorizontal: Tokens.spacing.sm,
    paddingVertical: 4,
    borderRadius: Tokens.radii.sm,
    backgroundColor: Tokens.colors.surfaceMuted,
    borderWidth: 1,
    borderColor: Tokens.colors.border,
  },
  turfDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Tokens.colors.primary,
  },
  turfText: {
    ...Typography.labelSm,
    color: Tokens.colors.text,
  },
  slotsSection: {
    gap: Tokens.spacing.sm,
  },
  slotsLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fieldLabel: {
    ...Typography.labelMd,
    color: Tokens.colors.text,
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
  },
  slotLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendDotSelected: {
    backgroundColor: Tokens.colors.primary,
  },
  legendDotOpen: {
    backgroundColor: Tokens.colors.surface,
    borderWidth: 1,
    borderColor: Tokens.colors.border,
  },
  legendDotBooked: {
    backgroundColor: Tokens.colors.border,
  },
  legendText: {
    ...Typography.bodySm,
    color: Tokens.colors.textMuted,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Tokens.spacing.sm,
  },
  slotBtn: {
    flex: 1,
    minWidth: 80,
    paddingVertical: Tokens.spacing.sm,
    paddingHorizontal: Tokens.spacing.xs,
    borderRadius: Tokens.radii.card,
    backgroundColor: Tokens.colors.surface,
    borderWidth: 1,
    borderColor: Tokens.colors.border,
    alignItems: 'center',
    gap: 2,
  },
  slotBtnSelected: {
    borderColor: Tokens.colors.primary,
    backgroundColor: Tokens.colors.primaryLight,
    borderWidth: 2,
  },
  slotBtnBooked: {
    backgroundColor: Tokens.colors.surfaceMuted,
    opacity: 0.5,
  },
  slotTimeText: {
    ...Typography.labelMd,
    color: Tokens.colors.text,
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
  },
  slotTimeTextSelected: {
    color: Tokens.colors.primaryText,
  },
  slotTimeTextBooked: {
    textDecorationLine: 'line-through',
    color: Tokens.colors.textMuted,
  },
  slotStatusText: {
    ...Typography.bodySm,
    color: Tokens.colors.greenText,
  },
  slotStatusTextSelected: {
    color: Tokens.colors.primaryText,
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
  },
  slotStatusTextBooked: {
    color: Tokens.colors.textMuted,
  },
  durationSection: {
    gap: Tokens.spacing.sm,
  },
  durationOptionsRow: {
    flexDirection: 'row',
    gap: Tokens.spacing.sm,
  },
  durationBox: {
    flex: 1,
    padding: Tokens.spacing.sm,
    borderRadius: Tokens.radii.card,
    backgroundColor: Tokens.colors.surface,
    borderWidth: 1,
    borderColor: Tokens.colors.border,
    gap: 2,
    position: 'relative',
  },
  durationBoxSelected: {
    borderColor: Tokens.colors.text,
    borderWidth: 2,
  },
  recommendedBadge: {
    position: 'absolute',
    top: -8,
    right: 8,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Tokens.radii.pill,
    backgroundColor: Tokens.colors.text,
  },
  recommendedBadgeText: {
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.surface,
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    textTransform: 'uppercase',
  },
  durationTitle: {
    ...Typography.labelMd,
    color: Tokens.colors.text,
  },
  durationRate: {
    ...Typography.bodySm,
    color: Tokens.colors.textMuted,
  },
  boldText: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
  },
  addonsSection: {
    gap: Tokens.spacing.sm,
  },
  addonsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Tokens.spacing.sm,
  },
  addonBox: {
    flex: 1,
    minWidth: 180,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Tokens.spacing.sm,
    borderRadius: Tokens.radii.card,
    backgroundColor: Tokens.colors.surface,
    borderWidth: 1,
    borderColor: Tokens.colors.border,
  },
  addonBoxSelected: {
    borderColor: Tokens.colors.text,
    borderWidth: 2,
  },
  addonInfo: {
    gap: 2,
  },
  addonTitle: {
    ...Typography.labelSm,
    color: Tokens.colors.text,
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
  },
  addonSub: {
    ...Typography.bodySm,
    color: Tokens.colors.textMuted,
  },
  addonPrice: {
    ...Typography.labelSm,
    color: Tokens.colors.text,
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
  },
  formatSection: {
    gap: Tokens.spacing.sm,
    paddingTop: Tokens.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Tokens.colors.border,
  },
  formatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  formatSub: {
    ...Typography.bodySm,
    color: Tokens.colors.textMuted,
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: Tokens.colors.surfaceMuted,
    padding: 3,
    borderRadius: Tokens.radii.card,
    borderWidth: 1,
    borderColor: Tokens.colors.border,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: Tokens.spacing.sm,
    alignItems: 'center',
    borderRadius: Tokens.radii.sm,
  },
  toggleBtnActive: {
    backgroundColor: Tokens.colors.surface,
    borderWidth: 1,
    borderColor: Tokens.colors.border,
  },
  toggleBtnText: {
    ...Typography.labelSm,
    color: Tokens.colors.textMuted,
  },
  toggleBtnTextActive: {
    color: Tokens.colors.text,
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
  },
  splitNoticeText: {
    ...Typography.bodySm,
    color: Tokens.colors.textMuted,
    lineHeight: Tokens.lineHeight.sm,
  },
  checkoutCard: {
    padding: Tokens.spacing.base,
    gap: Tokens.spacing.base,
  },
  checkoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: Tokens.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Tokens.colors.border,
  },
  checkoutTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.xs,
  },
  checkoutTitle: {
    ...Typography.headlineSm,
    color: Tokens.colors.text,
  },
  instantReleaseBadge: {
    paddingHorizontal: Tokens.spacing.sm,
    paddingVertical: 2,
    borderRadius: Tokens.radii.chip,
    backgroundColor: Tokens.colors.surfaceMuted,
    borderWidth: 1,
    borderColor: Tokens.colors.border,
  },
  instantReleaseText: {
    ...Typography.labelSm,
    color: Tokens.colors.textMuted,
  },
  paymentSection: {
    gap: Tokens.spacing.sm,
  },
  paymentMethodsCol: {
    gap: Tokens.spacing.sm,
  },
  paymentMethodBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Tokens.spacing.sm,
    borderRadius: Tokens.radii.card,
    backgroundColor: Tokens.colors.surface,
    borderWidth: 1,
    borderColor: Tokens.colors.border,
  },
  paymentMethodBoxSelected: {
    borderColor: Tokens.colors.text,
    borderWidth: 2,
  },
  paymentMethodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.sm,
  },
  providerLogo: {
    width: 26,
    height: 26,
    borderRadius: Tokens.radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mtnLogo: {
    backgroundColor: Tokens.colors.gold,
  },
  providerLogoTextMtn: {
    fontSize: Tokens.fontSize.xs,
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    color: Tokens.colors.text,
  },
  telecelLogo: {
    backgroundColor: Tokens.colors.danger,
  },
  providerLogoTextTelecel: {
    fontSize: Tokens.fontSize.xs,
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    color: Tokens.colors.surface,
  },
  walletLogo: {
    backgroundColor: Tokens.colors.text,
  },
  providerLogoTextWallet: {
    fontSize: Tokens.fontSize.xs,
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    color: Tokens.colors.primary,
  },
  paymentMethodName: {
    ...Typography.labelMd,
    color: Tokens.colors.text,
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
  },
  walletBalText: {
    ...Typography.bodySm,
    color: Tokens.colors.textMuted,
  },
  fastPromptBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  fastPromptDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Tokens.colors.primary,
  },
  fastPromptText: {
    ...Typography.labelSm,
    color: Tokens.colors.greenText,
  },
  activeText: {
    ...Typography.labelSm,
    color: Tokens.colors.textMuted,
  },
  readyBadge: {
    paddingHorizontal: Tokens.spacing.xs,
    paddingVertical: 2,
    borderRadius: Tokens.radii.chip,
    backgroundColor: Tokens.colors.primaryLight,
  },
  readyBadgeText: {
    ...Typography.labelSm,
    color: Tokens.colors.greenText,
  },
  phoneSection: {
    gap: Tokens.spacing.xs,
  },
  phoneLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ghanaCodeLabel: {
    ...Typography.bodySm,
    color: Tokens.colors.textMuted,
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Tokens.spacing.sm,
    paddingVertical: Tokens.spacing.xs,
    borderRadius: Tokens.radii.card,
    backgroundColor: Tokens.colors.surface,
    borderWidth: 1,
    borderColor: Tokens.colors.border,
    gap: Tokens.spacing.xs,
  },
  phonePrefixText: {
    ...Typography.labelMd,
    color: Tokens.colors.textMuted,
  },
  phoneInput: {
    flex: 1,
    ...Typography.labelMd,
    color: Tokens.colors.text,
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
  },
  registeredNameText: {
    ...Typography.bodySm,
    color: Tokens.colors.textMuted,
  },
  breakdownSection: {
    gap: Tokens.spacing.sm,
    paddingTop: Tokens.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Tokens.colors.border,
  },
  breakdownRowsCol: {
    gap: 6,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownLabel: {
    ...Typography.bodySm,
    color: Tokens.colors.textMuted,
  },
  breakdownVal: {
    ...Typography.bodySm,
    color: Tokens.colors.text,
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Tokens.fontWeight.medium,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Tokens.spacing.sm,
    marginTop: Tokens.spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Tokens.colors.border,
  },
  totalLabel: {
    ...Typography.headlineSm,
    color: Tokens.colors.text,
  },
  vatSubtext: {
    ...Typography.bodySm,
    color: Tokens.colors.textMuted,
  },
  totalAmount: {
    ...Typography.headlineLg,
    color: Tokens.colors.text,
  },
  checkoutActionCol: {
    gap: Tokens.spacing.sm,
  },
  promptSecurityNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Tokens.spacing.xs,
    padding: Tokens.spacing.sm,
    borderRadius: Tokens.radii.sm,
    backgroundColor: Tokens.colors.surfaceMuted,
    borderWidth: 1,
    borderColor: Tokens.colors.border,
  },
  promptSecurityText: {
    flex: 1,
    ...Typography.bodySm,
    color: Tokens.colors.textMuted,
    lineHeight: Tokens.lineHeight.sm,
  },
  guaranteeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Tokens.spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Tokens.colors.border,
  },
  guaranteeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  guaranteeText: {
    ...Typography.labelSm,
    color: Tokens.colors.textMuted,
  },
  accessCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Tokens.spacing.base,
  },
  accessLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.sm,
    flex: 1,
  },
  accessIconContainer: {
    width: 36,
    height: 36,
    borderRadius: Tokens.radii.sm,
    backgroundColor: Tokens.colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Tokens.colors.border,
  },
  accessInfo: {
    flex: 1,
    gap: 2,
  },
  accessTitle: {
    ...Typography.labelMd,
    color: Tokens.colors.text,
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
  },
  accessSubtitle: {
    ...Typography.bodySm,
    color: Tokens.colors.textMuted,
  },
});
