import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Calendar, MapPin } from 'lucide-react-native';
import { Tokens, Typography, Fonts } from '@/constants/theme';
import { formatGhanaCedis } from '@/lib/formatting';
import { t } from '@/lib/i18n';
import { StatusChip } from '@/components/ui';

export interface PlaySessionItem {
  id: string;
  format: string;
  status: 'Open' | 'Needs a 4th' | '1 spot left';
  title: string;
  venue: string;
  schedule: string;
  targetLevel: string;
  capacity: string;
  pricePesewas: number;
}

export const PLAY_SESSIONS: PlaySessionItem[] = [
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
    status: '1 spot left',
    title: 'Saturday Morning Sprint',
    venue: 'Cantonments Club',
    schedule: 'Sat, 8:00 AM',
    targetLevel: 'Level 3.5 - 4.5',
    capacity: '7/8 players',
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

export interface UpcomingLeagueRow {
  id: string;
  title: string;
  badge: string;
  subtitle: string;
  meta1Label: string;
  meta1Value: string;
  meta2Label: string;
  meta2Value: string;
  actionLabel: string;
}

export const UPCOMING_LEAGUES: UpcomingLeagueRow[] = [
  {
    id: 'lg-001',
    title: 'Accra Metro Premier League',
    badge: 'Active • Round 6',
    subtitle: 'Season 2 • 16 registered pairs • Cantonments & Airport',
    meta1Label: 'Leader',
    meta1Value: 'Kwame A. / Nana K.',
    meta2Label: '1st Prize',
    meta2Value: 'GH₵ 4,500.00',
    actionLabel: 'Standings',
  },
  {
    id: 'lg-002',
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

export function SessionsGrid() {
  const router = useRouter();

  return (
    <>
      {/* 4. Play Near You (Open Sessions) */}
      <View style={styles.sectionBlock}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>{t('playNearYouTitle')}</Text>
            <Text style={styles.sectionSubtitle}>
              {t('playNearYouSubtitle')}
            </Text>
          </View>
          <Pressable
            testID="home-see-all-sessions-btn"
            onPress={() => router.push('/events')}
            style={styles.seeAllButton}
            accessibilityRole="button"
            accessibilityLabel={t('seeAllSessions')}
          >
            <Text style={styles.seeAllButtonText}>{t('seeAllSessions')}</Text>
          </Pressable>
        </View>

        <View style={styles.sessionsGrid}>
          {PLAY_SESSIONS.map((session) => (
            <View key={session.id} style={styles.sessionCard}>
              <View style={styles.sessionTopRow}>
                <StatusChip status="open" label={session.status} />
                <Text style={styles.sessionFormat}>{session.format}</Text>
              </View>

              <Text style={styles.sessionTitle}>{session.title}</Text>

              <View style={styles.sessionMetaRow}>
                <Calendar size={14} color={Tokens.colors.muted} strokeWidth={1.75} />
                <Text style={styles.sessionMetaText}>{session.schedule}</Text>
              </View>

              <View style={styles.sessionMetaRow}>
                <MapPin size={14} color={Tokens.colors.muted} strokeWidth={1.75} />
                <Text style={styles.sessionMetaText}>{session.venue}</Text>
              </View>

              <View style={styles.sessionDivider} />

              <View style={styles.sessionFooter}>
                <View>
                  <Text style={styles.perPlayerLabel}>{t('perPlayer')}</Text>
                  <Text style={styles.sessionPrice}>
                    {formatGhanaCedis(session.pricePesewas)}
                  </Text>
                </View>
                <Pressable
                  style={styles.viewDetailsBtn}
                  onPress={() => router.push('/events/evt-001')}
                  accessibilityRole="button"
                  accessibilityLabel={`View details for ${session.title}`}
                >
                  <Text style={styles.viewDetailsText}>{t('viewDetailsBtn')}</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* 5. Upcoming Leagues */}
      <View style={styles.sectionBlock}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>{t('upcomingLeaguesTitle')}</Text>
            <Text style={styles.sectionSubtitle}>
              {t('upcomingLeaguesSubtitle')}
            </Text>
          </View>
          <Pressable
            testID="home-see-all-leagues-btn"
            onPress={() => router.push('/leagues')}
            style={styles.seeAllButton}
            accessibilityRole="button"
            accessibilityLabel={t('seeAllLeagues')}
          >
            <Text style={styles.seeAllButtonText}>{t('seeAllLeagues')}</Text>
          </Pressable>
        </View>

        <View style={styles.leaguesList}>
          {UPCOMING_LEAGUES.map((league) => (
            <View key={league.id} style={styles.leagueCard}>
              <View style={styles.leagueTopRow}>
                <Text style={styles.leagueTitle}>{league.title}</Text>
                <View style={styles.leagueBadge}>
                  <Text style={styles.leagueBadgeText}>{league.badge}</Text>
                </View>
              </View>

              <Text style={styles.leagueSubtitle}>{league.subtitle}</Text>

              <View style={styles.leagueMetaRow}>
                <View style={styles.leagueMetaItem}>
                  <Text style={styles.leagueMetaLabel}>{league.meta1Label}</Text>
                  <Text style={styles.leagueMetaValue}>{league.meta1Value}</Text>
                </View>
                <View style={styles.leagueMetaItem}>
                  <Text style={styles.leagueMetaLabel}>{league.meta2Label}</Text>
                  <Text style={styles.leagueMetaValue}>{league.meta2Value}</Text>
                </View>
                <Pressable
                  style={styles.leagueActionBtn}
                  onPress={() => router.push('/leagues')}
                  accessibilityRole="button"
                  accessibilityLabel={`${league.actionLabel} for ${league.title}`}
                >
                  <Text style={styles.leagueActionBtnText}>{league.actionLabel}</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  sectionBlock: {
    width: '100%',
    gap: Tokens.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    width: '100%',
    gap: Tokens.spacing.md,
  },
  sectionTitle: {
    fontFamily: Typography.fontFamily.display,
    fontSize: Tokens.fontSize.xl,
    lineHeight: Tokens.lineHeight.xl,
    fontWeight: Tokens.fontWeight.bold,
    color: Tokens.colors.ink,
    letterSpacing: -0.5,
  },
  sectionSubtitle: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Tokens.fontSize.sm,
    lineHeight: Tokens.lineHeight.sm,
    color: Tokens.colors.muted,
    marginTop: 2,
  },
  seeAllButton: {
    paddingVertical: Tokens.spacing.xs,
    paddingHorizontal: Tokens.spacing.sm,
  },
  seeAllButtonText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Tokens.fontSize.sm,
    lineHeight: Tokens.lineHeight.sm,
    color: Tokens.colors.primary,
  },
  sessionsGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Tokens.spacing.base,
  },
  sessionCard: {
    flex: 1,
    minWidth: 260,
    backgroundColor: Tokens.colors.surface,
    borderRadius: Tokens.radii.card,
    borderWidth: 1,
    borderColor: Tokens.colors.border,
    padding: Tokens.spacing.lg,
    gap: Tokens.spacing.sm,
  },
  sessionTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sessionFormat: {
    fontFamily: Fonts.mono,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  sessionTitle: {
    fontFamily: Typography.fontFamily.display,
    fontSize: Tokens.fontSize.lg,
    lineHeight: Tokens.lineHeight.lg,
    fontWeight: Tokens.fontWeight.bold,
    color: Tokens.colors.ink,
    letterSpacing: -0.3,
  },
  sessionMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.xs,
  },
  sessionMetaText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.muted,
  },
  sessionDivider: {
    height: 1,
    backgroundColor: Tokens.colors.border,
    marginVertical: Tokens.spacing.xs,
  },
  sessionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  perPlayerLabel: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.muted,
  },
  sessionPrice: {
    fontFamily: Typography.fontFamily.display,
    fontSize: Tokens.fontSize.base,
    lineHeight: Tokens.lineHeight.base,
    fontWeight: Tokens.fontWeight.bold,
    color: Tokens.colors.ink,
  },
  viewDetailsBtn: {
    borderWidth: 1,
    borderColor: Tokens.colors.border,
    borderRadius: Tokens.radii.sm,
    paddingVertical: Tokens.spacing.xs,
    paddingHorizontal: Tokens.spacing.md,
  },
  viewDetailsText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.ink,
  },
  leaguesList: {
    width: '100%',
    gap: Tokens.spacing.base,
  },
  leagueCard: {
    width: '100%',
    backgroundColor: Tokens.colors.surface,
    borderRadius: Tokens.radii.card,
    borderWidth: 1,
    borderColor: Tokens.colors.border,
    padding: Tokens.spacing.lg,
    gap: Tokens.spacing.sm,
  },
  leagueTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Tokens.spacing.md,
  },
  leagueTitle: {
    fontFamily: Typography.fontFamily.display,
    fontSize: Tokens.fontSize.base,
    lineHeight: Tokens.lineHeight.base,
    fontWeight: Tokens.fontWeight.bold,
    color: Tokens.colors.ink,
    letterSpacing: -0.3,
  },
  leagueBadge: {
    backgroundColor: Tokens.colors.surfaceMuted,
    borderRadius: Tokens.radii.sm,
    paddingHorizontal: Tokens.spacing.sm,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: Tokens.colors.border,
  },
  leagueBadgeText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.muted,
  },
  leagueSubtitle: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.muted,
  },
  leagueMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Tokens.spacing.lg,
    paddingTop: Tokens.spacing.xs,
  },
  leagueMetaItem: {
    gap: 2,
  },
  leagueMetaLabel: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.muted,
  },
  leagueMetaValue: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.ink,
  },
  leagueActionBtn: {
    marginLeft: 'auto',
    borderWidth: 1,
    borderColor: Tokens.colors.border,
    borderRadius: Tokens.radii.sm,
    paddingVertical: Tokens.spacing.xs,
    paddingHorizontal: Tokens.spacing.md,
  },
  leagueActionBtnText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.ink,
  },
});
