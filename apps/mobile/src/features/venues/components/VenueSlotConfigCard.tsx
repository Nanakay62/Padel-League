import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Tokens, Typography } from '@/constants/theme';
import { Card } from '@/components/ui';
import {
  type VenueItem,
  type VenueCourt,
  TIME_SLOTS,
} from '../hooks/useVenueFilters';

export interface VenueSlotConfigCardProps {
  selectedVenue: VenueItem;
  activeCourt: VenueCourt;
  availableCourts: VenueCourt[];
  selectedCourtId: string;
  onSelectCourt: (courtId: string) => void;
  todayDateString: string;
  selectedSlot: string;
  onSelectSlot: (slot: string) => void;
  selectedDuration: number;
  onSelectDuration: (dur: number) => void;
  baseHourlyCedis: number;
  includeBalls: boolean;
  onToggleBalls: () => void;
  includeRackets: boolean;
  onToggleRackets: () => void;
  matchType: 'private' | 'public';
  onSelectMatchType: (type: 'private' | 'public') => void;
}

export function VenueSlotConfigCard({
  selectedVenue,
  activeCourt,
  availableCourts,
  onSelectCourt,
  todayDateString,
  selectedSlot,
  onSelectSlot,
  selectedDuration,
  onSelectDuration,
  baseHourlyCedis,
  includeBalls,
  onToggleBalls,
  includeRackets,
  onToggleRackets,
  matchType,
  onSelectMatchType,
}: VenueSlotConfigCardProps) {
  return (
    <Card style={styles.matrixCard}>
      <View style={styles.matrixHeader}>
        <View>
          <Text style={styles.matrixSubheader}>
            Configuring Court Session • {selectedVenue.address}
          </Text>
          <Text style={styles.matrixTitle} testID="active-court-name">
            {activeCourt.name}
          </Text>
        </View>
        <View style={styles.turfBadge}>
          <View style={styles.turfDot} />
          <Text style={styles.turfText}>{activeCourt.turf}</Text>
        </View>
      </View>

      {/* Court Selection Selector */}
      <View style={styles.courtSelectionSection}>
        <Text style={styles.fieldLabel}>Select Court ({availableCourts.length} Available)</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.courtPillsRow}
        >
          {availableCourts.map((court) => {
            const isCourtActive = court.id === activeCourt.id;
            return (
              <TouchableOpacity
                key={court.id}
                style={[styles.courtPill, isCourtActive && styles.courtPillActive]}
                onPress={() => onSelectCourt(court.id)}
                accessibilityRole="button"
                accessibilityLabel={`${court.name}, GH₵ ${court.hourlyRateCedis} per hour`}
                testID={`court-select-${court.id}`}
              >
                <Text style={[styles.courtPillName, isCourtActive && styles.courtPillNameActive]}>
                  {court.name}
                </Text>
                <Text
                  style={[
                    styles.courtPillRate,
                    isCourtActive && styles.courtPillRateActive,
                    Typography.tabularNums,
                  ]}
                >
                  GH₵ {court.hourlyRateCedis}.00 / hr
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Time Slots Grid */}
      <View style={styles.slotsSection}>
        <View style={styles.slotsLabelRow}>
          <Text style={styles.fieldLabel}>Available Time Slots ({todayDateString})</Text>
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
                onPress={() => onSelectSlot(slot.time)}
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
            { mins: 60, multiplier: 1 },
            { mins: 90, multiplier: 1.5, recommended: true },
            { mins: 120, multiplier: 2 },
          ].map((dur) => {
            const isDurSelected = selectedDuration === dur.mins;
            const durRate = `GH₵ ${(baseHourlyCedis * dur.multiplier).toFixed(2)}`;
            return (
              <TouchableOpacity
                key={dur.mins}
                style={[styles.durationBox, isDurSelected && styles.durationBoxSelected]}
                onPress={() => onSelectDuration(dur.mins)}
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
                  {durRate}
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
          <TouchableOpacity
            style={[styles.addonBox, includeBalls && styles.addonBoxSelected]}
            onPress={onToggleBalls}
          >
            <View style={styles.addonInfo}>
              <Text style={styles.addonTitle}>Head Padel Pro Can (x3)</Text>
              <Text style={styles.addonSub}>New pressurized tube</Text>
            </View>
            <Text style={[styles.addonPrice, Typography.tabularNums]}>+GH₵ 65.00</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.addonBox, includeRackets && styles.addonBoxSelected]}
            onPress={onToggleRackets}
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
            onPress={() => onSelectMatchType('private')}
          >
            <Text style={[styles.toggleBtnText, matchType === 'private' && styles.toggleBtnTextActive]}>
              Private Match (Sole Host)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, matchType === 'public' && styles.toggleBtnActive]}
            onPress={() => onSelectMatchType('public')}
          >
            <Text style={[styles.toggleBtnText, matchType === 'public' && styles.toggleBtnTextActive]}>
              Open to Public (Needs 4th)
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.splitNoticeText}>
          You are paying reservation fees upfront. Invite links allow friends to refund you directly via MoMo.
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
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
  courtSelectionSection: {
    gap: Tokens.spacing.xs,
  },
  courtPillsRow: {
    gap: Tokens.spacing.sm,
    paddingVertical: Tokens.spacing.xs,
  },
  courtPill: {
    paddingHorizontal: Tokens.spacing.md,
    paddingVertical: Tokens.spacing.sm,
    borderRadius: Tokens.radii.card,
    backgroundColor: Tokens.colors.surface,
    borderWidth: 1,
    borderColor: Tokens.colors.border,
    minHeight: Tokens.touch.minTarget,
    justifyContent: 'center',
    gap: Tokens.spacing.xs,
  },
  courtPillActive: {
    backgroundColor: Tokens.colors.slotFilledBg,
    borderColor: Tokens.colors.primary,
    borderWidth: 2,
  },
  courtPillName: {
    ...Typography.labelMd,
    color: Tokens.colors.text,
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
  },
  courtPillNameActive: {
    color: Tokens.colors.primary,
  },
  courtPillRate: {
    ...Typography.bodySm,
    color: Tokens.colors.textMuted,
  },
  courtPillRateActive: {
    color: Tokens.colors.primary,
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
});
