import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useKeepAwake } from 'expo-keep-awake';
import { PadelBrand, Colors } from '@/constants/theme';

interface MatchItem {
  id: string;
  court_number: number;
  team_a_p1: string;
  team_a_p2: string;
  team_b_p1: string;
  team_b_p2: string;
  team_a_score: number | null;
  team_b_score: number | null;
  status: string;
}

interface LeaderboardItem {
  rank: number;
  player_name: string;
  total_points: number;
  games_played: number;
  point_difference: number;
}

interface LiveEventData {
  event_id: string;
  title: string;
  format: string;
  status: string;
  current_round: number;
  total_rounds: number;
  matches: MatchItem[];
  leaderboard: LeaderboardItem[];
}

interface EventDisplayScreenProps {
  eventId: string;
  apiBaseUrl?: string;
}

export function EventDisplayScreen({
  eventId,
  apiBaseUrl = 'http://localhost:8000',
}: EventDisplayScreenProps) {
  // Prevent tablet or TV from sleeping
  useKeepAwake();

  const [liveData, setLiveData] = useState<LiveEventData | null>(null);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const res = await fetch(`${apiBaseUrl}/events/${eventId}/live`);
        if (res.ok && isMounted) {
          const data = await res.json();
          setLiveData(data);
          setIsReconnecting(false);
          setLastUpdated(new Date());
        } else if (isMounted) {
          setIsReconnecting(true);
        }
      } catch {
        if (isMounted) {
          setIsReconnecting(true);
        }
      }
    };

    // Initial fetch
    void loadData();

    // 10-second polling fallback guarantees recovery after power cut / server reboot
    const pollInterval = setInterval(() => {
      void loadData();
    }, 10000);

    // If on Web, also attach EventSource SSE with auto-retry
    let eventSource: EventSource | null = null;
    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'EventSource' in window) {
      try {
        eventSource = new EventSource(`${apiBaseUrl}/events/${eventId}/stream`);
        eventSource.onmessage = (event) => {
          try {
            const parsed = JSON.parse(event.data);
            if (parsed.event_id && isMounted) {
              setLiveData(parsed);
              setIsReconnecting(false);
              setLastUpdated(new Date());
            }
          } catch {
            // keepalive or non-json chunk
          }
        };
        eventSource.onerror = () => {
          if (isMounted) {
            setIsReconnecting(true);
          }
        };
      } catch {
        // Fallback polling will handle it
      }
    }

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [eventId, apiBaseUrl]);

  if (!liveData && isReconnecting) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={PadelBrand.electricGreen} />
        <Text style={styles.reconnectingText}>Connecting to Court Display...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Top Header Bar */}
      <View style={styles.header}>
        <View>
          <Text style={styles.eventTitle}>{liveData?.title ?? 'Padel Tournament'}</Text>
          <Text style={styles.eventSubtitle}>
            {liveData?.format ?? 'AMERICANO'} • Round {liveData?.current_round ?? 1} of{' '}
            {liveData?.total_rounds ?? 8}
          </Text>
        </View>

        <View style={styles.statusBadgeRow}>
          {isReconnecting && (
            <View style={styles.reconnectingBadge}>
              <Text style={styles.reconnectingBadgeText}>RECONNECTING</Text>
            </View>
          )}
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveBadgeText}>LIVE TV</Text>
          </View>
        </View>
      </View>

      {/* Courts & Leaderboard Grid */}
      <View style={styles.grid}>
        {/* Left Column: Active Courts */}
        <View style={styles.column}>
          <Text style={styles.sectionHeader}>Active Courts</Text>
          {liveData?.matches.map((m) => (
            <View key={m.id} style={styles.matchCard}>
              <View style={styles.courtHeader}>
                <Text style={styles.courtName}>COURT {m.court_number}</Text>
                <Text style={styles.matchStatus}>{m.status}</Text>
              </View>

              <View style={styles.matchRow}>
                <View style={styles.teamBox}>
                  <Text style={styles.playerText}>{m.team_a_p1}</Text>
                  <Text style={styles.playerText}>{m.team_a_p2}</Text>
                </View>

                <View style={styles.scoreBox}>
                  <Text style={styles.scoreText}>
                    {m.team_a_score !== null ? m.team_a_score : '-'}
                  </Text>
                  <Text style={styles.vsText}>vs</Text>
                  <Text style={styles.scoreText}>
                    {m.team_b_score !== null ? m.team_b_score : '-'}
                  </Text>
                </View>

                <View style={[styles.teamBox, styles.teamRight]}>
                  <Text style={styles.playerText}>{m.team_b_p1}</Text>
                  <Text style={styles.playerText}>{m.team_b_p2}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Right Column: High-Contrast Standings */}
        <View style={styles.column}>
          <Text style={styles.sectionHeader}>Leaderboard</Text>
          <View style={styles.leaderboardTable}>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.tableHeaderCell, styles.rankCol]}>#</Text>
              <Text style={[styles.tableHeaderCell, styles.nameCol]}>PLAYER</Text>
              <Text style={[styles.tableHeaderCell, styles.statCol]}>PTS</Text>
              <Text style={[styles.tableHeaderCell, styles.statCol]}>DIFF</Text>
            </View>

            {liveData?.leaderboard.map((row, index) => {
              const isPodium = index < 3;
              return (
                <View
                  key={row.player_name + index}
                  style={[
                    styles.tableRow,
                    isPodium && styles.podiumRow,
                    index % 2 === 1 && styles.alternateRow,
                  ]}
                >
                  <Text
                    style={[
                      styles.rankText,
                      isPodium && styles.podiumRankText,
                      styles.rankCol,
                    ]}
                  >
                    {index + 1}
                  </Text>
                  <Text
                    style={[styles.nameText, isPodium && styles.podiumNameText, styles.nameCol]}
                    numberOfLines={1}
                  >
                    {row.player_name}
                  </Text>
                  <Text style={[styles.pointsText, styles.statCol]}>{row.total_points}</Text>
                  <Text style={[styles.diffText, styles.statCol]}>
                    {row.point_difference > 0 ? `+${row.point_difference}` : row.point_difference}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>

      {/* Footer bar */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Padel Ghana • Auto-refreshes • Last sync: {lastUpdated.toLocaleTimeString()}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PadelBrand.charcoal,
  },
  content: {
    padding: 24,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: PadelBrand.charcoal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reconnectingText: {
    color: Colors.dark.textSecondary,
    fontSize: 16,
    marginTop: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: PadelBrand.borderDark,
    paddingBottom: 20,
    marginBottom: 24,
  },
  eventTitle: {
    color: Colors.dark.text,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  eventSubtitle: {
    color: PadelBrand.electricGreen,
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
  },
  statusBadgeRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  reconnectingBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  reconnectingBadgeText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '700',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 200, 83, 0.15)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: PadelBrand.electricGreen,
  },
  liveBadgeText: {
    color: PadelBrand.electricGreen,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  grid: {
    flexDirection: 'row',
    gap: 24,
  },
  column: {
    flex: 1,
  },
  sectionHeader: {
    color: Colors.dark.textSecondary,
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 14,
  },
  matchCard: {
    backgroundColor: PadelBrand.cardDark,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: PadelBrand.borderDark,
    marginBottom: 16,
  },
  courtHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  courtName: {
    color: PadelBrand.gold,
    fontSize: 13,
    fontWeight: '700',
  },
  matchStatus: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  teamBox: {
    flex: 2,
    gap: 4,
  },
  teamRight: {
    alignItems: 'flex-end',
  },
  playerText: {
    color: Colors.dark.text,
    fontSize: 16,
    fontWeight: '600',
  },
  scoreBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
  },
  scoreText: {
    color: PadelBrand.electricGreen,
    fontSize: 22,
    fontWeight: '800',
  },
  vsText: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
  },
  leaderboardTable: {
    backgroundColor: PadelBrand.cardDark,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: PadelBrand.borderDark,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderColor: PadelBrand.borderDark,
  },
  tableHeaderCell: {
    color: Colors.dark.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: PadelBrand.borderDark,
  },
  alternateRow: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  podiumRow: {
    backgroundColor: 'rgba(244, 196, 48, 0.04)',
  },
  rankCol: {
    width: 32,
  },
  nameCol: {
    flex: 1,
  },
  statCol: {
    width: 50,
    textAlign: 'right',
  },
  rankText: {
    color: Colors.dark.textSecondary,
    fontSize: 15,
    fontWeight: '700',
  },
  podiumRankText: {
    color: PadelBrand.gold,
  },
  nameText: {
    color: Colors.dark.text,
    fontSize: 15,
    fontWeight: '600',
  },
  podiumNameText: {
    color: Colors.dark.text,
    fontWeight: '700',
  },
  pointsText: {
    color: PadelBrand.electricGreen,
    fontSize: 16,
    fontWeight: '800',
  },
  diffText: {
    color: Colors.dark.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderColor: PadelBrand.borderDark,
    alignItems: 'center',
  },
  footerText: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
  },
});
