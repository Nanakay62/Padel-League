import React from 'react';
import { Tabs, TabList, TabTrigger, TabSlot } from 'expo-router/ui';
import { useRouter, usePathname } from 'expo-router';
import {
  Home,
  Play,
  Trophy,
  Users,
  MapPin,
  CreditCard,
  User,
  Plus,
  Search,
  Bell,
  Settings,
} from 'lucide-react-native';
import { Tokens, Typography } from '@/constants/theme';
import { t } from '@/lib/i18n';

function RacquetLogo() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={Tokens.colors.primary} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="9" r="6" />
      <path d="M12 15v6" />
      <path d="M9 21h6" />
      <circle cx="10" cy="8" r="0.5" fill={Tokens.colors.gold} />
      <circle cx="14" cy="8" r="0.5" fill={Tokens.colors.gold} />
      <circle cx="12" cy="11" r="0.5" fill={Tokens.colors.gold} />
    </svg>
  );
}

export default function AppTabs() {
  const router = useRouter();
  const pathname = usePathname();

  const isHome = pathname === '/' || pathname === '';
  const isPlay = pathname.startsWith('/play');
  const isLeagues = pathname.startsWith('/leagues');
  const isCommunity = pathname.startsWith('/community');
  const isVenues = pathname.startsWith('/venues');
  const isCredits = pathname.startsWith('/credits');
  const isProfile = pathname.startsWith('/profile');

  return (
    <Tabs>
      <TabList style={{ display: 'none' }}>
        <TabTrigger name="index" href={"/" as any}>
          <span>Home</span>
        </TabTrigger>
        <TabTrigger name="play" href={"/play" as any}>
          <span>Play</span>
        </TabTrigger>
        <TabTrigger name="leagues" href={"/leagues" as any}>
          <span>Leagues</span>
        </TabTrigger>
        <TabTrigger name="community" href={"/community" as any}>
          <span>Community</span>
        </TabTrigger>
        <TabTrigger name="profile" href={"/profile" as any}>
          <span>Profile</span>
        </TabTrigger>
      </TabList>

      <div className="shell-root">
        {/* Desktop Sidebar (Rendered on >= 1024px via CSS) */}
        <aside className="desktop-sidebar">
          {/* Logo & Brand Header */}
          <div
            style={{
              padding: `${Tokens.spacing.xl}px ${Tokens.spacing.lg}px ${Tokens.spacing.base}px`,
              display: 'flex',
              alignItems: 'center',
              gap: Tokens.spacing.md,
              cursor: 'pointer',
            }}
            onClick={() => router.push('/')}
          >
            <RacquetLogo />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: Tokens.spacing.xs }}>
                <span
                  style={{
                    fontSize: Tokens.fontSize.base,
                    fontWeight: Tokens.fontWeight.semibold,
                    color: Tokens.colors.text,
                    letterSpacing: -0.5,
                    fontFamily: Typography.fontFamily.semibold,
                  }}
                >
                  PADEL
                </span>
                <span
                  style={{
                    fontSize: Tokens.fontSize.base,
                    fontWeight: Tokens.fontWeight.semibold,
                    color: Tokens.colors.greenText,
                    letterSpacing: -0.5,
                    fontFamily: Typography.fontFamily.semibold,
                  }}
                >
                  GHANA
                </span>
              </div>
              <div
                style={{
                  fontSize: Tokens.fontSize.xs,
                  color: Tokens.colors.textMuted,
                  fontWeight: Tokens.fontWeight.medium,
                  fontFamily: Typography.fontFamily.medium,
                }}
              >
                {t('tagline')}
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav
            style={{
              padding: `${Tokens.spacing.sm}px ${Tokens.spacing.md}px`,
              display: 'flex',
              flexDirection: 'column',
              gap: Tokens.spacing.xs,
            }}
          >
            <button
              type="button"
              data-testid="sidebar-home-link"
              aria-label={t('navHome')}
              onClick={() => router.push('/')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: Tokens.spacing.md,
                padding: `${Tokens.spacing.md}px ${Tokens.spacing.base}px`,
                minHeight: Tokens.touch.minTarget,
                borderRadius: Tokens.radii.button,
                backgroundColor: isHome ? Tokens.colors.background : 'transparent',
                color: isHome ? Tokens.colors.text : Tokens.colors.textMuted,
                border: isHome ? `1px solid ${Tokens.colors.border}` : '1px solid transparent',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: Tokens.fontSize.sm,
                fontWeight: isHome ? Tokens.fontWeight.semibold : Tokens.fontWeight.medium,
                fontFamily: Typography.fontFamily.medium,
              }}
            >
              <Home
                size={18}
                color={isHome ? Tokens.colors.greenText : Tokens.colors.textMuted}
                strokeWidth={1.75}
              />
              <span>{t('navHome')}</span>
            </button>

            <button
              type="button"
              data-testid="sidebar-play-link"
              aria-label={t('navPlay')}
              onClick={() => router.push('/play')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: Tokens.spacing.md,
                padding: `${Tokens.spacing.md}px ${Tokens.spacing.base}px`,
                minHeight: Tokens.touch.minTarget,
                borderRadius: Tokens.radii.button,
                backgroundColor: isPlay ? Tokens.colors.background : 'transparent',
                color: isPlay ? Tokens.colors.text : Tokens.colors.textMuted,
                border: isPlay ? `1px solid ${Tokens.colors.border}` : '1px solid transparent',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: Tokens.fontSize.sm,
                fontWeight: isPlay ? Tokens.fontWeight.semibold : Tokens.fontWeight.medium,
                fontFamily: Typography.fontFamily.medium,
              }}
            >
              <Play
                size={18}
                color={isPlay ? Tokens.colors.greenText : Tokens.colors.textMuted}
                strokeWidth={1.75}
              />
              <span>{t('navPlay')}</span>
            </button>

            <button
              type="button"
              data-testid="sidebar-leagues-link"
              aria-label={t('navLeagues')}
              onClick={() => router.push('/leagues')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: Tokens.spacing.md,
                padding: `${Tokens.spacing.md}px ${Tokens.spacing.base}px`,
                minHeight: Tokens.touch.minTarget,
                borderRadius: Tokens.radii.button,
                backgroundColor: isLeagues ? Tokens.colors.background : 'transparent',
                color: isLeagues ? Tokens.colors.text : Tokens.colors.textMuted,
                border: isLeagues ? `1px solid ${Tokens.colors.border}` : '1px solid transparent',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: Tokens.fontSize.sm,
                fontWeight: isLeagues ? Tokens.fontWeight.semibold : Tokens.fontWeight.medium,
                fontFamily: Typography.fontFamily.medium,
              }}
            >
              <Trophy
                size={18}
                color={isLeagues ? Tokens.colors.greenText : Tokens.colors.textMuted}
                strokeWidth={1.75}
              />
              <span>{t('navLeagues')}</span>
            </button>

            <button
              type="button"
              data-testid="sidebar-community-link"
              aria-label={t('navCommunity')}
              onClick={() => router.push('/community')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: Tokens.spacing.md,
                padding: `${Tokens.spacing.md}px ${Tokens.spacing.base}px`,
                minHeight: Tokens.touch.minTarget,
                borderRadius: Tokens.radii.button,
                backgroundColor: isCommunity ? Tokens.colors.background : 'transparent',
                color: isCommunity ? Tokens.colors.text : Tokens.colors.textMuted,
                border: isCommunity ? `1px solid ${Tokens.colors.border}` : '1px solid transparent',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: Tokens.fontSize.sm,
                fontWeight: isCommunity ? Tokens.fontWeight.semibold : Tokens.fontWeight.medium,
                fontFamily: Typography.fontFamily.medium,
              }}
            >
              <Users
                size={18}
                color={isCommunity ? Tokens.colors.greenText : Tokens.colors.textMuted}
                strokeWidth={1.75}
              />
              <span>{t('navCommunity')}</span>
            </button>

            <button
              type="button"
              data-testid="sidebar-venues-link"
              aria-label={t('navVenues')}
              onClick={() => router.push('/venues')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: Tokens.spacing.md,
                padding: `${Tokens.spacing.md}px ${Tokens.spacing.base}px`,
                minHeight: Tokens.touch.minTarget,
                borderRadius: Tokens.radii.button,
                backgroundColor: isVenues ? Tokens.colors.background : 'transparent',
                color: isVenues ? Tokens.colors.text : Tokens.colors.textMuted,
                border: isVenues ? `1px solid ${Tokens.colors.border}` : '1px solid transparent',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: Tokens.fontSize.sm,
                fontWeight: isVenues ? Tokens.fontWeight.semibold : Tokens.fontWeight.medium,
                fontFamily: Typography.fontFamily.medium,
              }}
            >
              <MapPin
                size={18}
                color={isVenues ? Tokens.colors.greenText : Tokens.colors.textMuted}
                strokeWidth={1.75}
              />
              <span>{t('navVenues')}</span>
            </button>

            <button
              type="button"
              data-testid="sidebar-credits-link"
              aria-label={t('navCredits')}
              onClick={() => router.push('/credits')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: Tokens.spacing.md,
                padding: `${Tokens.spacing.md}px ${Tokens.spacing.base}px`,
                minHeight: Tokens.touch.minTarget,
                borderRadius: Tokens.radii.button,
                backgroundColor: isCredits ? Tokens.colors.background : 'transparent',
                color: isCredits ? Tokens.colors.text : Tokens.colors.textMuted,
                border: isCredits ? `1px solid ${Tokens.colors.border}` : '1px solid transparent',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: Tokens.fontSize.sm,
                fontWeight: isCredits ? Tokens.fontWeight.semibold : Tokens.fontWeight.medium,
                fontFamily: Typography.fontFamily.medium,
              }}
            >
              <CreditCard
                size={18}
                color={isCredits ? Tokens.colors.greenText : Tokens.colors.textMuted}
                strokeWidth={1.75}
              />
              <span>{t('navCredits')}</span>
            </button>

            <button
              type="button"
              data-testid="sidebar-profile-link"
              aria-label={t('navProfile')}
              onClick={() => router.push('/profile')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: Tokens.spacing.md,
                padding: `${Tokens.spacing.md}px ${Tokens.spacing.base}px`,
                minHeight: Tokens.touch.minTarget,
                borderRadius: Tokens.radii.button,
                backgroundColor: isProfile ? Tokens.colors.background : 'transparent',
                color: isProfile ? Tokens.colors.text : Tokens.colors.textMuted,
                border: isProfile ? `1px solid ${Tokens.colors.border}` : '1px solid transparent',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: Tokens.fontSize.sm,
                fontWeight: isProfile ? Tokens.fontWeight.semibold : Tokens.fontWeight.medium,
                fontFamily: Typography.fontFamily.medium,
              }}
            >
              <User
                size={18}
                color={isProfile ? Tokens.colors.greenText : Tokens.colors.textMuted}
                strokeWidth={1.75}
              />
              <span>{t('navProfile')}</span>
            </button>
          </nav>

          {/* Quick Actions Section */}
          <div
            style={{
              margin: `${Tokens.spacing.lg}px ${Tokens.spacing.md}px 0`,
              paddingTop: Tokens.spacing.base,
              borderTop: `1px solid ${Tokens.colors.border}`,
            }}
          >
            <div
              style={{
                fontSize: Tokens.fontSize.xs,
                color: Tokens.colors.textMuted,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                fontWeight: Tokens.fontWeight.semibold,
                fontFamily: Typography.fontFamily.semibold,
                padding: `0 ${Tokens.spacing.md}px ${Tokens.spacing.sm}px`,
              }}
            >
              {t('quickActionsTitle')}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: Tokens.spacing.xs }}>
              <button
                type="button"
                data-testid="sidebar-create-event-btn"
                aria-label={t('actionCreateEvent')}
                onClick={() => router.push('/events/create')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: Tokens.spacing.md,
                  padding: `${Tokens.spacing.sm}px ${Tokens.spacing.md}px`,
                  minHeight: Tokens.touch.minTarget,
                  borderRadius: Tokens.radii.button,
                  backgroundColor: Tokens.colors.primary,
                  color: Tokens.colors.textOnPrimary,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: Tokens.fontSize.sm,
                  fontWeight: Tokens.fontWeight.semibold,
                  fontFamily: Typography.fontFamily.semibold,
                }}
              >
                <Plus size={16} color={Tokens.colors.textOnPrimary} strokeWidth={2} />
                <span>{t('actionCreateEvent')}</span>
              </button>

              <button
                type="button"
                data-testid="sidebar-find-fourth-btn"
                aria-label={t('actionFindFourth')}
                onClick={() => router.push('/partners')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: Tokens.spacing.md,
                  padding: `${Tokens.spacing.sm}px ${Tokens.spacing.md}px`,
                  minHeight: Tokens.touch.minTarget,
                  borderRadius: Tokens.radii.button,
                  backgroundColor: 'transparent',
                  color: Tokens.colors.text,
                  border: `1px solid ${Tokens.colors.border}`,
                  cursor: 'pointer',
                  fontSize: Tokens.fontSize.sm,
                  fontWeight: Tokens.fontWeight.medium,
                  fontFamily: Typography.fontFamily.medium,
                }}
              >
                <Users size={16} color={Tokens.colors.textMuted} strokeWidth={1.75} />
                <span>{t('actionFindFourth')}</span>
              </button>

              <button
                type="button"
                data-testid="sidebar-join-league-btn"
                aria-label={t('actionJoinLeague')}
                onClick={() => router.push('/leagues')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: Tokens.spacing.md,
                  padding: `${Tokens.spacing.sm}px ${Tokens.spacing.md}px`,
                  minHeight: Tokens.touch.minTarget,
                  borderRadius: Tokens.radii.button,
                  backgroundColor: 'transparent',
                  color: Tokens.colors.text,
                  border: `1px solid ${Tokens.colors.border}`,
                  cursor: 'pointer',
                  fontSize: Tokens.fontSize.sm,
                  fontWeight: Tokens.fontWeight.medium,
                  fontFamily: Typography.fontFamily.medium,
                }}
              >
                <Trophy size={16} color={Tokens.colors.textMuted} strokeWidth={1.75} />
                <span>{t('actionJoinLeague')}</span>
              </button>

              <button
                type="button"
                data-testid="sidebar-view-venues-btn"
                aria-label={t('actionViewVenues')}
                onClick={() => router.push('/venues')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: Tokens.spacing.md,
                  padding: `${Tokens.spacing.sm}px ${Tokens.spacing.md}px`,
                  minHeight: Tokens.touch.minTarget,
                  borderRadius: Tokens.radii.button,
                  backgroundColor: 'transparent',
                  color: Tokens.colors.text,
                  border: `1px solid ${Tokens.colors.border}`,
                  cursor: 'pointer',
                  fontSize: Tokens.fontSize.sm,
                  fontWeight: Tokens.fontWeight.medium,
                  fontFamily: Typography.fontFamily.medium,
                }}
              >
                <MapPin size={16} color={Tokens.colors.textMuted} strokeWidth={1.75} />
                <span>{t('actionViewVenues')}</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Right Column: Top Bar + Page Content */}
        <div className="shell-right-col">
          {/* Desktop Top Bar (Rendered on >= 1024px via CSS) */}
          <header className="desktop-topbar">
            {/* Search Button (Triggers /search route) */}
            <button
              type="button"
              data-testid="topbar-search-btn"
              aria-label={t('navSearch')}
              onClick={() => router.push('/search')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: Tokens.spacing.sm,
                backgroundColor: Tokens.colors.background,
                border: `1px solid ${Tokens.colors.border}`,
                borderRadius: Tokens.radii.input,
                padding: `${Tokens.spacing.sm}px ${Tokens.spacing.base}px`,
                width: 320,
                minHeight: Tokens.touch.minTarget,
                cursor: 'pointer',
                color: Tokens.colors.textMuted,
                fontSize: Tokens.fontSize.sm,
                fontWeight: Tokens.fontWeight.regular,
                fontFamily: Typography.fontFamily.regular,
                textAlign: 'left',
              }}
            >
              <Search size={16} color={Tokens.colors.textMuted} strokeWidth={1.75} />
              <span>{t('searchPlaceholder')}</span>
            </button>

            {/* Right Controls: Notifications Bell & Profile Menu */}
            <div style={{ display: 'flex', alignItems: 'center', gap: Tokens.spacing.md }}>
              <button
                type="button"
                data-testid="topbar-notifications-btn"
                aria-label={t('navNotifications')}
                onClick={() => router.push('/notifications')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: Tokens.touch.minTarget,
                  height: Tokens.touch.minTarget,
                  borderRadius: Tokens.radii.button,
                  backgroundColor: Tokens.colors.background,
                  border: `1px solid ${Tokens.colors.border}`,
                  cursor: 'pointer',
                }}
              >
                <Bell size={18} color={Tokens.colors.text} strokeWidth={1.75} />
              </button>

              <button
                type="button"
                data-testid="topbar-profile-btn"
                aria-label={t('navProfile')}
                onClick={() => router.push('/profile')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: Tokens.spacing.sm,
                  backgroundColor: Tokens.colors.background,
                  border: `1px solid ${Tokens.colors.border}`,
                  borderRadius: Tokens.radii.button,
                  padding: `4px ${Tokens.spacing.md}px`,
                  minHeight: Tokens.touch.minTarget,
                  cursor: 'pointer',
                  color: Tokens.colors.text,
                  fontSize: Tokens.fontSize.sm,
                  fontWeight: Tokens.fontWeight.medium,
                  fontFamily: Typography.fontFamily.medium,
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: Tokens.radii.pill,
                    backgroundColor: Tokens.colors.primary,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: Tokens.fontSize.xs,
                    fontWeight: Tokens.fontWeight.semibold,
                    color: Tokens.colors.textOnPrimary,
                  }}
                >
                  N
                </div>
                <span>Nana</span>
              </button>

              <button
                type="button"
                data-testid="topbar-settings-button"
                aria-label={t('actionSettings')}
                onClick={() => router.push('/settings')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: Tokens.touch.minTarget,
                  height: Tokens.touch.minTarget,
                  borderRadius: Tokens.radii.button,
                  backgroundColor: Tokens.colors.background,
                  border: `1px solid ${Tokens.colors.border}`,
                  cursor: 'pointer',
                }}
              >
                <Settings size={18} color={Tokens.colors.text} strokeWidth={1.75} />
              </button>
            </div>
          </header>

          {/* Active Screen Slot */}
          <main className="shell-main-content">
            <TabSlot />
          </main>
        </div>

        {/* Mobile Bottom Tabs (Rendered on < 1024px via CSS) */}
        <nav className="mobile-bottom-tabs">
          <button
            type="button"
            data-testid="tab-home-btn"
            aria-label={t('navHome')}
            onClick={() => router.push('/')}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              height: '100%',
              minHeight: Tokens.touch.minTarget,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: isHome ? Tokens.colors.greenText : Tokens.colors.textMuted,
            }}
          >
            <Home
              size={20}
              color={isHome ? Tokens.colors.greenText : Tokens.colors.textMuted}
              strokeWidth={1.75}
            />
            <span
              style={{
                fontSize: Tokens.fontSize.xs,
                fontWeight: isHome ? Tokens.fontWeight.semibold : Tokens.fontWeight.regular,
                fontFamily: Typography.fontFamily.medium,
              }}
            >
              {t('navHome')}
            </span>
          </button>

          <button
            type="button"
            data-testid="tab-play-btn"
            aria-label={t('navPlay')}
            onClick={() => router.push('/play')}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              height: '100%',
              minHeight: Tokens.touch.minTarget,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: isPlay ? Tokens.colors.greenText : Tokens.colors.textMuted,
            }}
          >
            <Play
              size={20}
              color={isPlay ? Tokens.colors.greenText : Tokens.colors.textMuted}
              strokeWidth={1.75}
            />
            <span
              style={{
                fontSize: Tokens.fontSize.xs,
                fontWeight: isPlay ? Tokens.fontWeight.semibold : Tokens.fontWeight.regular,
                fontFamily: Typography.fontFamily.medium,
              }}
            >
              {t('navPlay')}
            </span>
          </button>

          <button
            type="button"
            data-testid="tab-leagues-btn"
            aria-label={t('navLeagues')}
            onClick={() => router.push('/leagues')}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              height: '100%',
              minHeight: Tokens.touch.minTarget,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: isLeagues ? Tokens.colors.greenText : Tokens.colors.textMuted,
            }}
          >
            <Trophy
              size={20}
              color={isLeagues ? Tokens.colors.greenText : Tokens.colors.textMuted}
              strokeWidth={1.75}
            />
            <span
              style={{
                fontSize: Tokens.fontSize.xs,
                fontWeight: isLeagues ? Tokens.fontWeight.semibold : Tokens.fontWeight.regular,
                fontFamily: Typography.fontFamily.medium,
              }}
            >
              {t('navLeagues')}
            </span>
          </button>

          <button
            type="button"
            data-testid="tab-community-btn"
            aria-label={t('navCommunity')}
            onClick={() => router.push('/community')}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              height: '100%',
              minHeight: Tokens.touch.minTarget,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: isCommunity ? Tokens.colors.greenText : Tokens.colors.textMuted,
            }}
          >
            <Users
              size={20}
              color={isCommunity ? Tokens.colors.greenText : Tokens.colors.textMuted}
              strokeWidth={1.75}
            />
            <span
              style={{
                fontSize: Tokens.fontSize.xs,
                fontWeight: isCommunity ? Tokens.fontWeight.semibold : Tokens.fontWeight.regular,
                fontFamily: Typography.fontFamily.medium,
              }}
            >
              {t('navCommunity')}
            </span>
          </button>

          <button
            type="button"
            data-testid="tab-profile-btn"
            aria-label={t('navProfile')}
            onClick={() => router.push('/profile')}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              height: '100%',
              minHeight: Tokens.touch.minTarget,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: isProfile ? Tokens.colors.greenText : Tokens.colors.textMuted,
            }}
          >
            <User
              size={20}
              color={isProfile ? Tokens.colors.greenText : Tokens.colors.textMuted}
              strokeWidth={1.75}
            />
            <span
              style={{
                fontSize: Tokens.fontSize.xs,
                fontWeight: isProfile ? Tokens.fontWeight.semibold : Tokens.fontWeight.regular,
                fontFamily: Typography.fontFamily.medium,
              }}
            >
              {t('navProfile')}
            </span>
          </button>
        </nav>
      </div>
    </Tabs>
  );
}
