/**
 * Ghana Padel Platform Translation & Localization Dictionary
 * Ships English first; structured for localization (Twi, Ga, etc.).
 * Strict Mica guidelines: NO emojis, NO button arrows.
 */

const translations = {
  en: {
    // Brand & App
    appName: 'Padel Ghana',
    tagline: 'Play. Connect. Compete.',
    communitySubtitle: "Ghana's padel community",
    heroTitle: 'Padel in Ghana',
    heroSubtitle: 'Meet. Play. Build the Community.',
    heroTagline: 'Same Court, Different Stories',
    activePlayersStat: '1,240+ Active Players',
    partnerClubsStat: '12+ Partner Clubs',
    growingNationwideStat: 'Accra • Tema • Kumasi Growing Nationwide',
    demoDataBadge: 'Demo data',

    // Greeting
    greetingAfternoon: 'Good afternoon, Nana',

    // Navigation & Shell
    navHome: 'Home',
    navPlay: 'Play',
    navLeagues: 'Leagues',
    navCommunity: 'Community',
    navVenues: 'Venues',
    navCredits: 'Credits',
    navProfile: 'Profile',
    navSearch: 'Search',
    navNotifications: 'Notifications',
    searchPlaceholder: 'Search events, players, clubs...',

    // Quick Actions
    quickActionsTitle: 'Quick Actions',
    actionCreateEvent: 'Create Event',
    actionFindFourth: 'Find a Fourth',
    actionJoinLeague: 'Join League',
    actionViewVenues: 'View Venues',
    actionSettings: 'Settings',
    actionFindEvents: 'Find Events',
    exploreVenuesBannerTitle: 'Explore Venues Across Ghana',
    exploreVenuesBannerSubtitle: 'Find courts in Accra, Tema, and Kumasi with real-time slot availability.',
    exploreVenuesBannerBtn: 'Explore Venues',

    // Next Game Card
    nextGameTitle: 'Your Next Game',
    inTwoDaysBadge: 'In 2 days',
    viewSessionBtn: 'View Session',
    courtsideLiveBtn: 'Courtside Live',
    confirmedPlayers: '{{confirmed}}/{{max}} players',

    // Your Rating Card
    ratingTitle: 'Your Rating',
    ratingProvisionalTag: 'Provisional',
    ratingReliabilityLabel: 'Reliability {{percent}}%',
    ratingDeltaMonth: '+0.08 this month',
    viewRatingDetails: 'View Details',

    // Play Near You
    playNearYouTitle: 'Play Near You',
    seeAllSessions: 'See all sessions',
    seatsLeftBadge: '{{count}} seats left',
    lookingForFourthBadge: 'Needs a 4th',
    joinSessionBtn: 'Join Session',

    // Upcoming Leagues
    upcomingLeaguesTitle: 'Upcoming Leagues',
    seeAllLeagues: 'See all',
    liveBadge: 'Live',
    nextRoundBadge: 'Next round',

    // Status Enums mapped to human labels
    statusOpen: 'Open',
    statusFull: 'Full',
    statusDraft: 'Draft',
    statusInProgress: 'In Progress',
    statusCompleted: 'Completed',
    statusCancelled: 'Cancelled',
    statusNeedsFourth: 'Needs a 4th',

    // Community Stats
    communityTitle: "Ghana's Padel Community",
    communityDesc: 'Players, clubs, events and more.',
    communityPlayers: '1,240+ Players',
    communityClubs: '18 Clubs',
    communityEvents: '320+ Events this month',
    communityAvgRating: '4.7 Avg. club rating',
    topPlayersTitle: 'Top Players This Month',

    // Placeholders
    placeholderCommunityTitle: 'Community',
    placeholderCommunityText: 'Player matchmaking, rankings, and community groups arrive in Phase 3.',
    placeholderProfileTitle: 'Profile',
    placeholderProfileText: 'Player profiles, reliability history, and notification preferences arrive in Phase 3.',
    placeholderSearchTitle: 'Search',
    placeholderSearchText: 'Global search across events, courts, and players arrives in Phase 3.',
    placeholderNotificationsTitle: 'Notifications',
    placeholderNotificationsText: 'Match reminders and score update notifications arrive in Phase 3.',
  },
} as const;

export type TranslationKey = keyof typeof translations.en;

export function t(key: TranslationKey, params?: Record<string, string | number>): string {
  let text: string = (translations.en as Record<string, string>)[key] || key;
  if (params) {
    Object.entries(params).forEach(([placeholder, value]) => {
      text = text.replace(new RegExp(`{{${placeholder}}}`, 'g'), String(value));
    });
  }
  return text;
}
