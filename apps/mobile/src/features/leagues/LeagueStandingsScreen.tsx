import React from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Trophy,
  Calendar,
  CheckCircle2,
  Clock,
  BookOpen,
  PlusCircle,
  Shield,
} from 'lucide-react-native';
import { Tokens, Typography, useResponsiveLayout } from '@/constants/theme';
import { Card, Button, CircuitBanner } from '@/components/ui';
import {
  type BoxStandingItem,
  type LeagueBoxItem,
  type ScheduledChallenge,
  type AmericanoStanding,
  type PrizePoolData,
  DEFAULT_CHALLENGE,
  DEFAULT_PRIZE_POOL,
  DEFAULT_AMERICANO_STANDINGS,
  SAMPLE_AMERICANO_STANDINGS,
  useLeagueStandings,
} from './hooks/useLeagueStandings';
import { StandingsTable } from './components/StandingsTable';
import { LeagueSidebarCards } from './components/LeagueSidebarCards';

export type {
  BoxStandingItem,
  LeagueBoxItem,
  ScheduledChallenge,
  AmericanoStanding,
  PrizePoolData,
};
export { SAMPLE_AMERICANO_STANDINGS };

export interface LeagueStandingsScreenProps {
  leagueTitle: string;
  seasonName: string;
  cycleWeeks: number;
  boxes: LeagueBoxItem[];
  upcomingChallenge?: ScheduledChallenge;
  americanoStandings?: AmericanoStanding[];
  prizePool?: PrizePoolData;
  onSelectBox?: (boxId: string) => void;
  onViewFixtures?: (boxId: string) => void;
  onCreateChallenge?: () => void;
  onChallengePair?: (pair: BoxStandingItem) => void;
  onViewRulebook?: () => void;
  onEnterScores?: (challengeId: string) => void;
  onReschedule?: (challengeId: string) => void;
}

