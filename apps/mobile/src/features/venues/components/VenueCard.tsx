import React from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CheckCircle2, MapPin } from 'lucide-react-native';
import { Tokens, Typography } from '@/constants/theme';
import { Card, Button } from '@/components/ui';
import type { VenueItem } from '../hooks/useVenueFilters';

export interface VenueCardProps {
  venue: VenueItem;
  isSelected: boolean;
  onSelect: () => void;
  onViewClub: () => void;
  isDesktopOrTablet?: boolean;
}

export function VenueCard({
  venue,
  isSelected,
  onSelect,
  onViewClub,
  isDesktopOrTablet,
}: VenueCardProps) {
  return (
    <TouchableOpacity
      testID={`venue-card-${venue.id}`}
      activeOpacity={0.85}
      onPress={onSelect}
    >
      <Card style={[styles.clubCard, isSelected && styles.clubCardSelected]}>
        <View style={[styles.clubCardLayout, isDesktopOrTablet && styles.clubCardLayoutRow]}>
          {venue.imageUrl ? (
            <View style={[styles.clubImageWrapper, isDesktopOrTablet && styles.clubImageWrapperRow]}>
              <Image
                source={{ uri: venue.imageUrl }}
                style={styles.clubImage}
                resizeMode="cover"
              />
              {isSelected && (
                <View style={styles.selectedBadge}>
                  <Text style={styles.selectedBadgeText}>Selected</Text>
                </View>
              )}
            </View>
          ) : null}
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
                <Button
                  title="View club"
                  variant="primary"
                  size="sm"
                  style={styles.clubActionBtn}
                  onPress={(e) => {
                    e?.stopPropagation?.();
                    onViewClub();
                  }}
                />
              </View>
            </View>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  clubCard: {
    padding: Tokens.spacing.base,
    borderWidth: 1,
    borderColor: Tokens.colors.border,
  },
  clubCardSelected: {
    borderColor: Tokens.colors.text,
    borderWidth: 2,
  },
  clubCardLayout: {
    flexDirection: 'column',
    gap: Tokens.spacing.base,
  },
  clubCardLayoutRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  clubImageWrapper: {
    width: '100%',
    height: 160,
    borderRadius: Tokens.radii.sm,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: Tokens.colors.surfaceMuted,
  },
  clubImageWrapperRow: {
    width: 176,
    minHeight: 144,
    alignSelf: 'stretch',
  },
  clubImage: {
    width: '100%',
    height: '100%',
  },
  selectedBadge: {
    position: 'absolute',
    top: Tokens.spacing.sm,
    left: Tokens.spacing.sm,
    backgroundColor: Tokens.colors.text,
    paddingHorizontal: Tokens.spacing.sm,
    paddingVertical: 2,
    borderRadius: Tokens.radii.xs,
  },
  selectedBadgeText: {
    ...Typography.labelSm,
    color: Tokens.colors.surface,
  },
  clubCardContent: {
    flex: 1,
    gap: Tokens.spacing.sm,
    justifyContent: 'space-between',
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
    flexWrap: 'wrap',
    gap: Tokens.spacing.sm,
    paddingTop: Tokens.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Tokens.colors.border,
    marginTop: Tokens.spacing.xs,
  },
  rateCol: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Tokens.spacing.xs,
    flexShrink: 1,
    flexWrap: 'wrap',
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
    alignItems: 'center',
    flexShrink: 0,
  },
  clubActionBtn: {
    minHeight: 34,
    paddingVertical: 6,
    paddingHorizontal: Tokens.spacing.sm,
  },
});
