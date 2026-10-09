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
import { Tokens, Typography } from '@/constants/theme';
import { Card, StatusPill } from '@/components/ui';

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
  const [, setLastUpdated] = useState<Date>(new Date());

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

    void loadData();

    const pollInterval = setInterval(() => {
      void loadData();
    }, 10000);

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
        <ActivityIndicator size="large" color={Tokens.colors.primary} />
        <Text style={styles.reconnectingText}>Connecting to Court Display...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Top Header Bar */}
      <Card style={styles.header}>
        <View>
          <Text style={styles.eventTitle}>{liveData?.title ?? 'Padel Tournament'}</Text>
          <Text style={styles.eventSubtitle}>
            {liveData?.format ?? 'AMERICANO'} • Round {liveData?.current_round ?? 1} of{' '}
            {liveData?.total_rounds ?? 8}
          </Text>
        </View>

        <View style={styles.statusBadgeRow}>
          {isReconnecting && (
            <StatusPill label="Reconnecting" variant="danger" />
          )}
          <StatusPill label="Live TV" variant="success" />
        </View>
      </Card>

      {/* Courts & Leaderboard Grid */}
      <View style={styles.grid}>
        {/* Left Column: Active Courts */}
        <View style={styles.column}>
          <Text style={styles.sectionHeader}>Active Courts</Text>
          {liveData?.matches.map((m) => (
            <Card key={m.id} style={styles.matchCard}>
              <View style={styles.courtHeader}>
                <Text style={styles.courtName}>Court {m.court_number}</Text>
                <StatusPill label={m.status} variant="neutral" />
              </View>

              <View style={styles.matchRow}>
                <View style={styles.teamBox}>
                  <Text style={styles.playerText}>{m.team_a_p1}</Text>
                  <Text style={styles.playerText}>{m.team_a_p2}</Text>
                </View>

                <View style={styles.scoreBox}>
                  <Text style={[styles.scoreText, Typography.tabularNums]}>
                    {m.team_a_score !== null ? m.team_a_score : '-'}
                  </Text>
                  <Text style={styles.vsText}>vs</Text>
                  <Text style={[styles.scoreText, Typography.tabularNums]}>
                    {m.team_b_score !== null ? m.team_b_score : '-'}
                  </Text>
                </View>

                <View style={[styles.teamBox, styles.teamRight]}>
                  <Text style={styles.playerText}>{m.team_b_p1}</Text>
                  <Text style={styles.playerText}>{m.team_b_p2}</Text>
                </View>
              </View>
            </Card>
          ))}
        </View>

        {/* Right Column: High-Contrast Standings */}
        <View style={styles.column}>
          <Text style={styles.sectionHeader}>Leaderboard</Text>
          <Card style={styles.leaderboardTable}>
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
                  ]}
                >
                  <Text
                    style={[
                      styles.rankText,
                      styles.rankCol,
                      Typography.tabularNums,
                    ]}
                  >
                    {row.rank}
                  </Text>
                  <Text style={[styles.playerNameText, styles.nameCol]} numberOfLines={1}>
                    {row.player_name}
                  </Text>
                  <Text style={[styles.statText, styles.statCol, Typography.tabularNums]}>
                    {row.total_points}
                  </Text>
                  <Text
                    style={[
                      styles.statText,
                      styles.statCol,
                      Typography.tabularNums,
                      row.point_difference > 0
                        ? styles.positiveText
                        : row.point_difference < 0
                          ? styles.negativeText
                          : null,
                    ]}
                  >
                    {row.point_difference > 0
                      ? `+${row.point_difference}`
                      : `${row.point_difference}`}
                  </Text>
                </View>
              );
            })}
          </Card>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Tokens.colors.background,
  },
  content: {
    padding: Tokens.spacing.lg,
    gap: Tokens.spacing.base,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  centerContainer: {
    flex: 1,
    backgroundColor: Tokens.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Tokens.spacing.md,
  },
  reconnectingText: {
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Tokens.fontWeight.medium,
    fontSize: Tokens.fontSize.base,
    lineHeight: Tokens.lineHeight.base,
    color: Tokens.colors.textMuted,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Tokens.spacing.lg,
  },
  eventTitle: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.xl,
    lineHeight: Tokens.lineHeight.xl,
    color: Tokens.colors.text,
  },
  eventSubtitle: {
    fontFamily: Typography.fontFamily.regular,
    fontWeight: Tokens.fontWeight.regular,
    fontSize: Tokens.fontSize.sm,
    lineHeight: Tokens.lineHeight.sm,
    color: Tokens.colors.textMuted,
    marginTop: 2,
  },
  statusBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Tokens.spacing.lg,
  },
  column: {
    flex: 1,
    minWidth: 320,
    gap: Tokens.spacing.md,
  },
  sectionHeader: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.sm,
    lineHeight: Tokens.lineHeight.sm,
    color: Tokens.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  matchCard: {
    gap: Tokens.spacing.sm,
  },
  courtHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  courtName: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.sm,
    lineHeight: Tokens.lineHeight.sm,
    color: Tokens.colors.text,
  },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  teamBox: {
    flex: 2,
    gap: 2,
  },
  teamRight: {
    alignItems: 'flex-end',
  },
  playerText: {
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Tokens.fontWeight.medium,
    fontSize: Tokens.fontSize.sm,
    lineHeight: Tokens.lineHeight.sm,
    color: Tokens.colors.text,
  },
  scoreBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.xs,
    paddingHorizontal: Tokens.spacing.md,
  },
  scoreText: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.xl,
    lineHeight: Tokens.lineHeight.xl,
    color: Tokens.colors.greenText,
  },
  vsText: {
    fontFamily: Typography.fontFamily.regular,
    fontWeight: Tokens.fontWeight.regular,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.textMuted,
  },
  leaderboardTable: {
    padding: 0,
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Tokens.spacing.sm,
    paddingHorizontal: Tokens.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Tokens.colors.border,
  },
  tableHeaderCell: {
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Tokens.fontWeight.medium,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.textMuted,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Tokens.spacing.sm,
    paddingHorizontal: Tokens.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Tokens.colors.border,
    minHeight: Tokens.touch.minTarget,
  },
  podiumRow: {
    backgroundColor: Tokens.colors.background,
  },
  rankCol: {
    width: 28,
  },
  nameCol: {
    flex: 1,
    paddingHorizontal: Tokens.spacing.xs,
  },
  statCol: {
    width: 44,
    textAlign: 'center',
  },
  rankText: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.sm,
    lineHeight: Tokens.lineHeight.sm,
    color: Tokens.colors.text,
  },
  playerNameText: {
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Tokens.fontWeight.medium,
    fontSize: Tokens.fontSize.sm,
    lineHeight: Tokens.lineHeight.sm,
    color: Tokens.colors.text,
  },
  statText: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.sm,
    lineHeight: Tokens.lineHeight.sm,
    color: Tokens.colors.text,
  },
  positiveText: {
    color: Tokens.colors.greenText,
  },
  negativeText: {
    color: Tokens.colors.danger,
  },
});
