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
import { PadelBrand } from '@/constants/theme';
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
      '🇬🇭 *PADEL GHANA — AMERICANO LEADERBOARD* 🇬🇭',
      `🎾 *${title}*`,
      `📍 Venue: ${venueName}`,
      `🔄 Round ${currentRound} of ${totalRounds} | Target: ${pointTarget} pts`,
      '',
      '🏆 *STANDINGS*:',
    ];

    leaderboard.forEach((p) => {
      const diff = p.pointDifference > 0 ? `+${p.pointDifference}` : `${p.pointDifference}`;
      lines.push(`${p.rank}. *${p.name}* — ${p.points} pts (${diff})`);
    });

    lines.push('', 'Play. Connect. Compete. 🇬🇭', 'https://padelghana.com');

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
            <Text style={styles.venueText}>📍 {venueName}</Text>
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
                  <Text style={styles.reportedText}>✓ REPORTED</Text>
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
                    {match.teamAScore} — {match.teamBScore}
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
            >
              <Text
                style={[
                  styles.enterScoreBtnText,
                  match.status === 'SCORE_ENTERED' && { color: '#CBD5E1' },
                ]}
              >
                {match.status === 'SCORE_ENTERED' ? 'Edit Score' : '⚡ Enter Score'}
              </Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* Sit-outs indicator */}
        {sitOuts.length > 0 && (
          <View style={styles.sitOutCard}>
            <Text style={styles.sitOutTitle}>🛋️ Resting This Round</Text>
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
            >
              <Text style={styles.whatsAppBtnText}>📲 Share to WhatsApp</Text>
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
                  row.rank === 1 && { backgroundColor: '#1A2520' },
                ]}
              >
                <Text
                  style={[
                    styles.rankNum,
                    row.rank === 1 && { color: PadelBrand.gold, fontWeight: '800' },
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
                      ? { color: PadelBrand.electricGreen }
                      : row.pointDifference < 0
                      ? { color: '#EF4444' }
                      : { color: '#94A3B8' },
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
        >
          <Text
            style={[
              styles.nextRoundBtnText,
              !allReported && { color: '#64748B' },
            ]}
          >
            {allReported ? 'Generate Next Round →' : 'Waiting for all courts to report...'}
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
    backgroundColor: PadelBrand.charcoal,
  },
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  eventTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  venueText: {
    color: '#94A3B8',
    fontSize: 14,
    marginTop: 2,
  },
  offlineBadge: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  offlineText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  roundBanner: {
    backgroundColor: PadelBrand.cardDark,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: PadelBrand.borderDark,
  },
  roundLabel: {
    color: PadelBrand.electricGreen,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  roundValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 2,
  },
  pointBadge: {
    backgroundColor: '#1E2924',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2D3E36',
  },
  pointBadgeText: {
    color: PadelBrand.gold,
    fontSize: 13,
    fontWeight: '800',
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 12,
  },
  courtCard: {
    backgroundColor: PadelBrand.cardDark,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: PadelBrand.borderDark,
  },
  courtHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  courtNum: {
    color: PadelBrand.electricGreen,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
  },
  reportedBadge: {
    backgroundColor: '#133E2B',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  reportedText: {
    color: PadelBrand.electricGreen,
    fontSize: 11,
    fontWeight: '700',
  },
  inProgressBadge: {
    backgroundColor: '#372E15',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  inProgressText: {
    color: PadelBrand.gold,
    fontSize: 11,
    fontWeight: '700',
  },
  matchTeamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  teamCol: {
    flex: 1,
  },
  teamTitle: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  teamNames: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  scoreContainer: {
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  finalScore: {
    color: PadelBrand.electricGreen,
    fontSize: 22,
    fontWeight: '800',
  },
  vsText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '700',
  },
  enterScoreBtn: {
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitScoreBtn: {
    backgroundColor: PadelBrand.electricGreen,
  },
  editScoreBtn: {
    backgroundColor: '#202825',
    borderWidth: 1,
    borderColor: '#2F3C37',
  },
  enterScoreBtnText: {
    color: '#0B0F0E',
    fontSize: 15,
    fontWeight: '700',
  },
  sitOutCard: {
    backgroundColor: '#1E2421',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2A3530',
  },
  sitOutTitle: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  sitOutNames: {
    color: PadelBrand.gold,
    fontSize: 13,
    fontWeight: '600',
  },
  leaderboardSection: {
    marginTop: 8,
    marginBottom: 20,
  },
  leaderboardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  whatsAppBtn: {
    backgroundColor: '#1D3B2E',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  whatsAppBtnText: {
    color: PadelBrand.electricGreen,
    fontSize: 12,
    fontWeight: '700',
  },
  tableCard: {
    backgroundColor: PadelBrand.cardDark,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PadelBrand.borderDark,
    overflow: 'hidden',
  },
  tableHead: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#121715',
    borderBottomWidth: 1,
    borderBottomColor: PadelBrand.borderDark,
  },
  th: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
  },
  tableRow: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1A221E',
  },
  rankNum: {
    width: 32,
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '700',
  },
  playerName: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  playerPts: {
    width: 44,
    textAlign: 'right',
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  playerDiff: {
    width: 44,
    textAlign: 'right',
    fontSize: 13,
    fontWeight: '600',
  },
  nextRoundBtn: {
    backgroundColor: PadelBrand.electricGreen,
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  nextRoundBtnDisabled: {
    backgroundColor: '#1E2623',
  },
  nextRoundBtnText: {
    color: '#0B0F0E',
    fontSize: 16,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: PadelBrand.charcoal,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    borderTopWidth: 1,
    borderColor: PadelBrand.borderDark,
  },
});
