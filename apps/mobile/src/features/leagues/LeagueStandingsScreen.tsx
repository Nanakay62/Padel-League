import React, { useState } from 'react';
import {
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Trophy,
  Calendar,
  CheckCircle2,
  Clock,
  BookOpen,
  PlusCircle,
  Medal,
  ArrowRight,
} from 'lucide-react-native';
import { Tokens, Typography, useResponsiveLayout } from '@/constants/theme';
import { Card, Chip, StatusPill, Button } from '@/components/ui';

export interface BoxStandingItem {
  rank: number;
  pair_id: string;
  pair_name: string;
  points: number;
  matches_played: number;
  sets_won: number;
  sets_lost: number;
  games_won: number;
  games_lost: number;
  set_difference: number;
  game_difference: number;
  walkovers_given: number;
  zone: 'PROMOTION' | 'RELEGATION' | 'SAFE';
  rating?: number;
  venue?: string;
  form?: ('W' | 'L')[];
  is_user?: boolean;
}

export interface LeagueBoxItem {
  id: string;
  box_number: number;
  name: string;
  cycle_deadline?: string | null;
  standings: BoxStandingItem[];
}

export interface ScheduledChallenge {
  id: string;
  title: string;
  venue: string;
  court: string;
  time: string;
  challenger: {
    name: string;
    rung: number;
    rating: number;
  };
  defender: {
    name: string;
    rung: number;
    rating: number;
  };
  format: string;
  splitFeePerTeam: string;
  confirmed: boolean;
}

export interface AmericanoStanding {
  rank: number;
  name: string;
  club: string;
  points: number;
  weeklyDelta: number;
  avatarInitials: string;
  avatarUrl?: string;
}

export interface PrizePoolData {
  total: string;
  firstPlace: string;
  secondPlace: string;
  thirdPlace: string;
  sponsors: string;
}

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
  onViewRulebook?: () => void;
  onEnterScores?: (challengeId: string) => void;
  onReschedule?: (challengeId: string) => void;
}

const DEFAULT_CHALLENGE: ScheduledChallenge = {
  id: 'ch-1',
  title: 'Official Rung Duel',
  venue: 'Accra Padel Club',
  court: 'Court 1 (Panoramic)',
  time: 'Thu, 6:00 PM',
  challenger: {
    name: 'Kwame A. & Partner',
    rung: 4,
    rating: 4.35,
  },
  defender: {
    name: 'Ekow B. & Farouk S.',
    rung: 3,
    rating: 4.41,
  },
  format: 'Best of 3',
  splitFeePerTeam: 'GH₵ 60.00 / team',
  confirmed: true,
};

export const SAMPLE_AMERICANO_STANDINGS: AmericanoStanding[] = [
  {
    rank: 1,
    name: 'Ama B.',
    club: 'Airport Residential Club',
    points: 342,
    weeklyDelta: 24,
    avatarInitials: 'AB',
    avatarUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBdJ_AXf-mJcoGNC0md_j8X81pNJ1bsbALj9_TnS0LWHswDOVOtsPw60mtjvNRcWUeWjhBxJn7ebAqBAbzkmgELRiabqId6MzQF7Rlh8PloC2zsLvh2nBqVaUuEAVkqnPRox7Cqs_FFpShZBbUVTV58G0eJYWPXs_grYFUN06m2tBNuue0plrqYamcVD1E7I1grisd6UfnKgnp8JyV5gxm7TbQMgqlZJmBHhMKBaGFZxyaex-blG_x4',
  },
  {
    rank: 2,
    name: 'Kwame A.',
    club: 'East Legon Padel Club',
    points: 318,
    weeklyDelta: 18,
    avatarInitials: 'KA',
    avatarUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuChdoKLE-f4CmKzK2tMLAw6UrDjgtJwpUm3LhYhXfJ9a5nTQrsTvzvzAkXXIbhltL5P7ofxYR684B3nvS2aQZcqOPXAjbx_A4AwaQH-mwuQpAPczmCXFdBKM9nWm3O2u8BtGLzehqCtsja5iOvncQolymEsDxtMVvDZSIgLBHzIigFvlVKLIilTppRkxpAdnDOdBnf6R5j1fUfIAUM1g1rg1ZoSWalfjDo-zRMGrPeFhDqmCDOM_bjA',
  },
  {
    rank: 3,
    name: 'Kofi M.',
    club: 'Cantonments Social Club',
    points: 295,
    weeklyDelta: 12,
    avatarInitials: 'KM',
    avatarUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBxiOQXlV7-G2ByUtL6l3V0RtwXODAZOl1wVj1oWn-LdPFxkNyRenJm-4t7iyccq2_97f58PsUwRDGCex3Ngoz4HOKQDhicvXJFLQS_K6WAsf-Y4qXad_Ddxizs7CSaYK5ziGeHwjPuRoseeH5rpkTtepaP8xIx1a3ETu3S0SoOXHy8c_ei1OfHBqKWPou2DMZi2VauQbP3hFQ04HQ27CdfO2uBL8Wyepu-hnfqbloFbvjFBxrO_57O',
  },
];

