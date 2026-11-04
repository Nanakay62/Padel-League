import React from 'react';
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter, type Href } from 'expo-router';
import {
  Navigation,
  Zap,
  Phone,
  Shield,
} from 'lucide-react-native';
import { Tokens, Typography, useResponsiveLayout } from '@/constants/theme';
import { Card, Button, CircuitBanner } from '@/components/ui';
import {
  type VenueItem,
  type VenueCourt,
  type TimeSlot,
  VENUE_COURTS_MAP,
  useVenueFilters,
} from './hooks/useVenueFilters';
import { VenueCard } from './components/VenueCard';
import { VenueFilterBar } from './components/VenueFilterBar';
import { VenueSlotConfigCard } from './components/VenueSlotConfigCard';
import { VenueCheckoutDrawer } from './components/VenueCheckoutDrawer';

export type { VenueItem, VenueCourt };
export { VENUE_COURTS_MAP };

export interface BookingDetails {
  venueId: string;
  slot?: TimeSlot | string | null;
  duration?: number;
  totalGhs?: number;
  phone?: string;
  paymentMethod?: string;
  courtId?: string;
  slotTime?: string;
  courtName?: string;
}

export interface VenueListScreenProps {
  venues: VenueItem[];
  onSelectVenue?: (venueId: string) => void;
  onBookSlot?: (bookingDetails: BookingDetails) => void;
}

export function VenueListScreen({ venues, onSelectVenue, onBookSlot }: VenueListScreenProps) {
  const router = useRouter();
  const { isDesktop, isTablet } = useResponsiveLayout();
  const isDesktopOrTablet = isDesktop || isTablet;

  const {
    selectedVenueId,
    setSelectedVenueId,
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
  } = useVenueFilters(venues);

  const handleVenueClick = (venueId: string) => {
    setSelectedVenueId(venueId);
    if (onSelectVenue) {
      onSelectVenue(venueId);
    }
  };

  const handleCallClub = (phone?: string) => {
    if (phone) {
      Linking.openURL(`tel:${phone}`).catch(() => {});
    }
  };

  const handleCheckout = () => {
    setShowBookingOpensModal(true);
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
      {/* Top Banner */}
      <CircuitBanner
        badge="VENUES DIRECTORY"
        title="Accra Padel Clubs & Court Booking"
        description="Book panoramic glass courts across Accra with real-time pricing and slot availability."
        testID="venues-banner-card"
        stats={[
          {
            icon: <Zap size={14} color={Tokens.colors.gold} strokeWidth={1.75} />,
            label: '6 Courts available today',
          },
          {
            icon: <Shield size={14} color={Tokens.colors.bannerBlueIcon} strokeWidth={1.75} />,
            label: '3 Premier venues verified',
          },
        ]}
      />

      {/* Filter Strip */}
      <VenueFilterBar todayDateString={todayDateString} />

      {/* Main Responsive Grid Layout */}
      <View style={[styles.mainLayout, isDesktopOrTablet && styles.mainLayoutRow]}>
        {/* LEFT COLUMN: Club Cards & Court Slot Configuration */}
        <View style={[styles.leftColumn, isDesktopOrTablet && styles.leftColumnExpanded]}>
          <View style={styles.clubsListSection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeading}>Accra Padel Clubs</Text>
              <Text style={styles.sectionSubheading}>Select club to preview slots</Text>
            </View>

            {venues.map((venue) => (
              <VenueCard
                key={venue.id}
                venue={venue}
                isSelected={venue.id === selectedVenueId}
                onSelect={() => handleVenueClick(venue.id)}
                onViewClub={() => router.push(`/venues/${venue.id}` as Href)}
                isDesktopOrTablet={isDesktopOrTablet}
              />
            ))}
          </View>

          {/* Slot & Configuration Matrix Card */}
          <VenueSlotConfigCard
            selectedVenue={selectedVenue}
            activeCourt={activeCourt}
            availableCourts={availableCourts}
            selectedCourtId={selectedCourtId}
            onSelectCourt={setSelectedCourtId}
            todayDateString={todayDateString}
            selectedSlot={selectedSlot}
            onSelectSlot={setSelectedSlot}
            selectedDuration={selectedDuration}
            onSelectDuration={setSelectedDuration}
            baseHourlyCedis={baseHourlyCedis}
            includeBalls={includeBalls}
            onToggleBalls={() => setIncludeBalls(!includeBalls)}
            includeRackets={includeRackets}
            onToggleRackets={() => setIncludeRackets(!includeRackets)}
            matchType={matchType}
            onSelectMatchType={setMatchType}
          />
        </View>

        {/* RIGHT COLUMN: Mobile Money Checkout Drawer */}
        <View style={[styles.rightColumn, isDesktopOrTablet && styles.rightColumnNarrow]}>
          <VenueCheckoutDrawer
            selectedVenue={selectedVenue}
            selectedDuration={selectedDuration}
            paymentMethod={paymentMethod}
            onSelectPaymentMethod={setPaymentMethod}
            momoPhone={momoPhone}
            onChangeMomoPhone={setMomoPhone}
            courtFeeCedis={courtFeeCedis}
            lightingFeeCedis={lightingFeeCedis}
            ballsFeeCedis={ballsFeeCedis}
            racketsFeeCedis={racketsFeeCedis}
            includeBalls={includeBalls}
            includeRackets={includeRackets}
            totalCedis={totalCedis}
            onCheckout={handleCheckout}
            showBookingOpensModal={showBookingOpensModal}
          />

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
