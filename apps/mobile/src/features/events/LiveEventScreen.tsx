import React, { useState } from 'react';
import {
  Modal,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useKeepAwake } from 'expo-keep-awake';
import { MapPin, Share2, Zap, Trophy, Clock } from 'lucide-react-native';
import { Tokens, Typography, useResponsiveLayout } from '@/constants/theme';
import { ScoreStepper } from './ScoreStepper';

export interface MatchItem {
  id: string;
  courtNumber: number;
  teamANames: [string, string];
  teamBNames: [string, string];
  teamAScore?: number | null;
  teamBScore?: number | null;
  status: 'SCHEDULED' | 'SCORE_ENTERED';
}

export interface LeaderboardRow {
  rank: number;
  name: string;
  points: number;
  pointDifference: number;
  sitOuts: number;
}

export interface LiveEventProps {
  title: string;
  venueName: string;
  currentRound: number;
  totalRounds: number;
  pointTarget: number;
  matches: MatchItem[];
  sitOuts: string[];
  leaderboard: LeaderboardRow[];
  isOffline?: boolean;
  onScoreSubmitted: (matchId: string, scoreA: number, scoreB: number) => void;
  onGenerateNextRound: () => void;
}

export function LiveEventScreen({
  title,
  venueName,
  currentRound,
  totalRounds,
  pointTarget = 24,
  matches,
  sitOuts,
  leaderboard,
  isOffline = false,
  onScoreSubmitted,
  onGenerateNextRound,
}: LiveEventProps) {
  // Keep screen on courtside
  useKeepAwake();

  const { isDesktop, margin, gutter, maxContentWidth } = useResponsiveLayout();
  const [activeMatch, setActiveMatch] = useState<MatchItem | null>(null);

  const allReported = matches.length > 0 && matches.every((m) => m.status === 'SCORE_ENTERED');

  const handleShareToWhatsApp = async () => {
    const lines = [
      '*PADEL GHANA — AMERICANO LEADERBOARD*',
      `*${title}*`,
      `Venue: ${venueName}`,
      `Round ${currentRound} of ${totalRounds} | Target: ${pointTarget} pts`,
      '',
      '*STANDINGS*:',
    ];

    leaderboard.forEach((p) => {
      const diff = p.pointDifference > 0 ? `+${p.pointDifference}` : `${p.pointDifference}`;
      lines.push(`${p.rank}. *${p.name}* - ${p.points} pts (${diff})`);
    });

    lines.push('', 'Play. Connect. Compete.', 'https://padelghana.com');

    const message = lines.join('\n');
    try {
      await Share.share({
        message,
        title: `${title} Results`,
      });
    } catch {
      // OS Share dismiss ignored
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={[
          styles.container,
          {
            paddingHorizontal: margin,
            maxWidth: maxContentWidth,
            gap: gutter,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Bar */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.eventTitle}>{title}</Text>
            <View style={styles.venueRow}>
              <MapPin size={14} color={Tokens.colors.live.textMuted} strokeWidth={1.75} />
              <Text style={styles.venueText}>{venueName}</Text>
            </View>
          </View>
          {isOffline && (
            <View style={styles.offlineBadge}>
              <View style={styles.offlinePulseDot} />
              <Text style={styles.offlineText}>OFFLINE MODE</Text>
            </View>
          )}
        </View>

        {/* Round Progress Banner */}
        <View style={styles.roundBanner}>
          <View style={styles.roundInfo}>
            <View style={styles.roundLabelRow}>
              <Text style={styles.roundLabel}>CURRENT ROUND</Text>
              <View style={styles.roundDot} />
              <Clock size={12} color={Tokens.colors.live.primary} strokeWidth={1.75} />
              <Text style={[styles.roundTimerText, Typography.tabularNums]}>Live</Text>
            </View>
            <Text style={[styles.roundValue, Typography.tabularNums]}>
              Round {currentRound} of {totalRounds}
            </Text>
          </View>
          <View style={styles.pointBadge}>
            <Text style={[styles.pointBadgeText, Typography.tabularNums]}>
              {pointTarget} PTS TARGET
            </Text>
          </View>
        </View>

        {/* Responsive Dual Column for Desktop or Stacking for Mobile */}
        <View style={isDesktop ? styles.desktopColumnsRow : styles.mobileColumnsCol}>
          {/* Left Column: Courtside Matches */}
          <View style={isDesktop ? styles.desktopLeftCol : styles.fullWidthCol}>
            <Text style={styles.sectionTitle}>Courtside Matches</Text>
            {matches.map((match) => (
              <View key={match.id} style={styles.courtCard}>
                <View style={styles.courtHeader}>
                  <Text style={styles.courtNum}>COURT {match.courtNumber}</Text>
                  {match.status === 'SCORE_ENTERED' ? (
                    <View style={styles.reportedBadge}>
                      <Text style={styles.reportedText}>REPORTED</Text>
                    </View>
                  ) : (
                    <View style={styles.inProgressBadge}>
                      <Text style={styles.inProgressText}>LIVE</Text>
                    </View>
                  )}
                </View>

                <View style={styles.matchTeamsRow}>
                  <View style={styles.teamCol}>
                    <Text style={styles.teamTitle}>Team A</Text>
                    <Text style={styles.teamNames}>
                      {match.teamANames[0]} & {match.teamANames[1]}
                    </Text>
                  </View>

                  <View style={styles.scoreContainer}>
                    {match.status === 'SCORE_ENTERED' ? (
                      <Text style={[styles.finalScore, Typography.tabularNums]}>
                        {match.teamAScore} - {match.teamBScore}
                      </Text>
                    ) : (
                      <Text style={styles.vsText}>VS</Text>
                    )}
                  </View>

                  <View style={[styles.teamCol, { alignItems: 'flex-end' }]}>
                    <Text style={styles.teamTitle}>Team B</Text>
                    <Text style={[styles.teamNames, { textAlign: 'right' }]}>
                      {match.teamBNames[0]} & {match.teamBNames[1]}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[
                    styles.enterScoreBtn,
                    match.status === 'SCORE_ENTERED' ? styles.editScoreBtn : styles.submitScoreBtn,
                  ]}
                  onPress={() => setActiveMatch(match)}
                  accessibilityRole="button"
                  accessibilityLabel={match.status === 'SCORE_ENTERED' ? 'Edit Score' : 'Enter Score'}
                  activeOpacity={0.85}
                >
                  <View style={styles.btnInnerRow}>
                    {match.status !== 'SCORE_ENTERED' && (
                      <Zap size={16} color={Tokens.colors.live.primaryForeground} strokeWidth={2} />
                    )}
                    <Text
                      style={[
                        styles.enterScoreBtnText,
                        match.status === 'SCORE_ENTERED' && { color: Tokens.colors.live.textMuted },
                      ]}
                    >
                      {match.status === 'SCORE_ENTERED' ? 'Edit Score' : 'Enter Score'}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            ))}

            {/* Sit-outs indicator */}
            {sitOuts.length > 0 && (
              <View style={styles.sitOutCard}>
                <Text style={styles.sitOutTitle}>Resting This Round</Text>
                <Text style={styles.sitOutNames}>{sitOuts.join(' • ')}</Text>
              </View>
            )}
          </View>

          {/* Right Column: Live Leaderboard */}
          <View style={isDesktop ? styles.desktopRightCol : styles.fullWidthCol}>
            <View style={styles.leaderboardSection}>
              <View style={styles.leaderboardHeader}>
                <View style={styles.leaderboardTitleRow}>
                  <Trophy size={16} color={Tokens.colors.live.gold} strokeWidth={1.75} />
                  <Text style={styles.sectionTitle}>Live Leaderboard</Text>
                </View>
                <TouchableOpacity
                  style={styles.whatsAppBtn}
                  onPress={handleShareToWhatsApp}
                  accessibilityRole="button"
                  accessibilityLabel="Share to WhatsApp"
                  activeOpacity={0.85}
                >
                  <View style={styles.btnInnerRow}>
                    <Share2 size={14} color={Tokens.colors.live.primary} strokeWidth={1.75} />
                    <Text style={styles.whatsAppBtnText}>Share Standings</Text>
                  </View>
                </TouchableOpacity>
              </View>

              <View style={styles.tableCard}>
                <View style={styles.tableHead}>
                  <Text style={[styles.th, { width: 32 }]}>#</Text>
                  <Text style={[styles.th, { flex: 1 }]}>Player</Text>
                  <Text style={[styles.th, { width: 48, textAlign: 'right' }]}>Pts</Text>
                  <Text style={[styles.th, { width: 48, textAlign: 'right' }]}>+/-</Text>
                </View>

                {leaderboard.map((row) => (
                  <View
                    key={row.name}
                    style={[
                      styles.tableRow,
                      row.rank === 1 && { backgroundColor: Tokens.colors.live.surfaceMuted },
                    ]}
                  >
                    <View style={styles.rankContainer}>
                      {row.rank === 1 ? (
                        <View style={styles.rankOneBadge}>
                          <Text style={[styles.rankOneText, Typography.tabularNums]}>1</Text>
                        </View>
                      ) : (
                        <Text style={[styles.rankNum, Typography.tabularNums]}>{row.rank}</Text>
                      )}
                    </View>
                    <Text style={styles.playerName} numberOfLines={1}>
                      {row.name}
                    </Text>
                    <Text style={[styles.playerPts, Typography.tabularNums]}>{row.points}</Text>
                    <Text
                      style={[
                        styles.playerDiff,
                        Typography.tabularNums,
                        row.pointDifference > 0
                          ? { color: Tokens.colors.live.primary }
                          : row.pointDifference < 0
                          ? { color: Tokens.colors.live.error }
                          : { color: Tokens.colors.live.textMuted },
                      ]}
                    >
                      {row.pointDifference > 0 ? `+${row.pointDifference}` : row.pointDifference}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Next Round Button */}
            <TouchableOpacity
              style={[
                styles.nextRoundBtn,
                !allReported && styles.nextRoundBtnDisabled,
              ]}
              disabled={!allReported}
              onPress={onGenerateNextRound}
              accessibilityRole="button"
              accessibilityLabel="Generate Next Round"
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.nextRoundBtnText,
                  !allReported && { color: Tokens.colors.live.textMuted },
                ]}
              >
                {allReported ? 'Generate Next Round' : 'Waiting for all courts to report...'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Courtside Modal Stepper */}
      <Modal
        visible={!!activeMatch}
        animationType="slide"
        transparent
        onRequestClose={() => setActiveMatch(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            {activeMatch && (
              <ScoreStepper
                teamANames={activeMatch.teamANames}
                teamBNames={activeMatch.teamBNames}
                pointTarget={pointTarget}
                initialScoreA={activeMatch.teamAScore ?? pointTarget / 2}
                onSubmit={(sA, sB) => {
                  onScoreSubmitted(activeMatch.id, sA, sB);
                  setActiveMatch(null);
                }}
                onCancel={() => setActiveMatch(null)}
              />
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Tokens.colors.live.background,
  },
  container: {
    paddingVertical: Tokens.spacing.base,
    paddingBottom: Tokens.spacing.xxxl + 32,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
  },
  eventTitle: {
    color: Tokens.colors.live.text,
    fontSize: Tokens.fontSize.xl,
    lineHeight: Tokens.lineHeight.xl,
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
  },
  venueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.xs,
    marginTop: Tokens.spacing.xs,
  },
  venueText: {
    color: Tokens.colors.live.textMuted,
    fontSize: Tokens.fontSize.sm,
    lineHeight: Tokens.lineHeight.sm,
    fontFamily: Typography.fontFamily.regular,
    fontWeight: Tokens.fontWeight.regular,
  },
  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.xs,
    backgroundColor: Tokens.colors.live.errorBackground,
    paddingHorizontal: Tokens.spacing.sm,
    paddingVertical: Tokens.spacing.xs,
    borderRadius: Tokens.radii.chip,
    borderWidth: Tokens.borders.width,
    borderColor: Tokens.colors.live.errorBorder,
  },
  offlinePulseDot: {
    width: 6,
    height: 6,
    borderRadius: Tokens.radii.pill,
    backgroundColor: Tokens.colors.live.error,
  },
  offlineText: {
    color: Tokens.colors.live.errorText,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
  },
  roundBanner: {
    backgroundColor: Tokens.colors.live.surface,
    borderRadius: Tokens.radii.card,
    padding: Tokens.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: Tokens.borders.width,
    borderColor: Tokens.colors.live.border,
  },
  roundInfo: {
    flex: 1,
  },
  roundLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.xs,
  },
  roundLabel: {
    color: Tokens.colors.live.primary,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
  },
  roundDot: {
    width: 3,
    height: 3,
    borderRadius: Tokens.radii.pill,
    backgroundColor: Tokens.colors.live.textMuted,
  },
  roundTimerText: {
    color: Tokens.colors.live.primary,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Tokens.fontWeight.medium,
  },
  roundValue: {
    color: Tokens.colors.live.text,
    fontSize: Tokens.fontSize.lg,
    lineHeight: Tokens.lineHeight.lg,
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    marginTop: Tokens.spacing.xs,
  },
  pointBadge: {
    backgroundColor: Tokens.colors.live.goldBackground,
    paddingHorizontal: Tokens.spacing.md,
    paddingVertical: Tokens.spacing.xs,
    borderRadius: Tokens.radii.chip,
    borderWidth: Tokens.borders.width,
    borderColor: Tokens.colors.live.border,
  },
  pointBadgeText: {
    color: Tokens.colors.live.gold,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
  },
  desktopColumnsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Tokens.spacing.base,
  },
  mobileColumnsCol: {
    flexDirection: 'column',
    gap: Tokens.spacing.base,
  },
  desktopLeftCol: {
    flex: 3,
    gap: Tokens.spacing.sm,
  },
  desktopRightCol: {
    flex: 2,
    gap: Tokens.spacing.sm,
  },
  fullWidthCol: {
    width: '100%',
    gap: Tokens.spacing.sm,
  },
  sectionTitle: {
    color: Tokens.colors.live.text,
    fontSize: Tokens.fontSize.base,
    lineHeight: Tokens.lineHeight.base,
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
  },
  courtCard: {
    backgroundColor: Tokens.colors.live.surface,
    borderRadius: Tokens.radii.card,
    padding: Tokens.spacing.md,
    borderWidth: Tokens.borders.width,
    borderColor: Tokens.colors.live.border,
    gap: Tokens.spacing.sm,
  },
  courtHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  courtNum: {
    color: Tokens.colors.live.primary,
    fontSize: Tokens.fontSize.sm,
    lineHeight: Tokens.lineHeight.sm,
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
  },
  reportedBadge: {
    backgroundColor: Tokens.colors.live.successBackground,
    paddingHorizontal: Tokens.spacing.sm,
    paddingVertical: Tokens.spacing.xs,
    borderRadius: Tokens.radii.chip,
  },
  reportedText: {
    color: Tokens.colors.live.primary,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
  },
  inProgressBadge: {
    backgroundColor: Tokens.colors.live.goldBackground,
    paddingHorizontal: Tokens.spacing.sm,
    paddingVertical: Tokens.spacing.xs,
    borderRadius: Tokens.radii.chip,
  },
  inProgressText: {
    color: Tokens.colors.live.gold,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
  },
  matchTeamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Tokens.spacing.xs,
  },
  teamCol: {
    flex: 1,
  },
  teamTitle: {
    color: Tokens.colors.live.textMuted,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Tokens.fontWeight.medium,
    marginBottom: Tokens.spacing.xs,
  },
  teamNames: {
    color: Tokens.colors.live.text,
    fontSize: Tokens.fontSize.sm,
    lineHeight: Tokens.lineHeight.sm,
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Tokens.fontWeight.medium,
  },
  scoreContainer: {
    paddingHorizontal: Tokens.spacing.sm,
    alignItems: 'center',
  },
  finalScore: {
    color: Tokens.colors.live.primary,
    fontSize: Tokens.fontSize.xl,
    lineHeight: Tokens.lineHeight.xl,
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
  },
  vsText: {
    color: Tokens.colors.live.textMuted,
    fontSize: Tokens.fontSize.sm,
    lineHeight: Tokens.lineHeight.sm,
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
  },
  enterScoreBtn: {
    minHeight: Tokens.touch.minTarget,
    borderRadius: Tokens.radii.button,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Tokens.spacing.md,
    paddingVertical: Tokens.spacing.xs,
  },
  submitScoreBtn: {
    backgroundColor: Tokens.colors.live.primary,
  },
  editScoreBtn: {
    backgroundColor: Tokens.colors.live.surfaceMuted,
    borderWidth: Tokens.borders.width,
    borderColor: Tokens.colors.live.border,
  },
  btnInnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.xs,
  },
  enterScoreBtnText: {
    color: Tokens.colors.live.primaryForeground,
    fontSize: Tokens.fontSize.sm,
    lineHeight: Tokens.lineHeight.sm,
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
  },
  sitOutCard: {
    backgroundColor: Tokens.colors.live.surfaceMuted,
    borderRadius: Tokens.radii.card,
    padding: Tokens.spacing.sm,
    borderWidth: Tokens.borders.width,
    borderColor: Tokens.colors.live.border,
    gap: Tokens.spacing.xs,
  },
  sitOutTitle: {
    color: Tokens.colors.live.textMuted,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
  },
  sitOutNames: {
    color: Tokens.colors.live.gold,
    fontSize: Tokens.fontSize.sm,
    lineHeight: Tokens.lineHeight.sm,
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Tokens.fontWeight.medium,
  },
  leaderboardSection: {
    gap: Tokens.spacing.sm,
  },
  leaderboardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leaderboardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.xs,
  },
  whatsAppBtn: {
    backgroundColor: Tokens.colors.live.surfaceMuted,
    paddingHorizontal: Tokens.spacing.sm,
    minHeight: Tokens.touch.minTarget,
    justifyContent: 'center',
    borderRadius: Tokens.radii.button,
    borderWidth: Tokens.borders.width,
    borderColor: Tokens.colors.live.border,
  },
  whatsAppBtnText: {
    color: Tokens.colors.live.primary,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
  },
  tableCard: {
    backgroundColor: Tokens.colors.live.surface,
    borderRadius: Tokens.radii.card,
    borderWidth: Tokens.borders.width,
    borderColor: Tokens.colors.live.border,
    overflow: 'hidden',
  },
  tableHead: {
    flexDirection: 'row',
    paddingHorizontal: Tokens.spacing.sm,
    paddingVertical: Tokens.spacing.sm,
    backgroundColor: Tokens.colors.live.surfaceMuted,
    borderBottomWidth: Tokens.borders.width,
    borderBottomColor: Tokens.colors.live.border,
  },
  th: {
    color: Tokens.colors.live.textMuted,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
  },
  tableRow: {
    flexDirection: 'row',
    paddingHorizontal: Tokens.spacing.sm,
    minHeight: Tokens.touch.minTarget,
    alignItems: 'center',
    borderBottomWidth: Tokens.borders.width,
    borderBottomColor: Tokens.colors.live.border,
  },
  rankContainer: {
    width: 32,
    alignItems: 'flex-start',
  },
  rankOneBadge: {
    width: 20,
    height: 20,
    borderRadius: Tokens.radii.xs,
    backgroundColor: Tokens.colors.live.goldBackground,
    borderWidth: 1,
    borderColor: Tokens.colors.live.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankOneText: {
    color: Tokens.colors.live.gold,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
  },
  rankNum: {
    color: Tokens.colors.live.textMuted,
    fontSize: Tokens.fontSize.sm,
    lineHeight: Tokens.lineHeight.sm,
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
  },
  playerName: {
    flex: 1,
    color: Tokens.colors.live.text,
    fontSize: Tokens.fontSize.sm,
    lineHeight: Tokens.lineHeight.sm,
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Tokens.fontWeight.medium,
  },
  playerPts: {
    width: 48,
    textAlign: 'right',
    color: Tokens.colors.live.text,
    fontSize: Tokens.fontSize.sm,
    lineHeight: Tokens.lineHeight.sm,
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
  },
  playerDiff: {
    width: 48,
    textAlign: 'right',
    fontSize: Tokens.fontSize.sm,
    lineHeight: Tokens.lineHeight.sm,
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Tokens.fontWeight.medium,
  },
  nextRoundBtn: {
    backgroundColor: Tokens.colors.live.primary,
    minHeight: Tokens.touch.minTarget,
    height: 48,
    borderRadius: Tokens.radii.button,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Tokens.spacing.xs,
  },
  nextRoundBtnDisabled: {
    backgroundColor: Tokens.colors.live.surfaceMuted,
  },
  nextRoundBtnText: {
    color: Tokens.colors.live.primaryForeground,
    fontSize: Tokens.fontSize.base,
    lineHeight: Tokens.lineHeight.base,
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Tokens.colors.live.background,
    borderTopLeftRadius: Tokens.radii.card,
    borderTopRightRadius: Tokens.radii.card,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    borderTopWidth: Tokens.borders.width,
    borderColor: Tokens.colors.live.border,
  },
});