const DEFAULT_AMERICANO_STANDINGS = SAMPLE_AMERICANO_STANDINGS;

const DEFAULT_PRIZE_POOL: PrizePoolData = {
  total: 'GH₵ 8,500.00',
  firstPlace: 'GH₵ 4,500',
  secondPlace: 'GH₵ 2,500',
  thirdPlace: 'GH₵ 1,500',
  sponsors: 'MTN MoMo • Telecel • Puma Energy Ghana',
};

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
  onViewRulebook,
  onEnterScores,
  onReschedule,
}: LeagueStandingsScreenProps) {
  const { isDesktop, isTablet } = useResponsiveLayout();
  const [selectedBoxIndex, setSelectedBoxIndex] = useState(0);

  const currentBox = boxes[selectedBoxIndex] || boxes[0];

  const handleBoxSelect = (idx: number, boxId: string) => {
    setSelectedBoxIndex(idx);
    if (onSelectBox) {
      onSelectBox(boxId);
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Circuit Header Strip */}
      <View style={styles.headerRow}>
        <View style={styles.headerInfo}>
          <View style={styles.circuitBadgeRow}>
            <View style={styles.circuitBadge}>
              <Text style={styles.circuitBadgeText}>Official Circuit</Text>
            </View>
            <Text style={styles.circuitSubtitle}>Accra Metro Series</Text>
          </View>
          <Text style={styles.leagueTitle}>{leagueTitle}</Text>
          <Text style={styles.seasonSubtitle}>
            {seasonName} • Challenge pairs within 3 rungs to climb the national leaderboard.
          </Text>
        </View>

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
            title="Create Ladder Challenge"
            variant="primary"
            size="sm"
            icon={<PlusCircle size={16} color={Tokens.colors.textOnPrimary} />}
            onPress={onCreateChallenge}
          />
        </View>
      </View>

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

      {/* Main Responsive Layout: 2 Columns on Desktop/Tablet */}
      <View style={[styles.mainLayout, (isDesktop || isTablet) && styles.mainLayoutRow]}>
        {/* LEFT COLUMN: Ladder Table & Upcoming Challenge */}
        <View style={[styles.leftColumn, (isDesktop || isTablet) && styles.leftColumnExpanded]}>
          {/* Active Ladder Table Card */}
          <Card style={styles.tableCard}>
            <View style={styles.tableCardHeader}>
              <View>
                <Text style={styles.cardHeaderTitle}>Official Accra Ladder</Text>
                <Text style={styles.cardHeaderSubtitle}>
                  Dynamic ladder updated live after verified match submission
                </Text>
              </View>
              <View style={styles.liveBadge}>
                <View style={styles.pulseDot} />
                <Text style={styles.liveBadgeText}>Live Rankings</Text>
              </View>
            </View>

            {/* Box / Ladder Tabs */}
            {boxes.length > 1 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.tabsContainer}
                contentContainerStyle={styles.tabsContent}
              >
                {boxes.map((b, idx) => (
                  <Chip
                    key={b.id}
                    label={`Box ${b.box_number}: ${b.name}`}
                    selected={selectedBoxIndex === idx}
                    onPress={() => handleBoxSelect(idx, b.id)}
                  />
                ))}
              </ScrollView>
            )}

            {/* Standings Table */}
            {currentBox ? (
              <View style={styles.tableWrapper}>
                {/* Table Column Headers */}
                <View style={styles.tableHeaderRow}>
                  <Text style={[styles.headerCell, styles.rankCol]}>Rung</Text>
                  <Text style={[styles.headerCell, styles.pairCol]}>Player / Team</Text>
                  <Text style={[styles.headerCell, styles.ratingCol]}>Rating</Text>
                  <Text style={[styles.headerCell, styles.recordCol]}>W - L</Text>
                  <Text style={[styles.headerCell, styles.formCol]}>Form</Text>
                  <Text style={[styles.headerCell, styles.actionCol]}>Status</Text>
                </View>

                {/* Standings Rows */}
                <FlatList
                  data={currentBox.standings}
                  keyExtractor={(item) => item.pair_id}
                  scrollEnabled={false}
                  renderItem={({ item, index }) => {
                    const isChampion = item.rank === 1;
                    const isUser = item.is_user || item.pair_name.includes('Kwame');
                    const formHistory = item.form || (index % 2 === 0 ? ['W', 'W', 'W'] : ['W', 'L', 'W']);
                    const ratingDisplay = item.rating ? item.rating.toFixed(2) : (4.9 - index * 0.15).toFixed(2);

                    return (
                      <View
                        style={[
                          styles.tableRow,
                          isChampion && styles.championRow,
                          isUser && styles.userRow,
                        ]}
                      >
                        {/* Rank / Rung Column */}
                        <View style={styles.rankCol}>
                          <View
                            style={[
                              styles.rankBadge,
                              isChampion && styles.championRankBadge,
                              isUser && styles.userRankBadge,
                            ]}
                          >
                            <Text
                              style={[
                                styles.rankText,
                                isChampion && styles.championRankText,
                                isUser && styles.userRankText,
                                Typography.tabularNums,
                              ]}
                            >
                              {item.rank}
                            </Text>
                          </View>
                        </View>

                        {/* Team / Pair Column */}
                        <View style={styles.pairCol}>
                          <View style={styles.pairTitleRow}>
                            <Text
                              style={[
                                styles.pairNameText,
                                (isChampion || isUser) && styles.boldText,
                              ]}
                              numberOfLines={1}
                            >
                              {item.pair_name}
                            </Text>
                            {isChampion && (
                              <Medal size={14} color={Tokens.colors.goldText} />
                            )}
                            {isUser && (
                              <View style={styles.youBadge}>
                                <Text style={styles.youBadgeText}>YOU</Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.pairClubText} numberOfLines={1}>
                            {item.venue || 'Accra Padel Arena'}
                          </Text>
                          {item.walkovers_given > 0 && (
                            <Text style={styles.walkoverSubtext}>
                              {item.walkovers_given} w/o given
                            </Text>
                          )}
                        </View>

                        {/* Rating Column */}
                        <View style={styles.ratingCol}>
                          <Text
                            style={[
                              styles.cellText,
                              Typography.tabularNums,
                              (isChampion || isUser) && styles.boldText,
                            ]}
                          >
                            {ratingDisplay}
                          </Text>
                        </View>

                        {/* W - L Record Column */}
                        <View style={styles.recordCol}>
                          <Text
                            style={[
                              styles.cellMutedText,
                              Typography.tabularNums,
                            ]}
                          >
                            {item.matches_played > 0
                              ? `${item.sets_won} - ${item.sets_lost}`
                              : '0 - 0'}
                          </Text>
                        </View>

                        {/* Form Badges Column */}
                        <View style={styles.formCol}>
                          <View style={styles.formBadgeGroup}>
                            {formHistory.map((res, fIdx) => (
                              <View
                                key={fIdx}
                                style={[
                                  styles.formChip,
                                  res === 'W' ? styles.formChipWin : styles.formChipLoss,
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.formChipText,
                                    res === 'W' ? styles.formChipTextWin : styles.formChipTextLoss,
                                  ]}
                                >
                                  {res}
                                </Text>
                              </View>
                            ))}
                          </View>
                        </View>

                        {/* Action / Zone Column */}
                        <View style={styles.actionCol}>
                          {isChampion ? (
                            <View style={styles.championPill}>
                              <Text style={styles.championPillText}>Champion</Text>
                            </View>
                          ) : isUser ? (
                            <View style={styles.currentRungPill}>
                              <Text style={styles.currentRungPillText}>Current</Text>
                            </View>
                          ) : item.zone === 'PROMOTION' ? (
                            <StatusPill label="Up" variant="success" />
                          ) : item.zone === 'RELEGATION' ? (
                            <StatusPill label="Down" variant="danger" />
                          ) : (
                            <TouchableOpacity
                              style={styles.challengeBtn}
                              activeOpacity={0.7}
                              onPress={() => {
                                if (onViewFixtures) onViewFixtures(currentBox.id);
                              }}
                            >
                              <Text style={styles.challengeBtnText}>Challenge</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    );
                  }}
                />

                {/* Table Footer */}
                <View style={styles.tableFooter}>
                  <Text style={styles.tableFooterText}>
                    Showing {currentBox.standings.length} of 32 registered teams
                  </Text>
                  {onViewFixtures && (
                    <TouchableOpacity
                      style={styles.viewAllBtn}
                      onPress={() => onViewFixtures(currentBox.id)}
                    >
                      <Text style={styles.viewAllText}>View Complete Ladder</Text>
                      <ArrowRight size={14} color={Tokens.colors.greenText} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ) : null}
          </Card>

          {/* Upcoming Scheduled Challenge Card */}
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

              {/* Head-to-Head Duel Preview */}
              <View style={styles.duelGrid}>
                {/* Challenger */}
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

                {/* VS Badge */}
                <View style={styles.duelVsCenter}>
                  <View style={styles.vsCircle}>
                    <Text style={styles.vsText}>VS</Text>
                  </View>
                  <Text style={styles.vsSubtext}>{upcomingChallenge.format}</Text>
                </View>

                {/* Defender */}
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

              {/* Challenge Footer */}
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

        {/* RIGHT COLUMN: Prize Pool, Americano Standings, and Scoring Rules */}
        <View style={[styles.rightColumn, (isDesktop || isTablet) && styles.rightColumnNarrow]}>
          {/* Season Prize Pool Card */}
          {prizePool && (
            <Card style={styles.prizeCard}>
              <View style={styles.prizeHeader}>
                <View>
                  <Text style={styles.prizeEyebrow}>Accra Metro Circuit Prize Pool</Text>
                  <Text style={[styles.prizeTotalAmount, Typography.tabularNums]}>
                    {prizePool.total}
                  </Text>
                </View>
                <View style={styles.prizeTrophyBox}>
                  <Trophy size={22} color={Tokens.colors.goldText} />
                </View>
              </View>

              <Text style={styles.prizeDescription}>
                Powered by Accra Padel Club sponsors. Winner takes{' '}
                <Text style={styles.boldText}>{prizePool.firstPlace}</Text> + official Padel Ghana crystal trophy and seed in the West Africa Cup.
              </Text>

              {/* Prize Tiers */}
              <View style={styles.prizeTiersRow}>
                <View style={styles.prizeTierBox}>
                  <Text style={styles.tierRankLabel}>1st Place</Text>
                  <Text style={[styles.tierAmount, Typography.tabularNums]}>
                    {prizePool.firstPlace}
                  </Text>
                </View>
                <View style={styles.prizeTierBox}>
                  <Text style={styles.tierRankLabel}>2nd Place</Text>
                  <Text style={[styles.tierAmount, Typography.tabularNums]}>
                    {prizePool.secondPlace}
                  </Text>
                </View>
                <View style={styles.prizeTierBox}>
                  <Text style={styles.tierRankLabel}>3rd Place</Text>
                  <Text style={[styles.tierAmount, Typography.tabularNums]}>
                    {prizePool.thirdPlace}
                  </Text>
                </View>
              </View>

              <View style={styles.prizeSponsorsRow}>
                <Text style={styles.sponsorsLabel}>Supported by</Text>
                <Text style={styles.sponsorsList}>{prizePool.sponsors}</Text>
              </View>
            </Card>
          )}

          {/* Americano Weekly Standings Card */}
          {americanoStandings && (
            <Card style={styles.americanoCard}>
              <View style={styles.americanoHeader}>
                <View>
                  <Text style={styles.cardHeaderTitle}>Americano Weekly Standings</Text>
                  <Text style={styles.cardHeaderSubtitle}>
                    Points across East Legon & Cantonments rollups
                  </Text>
                </View>
                <View style={styles.weekPill}>
                  <Text style={styles.weekPillText}>Week 6</Text>
                </View>
              </View>

              <View style={styles.americanoList}>
                {americanoStandings.map((p) => {
                  const isGold = p.rank === 1;
                  return (
                    <View
                      key={p.rank}
                      style={[
                        styles.americanoItem,
                        isGold && styles.americanoItemGold,
                      ]}
                    >
                      <View style={styles.americanoLeft}>
                        <View
                          style={[
                            styles.americanoRankBadge,
                            isGold && styles.americanoRankBadgeGold,
                          ]}
                        >
                          <Text
                            style={[
                              styles.americanoRankText,
                              isGold && styles.americanoRankTextGold,
                              Typography.tabularNums,
                            ]}
                          >
                            {p.rank}
                          </Text>
                        </View>
                        {p.avatarUrl ? (
                          <Image
                            source={{ uri: p.avatarUrl }}
                            style={styles.americanoAvatarImage}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={styles.americanoAvatar}>
                            <Text style={styles.americanoAvatarText}>{p.avatarInitials}</Text>
                          </View>
                        )}
                        <View style={styles.americanoPlayerCol}>
                          <Text style={styles.americanoPlayerName}>{p.name}</Text>
                          <Text style={styles.americanoPlayerClub} numberOfLines={1}>
                            {p.club}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.americanoRight}>
                        <Text style={[styles.americanoPointsText, Typography.tabularNums]}>
                          {p.points} pts
                        </Text>
                        <Text style={[styles.americanoDeltaText, Typography.tabularNums]}>
                          +{p.weeklyDelta} this wk
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>

              <TouchableOpacity style={styles.joinAmericanoBtn} activeOpacity={0.8}>
                <Text style={styles.joinAmericanoBtnText}>
                  Join Friday Americano Session (GH₵ 85.00)
                </Text>
              </TouchableOpacity>
            </Card>
          )}

          {/* Scoring & Tie-break System Footnote Card */}
          <Card style={styles.rulesCard}>
            <Text style={styles.rulesNoteTitle}>Scoring & Tie-break System</Text>
            <Text style={styles.rulesNoteBody}>
              Win: 3 pts | Played Loss: 1 pt | Walkover Loss: 0 pts{'\n'}
              Tiebreak: Points, Head-to-Head, Set Diff, Game Diff{'\n'}
              Top pairs promoted up; bottom pairs relegated at cycle end.
            </Text>
          </Card>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Tokens.spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: Tokens.spacing.base,
    paddingBottom: Tokens.spacing.xs,
  },
  headerInfo: {
    flex: 1,
    minWidth: 280,
    gap: Tokens.spacing.xs,
  },
  circuitBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.sm,
  },
  circuitBadge: {
    paddingHorizontal: Tokens.spacing.sm,
    paddingVertical: 2,
    borderRadius: Tokens.radii.pill,
    backgroundColor: Tokens.colors.primaryLight,
  },
  circuitBadgeText: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.primaryText,
    textTransform: 'uppercase',
  },
  circuitSubtitle: {
    fontFamily: Typography.fontFamily.regular,
    fontWeight: Tokens.fontWeight.regular,
    fontSize: Tokens.fontSize.sm,
    lineHeight: Tokens.lineHeight.sm,
    color: Tokens.colors.textMuted,
  },
  leagueTitle: {
    ...Typography.headlineLg,
    color: Tokens.colors.text,
  },
  seasonSubtitle: {
    ...Typography.bodyMd,
    color: Tokens.colors.textMuted,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.sm,
    flexWrap: 'wrap',
  },
  progressCard: {
    padding: Tokens.spacing.base,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Tokens.spacing.base,
  },
  progressLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.md,
    flex: 1,
    minWidth: 260,
  },
  calendarIconContainer: {
    width: 40,
    height: 40,
    borderRadius: Tokens.radii.sm,
    backgroundColor: Tokens.colors.primaryLight,
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
    minWidth: 240,
    flex: 1,
    maxWidth: 400,
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
    height: 8,
    borderRadius: Tokens.radii.pill,
    backgroundColor: Tokens.colors.surfaceMuted,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Tokens.colors.border,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Tokens.colors.primary,
    borderRadius: Tokens.radii.pill,
  },
  wksChip: {
    alignSelf: 'flex-start',
  },
  wksChipText: {
    ...Typography.bodySm,
    color: Tokens.colors.textMuted,
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
  tableCard: {
    padding: 0,
    overflow: 'hidden',
  },
  tableCardHeader: {
    padding: Tokens.spacing.base,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Tokens.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Tokens.colors.border,
  },
  cardHeaderTitle: {
    ...Typography.headlineSm,
    color: Tokens.colors.text,
  },
  cardHeaderSubtitle: {
    ...Typography.bodySm,
    color: Tokens.colors.textMuted,
    marginTop: 2,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.xs,
    paddingHorizontal: Tokens.spacing.sm,
    paddingVertical: Tokens.spacing.xs,
    borderRadius: Tokens.radii.pill,
    backgroundColor: Tokens.colors.primaryLight,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Tokens.colors.primaryText,
  },
  liveBadgeText: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.primaryText,
  },
  tabsContainer: {
    paddingHorizontal: Tokens.spacing.base,
    paddingVertical: Tokens.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Tokens.colors.border,
  },
  tabsContent: {
    flexDirection: 'row',
    gap: Tokens.spacing.sm,
  },
  tableWrapper: {
    width: '100%',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Tokens.spacing.base,
    paddingVertical: Tokens.spacing.sm,
    backgroundColor: Tokens.colors.surfaceMuted,
    borderBottomWidth: 1,
    borderBottomColor: Tokens.colors.border,
  },
  headerCell: {
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Tokens.fontWeight.medium,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.textMuted,
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Tokens.spacing.base,
    paddingVertical: Tokens.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Tokens.colors.border,
    minHeight: 52,
    backgroundColor: Tokens.colors.surface,
  },
  championRow: {
    backgroundColor: Tokens.colors.goldLight,
  },
  userRow: {
    backgroundColor: Tokens.colors.primaryLight,
  },
  rankCol: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: Tokens.radii.pill,
    backgroundColor: Tokens.colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  championRankBadge: {
    backgroundColor: Tokens.colors.gold,
  },
  userRankBadge: {
    backgroundColor: Tokens.colors.primary,
  },
  rankText: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.sm,
    lineHeight: Tokens.lineHeight.sm,
    color: Tokens.colors.text,
  },
  championRankText: {
    color: Tokens.colors.textOnGold,
  },
  userRankText: {
    color: Tokens.colors.textOnPrimary,
  },
  pairCol: {
    flex: 1,
    paddingHorizontal: Tokens.spacing.sm,
  },
  pairTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.xs,
  },
  pairNameText: {
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Tokens.fontWeight.medium,
    fontSize: Tokens.fontSize.sm,
    lineHeight: Tokens.lineHeight.sm,
    color: Tokens.colors.text,
  },
  pairClubText: {
    fontFamily: Typography.fontFamily.regular,
    fontWeight: Tokens.fontWeight.regular,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.textMuted,
    marginTop: 2,
  },
  ratingCol: {
    width: 52,
    alignItems: 'flex-end',
    paddingRight: Tokens.spacing.xs,
  },
  recordCol: {
    width: 56,
    alignItems: 'center',
  },
  formCol: {
    width: 64,
    alignItems: 'center',
  },
  formBadgeGroup: {
    flexDirection: 'row',
    gap: 3,
  },
  formChip: {
    width: 16,
    height: 16,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formChipWin: {
    backgroundColor: Tokens.colors.primaryLight,
  },
  formChipLoss: {
    backgroundColor: Tokens.colors.surfaceMuted,
  },
  formChipText: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
  },
  formChipTextWin: {
    color: Tokens.colors.primaryText,
  },
  formChipTextLoss: {
    color: Tokens.colors.textMuted,
  },
  actionCol: {
    width: 80,
    alignItems: 'flex-end',
  },
  championPill: {
    paddingHorizontal: Tokens.spacing.xs,
    paddingVertical: 2,
    borderRadius: Tokens.radii.chip,
    backgroundColor: Tokens.colors.gold,
  },
  championPillText: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.textOnGold,
  },
  currentRungPill: {
    paddingHorizontal: Tokens.spacing.xs,
    paddingVertical: 2,
    borderRadius: Tokens.radii.chip,
    backgroundColor: Tokens.colors.primary,
  },
  currentRungPillText: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.textOnPrimary,
  },
  challengeBtn: {
    paddingHorizontal: Tokens.spacing.sm,
    paddingVertical: 4,
    borderRadius: Tokens.radii.chip,
    backgroundColor: Tokens.colors.surfaceMuted,
    borderWidth: 1,
    borderColor: Tokens.colors.border,
  },
  challengeBtnText: {
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Tokens.fontWeight.medium,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.text,
  },
  youBadge: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    backgroundColor: Tokens.colors.primary,
  },
  youBadgeText: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.textOnPrimary,
  },
  boldText: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
  },
  cellText: {
    fontFamily: Typography.fontFamily.regular,
    fontWeight: Tokens.fontWeight.regular,
    fontSize: Tokens.fontSize.sm,
    lineHeight: Tokens.lineHeight.sm,
    color: Tokens.colors.text,
  },
  cellMutedText: {
    fontFamily: Typography.fontFamily.regular,
    fontWeight: Tokens.fontWeight.regular,
    fontSize: Tokens.fontSize.sm,
    lineHeight: Tokens.lineHeight.sm,
    color: Tokens.colors.textMuted,
  },
  walkoverSubtext: {
    fontFamily: Typography.fontFamily.regular,
    fontWeight: Tokens.fontWeight.regular,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.danger,
    marginTop: 2,
  },
  tableFooter: {
    paddingHorizontal: Tokens.spacing.base,
    paddingVertical: Tokens.spacing.sm,
    backgroundColor: Tokens.colors.surfaceMuted,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Tokens.spacing.sm,
  },
  tableFooterText: {
    ...Typography.bodySm,
    color: Tokens.colors.textMuted,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    ...Typography.labelSm,
    color: Tokens.colors.greenText,
  },
  challengeCard: {
    padding: Tokens.spacing.base,
    gap: Tokens.spacing.base,
  },
  challengeHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Tokens.spacing.xs,
  },
  challengeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.sm,
    flexWrap: 'wrap',
  },
  duelBadge: {
    paddingHorizontal: Tokens.spacing.sm,
    paddingVertical: 2,
    borderRadius: Tokens.radii.chip,
    backgroundColor: Tokens.colors.primaryLight,
  },
  duelBadgeText: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.primaryText,
  },
  challengeVenueText: {
    ...Typography.bodySm,
    color: Tokens.colors.textMuted,
  },
  challengeTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.xs,
  },
  challengeTimeText: {
    ...Typography.labelMd,
    color: Tokens.colors.text,
  },
  duelGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Tokens.spacing.base,
    borderRadius: Tokens.radii.card,
    backgroundColor: Tokens.colors.surfaceMuted,
    borderWidth: 1,
    borderColor: Tokens.colors.border,
    gap: Tokens.spacing.sm,
  },
  duelTeamLeft: {
    flex: 1,
    gap: 2,
  },
  duelTeamRight: {
    flex: 1,
    alignItems: 'flex-end',
    gap: 2,
  },
  duelRoleLabel: {
    ...Typography.labelSm,
    color: Tokens.colors.textMuted,
    textTransform: 'uppercase',
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
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  vsCircle: {
    width: 32,
    height: 32,
    borderRadius: Tokens.radii.pill,
    backgroundColor: Tokens.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Tokens.colors.border,
  },
  vsText: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.textMuted,
  },
  vsSubtext: {
    ...Typography.bodySm,
    color: Tokens.colors.textMuted,
  },
  challengeFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Tokens.spacing.sm,
    paddingTop: Tokens.spacing.xs,
  },
  challengeStatusInfo: {
    gap: 2,
  },
  confirmedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.xs,
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
    alignItems: 'center',
    gap: Tokens.spacing.sm,
  },
  prizeCard: {
    padding: Tokens.spacing.base,
    gap: Tokens.spacing.md,
  },
  prizeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  prizeEyebrow: {
    ...Typography.labelSm,
    color: Tokens.colors.textMuted,
    textTransform: 'uppercase',
  },
  prizeTotalAmount: {
    ...Typography.displayLgMobile,
    color: Tokens.colors.text,
    marginTop: 4,
  },
  prizeTrophyBox: {
    width: 40,
    height: 40,
    borderRadius: Tokens.radii.sm,
    backgroundColor: Tokens.colors.goldLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Tokens.colors.goldBorder,
  },
  prizeDescription: {
    ...Typography.bodySm,
    color: Tokens.colors.textMuted,
    lineHeight: Tokens.lineHeight.sm,
  },
  prizeTiersRow: {
    flexDirection: 'row',
    gap: Tokens.spacing.sm,
  },
  prizeTierBox: {
    flex: 1,
    padding: Tokens.spacing.sm,
    borderRadius: Tokens.radii.sm,
    backgroundColor: Tokens.colors.surfaceMuted,
    borderWidth: 1,
    borderColor: Tokens.colors.border,
  },
  tierRankLabel: {
    ...Typography.labelSm,
    color: Tokens.colors.textMuted,
  },
  tierAmount: {
    ...Typography.labelMd,
    color: Tokens.colors.text,
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    marginTop: 2,
  },
  prizeSponsorsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Tokens.spacing.xs,
  },
  sponsorsLabel: {
    ...Typography.bodySm,
    color: Tokens.colors.textMuted,
  },
  sponsorsList: {
    ...Typography.labelSm,
    color: Tokens.colors.text,
  },
  americanoCard: {
    padding: Tokens.spacing.base,
    gap: Tokens.spacing.md,
  },
  americanoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  weekPill: {
    paddingHorizontal: Tokens.spacing.sm,
    paddingVertical: 2,
    borderRadius: Tokens.radii.chip,
    backgroundColor: Tokens.colors.surfaceMuted,
    borderWidth: 1,
    borderColor: Tokens.colors.border,
  },
  weekPillText: {
    ...Typography.labelSm,
    color: Tokens.colors.text,
  },
  americanoList: {
    gap: Tokens.spacing.sm,
  },
  americanoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Tokens.spacing.sm,
    borderRadius: Tokens.radii.card,
    backgroundColor: Tokens.colors.surfaceMuted,
    borderWidth: 1,
    borderColor: Tokens.colors.border,
  },
  americanoItemGold: {
    backgroundColor: Tokens.colors.goldLight,
    borderColor: Tokens.colors.goldBorder,
  },
  americanoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.sm,
    flex: 1,
  },
  americanoRankBadge: {
    width: 24,
    height: 24,
    borderRadius: Tokens.radii.pill,
    backgroundColor: Tokens.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  americanoRankBadgeGold: {
    backgroundColor: Tokens.colors.gold,
  },
  americanoRankText: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.text,
  },
  americanoRankTextGold: {
    color: Tokens.colors.textOnGold,
  },
  americanoAvatar: {
    width: 32,
    height: 32,
    borderRadius: Tokens.radii.pill,
    backgroundColor: Tokens.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  americanoAvatarImage: {
    width: 32,
    height: 32,
    borderRadius: Tokens.radii.pill,
    backgroundColor: Tokens.colors.surfaceMuted,
  },
  americanoAvatarText: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.primaryText,
  },
  americanoPlayerCol: {
    flex: 1,
  },
  americanoPlayerName: {
    ...Typography.labelMd,
    color: Tokens.colors.text,
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
  },
  americanoPlayerClub: {
    ...Typography.bodySm,
    color: Tokens.colors.textMuted,
  },
  americanoRight: {
    alignItems: 'flex-end',
  },
  americanoPointsText: {
    ...Typography.labelMd,
    color: Tokens.colors.text,
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
  },
  americanoDeltaText: {
    ...Typography.bodySm,
    color: Tokens.colors.greenText,
  },
  joinAmericanoBtn: {
    width: '100%',
    paddingVertical: Tokens.spacing.sm,
    backgroundColor: Tokens.colors.surfaceMuted,
    borderRadius: Tokens.radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Tokens.colors.border,
  },
  joinAmericanoBtnText: {
    ...Typography.labelSm,
    color: Tokens.colors.text,
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Tokens.fontWeight.medium,
  },
  rulesCard: {
    padding: Tokens.spacing.base,
    gap: Tokens.spacing.xs,
  },
  rulesNoteTitle: {
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Tokens.fontWeight.medium,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rulesNoteBody: {
    fontFamily: Typography.fontFamily.regular,
    fontWeight: Tokens.fontWeight.regular,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.sm,
    color: Tokens.colors.textMuted,
  },
});
