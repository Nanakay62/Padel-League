import React from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Calendar,
  MapPin,
  Activity,
  Medal,
  Trophy,
  ListOrdered,
  Plus,
  Play,
  Users,
  Settings,
} from 'lucide-react-native';
import { Tokens, Typography, useResponsiveLayout } from '@/constants/theme';
import { formatGhanaCedis } from '@/lib/formatting';
import { t } from '@/lib/i18n';
import {
  useNextGame,
  useRating,
} from '@/hooks/useData';
import { Card } from '@/components/ui';

export const HOME_HERO_IMAGE_URL =
  'https://lh3.googleusercontent.com/aida/AEtjO1XqMzywArgQMCs2_7pEHQakoPhf30KfGCWivMto-yKD2Mu4Ov-d2gUTL6vqT-S4afGf9g4L0H4YLVDTyswT1mAiIUJMH0S2JlAgttn79NpCmUmWmEB3LXjRcv90rrsi1BN_NH8ZVexdg0yAtcbTmWLr_jwM--2lrI51eRd8xlyN6W4rv7Owv5YeNg0hg9kNUbLvacgtEY_kHqg9pNzgDKskdY8E1qrY3Mk4avXnqsMY-mIQHcvcS-jQ83E';

interface PlaySessionItem {
  id: string;
  format: string;
  status: 'Open' | 'Needs a 4th';
  title: string;
  venue: string;
  schedule: string;
  targetLevel: string;
  capacity: string;
  isCapacityAlert?: boolean;
  pricePesewas: number;
}

const PLAY_SESSIONS: PlaySessionItem[] = [
  {
    id: 'evt-001',
    format: 'Americano',
    status: 'Open',
    title: 'Friday Night Sunset',
    venue: 'East Legon Padel Club',
    schedule: 'Fri, 6:30 PM',
    targetLevel: 'Level 3.0 - 4.0',
    capacity: '14/16 players',
    pricePesewas: 10000,
  },
  {
    id: 'evt-002',
    format: 'Mexicano',
    status: 'Needs a 4th',
    title: 'Saturday Morning Sprint',
    venue: 'Cantonments Club',
    schedule: 'Sat, 8:00 AM',
    targetLevel: 'Level 3.5 - 4.5',
    capacity: '7/8 players',
    isCapacityAlert: true,
    pricePesewas: 9000,
  },
  {
    id: 'evt-003',
    format: 'Social Mixer',
    status: 'Open',
    title: 'Sunday Morning Coffee & Padel',
    venue: 'Accra Padel Club',
    schedule: 'Sun, 9:00 AM',
    targetLevel: 'Level 2.5 - 3.5',
    capacity: '11/12 players',
    pricePesewas: 8500,
  },
];

interface UpcomingLeagueRow {
  id: string;
  iconType: 'medal' | 'trophy' | 'ladder';
  title: string;
  badge: string;
  isGoldBadge?: boolean;
  subtitle: string;
  meta1Label: string;
  meta1Value: string;
  meta2Label: string;
  meta2Value: string;
  actionLabel: string;
}

