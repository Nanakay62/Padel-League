import React from 'react';
import {
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
  Clock,
  MapPin,
  Users,
  Trophy,
  TrendingUp,
  Plus,
  Settings,
  Shield,
  Play,
} from 'lucide-react-native';
import { Tokens, Typography } from '@/constants/theme';
import { formatGhanaCedis, formatAccraDateTime } from '@/lib/formatting';
import { t } from '@/lib/i18n';
import {
  useNextGame,
  useEvents,
  useRating,
  useLeagues,
} from '@/hooks/useData';
import {
  Card,
  Button,
  StatusPill,
  Stat,
} from '@/components/ui';

export default function HomeScreen() {
  const router = useRouter();

  const userBalancePesewas = 5000; // GH₵ 50.00
  const nextGameResult = useNextGame();
  const nextGame = nextGameResult.data;
  const eventsResult = useEvents();
  const events = eventsResult.data;
  const ratingResult = useRating();
  const rating = ratingResult.data;
  const leaguesResult = useLeagues();
  const leagues = leaguesResult.data;

  const isProvisional = rating.reliability < 0.85;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
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

        {/* Hero Section */}
        <Card style={styles.heroCard}>
          <Text style={styles.heroTitle}>{t('heroTitle')}</Text>
          <Text style={styles.heroSubtitle}>{t('heroSubtitle')}</Text>
          <View style={styles.heroStatsRow}>
            <View style={styles.heroPill}>
              <Users size={14} color={Tokens.colors.textMuted} strokeWidth={1.75} />
              <Text style={styles.heroPillText}>{t('activePlayersStat')}</Text>
            </View>
            <View style={styles.heroPill}>
              <Shield size={14} color={Tokens.colors.textMuted} strokeWidth={1.75} />
              <Text style={styles.heroPillText}>{t('partnerClubsStat')}</Text>
            </View>
            <View style={styles.heroPill}>
              <MapPin size={14} color={Tokens.colors.textMuted} strokeWidth={1.75} />
              <Text style={styles.heroPillText}>{t('growingNationwideStat')}</Text>
            </View>
          </View>
        </Card>

        {/* Main Grid: Next Game & Your Rating */}
        <View style={styles.topCardsRow}>
          {/* Next Game Card */}
          <Card style={styles.cardFlex}>
            <View style={styles.cardHeaderRow}>
              <StatusPill label={t('inTwoDaysBadge')} variant="neutral" />
              <View style={styles.timeRow}>
                <Clock size={14} color={Tokens.colors.textMuted} strokeWidth={1.75} />
                <Text style={styles.timeLabel}>
                  {formatAccraDateTime(nextGame.start_time)}
                </Text>
              </View>
            </View>

            <Text style={styles.cardTitle}>{nextGame.title}</Text>

            <View style={styles.metaRow}>
              <MapPin size={14} color={Tokens.colors.textMuted} strokeWidth={1.75} />
              <Text style={styles.metaText}>{nextGame.venue_name}</Text>
            </View>

            <View style={styles.metaRow}>
              <Users size={14} color={Tokens.colors.textMuted} strokeWidth={1.75} />
              <Text style={styles.metaText}>
                {t('confirmedPlayers', {
                  confirmed: nextGame.confirmed_players,
                  max: nextGame.max_players,
                })}
              </Text>
            </View>

            <View style={styles.statsInlineRow}>
              <Stat
                label="Court Share"
                value={formatGhanaCedis(nextGame.pricing.court_share_pesewas)}
              />
              <Stat
                label="Level Band"
                value={`${nextGame.level_min.toFixed(1)} - ${nextGame.level_max.toFixed(1)}`}
              />
              <Stat
                label="Total"
                value={formatGhanaCedis(nextGame.pricing.total_price_pesewas)}
              />
            </View>

            <View style={styles.cardActionsRow}>
              <Button
                title={t('viewSessionBtn')}
                variant="secondary"
                size="md"
                style={styles.actionBtnFlex}
                onPress={() => router.push(`/events/${nextGame.id}` as any)}
                testID="home-view-session-btn"
              />
              <Button
                title={t('courtsideLiveBtn')}
                variant="primary"
                size="md"
                style={styles.actionBtnFlex}
                onPress={() => router.push(`/events/${nextGame.id}/live` as any)}
                testID="home-courtside-live-btn"
              />
            </View>
          </Card>

          {/* Your Rating Card */}
          <Card style={styles.cardFlex}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardCategoryTitle}>{t('ratingTitle')}</Text>
              {isProvisional ? (
                <StatusPill label={t('ratingProvisionalTag')} variant="neutral" />
              ) : null}
            </View>

            <View style={styles.ratingNumberContainer}>
              <Text style={[styles.ratingNumber, Typography.tabularNums]}>
                {isProvisional
                  ? `${rating.min_range.toFixed(1)} - ${rating.max_range.toFixed(1)}`
                  : rating.rating.toFixed(2)}
              </Text>
              <Text style={styles.ratingScale}>/ 7.00</Text>
            </View>

            <View style={styles.reliabilityRow}>
              <TrendingUp size={14} color={Tokens.colors.greenText} strokeWidth={1.75} />
              <Text style={styles.reliabilityText}>
                {t('ratingReliabilityLabel', {
                  percent: Math.round(rating.reliability * 100),
                })}
              </Text>
            </View>

            <Text style={styles.ratingDeltaText}>{t('ratingDeltaMonth')}</Text>

            <View style={styles.ratingFooter}>
              <Button
                title={t('viewRatingDetails')}
                variant="secondary"
                size="md"
                style={styles.fullWidthBtn}
                onPress={() => router.push('/ratings')}
                testID="home-my-rating-btn"
              />
            </View>
          </Card>
        </View>

        {/* Play Near You Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>{t('playNearYouTitle')}</Text>
          <Button
            title={t('seeAllSessions')}
            variant="ghost"
            size="sm"
            onPress={() => router.push('/play')}
            testID="home-see-all-sessions-btn"
          />
        </View>

        <View style={styles.eventsGrid}>
          {events.slice(0, 2).map((item) => (
            <Card key={item.id} style={styles.eventCard}>
              <View style={styles.cardHeaderRow}>
                <StatusPill
                  label={
                    item.seats_left <= 1
                      ? t('lookingForFourthBadge')
                      : t('seatsLeftBadge', { count: item.seats_left })
                  }
                  variant={item.seats_left <= 1 ? 'gold' : 'neutral'}
                />
                <Text style={styles.eventFormatText}>{item.format}</Text>
              </View>

              <Text style={styles.eventTitle}>{item.title}</Text>

              <View style={styles.metaRow}>
                <Clock size={14} color={Tokens.colors.textMuted} strokeWidth={1.75} />
                <Text style={styles.metaText}>{formatAccraDateTime(item.start_time)}</Text>
              </View>

              <View style={styles.metaRow}>
                <MapPin size={14} color={Tokens.colors.textMuted} strokeWidth={1.75} />
                <Text style={styles.metaText}>{item.venue_name}</Text>
              </View>

              <View style={styles.eventFooterRow}>
                <View>
                  <Text style={styles.priceLabel}>Price</Text>
                  <Text style={[styles.priceValue, Typography.tabularNums]}>
                    {formatGhanaCedis(item.pricing.total_price_pesewas)}
                  </Text>
                </View>

                <Button
                  title={t('joinSessionBtn')}
                  variant="primary"
                  size="sm"
                  onPress={() => router.push(`/events/${item.id}` as any)}
                  testID={item.id === 'evt-001' ? 'home-join-session-evt-001' : `home-join-session-${item.id}`}
                />
              </View>
            </Card>
          ))}
        </View>

        {/* Upcoming Leagues Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>{t('upcomingLeaguesTitle')}</Text>
          <Button
            title={t('seeAllLeagues')}
            variant="ghost"
            size="sm"
            onPress={() => router.push('/leagues')}
            testID="home-see-all-leagues-btn"
          />
        </View>

        <View style={styles.leaguesGrid}>
          {leagues.map((item) => (
            <Card
              key={item.id}
              style={styles.leagueCard}
              onPress={() => router.push('/leagues')}
              testID={item.id === 'lg-001' ? 'home-league-lg-001' : `home-league-${item.id}`}
            >
              <View style={styles.cardHeaderRow}>
                <StatusPill
                  label={item.status === 'LIVE' ? t('liveBadge') : t('nextRoundBadge')}
                  variant={item.status === 'LIVE' ? 'success' : 'neutral'}
                />
                <Text style={styles.leagueDivisionText}>{item.division}</Text>
              </View>

              <Text style={styles.leagueNameText}>{item.name}</Text>

              <View style={styles.metaRow}>
                <Trophy size={14} color={Tokens.colors.textMuted} strokeWidth={1.75} />
                <Text style={styles.metaText}>{item.teams_count} teams</Text>
              </View>

              <View style={styles.metaRow}>
                <Calendar size={14} color={Tokens.colors.textMuted} strokeWidth={1.75} />
                <Text style={styles.metaText}>{item.start_date || 'Oct 2026'}</Text>
              </View>
            </Card>
          ))}
        </View>

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
              <Plus size={20} color={Tokens.colors.textOnPrimary} strokeWidth={2} />
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
          <Button
            title={t('exploreVenuesBannerBtn')}
            variant="secondary"
            size="md"
            onPress={() => router.push('/venues')}
            testID="home-explore-venues-banner-btn"
          />
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
    paddingHorizontal: Tokens.spacing.base,
    paddingTop: Tokens.spacing.base,
    paddingBottom: Tokens.spacing.xxxl + 64,
    maxWidth: 900,
    width: '100%',
    alignSelf: 'center',
    gap: Tokens.spacing.lg,
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
    backgroundColor: Tokens.colors.card,
    padding: Tokens.spacing.lg,
    gap: Tokens.spacing.sm,
  },
  heroTitle: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.xl,
    lineHeight: Tokens.lineHeight.xl,
    color: Tokens.colors.text,
  },
  heroSubtitle: {
    fontFamily: Typography.fontFamily.regular,
    fontWeight: Tokens.fontWeight.regular,
    fontSize: Tokens.fontSize.sm,
    lineHeight: Tokens.lineHeight.sm,
    color: Tokens.colors.textMuted,
  },
  heroStatsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Tokens.spacing.sm,
    marginTop: Tokens.spacing.xs,
  },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.xs,
    backgroundColor: Tokens.colors.background,
    borderWidth: 1,
    borderColor: Tokens.colors.border,
    paddingHorizontal: Tokens.spacing.sm,
    paddingVertical: Tokens.spacing.xs,
    borderRadius: Tokens.radii.pill,
  },
  heroPillText: {
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Tokens.fontWeight.medium,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.textMuted,
  },
  topCardsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Tokens.spacing.base,
  },
  cardFlex: {
    flex: 1,
    minWidth: 280,
    gap: Tokens.spacing.md,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.xs,
  },
  timeLabel: {
    fontFamily: Typography.fontFamily.regular,
    fontWeight: Tokens.fontWeight.regular,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.textMuted,
  },
  cardTitle: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.lg,
    lineHeight: Tokens.lineHeight.lg,
    color: Tokens.colors.text,
  },
  cardCategoryTitle: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.base,
    lineHeight: Tokens.lineHeight.base,
    color: Tokens.colors.text,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.xs,
  },
  metaText: {
    fontFamily: Typography.fontFamily.regular,
    fontWeight: Tokens.fontWeight.regular,
    fontSize: Tokens.fontSize.sm,
    lineHeight: Tokens.lineHeight.sm,
    color: Tokens.colors.textMuted,
  },
  statsInlineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Tokens.spacing.xs,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Tokens.colors.border,
  },
  cardActionsRow: {
    flexDirection: 'row',
    gap: Tokens.spacing.sm,
    marginTop: Tokens.spacing.xs,
  },
  actionBtnFlex: {
    flex: 1,
  },
  fullWidthBtn: {
    width: '100%',
  },
  ratingNumberContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Tokens.spacing.xs,
  },
  ratingNumber: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.display,
    lineHeight: Tokens.lineHeight.display,
    color: Tokens.colors.text,
  },
  ratingScale: {
    fontFamily: Typography.fontFamily.regular,
    fontWeight: Tokens.fontWeight.regular,
    fontSize: Tokens.fontSize.sm,
    lineHeight: Tokens.lineHeight.sm,
    color: Tokens.colors.textMuted,
  },
  reliabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.xs,
  },
  reliabilityText: {
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Tokens.fontWeight.medium,
    fontSize: Tokens.fontSize.sm,
    lineHeight: Tokens.lineHeight.sm,
    color: Tokens.colors.greenText,
  },
  ratingDeltaText: {
    fontFamily: Typography.fontFamily.regular,
    fontWeight: Tokens.fontWeight.regular,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.textMuted,
  },
  ratingFooter: {
    marginTop: 'auto',
    paddingTop: Tokens.spacing.sm,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Tokens.spacing.sm,
  },
  sectionHeading: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.lg,
    lineHeight: Tokens.lineHeight.lg,
    color: Tokens.colors.text,
  },
  eventsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Tokens.spacing.base,
  },
  eventCard: {
    flex: 1,
    minWidth: 280,
    gap: Tokens.spacing.sm,
  },
  eventFormatText: {
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Tokens.fontWeight.medium,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.textMuted,
  },
  eventTitle: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.base,
    lineHeight: Tokens.lineHeight.base,
    color: Tokens.colors.text,
  },
  eventFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Tokens.spacing.xs,
    paddingTop: Tokens.spacing.xs,
  },
  priceLabel: {
    fontFamily: Typography.fontFamily.regular,
    fontWeight: Tokens.fontWeight.regular,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.textMuted,
  },
  priceValue: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.base,
    lineHeight: Tokens.lineHeight.base,
    color: Tokens.colors.text,
  },
  leaguesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Tokens.spacing.base,
  },
  leagueCard: {
    flex: 1,
    minWidth: 280,
    gap: Tokens.spacing.sm,
  },
  leagueDivisionText: {
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Tokens.fontWeight.medium,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.textMuted,
  },
  leagueNameText: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.base,
    lineHeight: Tokens.lineHeight.base,
    color: Tokens.colors.text,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Tokens.spacing.md,
  },
  quickActionTile: {
    flex: 1,
    minWidth: 160,
    alignItems: 'flex-start',
    gap: Tokens.spacing.xs,
    padding: Tokens.spacing.base,
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
});