export function LeagueStandingsScreen({
  leagueTitle,
  seasonName,
  cycleWeeks,
  boxes,
  upcomingChallenge = DEFAULT_CHALLENGE,
  americanoStandings = DEFAULT_AMERICANO_STANDINGS,
  prizePool = DEFAULT_PRIZE_POOL,
  onSelectBox,
  onViewFixtures,
  onCreateChallenge,
  onChallengePair,
  onViewRulebook,
  onEnterScores,
  onReschedule,
}: LeagueStandingsScreenProps) {
  const { isDesktop, isTablet } = useResponsiveLayout();
  const isDesktopOrTablet = isDesktop || isTablet;

  const {
    selectedBoxIndex,
    currentBox,
    handleBoxSelect,
  } = useLeagueStandings(boxes, onSelectBox);

  return (
    <View style={styles.container}>
      {/* Top Banner */}
      <CircuitBanner
        title={leagueTitle}
        description={`${seasonName} • Challenge pairs within 3 rungs to climb the national leaderboard.`}
        testID="leagues-banner-card"
        rightAction={
          <View style={styles.headerActions}>
            {onViewRulebook && (
              <Button
                title="League Rulebook"
                variant="secondary"
                size="sm"
                icon={<BookOpen size={16} color={Tokens.colors.textMuted} />}
                onPress={onViewRulebook}
              />
            )}
            <Button
              testID="leagues-create-challenge-btn"
              title="Create Ladder Challenge"
              variant="primary"
              size="sm"
              icon={<PlusCircle size={16} color={Tokens.colors.textOnPrimary} />}
              onPress={onCreateChallenge}
            />
          </View>
        }
        stats={[
          {
            icon: <Trophy size={14} color={Tokens.colors.gold} strokeWidth={1.75} />,
            label: 'Accra Championship Circuit',
          },
          {
            icon: <Shield size={14} color={Tokens.colors.bannerBlueIcon} strokeWidth={1.75} />,
            label: 'Official GPR synced',
          },
        ]}
      />

      {/* Season Progress Strip */}
      <Card style={styles.progressCard}>
        <View style={styles.progressLeft}>
          <View style={styles.calendarIconContainer}>
            <Calendar size={20} color={Tokens.colors.greenText} />
          </View>
          <View style={styles.progressTextCol}>
            <Text style={styles.progressTitle}>
              Week 6 of 10 • Playoff cut-off: Nov 30
            </Text>
            <Text style={styles.progressSubtitle}>
              Top 8 pairs qualify for Accra Championship Masters at Airport Residential Club
            </Text>
          </View>
        </View>

        <View style={styles.progressBarSection}>
          <View style={styles.progressLabelRow}>
            <Text style={styles.progressLabel}>Regular Season Progress</Text>
            <Text style={[styles.progressPercent, Typography.tabularNums]}>60%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: '60%' }]} />
          </View>
          <View style={styles.wksChip}>
            <Text style={styles.wksChipText}>{cycleWeeks} Wks Total • 4 Wks Left</Text>
          </View>
        </View>
      </Card>

      {/* Main Responsive Layout */}
      <View style={[styles.mainLayout, isDesktopOrTablet && styles.mainLayoutRow]}>
        {/* LEFT COLUMN: Ladder Table & Upcoming Challenge */}
        <View style={[styles.leftColumn, isDesktopOrTablet && styles.leftColumnExpanded]}>
          <StandingsTable
            boxes={boxes}
            selectedBoxIndex={selectedBoxIndex}
            currentBox={currentBox}
            onSelectBox={handleBoxSelect}
            onChallengePair={onChallengePair}
            onViewFixtures={onViewFixtures}
          />

          {/* Upcoming Challenge Card */}
          {upcomingChallenge && (
            <Card style={styles.challengeCard}>
              <View style={styles.challengeHeader}>
                <View style={styles.challengeTitleRow}>
                  <View style={styles.duelBadge}>
                    <Text style={styles.duelBadgeText}>{upcomingChallenge.title}</Text>
                  </View>
                  <Text style={styles.challengeVenueText}>
                    {upcomingChallenge.venue} • {upcomingChallenge.court}
                  </Text>
                </View>
                <View style={styles.challengeTimeRow}>
                  <Clock size={16} color={Tokens.colors.textMuted} />
                  <Text style={[styles.challengeTimeText, Typography.tabularNums]}>
                    {upcomingChallenge.time}
                  </Text>
                </View>
              </View>

              <View style={styles.duelGrid}>
                <View style={styles.duelTeamLeft}>
                  <Text style={styles.duelRoleLabel}>
                    Challenger (Rung {upcomingChallenge.challenger.rung})
                  </Text>
                  <Text style={styles.duelTeamName} numberOfLines={1}>
                    {upcomingChallenge.challenger.name}
                  </Text>
                  <Text style={[styles.duelRatingText, Typography.tabularNums]}>
                    PG Rating: {upcomingChallenge.challenger.rating.toFixed(2)}
                  </Text>
                </View>

                <View style={styles.duelVsCenter}>
                  <View style={styles.vsCircle}>
                    <Text style={styles.vsText}>VS</Text>
                  </View>
                  <Text style={styles.vsSubtext}>{upcomingChallenge.format}</Text>
                </View>

                <View style={styles.duelTeamRight}>
                  <Text style={styles.duelRoleLabel}>
                    Defender (Rung {upcomingChallenge.defender.rung})
                  </Text>
                  <Text style={styles.duelTeamName} numberOfLines={1}>
                    {upcomingChallenge.defender.name}
                  </Text>
                  <Text style={[styles.duelRatingText, Typography.tabularNums]}>
                    PG Rating: {upcomingChallenge.defender.rating.toFixed(2)}
                  </Text>
                </View>
              </View>

              <View style={styles.challengeFooter}>
                <View style={styles.challengeStatusInfo}>
                  <View style={styles.confirmedRow}>
                    <CheckCircle2 size={14} color={Tokens.colors.greenText} />
                    <Text style={styles.confirmedText}>Confirmed by both teams</Text>
                  </View>
                  <Text style={styles.feeBreakdownText}>
                    Split Court Fee:{' '}
                    <Text style={[styles.feeHighlight, Typography.tabularNums]}>
                      {upcomingChallenge.splitFeePerTeam}
                    </Text>
                  </Text>
                </View>

                <View style={styles.challengeActionsRow}>
                  {onReschedule && (
                    <Button
                      title="Reschedule"
                      variant="secondary"
                      size="sm"
                      onPress={() => onReschedule(upcomingChallenge.id)}
                    />
                  )}
                  <Button
                    testID="challenge-enter-scores-btn"
                    title="Enter Scores"
                    variant="primary"
                    size="sm"
                    onPress={() => {
                      if (onEnterScores) onEnterScores(upcomingChallenge.id);
                    }}
                  />
                </View>
              </View>
            </Card>
          )}
        </View>

        {/* RIGHT COLUMN */}
        <View style={[styles.rightColumn, isDesktopOrTablet && styles.rightColumnNarrow]}>
          <LeagueSidebarCards
            prizePool={prizePool}
            americanoStandings={americanoStandings}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Tokens.spacing.lg,
  },
  headerActions: {
    flexDirection: 'row',
    gap: Tokens.spacing.sm,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  progressCard: {
    padding: Tokens.spacing.base,
    gap: Tokens.spacing.base,
  },
  progressLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.sm,
  },
  calendarIconContainer: {
    width: 40,
    height: 40,
    borderRadius: Tokens.radii.card,
    backgroundColor: Tokens.colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTextCol: {
    flex: 1,
    gap: 2,
  },
  progressTitle: {
    ...Typography.headlineSm,
    color: Tokens.colors.text,
  },
  progressSubtitle: {
    ...Typography.bodySm,
    color: Tokens.colors.textMuted,
  },
  progressBarSection: {
    gap: Tokens.spacing.xs,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    ...Typography.labelSm,
    color: Tokens.colors.textMuted,
  },
  progressPercent: {
    ...Typography.labelSm,
    color: Tokens.colors.text,
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Tokens.colors.surfaceMuted,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Tokens.colors.primary,
    borderRadius: 3,
  },
  wksChip: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  wksChipText: {
    ...Typography.labelSm,
    color: Tokens.colors.textMuted,
    fontSize: Tokens.fontSize.xs,
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
  challengeCard: {
    padding: Tokens.spacing.base,
    gap: Tokens.spacing.base,
  },
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: Tokens.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Tokens.colors.border,
    flexWrap: 'wrap',
    gap: Tokens.spacing.xs,
  },
  challengeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.sm,
  },
  duelBadge: {
    backgroundColor: Tokens.colors.primaryLight,
    paddingHorizontal: Tokens.spacing.sm,
    paddingVertical: 2,
    borderRadius: Tokens.radii.chip,
  },
  duelBadgeText: {
    ...Typography.labelSm,
    color: Tokens.colors.greenText,
  },
  challengeVenueText: {
    ...Typography.bodySm,
    color: Tokens.colors.textMuted,
  },
  challengeTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  challengeTimeText: {
    ...Typography.labelSm,
    color: Tokens.colors.text,
  },
  duelGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Tokens.spacing.sm,
    backgroundColor: Tokens.colors.surfaceMuted,
    borderRadius: Tokens.radii.card,
    paddingHorizontal: Tokens.spacing.base,
  },
  duelTeamLeft: {
    flex: 1,
    gap: 2,
  },
  duelTeamRight: {
    flex: 1,
    gap: 2,
    alignItems: 'flex-end',
  },
  duelRoleLabel: {
    ...Typography.labelSm,
    color: Tokens.colors.textMuted,
    fontSize: Tokens.fontSize.xs,
  },
  duelTeamName: {
    ...Typography.headlineSm,
    color: Tokens.colors.text,
  },
  duelRatingText: {
    ...Typography.bodySm,
    color: Tokens.colors.textMuted,
  },
  duelVsCenter: {
    paddingHorizontal: Tokens.spacing.base,
    alignItems: 'center',
    gap: 2,
  },
  vsCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Tokens.colors.surface,
    borderWidth: 1,
    borderColor: Tokens.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vsText: {
    ...Typography.labelSm,
    color: Tokens.colors.text,
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
  },
  vsSubtext: {
    ...Typography.labelSm,
    color: Tokens.colors.textMuted,
    fontSize: Tokens.fontSize.xs,
  },
  challengeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Tokens.spacing.sm,
    paddingTop: Tokens.spacing.xs,
  },
  challengeStatusInfo: {
    gap: 2,
  },
  confirmedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  confirmedText: {
    ...Typography.bodySm,
    color: Tokens.colors.greenText,
  },
  feeBreakdownText: {
    ...Typography.bodySm,
    color: Tokens.colors.textMuted,
  },
  feeHighlight: {
    color: Tokens.colors.text,
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
  },
  challengeActionsRow: {
    flexDirection: 'row',
    gap: Tokens.spacing.sm,
  },
});
