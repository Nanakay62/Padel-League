import React from 'react';
import { Tabs, TabList, TabTrigger, TabSlot } from 'expo-router/ui';
import { useRouter, usePathname, type Href } from 'expo-router';
import {
  Home,
  Play,
  Trophy,
  MapPin,
  User,
  Bell,
  Settings,
} from 'lucide-react-native';
import { Tokens, Typography } from '@/constants/theme';
import { t } from '@/lib/i18n';
import { DesktopSearchBar } from '@/components/DesktopSearchBar';

function PadelBallLogo() {
  return (
    <svg width="34" height="34" viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="15" fill={Tokens.colors.lime} />
      <path
        d="M6 10C12 10 16 6 16 1"
        stroke={Tokens.colors.ink}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M26 22C20 22 16 26 16 31"
        stroke={Tokens.colors.ink}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="11" cy="20" r="1.25" fill={Tokens.colors.ink} />
      <circle cx="21" cy="12" r="1.25" fill={Tokens.colors.ink} />
    </svg>
  );
}

export default function AppTabs() {
  const router = useRouter();
  const pathname = usePathname();

  const isHome = pathname === '/' || pathname === '' || pathname === '/(tabs)' || pathname === '/(tabs)/';
  const isPlay = pathname.includes('/play');
  const isLeagues = pathname.includes('/leagues');
  const isCommunity = pathname.includes('/community');
  const isVenues = pathname.includes('/venues');
  const isCredits = pathname.includes('/credits');
  const isProfile = pathname.includes('/profile');

  const navItems: { name: string; href: Href; active: boolean; testId: string }[] = [
    { name: 'Home', href: '/(tabs)', active: isHome, testId: 'sidebar-home-link' },
    { name: 'Play', href: '/(tabs)/play', active: isPlay, testId: 'sidebar-play-link' },
    { name: 'Leagues', href: '/(tabs)/leagues', active: isLeagues, testId: 'sidebar-leagues-link' },
    { name: 'Community', href: '/(tabs)/community', active: isCommunity, testId: 'sidebar-community-link' },
    { name: 'Venues', href: '/(tabs)/venues', active: isVenues, testId: 'sidebar-venues-link' },
    { name: 'Credits', href: '/(tabs)/credits', active: isCredits, testId: 'sidebar-credits-link' },
  ];

  return (
    <Tabs>
      <TabList style={{ display: 'none' }}>
        <TabTrigger name="index" href={"/(tabs)" as Href}>
          <span>Home</span>
        </TabTrigger>
        <TabTrigger name="play" href={"/(tabs)/play" as Href}>
          <span>Play</span>
        </TabTrigger>
        <TabTrigger name="leagues" href={"/(tabs)/leagues" as Href}>
          <span>Leagues</span>
        </TabTrigger>
        <TabTrigger name="community" href={"/(tabs)/community" as Href}>
          <span>Community</span>
        </TabTrigger>
        <TabTrigger name="venues" href={"/(tabs)/venues" as Href}>
          <span>Venues</span>
        </TabTrigger>
        <TabTrigger name="credits" href={"/(tabs)/credits" as Href}>
          <span>Credits</span>
        </TabTrigger>
        <TabTrigger name="profile" href={"/(tabs)/profile" as Href}>
          <span>Profile</span>
        </TabTrigger>
      </TabList>

      <div className="shell-root">
        {/* Court Chalk Desktop Top Header */}
        <header className="desktop-topbar">
          <div className="desktop-topbar-inner">
            {/* Logo Mark + Wordmark */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: Tokens.spacing.md,
                cursor: 'pointer',
              }}
              onClick={() => router.push('/')}
            >
              <PadelBallLogo />
              <span
                style={{
                  fontSize: Tokens.fontSize.lg,
                  fontWeight: Tokens.fontWeight.bold,
                  color: Tokens.colors.ink,
                  letterSpacing: -0.5,
                  fontFamily: Typography.fontFamily.display,
                }}
              >
                Padel Ghana
              </span>
            </div>

            {/* Horizontal Nav Pills (Desktop) */}
            <nav className="desktop-topbar-pills">
              {navItems.map((item) => (
                <button
                  key={item.name}
                  type="button"
                  data-testid={item.testId}
                  aria-label={item.name}
                  onClick={() => router.push(item.href)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '8px 18px',
                    minHeight: 40,
                    borderRadius: Tokens.radii.pill,
                    backgroundColor: item.active ? Tokens.colors.ink : 'transparent',
                    color: item.active ? Tokens.colors.chalk : Tokens.colors.muted,
                    border: 'none',
                    outline: 'none',
                    cursor: 'pointer',
                    fontSize: Tokens.fontSize.sm,
                    fontWeight: item.active ? Tokens.fontWeight.semibold : Tokens.fontWeight.medium,
                    fontFamily: Typography.fontFamily.medium,
                    transition: 'all 150ms ease',
                  }}
                >
                  {item.name}
                </button>
              ))}
            </nav>

            {/* Right Controls: Search, Notifications, Avatar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: Tokens.spacing.md }}>
              <div data-testid="topbar-search-btn">
                <DesktopSearchBar />
              </div>

              <button
                type="button"
                data-testid="topbar-notifications-btn"
                aria-label={t('navNotifications')}
                onClick={() => router.push('/notifications')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 40,
                  height: 40,
                  borderRadius: Tokens.radii.pill,
                  backgroundColor: 'transparent',
                  border: `1px solid ${Tokens.colors.line}`,
                  cursor: 'pointer',
                }}
              >
                <Bell size={18} color={Tokens.colors.ink} strokeWidth={1.75} />
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
                  width: 40,
                  height: 40,
                  borderRadius: Tokens.radii.pill,
                  backgroundColor: 'transparent',
                  border: `1px solid ${Tokens.colors.line}`,
                  cursor: 'pointer',
                }}
              >
                <Settings size={18} color={Tokens.colors.ink} strokeWidth={1.75} />
              </button>

              {/* Ink avatar circle with initial in lime */}
              <button
                type="button"
                data-testid="topbar-profile-btn"
                aria-label={t('navProfile')}
                onClick={() => router.push('/(tabs)/profile' as Href)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 40,
                  height: 40,
                  borderRadius: Tokens.radii.pill,
                  backgroundColor: Tokens.colors.ink,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <span
                  style={{
                    fontSize: Tokens.fontSize.base,
                    fontWeight: Tokens.fontWeight.bold,
                    color: Tokens.colors.lime,
                    fontFamily: Typography.fontFamily.display,
                  }}
                >
                  N
                </span>
              </button>
            </div>
          </div>
        </header>

        {/* Content Column */}
        <div className="shell-right-col">
          <main className="shell-main-content">
            <TabSlot />
          </main>
        </div>

        {/* Mobile Bottom Tab Bar (5 tabs: Home, Play, Leagues, Venues, Profile) */}
        <nav className="mobile-bottom-tabs">
          <button
            type="button"
            data-testid="tab-home-btn"
            aria-label={t('navHome')}
            onClick={() => router.push('/(tabs)' as Href)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              minHeight: 48,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            {isHome ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  backgroundColor: Tokens.colors.lime,
                  borderRadius: Tokens.radii.pill,
                  padding: '6px 14px',
                }}
              >
                <Home size={18} color={Tokens.colors.ink} strokeWidth={2} />
                <span
                  style={{
                    fontSize: Tokens.fontSize.xs,
                    fontWeight: Tokens.fontWeight.bold,
                    color: Tokens.colors.ink,
                    fontFamily: Typography.fontFamily.medium,
                  }}
                >
                  Home
                </span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                <Home size={20} color={Tokens.colors.muted} strokeWidth={1.75} />
                <span
                  style={{
                    fontSize: Tokens.fontSize.xs,
                    fontWeight: Tokens.fontWeight.medium,
                    color: Tokens.colors.muted,
                    fontFamily: Typography.fontFamily.medium,
                  }}
                >
                  Home
                </span>
              </div>
            )}
          </button>

          <button
            type="button"
            data-testid="tab-play-btn"
            aria-label={t('navPlay')}
            onClick={() => router.push('/(tabs)/play' as Href)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              minHeight: 48,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            {isPlay ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  backgroundColor: Tokens.colors.lime,
                  borderRadius: Tokens.radii.pill,
                  padding: '6px 14px',
                }}
              >
                <Play size={18} color={Tokens.colors.ink} strokeWidth={2} />
                <span
                  style={{
                    fontSize: Tokens.fontSize.xs,
                    fontWeight: Tokens.fontWeight.bold,
                    color: Tokens.colors.ink,
                    fontFamily: Typography.fontFamily.medium,
                  }}
                >
                  Play
                </span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                <Play size={20} color={Tokens.colors.muted} strokeWidth={1.75} />
                <span
                  style={{
                    fontSize: Tokens.fontSize.xs,
                    fontWeight: Tokens.fontWeight.medium,
                    color: Tokens.colors.muted,
                    fontFamily: Typography.fontFamily.medium,
                  }}
                >
                  Play
                </span>
              </div>
            )}
          </button>

          <button
            type="button"
            data-testid="tab-leagues-btn"
            aria-label={t('navLeagues')}
            onClick={() => router.push('/(tabs)/leagues' as Href)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              minHeight: 48,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            {isLeagues ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  backgroundColor: Tokens.colors.lime,
                  borderRadius: Tokens.radii.pill,
                  padding: '6px 14px',
                }}
              >
                <Trophy size={18} color={Tokens.colors.ink} strokeWidth={2} />
                <span
                  style={{
                    fontSize: Tokens.fontSize.xs,
                    fontWeight: Tokens.fontWeight.bold,
                    color: Tokens.colors.ink,
                    fontFamily: Typography.fontFamily.medium,
                  }}
                >
                  Leagues
                </span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                <Trophy size={20} color={Tokens.colors.muted} strokeWidth={1.75} />
                <span
                  style={{
                    fontSize: Tokens.fontSize.xs,
                    fontWeight: Tokens.fontWeight.medium,
                    color: Tokens.colors.muted,
                    fontFamily: Typography.fontFamily.medium,
                  }}
                >
                  Leagues
                </span>
              </div>
            )}
          </button>

          <button
            type="button"
            data-testid="tab-venues-btn"
            aria-label={t('navVenues')}
            onClick={() => router.push('/(tabs)/venues' as Href)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              minHeight: 48,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            {isVenues ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  backgroundColor: Tokens.colors.lime,
                  borderRadius: Tokens.radii.pill,
                  padding: '6px 14px',
                }}
              >
                <MapPin size={18} color={Tokens.colors.ink} strokeWidth={2} />
                <span
                  style={{
                    fontSize: Tokens.fontSize.xs,
                    fontWeight: Tokens.fontWeight.bold,
                    color: Tokens.colors.ink,
                    fontFamily: Typography.fontFamily.medium,
                  }}
                >
                  Venues
                </span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                <MapPin size={20} color={Tokens.colors.muted} strokeWidth={1.75} />
                <span
                  style={{
                    fontSize: Tokens.fontSize.xs,
                    fontWeight: Tokens.fontWeight.medium,
                    color: Tokens.colors.muted,
                    fontFamily: Typography.fontFamily.medium,
                  }}
                >
                  Venues
                </span>
              </div>
            )}
          </button>

          <button
            type="button"
            data-testid="tab-profile-btn"
            aria-label={t('navProfile')}
            onClick={() => router.push('/(tabs)/profile' as Href)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              minHeight: 48,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            {isProfile ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  backgroundColor: Tokens.colors.lime,
                  borderRadius: Tokens.radii.pill,
                  padding: '6px 14px',
                }}
              >
                <User size={18} color={Tokens.colors.ink} strokeWidth={2} />
                <span
                  style={{
                    fontSize: Tokens.fontSize.xs,
                    fontWeight: Tokens.fontWeight.bold,
                    color: Tokens.colors.ink,
                    fontFamily: Typography.fontFamily.medium,
                  }}
                >
                  Profile
                </span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                <User size={20} color={Tokens.colors.muted} strokeWidth={1.75} />
                <span
                  style={{
                    fontSize: Tokens.fontSize.xs,
                    fontWeight: Tokens.fontWeight.medium,
                    color: Tokens.colors.muted,
                    fontFamily: Typography.fontFamily.medium,
                  }}
                >
                  Profile
                </span>
              </div>
            )}
          </button>
        </nav>
      </div>
    </Tabs>
  );
}