const UPCOMING_LEAGUES: UpcomingLeagueRow[] = [
  {
    id: 'lg-001',
    iconType: 'medal',
    title: 'Accra Metro Premier League',
    badge: 'Active • Round 6',
    isGoldBadge: true,
    subtitle: 'Season 2 • 16 registered pairs • Cantonments & Airport',
    meta1Label: 'Leader',
    meta1Value: 'Kwame A. / Nana K.',
    meta2Label: '1st Prize',
    meta2Value: 'GH₵ 4,500.00',
    actionLabel: 'Standings',
  },
  {
    id: 'lg-002',
    iconType: 'trophy',
    title: 'East Legon Americano Cup',
    badge: 'Starts Nov 15',
    subtitle: 'Individual format • 32 player quota • East Legon Padel Club',
    meta1Label: 'Registration',
    meta1Value: '24/32 registered',
    meta2Label: 'Entry Fee',
    meta2Value: 'GH₵ 350.00',
    actionLabel: 'Register',
  },
  {
    id: 'lg-003',
    iconType: 'ladder',
    title: 'Cantonments Corporate Ladder',
    badge: 'Rolling Season',
    subtitle: 'Challenge-based weekly matches • 20 Corporate Teams',
    meta1Label: 'Current #1',
    meta1Value: 'Ecobank Accra',
    meta2Label: 'Match Cadence',
    meta2Value: 'Weekly',
    actionLabel: 'View ladder',
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const { isDesktop, margin, gutter, maxContentWidth } = useResponsiveLayout();

  const userBalancePesewas = 5000; // GH₵ 50.00
  const nextGameResult = useNextGame();
  const nextGame = nextGameResult.data;
  const ratingResult = useRating();
  const rating = ratingResult.data;

  const isProvisional = rating.reliability < 0.85;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: margin,
            maxWidth: maxContentWidth,
            gap: gutter,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header Row with Demo Data Badge & Balance */}
        <View style={styles.header}>
          <View>
            <View style={styles.greetingRow}>
              <Text style={styles.greetingText}>{t('greetingAfternoon')}</Text>
              {nextGameResult.isMock && (
                <View style={styles.demoBadge}>
                  <Text style={styles.demoBadgeText}>{t('demoDataBadge')}</Text>
                </View>
              )}
            </View>
            <Text style={styles.taglineText}>{t('tagline')}</Text>
          </View>

          <Pressable
            style={styles.balanceBadge}
            onPress={() => router.push('/credits')}
            accessibilityRole="button"
            accessibilityLabel="Credit Balance"
            testID="home-credit-balance-btn"
          >
            <Text style={styles.balanceLabel}>Credit Balance</Text>
            <Text style={[styles.balanceValue, Typography.tabularNums]}>
              {formatGhanaCedis(userBalancePesewas)}
            </Text>
          </Pressable>
        </View>

        {/* Hero Banner Section (Stitch 280px) */}
        <Card style={styles.heroCard}>
          <Image
            source={{ uri: HOME_HERO_IMAGE_URL }}
            style={styles.heroImageBg}
            resizeMode="cover"
          />
          <View style={styles.heroOverlay} />

          <View style={styles.heroContent}>
            <View style={styles.heroBadgeRow}>
              <View style={styles.heroCircuitPill}>
                <Text style={styles.heroCircuitPillText}>{t('heroCircuitBadge')}</Text>
              </View>
              <Text style={styles.heroDot}>•</Text>
              <Text style={styles.heroBadgeSubtext}>{t('heroCommunityOpenPlay')}</Text>
            </View>
            <Text style={[styles.heroHeadline, isDesktop && styles.heroHeadlineDesktop]}>
              {t('heroTitle')}
            </Text>
            <Text style={styles.heroSubtitle}>{t('heroSubtitle')}</Text>
          </View>
        </Card>

        {/* Top Grid: Your Next Game (8 Cols / 66.6%) & Rating (4 Cols / 33.3%) */}
        <View style={[styles.topCardsRow, isDesktop ? styles.topCardsRowDesktop : styles.topCardsRowMobile]}>
          {/* Your Next Game (8 Cols) */}
          <Card style={[styles.cardContainer, isDesktop && styles.nextGameCardDesktop]}>
            <View style={styles.cardHeaderDividerRow}>
              <View style={styles.cardHeaderTagGroup}>
                <Calendar size={16} color={Tokens.colors.textMuted} strokeWidth={1.75} />
                <Text style={styles.cardSectionTag}>{t('nextGameTag')}</Text>
              </View>
              <Text style={[styles.timeHighlightText, Typography.tabularNums]}>
                Thu, 6:00 PM
              </Text>
            </View>

            <View style={styles.nextGameMainRow}>
              <View style={styles.nextGameTitleCol}>
                <View style={styles.titleWithBadgeRow}>
                  <Text style={styles.cardTitle}>{nextGame.title}</Text>
                  <View style={styles.confirmedBadge}>
                    <Text style={styles.confirmedBadgeText}>{t('confirmedBadge')}</Text>
                  </View>
                </View>
                <Text style={styles.subVenueText}>Accra Padel Club • Court 2 & 3</Text>
              </View>

              <View style={styles.priceTopRightCol}>
                <Text style={[styles.priceBigText, Typography.tabularNums]}>GH₵ 85.00</Text>
                <Text style={styles.paidMethodSubtext}>{t('paidViaMoMo')}</Text>
              </View>
            </View>

            {/* 3-Column Specs Box */}
            <View style={styles.specsContainer}>
              <View style={styles.specColumn}>
                <Text style={styles.specLabel}>{t('levelLabel')}</Text>
                <Text style={styles.specValue}>Intermediate 3.0-4.0</Text>
              </View>
              <View style={styles.specColumn}>
                <Text style={styles.specLabel}>{t('capacityLabel')}</Text>
                <Text style={[styles.specValue, Typography.tabularNums]}>8/12 players</Text>
              </View>
              <View style={styles.specColumn}>
                <Text style={styles.specLabel}>{t('formatLabel')}</Text>
                <Text style={styles.specValue}>Timed Americano (21 pts)</Text>
              </View>
            </View>

            {/* Next Game Footer */}
            <View style={styles.nextGameFooterRow}>
              <View style={styles.locationFooterGroup}>
                <MapPin size={16} color={Tokens.colors.textMuted} strokeWidth={1.75} />
                <Text style={styles.locationFooterText}>Airport Residential Area, Accra</Text>
              </View>

              <View style={styles.nextGameActionGroup}>
                <Pressable
                  style={styles.courtsideLiveSecondaryAction}
                  onPress={() => router.push(`/events/${nextGame.id}/live` as any)}
                  accessibilityRole="button"
                  accessibilityLabel="Courtside Live"
                  testID="home-courtside-live-btn"
                >
                  <Text style={styles.courtsideLiveActionText}>{t('courtsideLiveBtn')}</Text>
                </Pressable>

                <Pressable
                  style={styles.primaryActionButton}
                  onPress={() => router.push(`/events/${nextGame.id}` as any)}
                  accessibilityRole="button"
                  accessibilityLabel="View session"
                  testID="home-view-session-btn"
                >
                  <Text style={styles.primaryActionText}>{t('viewSessionBtn')}</Text>
                </Pressable>
              </View>
            </View>
          </Card>

          {/* Your Rating (4 Cols) */}
          <Card style={[styles.cardContainer, isDesktop && styles.ratingCardDesktop]}>
            <View style={styles.cardHeaderDividerRow}>
              <View style={styles.cardHeaderTagGroup}>
                <Activity size={16} color={Tokens.colors.textMuted} strokeWidth={1.75} />
                <Text style={styles.cardSectionTag}>{t('ratingTag')}</Text>
              </View>
              {isProvisional && (
                <View style={styles.provisionalBadge}>
                  <Text style={styles.provisionalBadgeText}>{t('ratingProvisionalTag')}</Text>
                </View>
              )}
            </View>

            <View style={styles.ratingNumberRow}>
              <View>
                <Text style={[styles.ratingBigNumber, Typography.tabularNums]}>3.2 - 3.6</Text>
                <Text style={styles.ratingIndexLabel}>{t('accraMetroSkillIndex')}</Text>
              </View>
              <View style={styles.ratingCalculatedCol}>
                <Text style={[styles.ratingCalculatedValue, Typography.tabularNums]}>3.40</Text>
                <Text style={styles.ratingCalculatedLabel}>{t('calculatedLabel')}</Text>
              </View>
            </View>

            {/* Rating Reliability */}
            <View style={styles.reliabilitySection}>
              <View style={styles.reliabilityHeaderRow}>
                <Text style={styles.reliabilityTitle}>{t('ratingReliabilityHeader')}</Text>
                <Text style={[styles.reliabilityPercent, Typography.tabularNums]}>82% reliability</Text>
              </View>
              <View style={styles.reliabilityTrack}>
                <View style={[styles.reliabilityBarFill, { width: '82%' as any }]} />
              </View>
            </View>

            {/* 2 Metric Tiles */}
            <View style={styles.metricsTilesRow}>
              <View style={styles.metricTile}>
                <Text style={styles.metricTileLabel}>{t('matchesStat')}</Text>
                <Text style={[styles.metricTileValue, Typography.tabularNums]}>14</Text>
              </View>
              <View style={styles.metricTile}>
                <Text style={styles.metricTileLabel}>{t('winRateStat')}</Text>
                <Text style={[styles.metricTileValueGreen, Typography.tabularNums]}>64%</Text>
              </View>
            </View>

            {/* Rating Footer */}
            <View style={styles.ratingFooterRow}>
              <Text style={styles.ratingLastUpdateText}>{t('lastUpdateTwoDays')}</Text>
              <Pressable
                onPress={() => router.push('/ratings')}
                accessibilityRole="button"
                accessibilityLabel="Full stats"
                testID="home-my-rating-btn"
              >
                <Text style={styles.fullStatsLink}>{t('fullStatsBtn')}</Text>
              </Pressable>
            </View>
          </Card>
        </View>

        {/* Play Near You Section */}
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.sectionHeading}>{t('playNearYouTitle')}</Text>
            <Text style={styles.sectionSubtitle}>{t('playNearYouSubtitle')}</Text>
          </View>
          <Pressable
            onPress={() => router.push('/play')}
            accessibilityRole="button"
            accessibilityLabel="View all sessions"
            testID="home-see-all-sessions-btn"
          >
            <Text style={styles.sectionHeaderLink}>{t('viewAllSessions')}</Text>
          </Pressable>
        </View>

        <View style={styles.playSessionsGrid}>
          {PLAY_SESSIONS.map((item) => (
            <Card key={item.id} style={[styles.sessionCard, isDesktop ? styles.sessionCardDesktop : styles.sessionCardMobile]}>
              <View style={styles.sessionCardTopRow}>
                <View style={styles.formatBadge}>
                  <Text style={styles.formatBadgeText}>{item.format}</Text>
                </View>
                <View
                  style={
                    item.status === 'Open'
                      ? styles.openBadge
                      : styles.needsFourthBadge
                  }
                >
                  <Text
                    style={
                      item.status === 'Open'
                        ? styles.openBadgeText
                        : styles.needsFourthBadgeText
                    }
                  >
                    {item.status}
                  </Text>
                </View>
              </View>

              <View style={styles.sessionTitleGroup}>
                <Text style={styles.sessionTitle}>{item.title}</Text>
                <Text style={styles.sessionVenue}>{item.venue}</Text>
              </View>

              <View style={styles.sessionSpecsTable}>
                <View style={styles.sessionSpecRow}>
                  <Text style={styles.sessionSpecLabel}>{t('scheduleLabel')}</Text>
                  <Text style={[styles.sessionSpecValue, Typography.tabularNums]}>{item.schedule}</Text>
                </View>
                <View style={styles.sessionSpecRow}>
                  <Text style={styles.sessionSpecLabel}>{t('targetLevelLabel')}</Text>
                  <Text style={styles.sessionSpecValueMedium}>{item.targetLevel}</Text>
                </View>
                <View style={styles.sessionSpecRow}>
                  <Text style={styles.sessionSpecLabel}>{t('capacityLabel')}</Text>
                  <Text
                    style={[
                      item.isCapacityAlert
                        ? styles.sessionSpecValueAlert
                        : styles.sessionSpecValue,
                      Typography.tabularNums,
                    ]}
                  >
                    {item.capacity}
                  </Text>
                </View>
              </View>

              <View style={styles.sessionFooterRow}>
                <View>
                  <Text style={[styles.sessionPriceValue, Typography.tabularNums]}>
                    {formatGhanaCedis(item.pricePesewas)}
                  </Text>
                  <Text style={styles.sessionPriceLabel}>{t('perPlayer')}</Text>
                </View>

                <Pressable
                  style={styles.outlineDetailsBtn}
                  onPress={() => router.push(`/events/${item.id}` as any)}
                  accessibilityRole="button"
                  accessibilityLabel="View details"
                  testID={item.id === 'evt-001' ? 'home-join-session-evt-001' : `home-join-session-${item.id}`}
                >
                  <Text style={styles.outlineDetailsBtnText}>{t('viewDetailsBtn')}</Text>
                </Pressable>
              </View>
            </Card>
          ))}
        </View>

        {/* Upcoming Leagues Section */}
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.sectionHeading}>{t('upcomingLeaguesTitle')}</Text>
            <Text style={styles.sectionSubtitle}>{t('upcomingLeaguesSubtitle')}</Text>
          </View>
          <Pressable
            onPress={() => router.push('/leagues')}
            accessibilityRole="button"
            accessibilityLabel="Circuit standings"
            testID="home-see-all-leagues-btn"
          >
            <Text style={styles.sectionHeaderLink}>{t('circuitStandings')}</Text>
          </Pressable>
        </View>

        <Card style={styles.leaguesContainerCard}>
          {UPCOMING_LEAGUES.map((league, idx) => (
            <React.Fragment key={league.id}>
              {idx > 0 && <View style={styles.leagueDivider} />}
              <View style={styles.leagueStackedRow}>
                <View style={styles.leagueLeftGroup}>
                  <View style={styles.leagueIconSquare}>
                    {league.iconType === 'medal' ? (
                      <Medal size={20} color={Tokens.colors.text} strokeWidth={1.75} />
                    ) : league.iconType === 'trophy' ? (
                      <Trophy size={20} color={Tokens.colors.text} strokeWidth={1.75} />
                    ) : (
                      <ListOrdered size={20} color={Tokens.colors.text} strokeWidth={1.75} />
                    )}
                  </View>

                  <View style={styles.leagueInfoGroup}>
                    <View style={styles.leagueTitleRow}>
                      <Text style={styles.leagueTitleText}>{league.title}</Text>
                      <View
                        style={
                          league.isGoldBadge
                            ? styles.leagueGoldBadge
                            : styles.leagueNeutralBadge
                        }
                      >
                        <Text
                          style={
                            league.isGoldBadge
                              ? styles.leagueGoldBadgeText
                              : styles.leagueNeutralBadgeText
                          }
                        >
                          {league.badge}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.leagueSubtitleText}>{league.subtitle}</Text>
                  </View>
                </View>

                <View style={styles.leagueRightGroup}>
                  <View style={styles.leagueMetaCol}>
                    <Text style={styles.leagueMetaLabel}>{league.meta1Label}</Text>
                    <Text style={styles.leagueMetaValueMedium}>{league.meta1Value}</Text>
                  </View>

                  <View style={styles.leagueMetaCol}>
                    <Text style={styles.leagueMetaLabel}>{league.meta2Label}</Text>
                    <Text style={[styles.leagueMetaValueBold, Typography.tabularNums]}>
                      {league.meta2Value}
                    </Text>
                  </View>

                  <Pressable
                    style={styles.outlineActionBtn}
                    onPress={() => router.push('/leagues')}
                    accessibilityRole="button"
                    accessibilityLabel={league.actionLabel}
                    testID={`home-league-${league.id}`}
                  >
                    <Text style={styles.outlineActionBtnText}>{league.actionLabel}</Text>
                  </Pressable>
                </View>
              </View>
            </React.Fragment>
          ))}
        </Card>

        {/* Quick Actions Grid */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>{t('quickActionsTitle')}</Text>
        </View>

        <View style={styles.quickActionsGrid}>
          <Card
            style={styles.quickActionTile}
            onPress={() => router.push('/events/create')}
            testID="home-create-event-btn"
          >
            <View style={styles.quickActionIconPrimary}>
              <Plus size={20} color={Tokens.colors.textOnPrimary} strokeWidth={1.75} />
            </View>
            <Text style={styles.quickActionTitle}>{t('actionCreateEvent')}</Text>
            <Text style={styles.quickActionSubtitle}>Americano or Mexicano</Text>
          </Card>

          <Card
            style={styles.quickActionTile}
            onPress={() => router.push('/play')}
            testID="home-find-events-btn"
          >
            <View style={styles.quickActionIconNeutral}>
              <Play size={20} color={Tokens.colors.text} strokeWidth={1.75} />
            </View>
            <Text style={styles.quickActionTitle}>{t('actionFindEvents')}</Text>
            <Text style={styles.quickActionSubtitle}>Sessions & matches</Text>
          </Card>

          <Card
            style={styles.quickActionTile}
            onPress={() => router.push('/partners')}
            testID="home-partner-finder-btn"
          >
            <View style={styles.quickActionIconNeutral}>
              <Users size={20} color={Tokens.colors.text} strokeWidth={1.75} />
            </View>
            <Text style={styles.quickActionTitle}>{t('actionFindFourth')}</Text>
            <Text style={styles.quickActionSubtitle}>Matchmaking & pairs</Text>
          </Card>

          <Card
            style={styles.quickActionTile}
            onPress={() => router.push('/leagues')}
            testID="home-box-leagues-btn"
          >
            <View style={styles.quickActionIconNeutral}>
              <Trophy size={20} color={Tokens.colors.text} strokeWidth={1.75} />
            </View>
            <Text style={styles.quickActionTitle}>{t('actionJoinLeague')}</Text>
            <Text style={styles.quickActionSubtitle}>Monthly box cycles</Text>
          </Card>

          <Card
            style={styles.quickActionTile}
            onPress={() => router.push('/venues')}
            testID="home-venues-btn"
          >
            <View style={styles.quickActionIconNeutral}>
              <MapPin size={20} color={Tokens.colors.text} strokeWidth={1.75} />
            </View>
            <Text style={styles.quickActionTitle}>{t('actionViewVenues')}</Text>
            <Text style={styles.quickActionSubtitle}>Club directory</Text>
          </Card>

          <Card
            style={styles.quickActionTile}
            onPress={() => router.push('/settings')}
            testID="home-settings-btn"
          >
            <View style={styles.quickActionIconNeutral}>
              <Settings size={20} color={Tokens.colors.text} strokeWidth={1.75} />
            </View>
            <Text style={styles.quickActionTitle}>{t('actionSettings')}</Text>
            <Text style={styles.quickActionSubtitle}>Preferences & rules</Text>
          </Card>
        </View>

        {/* Explore Venues Banner */}
        <Card style={styles.bannerCard}>
          <View style={styles.bannerContent}>
            <Text style={styles.bannerTitle}>{t('exploreVenuesBannerTitle')}</Text>
            <Text style={styles.bannerSubtitle}>{t('exploreVenuesBannerSubtitle')}</Text>
          </View>
          <Pressable
            style={styles.outlineBannerBtn}
            onPress={() => router.push('/venues')}
            accessibilityRole="button"
            accessibilityLabel="Explore Venues"
            testID="home-explore-venues-banner-btn"
          >
            <Text style={styles.outlineBannerBtnText}>{t('exploreVenuesBannerBtn')}</Text>
          </Pressable>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Tokens.colors.background,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: Tokens.spacing.base,
    paddingBottom: Tokens.spacing.xxxl + 64,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Tokens.spacing.xs,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.sm,
  },
  greetingText: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.lg,
    lineHeight: Tokens.lineHeight.lg,
    color: Tokens.colors.text,
  },
  demoBadge: {
    backgroundColor: Tokens.colors.card,
    borderWidth: 1,
    borderColor: Tokens.colors.border,
    paddingHorizontal: Tokens.spacing.sm,
    paddingVertical: 2,
    borderRadius: Tokens.radii.pill,
  },
  demoBadgeText: {
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Tokens.fontWeight.medium,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.textMuted,
  },
  taglineText: {
    fontFamily: Typography.fontFamily.regular,
    fontWeight: Tokens.fontWeight.regular,
    fontSize: Tokens.fontSize.sm,
    lineHeight: Tokens.lineHeight.sm,
    color: Tokens.colors.textMuted,
    marginTop: 2,
  },
  balanceBadge: {
    minHeight: Tokens.touch.minTarget,
    paddingHorizontal: Tokens.spacing.md,
    paddingVertical: Tokens.spacing.xs,
    borderRadius: Tokens.radii.card,
    backgroundColor: Tokens.colors.card,
    borderWidth: 1,
    borderColor: Tokens.colors.border,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  balanceLabel: {
    fontFamily: Typography.fontFamily.regular,
    fontWeight: Tokens.fontWeight.regular,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.textMuted,
  },
  balanceValue: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.base,
    lineHeight: Tokens.lineHeight.base,
    color: Tokens.colors.greenText,
  },
  heroCard: {
    position: 'relative',
    overflow: 'hidden',
    padding: 0,
    borderRadius: Tokens.radii.card,
    borderWidth: 1,
    borderColor: Tokens.colors.sidebarBorder,
    minHeight: 280,
    height: 280,
    justifyContent: 'flex-end',
  },
  heroImageBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Tokens.colors.heroOverlay,
  },
  heroContent: {
    position: 'relative',
    padding: Tokens.spacing.xl,
    gap: Tokens.spacing.xs,
    maxWidth: 620,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.xs,
    marginBottom: 2,
  },
  heroCircuitPill: {
    backgroundColor: Tokens.colors.card,
    paddingHorizontal: Tokens.spacing.xs,
    paddingVertical: 2,
    borderRadius: Tokens.radii.pill,
  },
  heroCircuitPillText: {
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Tokens.fontWeight.medium,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.text,
    letterSpacing: 0.5,
  },
  heroDot: {
    fontFamily: Typography.fontFamily.regular,
    fontWeight: Tokens.fontWeight.regular,
    fontSize: Tokens.fontSize.sm,
    color: Tokens.colors.surfaceContainerHighest,
  },
  heroBadgeSubtext: {
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Tokens.fontWeight.medium,
    fontSize: Tokens.fontSize.sm,
    lineHeight: Tokens.lineHeight.sm,
    color: Tokens.colors.card,
  },
  heroHeadline: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.displayMobile,
    lineHeight: Tokens.lineHeight.displayMobile,
    color: Tokens.colors.card,
    letterSpacing: -0.4,
  },
  heroHeadlineDesktop: {
    fontSize: Tokens.fontSize.displayLg,
    lineHeight: Tokens.lineHeight.displayLg,
  },
  heroSubtitle: {
    fontFamily: Typography.fontFamily.regular,
    fontWeight: Tokens.fontWeight.regular,
    fontSize: Tokens.fontSize.sm,
    lineHeight: Tokens.lineHeight.sm,
    color: Tokens.colors.heroTextMuted,
  },
  topCardsRow: {
    gap: Tokens.spacing.base,
  },
  topCardsRowDesktop: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  topCardsRowMobile: {
    flexDirection: 'column',
  },
  cardContainer: {
    gap: Tokens.spacing.md,
    borderRadius: Tokens.radii.card,
    borderWidth: 1,
    borderColor: Tokens.colors.border,
    padding: Tokens.spacing.lg,
    justifyContent: 'space-between',
  },
  nextGameCardDesktop: {
    flex: 2,
  },
  ratingCardDesktop: {
    flex: 1,
  },
  cardHeaderDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: Tokens.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Tokens.colors.surfaceContainer,
  },
  cardHeaderTagGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.xs,
  },
  cardSectionTag: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.textMuted,
    letterSpacing: 0.5,
  },
  timeHighlightText: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.sm,
    lineHeight: Tokens.lineHeight.sm,
    color: Tokens.colors.greenText,
  },
  nextGameMainRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: Tokens.spacing.md,
  },
  nextGameTitleCol: {
    flex: 1,
    minWidth: 200,
    gap: 4,
  },
  titleWithBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.sm,
    flexWrap: 'wrap',
  },
  cardTitle: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.xl,
    lineHeight: Tokens.lineHeight.xl,
    color: Tokens.colors.text,
    letterSpacing: -0.2,
  },
  confirmedBadge: {
    backgroundColor: Tokens.colors.surfaceContainer,
    paddingHorizontal: Tokens.spacing.xs,
    paddingVertical: 2,
    borderRadius: Tokens.radii.xs,
  },
  confirmedBadgeText: {
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Tokens.fontWeight.medium,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.textMuted,
  },
  subVenueText: {
    fontFamily: Typography.fontFamily.regular,
    fontWeight: Tokens.fontWeight.regular,
    fontSize: Tokens.fontSize.sm,
    lineHeight: Tokens.lineHeight.sm,
    color: Tokens.colors.textMuted,
  },
  priceTopRightCol: {
    alignItems: 'flex-end',
  },
  priceBigText: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.xl,
    lineHeight: Tokens.lineHeight.xl,
    color: Tokens.colors.text,
  },
  paidMethodSubtext: {
    fontFamily: Typography.fontFamily.regular,
    fontWeight: Tokens.fontWeight.regular,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.textMuted,
  },
  specsContainer: {
    flexDirection: 'row',
    backgroundColor: Tokens.colors.surfaceContainerLow,
    borderRadius: Tokens.radii.sm,
    padding: Tokens.spacing.sm,
    gap: Tokens.spacing.sm,
  },
  specColumn: {
    flex: 1,
    gap: 2,
  },
  specLabel: {
    fontFamily: Typography.fontFamily.regular,
    fontWeight: Tokens.fontWeight.regular,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.textMuted,
  },
  specValue: {
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Tokens.fontWeight.medium,
    fontSize: Tokens.fontSize.sm,
    lineHeight: Tokens.lineHeight.sm,
    color: Tokens.colors.text,
  },
  nextGameFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Tokens.spacing.md,
    borderTopWidth: 1,
    borderTopColor: Tokens.colors.surfaceContainer,
    marginTop: Tokens.spacing.xs,
    flexWrap: 'wrap',
    gap: Tokens.spacing.sm,
  },
  locationFooterGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.xs,
  },
  locationFooterText: {
    fontFamily: Typography.fontFamily.regular,
    fontWeight: Tokens.fontWeight.regular,
    fontSize: Tokens.fontSize.sm,
    lineHeight: Tokens.lineHeight.sm,
    color: Tokens.colors.textMuted,
  },
  nextGameActionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.sm,
  },
  courtsideLiveSecondaryAction: {
    paddingHorizontal: Tokens.spacing.md,
    paddingVertical: Tokens.spacing.xs,
    borderRadius: Tokens.radii.button,
    backgroundColor: Tokens.colors.surfaceContainer,
  },
  courtsideLiveActionText: {
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Tokens.fontWeight.medium,
    fontSize: Tokens.fontSize.sm,
    lineHeight: Tokens.lineHeight.sm,
    color: Tokens.colors.text,
  },
  primaryActionButton: {
    paddingHorizontal: Tokens.spacing.base,
    paddingVertical: Tokens.spacing.xs,
    borderRadius: Tokens.radii.button,
    backgroundColor: Tokens.colors.primary,
  },
  primaryActionText: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.sm,
    lineHeight: Tokens.lineHeight.sm,
    color: Tokens.colors.textOnPrimary,
  },
  provisionalBadge: {
    borderWidth: 1,
    borderColor: Tokens.colors.surfaceContainerHighest,
    paddingHorizontal: Tokens.spacing.xs,
    paddingVertical: 2,
    borderRadius: Tokens.radii.xs,
  },
  provisionalBadgeText: {
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Tokens.fontWeight.medium,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.textMuted,
  },
  ratingNumberRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  ratingBigNumber: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.displayLg,
    lineHeight: Tokens.lineHeight.displayLg,
    color: Tokens.colors.text,
  },
  ratingIndexLabel: {
    fontFamily: Typography.fontFamily.regular,
    fontWeight: Tokens.fontWeight.regular,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.textMuted,
  },
  ratingCalculatedCol: {
    alignItems: 'flex-end',
  },
  ratingCalculatedValue: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.base,
    lineHeight: Tokens.lineHeight.base,
    color: Tokens.colors.text,
  },
  ratingCalculatedLabel: {
    fontFamily: Typography.fontFamily.regular,
    fontWeight: Tokens.fontWeight.regular,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.textMuted,
  },
  reliabilitySection: {
    gap: Tokens.spacing.xs,
  },
  reliabilityHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reliabilityTitle: {
    fontFamily: Typography.fontFamily.regular,
    fontWeight: Tokens.fontWeight.regular,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.textMuted,
  },
  reliabilityPercent: {
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Tokens.fontWeight.medium,
    fontSize: Tokens.fontSize.sm,
    lineHeight: Tokens.lineHeight.sm,
    color: Tokens.colors.text,
  },
  reliabilityTrack: {
    width: '100%',
    height: 6,
    borderRadius: Tokens.radii.pill,
    backgroundColor: Tokens.colors.surfaceContainer,
    overflow: 'hidden',
  },
  reliabilityBarFill: {
    height: '100%',
    backgroundColor: Tokens.colors.text,
    borderRadius: Tokens.radii.pill,
  },
  metricsTilesRow: {
    flexDirection: 'row',
    gap: Tokens.spacing.sm,
  },
  metricTile: {
    flex: 1,
    padding: Tokens.spacing.sm,
    backgroundColor: Tokens.colors.surfaceContainerLow,
    borderRadius: Tokens.radii.sm,
    gap: 2,
  },
  metricTileLabel: {
    fontFamily: Typography.fontFamily.regular,
    fontWeight: Tokens.fontWeight.regular,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.textMuted,
  },
  metricTileValue: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.xl,
    lineHeight: Tokens.lineHeight.xl,
    color: Tokens.colors.text,
  },
  metricTileValueGreen: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.xl,
    lineHeight: Tokens.lineHeight.xl,
    color: Tokens.colors.greenText,
  },
  ratingFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Tokens.spacing.md,
    borderTopWidth: 1,
    borderTopColor: Tokens.colors.surfaceContainer,
  },
  ratingLastUpdateText: {
    fontFamily: Typography.fontFamily.regular,
    fontWeight: Tokens.fontWeight.regular,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.textMuted,
  },
  fullStatsLink: {
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Tokens.fontWeight.medium,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.text,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: Tokens.spacing.sm,
  },
  sectionHeading: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.xl,
    lineHeight: Tokens.lineHeight.xl,
    color: Tokens.colors.text,
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    fontFamily: Typography.fontFamily.regular,
    fontWeight: Tokens.fontWeight.regular,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.textMuted,
    marginTop: 2,
  },
  sectionHeaderLink: {
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Tokens.fontWeight.medium,
    fontSize: Tokens.fontSize.sm,
    lineHeight: Tokens.lineHeight.sm,
    color: Tokens.colors.text,
  },
  playSessionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Tokens.spacing.base,
  },
  sessionCard: {
    borderRadius: Tokens.radii.card,
    borderWidth: 1,
    borderColor: Tokens.colors.border,
    padding: Tokens.spacing.md,
    gap: Tokens.spacing.sm,
    justifyContent: 'space-between',
  },
  sessionCardDesktop: {
    flex: 1,
    minWidth: 280,
  },
  sessionCardMobile: {
    width: '100%',
  },
  sessionCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  formatBadge: {
    backgroundColor: Tokens.colors.surfaceContainer,
    paddingHorizontal: Tokens.spacing.xs,
    paddingVertical: 2,
    borderRadius: Tokens.radii.xs,
  },
  formatBadgeText: {
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Tokens.fontWeight.medium,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.textMuted,
  },
  openBadge: {
    backgroundColor: Tokens.colors.openBadgeBg,
    paddingHorizontal: Tokens.spacing.xs,
    paddingVertical: 2,
    borderRadius: Tokens.radii.xs,
  },
  openBadgeText: {
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Tokens.fontWeight.medium,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.openBadgeText,
  },
  needsFourthBadge: {
    backgroundColor: Tokens.colors.needsFourthBg,
    paddingHorizontal: Tokens.spacing.xs,
    paddingVertical: 2,
    borderRadius: Tokens.radii.xs,
  },
  needsFourthBadgeText: {
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Tokens.fontWeight.medium,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.needsFourthText,
  },
  sessionTitleGroup: {
    gap: 2,
  },
  sessionTitle: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.base,
    lineHeight: Tokens.lineHeight.base,
    color: Tokens.colors.text,
  },
  sessionVenue: {
    fontFamily: Typography.fontFamily.regular,
    fontWeight: Tokens.fontWeight.regular,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.textMuted,
  },
  sessionSpecsTable: {
    paddingVertical: Tokens.spacing.xs,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Tokens.colors.surfaceContainer,
    gap: Tokens.spacing.xs,
  },
  sessionSpecRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sessionSpecLabel: {
    fontFamily: Typography.fontFamily.regular,
    fontWeight: Tokens.fontWeight.regular,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.textMuted,
  },
  sessionSpecValue: {
    fontFamily: Typography.fontFamily.regular,
    fontWeight: Tokens.fontWeight.regular,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.text,
  },
  sessionSpecValueMedium: {
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Tokens.fontWeight.medium,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.text,
  },
  sessionSpecValueAlert: {
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Tokens.fontWeight.medium,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.needsFourthText,
  },
  sessionFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Tokens.spacing.xs,
  },
  sessionPriceValue: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.base,
    lineHeight: Tokens.lineHeight.base,
    color: Tokens.colors.text,
  },
  sessionPriceLabel: {
    fontFamily: Typography.fontFamily.regular,
    fontWeight: Tokens.fontWeight.regular,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.textMuted,
  },
  outlineDetailsBtn: {
    paddingHorizontal: Tokens.spacing.md,
    paddingVertical: Tokens.spacing.xs,
    borderRadius: Tokens.radii.button,
    backgroundColor: Tokens.colors.card,
    borderWidth: 1,
    borderColor: Tokens.colors.border,
  },
  outlineDetailsBtnText: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.sm,
    lineHeight: Tokens.lineHeight.sm,
    color: Tokens.colors.text,
  },
  leaguesContainerCard: {
    borderRadius: Tokens.radii.card,
    borderWidth: 1,
    borderColor: Tokens.colors.border,
    padding: 0,
    overflow: 'hidden',
  },
  leagueStackedRow: {
    padding: Tokens.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: Tokens.spacing.md,
  },
  leagueDivider: {
    height: 1,
    backgroundColor: Tokens.colors.surfaceContainer,
  },
  leagueLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.md,
    flex: 1,
    minWidth: 260,
  },
  leagueIconSquare: {
    width: 40,
    height: 40,
    borderRadius: Tokens.radii.sm,
    backgroundColor: Tokens.colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leagueInfoGroup: {
    flex: 1,
    gap: 2,
  },
  leagueTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.xs,
    flexWrap: 'wrap',
  },
  leagueTitleText: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.base,
    lineHeight: Tokens.lineHeight.base,
    color: Tokens.colors.text,
  },
  leagueGoldBadge: {
    backgroundColor: Tokens.colors.activeRoundBg,
    borderWidth: 1,
    borderColor: Tokens.colors.activeRoundBorder,
    paddingHorizontal: Tokens.spacing.xs,
    paddingVertical: 2,
    borderRadius: Tokens.radii.xs,
  },
  leagueGoldBadgeText: {
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Tokens.fontWeight.medium,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.activeRoundText,
  },
  leagueNeutralBadge: {
    backgroundColor: Tokens.colors.surfaceContainer,
    paddingHorizontal: Tokens.spacing.xs,
    paddingVertical: 2,
    borderRadius: Tokens.radii.xs,
  },
  leagueNeutralBadgeText: {
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Tokens.fontWeight.medium,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.textMuted,
  },
  leagueSubtitleText: {
    fontFamily: Typography.fontFamily.regular,
    fontWeight: Tokens.fontWeight.regular,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.textMuted,
  },
  leagueRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: Tokens.spacing.xl,
    flexWrap: 'wrap',
  },
  leagueMetaCol: {
    alignItems: 'flex-end',
  },
  leagueMetaLabel: {
    fontFamily: Typography.fontFamily.regular,
    fontWeight: Tokens.fontWeight.regular,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.textMuted,
  },
  leagueMetaValueMedium: {
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Tokens.fontWeight.medium,
    fontSize: Tokens.fontSize.sm,
    lineHeight: Tokens.lineHeight.sm,
    color: Tokens.colors.text,
  },
  leagueMetaValueBold: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.sm,
    lineHeight: Tokens.lineHeight.sm,
    color: Tokens.colors.text,
  },
  outlineActionBtn: {
    paddingHorizontal: Tokens.spacing.md,
    paddingVertical: Tokens.spacing.xs,
    borderRadius: Tokens.radii.button,
    backgroundColor: Tokens.colors.card,
    borderWidth: 1,
    borderColor: Tokens.colors.border,
  },
  outlineActionBtnText: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.sm,
    lineHeight: Tokens.lineHeight.sm,
    color: Tokens.colors.text,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Tokens.spacing.md,
  },
  quickActionTile: {
    flex: 1,
    minWidth: 150,
    alignItems: 'flex-start',
    gap: Tokens.spacing.xs,
    padding: Tokens.spacing.base,
    borderRadius: Tokens.radii.card,
    borderWidth: 1,
    borderColor: Tokens.colors.border,
  },
  quickActionIconPrimary: {
    width: 36,
    height: 36,
    borderRadius: Tokens.radii.button,
    backgroundColor: Tokens.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Tokens.spacing.xs,
  },
  quickActionIconNeutral: {
    width: 36,
    height: 36,
    borderRadius: Tokens.radii.button,
    backgroundColor: Tokens.colors.background,
    borderWidth: 1,
    borderColor: Tokens.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Tokens.spacing.xs,
  },
  quickActionTitle: {
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Tokens.fontWeight.medium,
    fontSize: Tokens.fontSize.sm,
    lineHeight: Tokens.lineHeight.sm,
    color: Tokens.colors.text,
  },
  quickActionSubtitle: {
    fontFamily: Typography.fontFamily.regular,
    fontWeight: Tokens.fontWeight.regular,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.textMuted,
  },
  bannerCard: {
    backgroundColor: Tokens.colors.card,
    padding: Tokens.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: Tokens.spacing.md,
    borderRadius: Tokens.radii.card,
    borderWidth: 1,
    borderColor: Tokens.colors.border,
  },
  bannerContent: {
    flex: 1,
    minWidth: 240,
    gap: Tokens.spacing.xs,
  },
  bannerTitle: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.base,
    lineHeight: Tokens.lineHeight.base,
    color: Tokens.colors.text,
  },
  bannerSubtitle: {
    fontFamily: Typography.fontFamily.regular,
    fontWeight: Tokens.fontWeight.regular,
    fontSize: Tokens.fontSize.sm,
    lineHeight: Tokens.lineHeight.sm,
    color: Tokens.colors.textMuted,
  },
  outlineBannerBtn: {
    paddingHorizontal: Tokens.spacing.base,
    paddingVertical: Tokens.spacing.sm,
    borderRadius: Tokens.radii.button,
    backgroundColor: Tokens.colors.card,
    borderWidth: 1,
    borderColor: Tokens.colors.border,
  },
  outlineBannerBtnText: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.sm,
    lineHeight: Tokens.lineHeight.sm,
    color: Tokens.colors.text,
  },
});
