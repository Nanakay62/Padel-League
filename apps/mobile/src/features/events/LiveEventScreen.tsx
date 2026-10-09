import React, { useState } from 'react';
import {
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useKeepAwake } from 'expo-keep-awake';
import { MapPin, Share2, Zap } from 'lucide-react-native';
import { Tokens } from '@/constants/theme';
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
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header Bar */}
        <View style={styles.header}>
          <View>
            <Text style={styles.eventTitle}>{title}</Text>
            <View style={styles.venueRow}>
              <MapPin size={14} color={Tokens.colors.live.textMuted} />
              <Text style={styles.venueText}>{venueName}</Text>
            </View>
          </View>
          {isOffline && (
            <View style={styles.offlineBadge}>
              <Text style={styles.offlineText}>OFFLINE MODE</Text>
            </View>
          )}
        </View>

        {/* Round Progress Banner */}
        <View style={styles.roundBanner}>
          <View>
            <Text style={styles.roundLabel}>CURRENT ROUND</Text>
            <Text style={styles.roundValue}>
              Round {currentRound} of {totalRounds}
            </Text>
          </View>
          <View style={styles.pointBadge}>
            <Text style={styles.pointBadgeText}>{pointTarget} PTS</Text>
          </View>
        </View>

        {/* Court Matches */}
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
                  <Text style={styles.finalScore}>
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
            >
              <View style={styles.btnInnerRow}>
                {match.status !== 'SCORE_ENTERED' && (
                  <Zap size={16} color={Tokens.colors.live.primaryForeground} />
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

        {/* Leaderboard Table */}
        <View style={styles.leaderboardSection}>
          <View style={styles.leaderboardHeader}>
            <Text style={styles.sectionTitle}>Live Leaderboard</Text>
            <TouchableOpacity
              style={styles.whatsAppBtn}
              onPress={handleShareToWhatsApp}
              accessibilityRole="button"
              accessibilityLabel="Share to WhatsApp"
            >
              <View style={styles.btnInnerRow}>
                <Share2 size={14} color={Tokens.colors.live.primary} />
                <Text style={styles.whatsAppBtnText}>Share Standings</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.tableCard}>
            <View style={styles.tableHead}>
              <Text style={[styles.th, { width: 32 }]}>#</Text>
              <Text style={[styles.th, { flex: 1 }]}>Player</Text>
              <Text style={[styles.th, { width: 44, textAlign: 'right' }]}>Pts</Text>
              <Text style={[styles.th, { width: 44, textAlign: 'right' }]}>+/-</Text>
            </View>

            {leaderboard.map((row) => (
              <View
                key={row.name}
                style={[
                  styles.tableRow,
                  row.rank === 1 && { backgroundColor: Tokens.colors.live.surfaceMuted },
                ]}
              >
                <Text
                  style={[
                    styles.rankNum,
                    row.rank === 1 && { color: Tokens.colors.live.gold, fontWeight: Tokens.fontWeight.semibold },
                  ]}
                >
                  {row.rank}
                </Text>
                <Text style={styles.playerName} numberOfLines={1}>
                  {row.name}
                </Text>
                <Text style={styles.playerPts}>{row.points}</Text>
                <Text
                  style={[
                    styles.playerDiff,
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
    padding: Tokens.spacing.md,
    paddingBottom: Tokens.spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Tokens.spacing.md,
  },
  eventTitle: {
    color: Tokens.colors.live.text,
    fontSize: Tokens.fontSize.xl,
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
  },
  offlineBadge: {
    backgroundColor: Tokens.colors.live.errorBackground,
    paddingHorizontal: Tokens.spacing.sm,
    paddingVertical: Tokens.spacing.xs,
    borderRadius: Tokens.radii.sm,
    borderWidth: Tokens.borders.width,
    borderColor: Tokens.colors.live.errorBorder,
  },
  offlineText: {
    color: Tokens.colors.live.errorText,
    fontSize: Tokens.fontSize.xs,
    fontWeight: Tokens.fontWeight.semibold,
    letterSpacing: 0.5,
  },
  roundBanner: {
    backgroundColor: Tokens.colors.live.surface,
    borderRadius: Tokens.radii.card,
    padding: Tokens.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Tokens.spacing.md,
    borderWidth: Tokens.borders.width,
    borderColor: Tokens.colors.live.border,
  },
  roundLabel: {
    color: Tokens.colors.live.primary,
    fontSize: Tokens.fontSize.xs,
    fontWeight: Tokens.fontWeight.semibold,
    letterSpacing: 1,
  },
  roundValue: {
    color: Tokens.colors.live.text,
    fontSize: Tokens.fontSize.lg,
    fontWeight: Tokens.fontWeight.semibold,
    marginTop: Tokens.spacing.xs,
  },
  pointBadge: {
    backgroundColor: Tokens.colors.live.goldBackground,
    paddingHorizontal: Tokens.spacing.md,
    paddingVertical: Tokens.spacing.xs,
    borderRadius: Tokens.radii.sm,
    borderWidth: Tokens.borders.width,
    borderColor: Tokens.colors.live.border,
  },
  pointBadgeText: {
    color: Tokens.colors.live.gold,
    fontSize: Tokens.fontSize.sm,
    fontWeight: Tokens.fontWeight.semibold,
    fontVariant: ['tabular-nums'],
  },
  sectionTitle: {
    color: Tokens.colors.live.text,
    fontSize: Tokens.fontSize.base,
    fontWeight: Tokens.fontWeight.semibold,
    marginBottom: Tokens.spacing.sm,
  },
  courtCard: {
    backgroundColor: Tokens.colors.live.surface,
    borderRadius: Tokens.radii.card,
    padding: Tokens.spacing.md,
    marginBottom: Tokens.spacing.sm,
    borderWidth: Tokens.borders.width,
    borderColor: Tokens.colors.live.border,
  },
  courtHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Tokens.spacing.sm,
  },
  courtNum: {
    color: Tokens.colors.live.primary,
    fontSize: Tokens.fontSize.sm,
    fontWeight: Tokens.fontWeight.semibold,
    letterSpacing: 1,
  },
  reportedBadge: {
    backgroundColor: Tokens.colors.live.successBackground,
    paddingHorizontal: Tokens.spacing.sm,
    paddingVertical: Tokens.spacing.xs,
    borderRadius: Tokens.radii.sm,
  },
  reportedText: {
    color: Tokens.colors.live.primary,
    fontSize: Tokens.fontSize.xs,
    fontWeight: Tokens.fontWeight.semibold,
  },
  inProgressBadge: {
    backgroundColor: Tokens.colors.live.goldBackground,
    paddingHorizontal: Tokens.spacing.sm,
    paddingVertical: Tokens.spacing.xs,
    borderRadius: Tokens.radii.sm,
  },
  inProgressText: {
    color: Tokens.colors.live.gold,
    fontSize: Tokens.fontSize.xs,
    fontWeight: Tokens.fontWeight.semibold,
  },
  matchTeamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Tokens.spacing.md,
  },
  teamCol: {
    flex: 1,
  },
  teamTitle: {
    color: Tokens.colors.live.textMuted,
    fontSize: Tokens.fontSize.xs,
    fontWeight: Tokens.fontWeight.medium,
    marginBottom: Tokens.spacing.xs,
  },
  teamNames: {
    color: Tokens.colors.live.text,
    fontSize: Tokens.fontSize.sm,
    fontWeight: Tokens.fontWeight.medium,
  },
  scoreContainer: {
    paddingHorizontal: Tokens.spacing.sm,
    alignItems: 'center',
  },
  finalScore: {
    color: Tokens.colors.live.primary,
    fontSize: Tokens.fontSize.xl,
    fontWeight: Tokens.fontWeight.semibold,
    fontVariant: ['tabular-nums'],
  },
  vsText: {
    color: Tokens.colors.live.textMuted,
    fontSize: Tokens.fontSize.sm,
    fontWeight: Tokens.fontWeight.semibold,
  },
  enterScoreBtn: {
    minHeight: Tokens.dimensions.minTouchTarget,
    borderRadius: Tokens.radii.button,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontWeight: Tokens.fontWeight.semibold,
  },
  sitOutCard: {
    backgroundColor: Tokens.colors.live.surfaceMuted,
    borderRadius: Tokens.radii.card,
    padding: Tokens.spacing.sm,
    marginBottom: Tokens.spacing.md,
    borderWidth: Tokens.borders.width,
    borderColor: Tokens.colors.live.border,
  },
  sitOutTitle: {
    color: Tokens.colors.live.textMuted,
    fontSize: Tokens.fontSize.xs,
    fontWeight: Tokens.fontWeight.semibold,
    marginBottom: Tokens.spacing.xs,
  },
  sitOutNames: {
    color: Tokens.colors.live.gold,
    fontSize: Tokens.fontSize.sm,
    fontWeight: Tokens.fontWeight.medium,
  },
  leaderboardSection: {
    marginTop: Tokens.spacing.xs,
    marginBottom: Tokens.spacing.md,
  },
  leaderboardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Tokens.spacing.sm,
  },
  whatsAppBtn: {
    backgroundColor: Tokens.colors.live.surfaceMuted,
    paddingHorizontal: Tokens.spacing.sm,
    minHeight: Tokens.dimensions.minTouchTarget,
    justifyContent: 'center',
    borderRadius: Tokens.radii.button,
    borderWidth: Tokens.borders.width,
    borderColor: Tokens.colors.live.border,
  },
  whatsAppBtnText: {
    color: Tokens.colors.live.primary,
    fontSize: Tokens.fontSize.xs,
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
    fontWeight: Tokens.fontWeight.semibold,
  },
  tableRow: {
    flexDirection: 'row',
    paddingHorizontal: Tokens.spacing.sm,
    minHeight: Tokens.dimensions.minTouchTarget,
    alignItems: 'center',
    borderBottomWidth: Tokens.borders.width,
    borderBottomColor: Tokens.colors.live.border,
  },
  rankNum: {
    width: 32,
    color: Tokens.colors.live.textMuted,
    fontSize: Tokens.fontSize.sm,
    fontWeight: Tokens.fontWeight.semibold,
    fontVariant: ['tabular-nums'],
  },
  playerName: {
    flex: 1,
    color: Tokens.colors.live.text,
    fontSize: Tokens.fontSize.sm,
    fontWeight: Tokens.fontWeight.medium,
  },
  playerPts: {
    width: 44,
    textAlign: 'right',
    color: Tokens.colors.live.text,
    fontSize: Tokens.fontSize.sm,
    fontWeight: Tokens.fontWeight.semibold,
    fontVariant: ['tabular-nums'],
  },
  playerDiff: {
    width: 44,
    textAlign: 'right',
    fontSize: Tokens.fontSize.sm,
    fontWeight: Tokens.fontWeight.medium,
    fontVariant: ['tabular-nums'],
  },
  nextRoundBtn: {
    backgroundColor: Tokens.colors.live.primary,
    minHeight: Tokens.dimensions.minTouchTarget,
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
