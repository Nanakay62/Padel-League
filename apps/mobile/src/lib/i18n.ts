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
    heroTitle: 'Meet. Play. Build the community.',
    heroSubtitle: 'Accra’s dedicated circuit connecting players and clubs across Airport Residential, East Legon, and Cantonments.',
    heroTagline: 'Same Court, Different Stories',
    heroCircuitBadge: 'ACCRA PADEL CIRCUIT',
    heroCommunityOpenPlay: 'Community Open Play',
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
    nextGameTag: 'YOUR NEXT GAME',
    inTwoDaysBadge: 'In 2 days',
    confirmedBadge: 'Confirmed',
    paidViaMoMo: 'Paid via MTN MoMo',
    levelLabel: 'Level',
    capacityLabel: 'Capacity',
    formatLabel: 'Format',
    viewSessionBtn: 'View session',
    courtsideLiveBtn: 'Courtside Live',
    confirmedPlayers: '{{confirmed}}/{{max}} players',

    // Your Rating Card
    ratingTitle: 'Your Rating',
    ratingTag: 'YOUR RATING',
    ratingProvisionalTag: 'Provisional',
    accraMetroSkillIndex: 'Accra Metro Skill Index',
    calculatedLabel: 'Calculated',
    ratingReliabilityHeader: 'Rating Reliability',
    ratingReliabilityLabel: 'Reliability {{percent}}%',
    matchesStat: 'Matches',
    winRateStat: 'Win rate',
    lastUpdateTwoDays: 'Last update: 2 days ago',
    fullStatsBtn: 'Full stats',
    ratingDeltaMonth: '+0.08 this month',
    viewRatingDetails: 'View Details',

    // Play Near You
    playNearYouTitle: 'Play near you',
    playNearYouSubtitle: 'Open sessions with available slots this week',
    seeAllSessions: 'See all sessions',
    viewAllSessions: 'View all sessions',
    seatsLeftBadge: '{{count}} seats left',
    lookingForFourthBadge: 'Needs a 4th',
    joinSessionBtn: 'Join Session',
    perPlayer: 'Per player',
    viewDetailsBtn: 'View details',
    scheduleLabel: 'Schedule',
    targetLevelLabel: 'Target Level',

    // Upcoming Leagues
    upcomingLeaguesTitle: 'Upcoming leagues',
    upcomingLeaguesSubtitle: 'Official ranking tournaments across the circuit',
    seeAllLeagues: 'See all',
    circuitStandings: 'Circuit standings',
    liveBadge: 'Live',
    nextRoundBadge: 'Next round',
    leaderLabel: 'Leader',
    firstPrizeLabel: '1st Prize',
    registrationLabel: 'Registration',
    entryFeeLabel: 'Entry Fee',
    currentFirstLabel: 'Current #1',
    matchCadenceLabel: 'Match Cadence',
    weeklyLabel: 'Weekly',
    standingsBtn: 'Standings',
    registerBtn: 'Register',
    viewLadderBtn: 'View ladder',

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

    // Authentication (Slice A)
    authTitle: 'Padel Ghana',
    authTagline: 'Play. Connect. Compete.',
    authPhoneLabel: 'Phone Number',
    authPhonePlaceholder: '024 123 4567',
    authNameLabel: 'Your Name (optional)',
    authNamePlaceholder: 'e.g. Kwame Mensah',
    authSendCodeBtn: 'Send Login Code',
    authDisclaimer: 'We will send an SMS with a 6-digit code. Standard network rates apply.',
    authEnterCodeLabel: 'Enter 6-Digit Code',
    authCodeSentTo: 'Sent via SMS to {{phone}}',
    authVerifyBtn: 'Verify and Continue',
    authResendCodeBtn: 'Resend Code',
    authResendCooldown: 'Resend code in {{seconds}}s',
    authCodeExpired: 'Code expired. Please request a new code.',
    authChangePhoneBtn: 'Change phone number',
    authRateLimitError: 'Too many requests. Please wait before trying again.',
    authInvalidPhoneError: 'Please enter a valid Ghana phone number (e.g. 024 123 4567)',
    authInvalidCodeError: 'Please enter the full 6-digit verification code',
    authLogoutBtn: 'Log Out',
    authLoginRequiredMessage: 'Sign in to join events, manage your profile, and compete.',
    authSignInBtn: 'Sign In',

    // Level Onboarding & Partners (Slice B)
    onboardingTitle: 'Find Your Padel Level',
    onboardingSubtitle: 'Answer 4 quick questions. Your initial rating will be provisional and adapt as you play.',
    onboardingCalibrateBtn: 'Calibrate Level',
    onboardingProvisionalBadge: 'Provisional Rating',
    onboardingSaveBtn: 'Save My Level & Continue',
    partnersTitle: 'Find a Partner',
    partnersSubtitle: 'Connect with players in Ghana at your skill level looking for games.',
    partnersInviteBtn: 'Invite to Match',

    // Venues, Courts, and Quotes (Phase 14)
    viewClubBtn: 'View club',
    viewCourtBtn: 'View court',
    askTheClub: 'Ask the club',
    courtFee: 'Court Session',
    platformFee: 'Platform Fee',
    pricingUpdating: 'Updating price...',
    quoteExpiredNotice: 'Quote expired. Recomputing latest price...',
    quoteChangedNotice: 'Price has changed since your quote was issued.',
    bookingOpensSoon: 'Court booking opens soon',
    bookingOpensSoonDesc: 'Online booking and slot reservations are launching shortly across Ghana. In the meantime, call or WhatsApp the club directly to reserve your court.',
    requestTimeTitle: 'Request a time, the club confirms',
    contactClubCall: 'Call Club',
    contactClubWhatsApp: 'WhatsApp Club',
    ghanaPostGpsLabel: 'GhanaPostGPS',
    openInMapsLabel: 'Open in Google Maps',
    openingHoursLabel: 'Opening Hours',
    amenitiesLabel: 'Amenities',
    upcomingEventsAtClub: 'Upcoming Events Here',
    noUpcomingEvents: 'No upcoming public events scheduled.',
    courtSurfaceLabel: 'Surface',
    courtLightingLabel: 'Lighting',
    courtTypeLabel: 'Type',
    indoorCourt: 'Indoor',
    outdoorCourt: 'Outdoor',
    updatedOn: 'Updated {{date}}',
    payAtClub: 'Pay at club',
    paymentMethodsTitle: 'Payment Methods',
    mtnMoMo: 'MTN Mobile Money',
    telecelCash: 'Telecel Cash',
    atMoney: 'AT Money',
    cardPayment: 'Credit / Debit Card',
    backToClubs: 'Back to Clubs',
    backToClub: 'Back to Club',
    selectDuration: 'Duration',
    duration60: '60 min',
    duration90: '90 min',
    duration120: '120 min',
    addOnsTitle: 'Add-ons & Equipment',
    totalAmount: 'Total',
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
