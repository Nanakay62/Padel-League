import React, { useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Search, X, MapPin, Calendar, Users } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Tokens, Typography } from '@/constants/theme';
import { t } from '@/lib/i18n';

export interface SearchResultItem {
  id: string;
  category: 'venue' | 'event' | 'player';
  title: string;
  subtitle: string;
  route: string;
}

const SEARCH_DATABASE: SearchResultItem[] = [
  // Venues
  {
    id: 'venue-1',
    category: 'venue',
    title: 'Accra City Padel Club',
    subtitle: 'Airport Residential Area • 3 courts',
    route: '/venues/venue-001',
  },
  {
    id: 'venue-2',
    category: 'venue',
    title: 'East Legon Padel Center',
    subtitle: 'Lagos Avenue, East Legon • 2 courts',
    route: '/venues/venue-002',
  },
  {
    id: 'venue-3',
    category: 'venue',
    title: 'Cantonments Padel Club',
    subtitle: 'Cantonments, Accra • 4 courts',
    route: '/venues/venue-003',
  },
  {
    id: 'venue-4',
    category: 'venue',
    title: 'Burma Camp Padel Court',
    subtitle: 'Burma Camp Sports Complex • 2 courts',
    route: '/venues/venue-004',
  },
  // Events
  {
    id: 'event-1',
    category: 'event',
    title: 'Friday Night Sunset',
    subtitle: 'Americano • East Legon Padel Club • Fri 6:30 PM',
    route: '/(tabs)',
  },
  {
    id: 'event-2',
    category: 'event',
    title: 'Saturday Morning Sprint',
    subtitle: 'Mexicano • Cantonments Club • Sat 8:00 AM',
    route: '/(tabs)',
  },
  {
    id: 'event-3',
    category: 'event',
    title: 'Sunday Morning Coffee & Padel',
    subtitle: 'Social Mixer • Accra Padel Club • Sun 9:00 AM',
    route: '/(tabs)',
  },
  {
    id: 'event-4',
    category: 'event',
    title: 'Thursday Americano',
    subtitle: 'Americano • Accra Padel Club • Thu 6:00 PM',
    route: '/(tabs)',
  },
  // Players
  {
    id: 'player-1',
    category: 'player',
    title: 'Kojo Mensah',
    subtitle: 'Level 3.4 • Intermediate • Accra Padel Club',
    route: '/partners',
  },
  {
    id: 'player-2',
    category: 'player',
    title: 'Yaw Boateng',
    subtitle: 'Level 3.8 • Intermediate • East Legon Padel Center',
    route: '/partners',
  },
  {
    id: 'player-3',
    category: 'player',
    title: 'Esi Asante',
    subtitle: 'Level 2.9 • Improver • Burma Camp Padel Court',
    route: '/partners',
  },
  {
    id: 'player-4',
    category: 'player',
    title: 'Fiifi Sam',
    subtitle: 'Level 4.2 • Advanced • Accra Padel Club',
    route: '/partners',
  },
  {
    id: 'player-5',
    category: 'player',
    title: 'Nana Asante',
    subtitle: 'Level 3.5 • Intermediate • Verified Player',
    route: '/partners',
  },
];

export interface DesktopSearchBarProps {
  onNavigate?: (route: string) => void;
}

export function DesktopSearchBar({ onNavigate }: DesktopSearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const filteredResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      // Suggest top items across categories
      return SEARCH_DATABASE.slice(0, 5);
    }
    return SEARCH_DATABASE.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
    );
  }, [query]);

  const handleSelectResult = (item: SearchResultItem) => {
    setIsFocused(false);
    setQuery('');
    inputRef.current?.blur();
    if (onNavigate) {
      onNavigate(item.route);
    } else {
      router.push(item.route as any);
    }
  };

  const handleClear = () => {
    setQuery('');
    inputRef.current?.focus();
  };

  const getCategoryIcon = (category: SearchResultItem['category']) => {
    switch (category) {
      case 'venue':
        return <MapPin size={14} color={Tokens.colors.primary} strokeWidth={1.75} />;
      case 'event':
        return <Calendar size={14} color={Tokens.colors.gold} strokeWidth={1.75} />;
      case 'player':
        return <Users size={14} color={Tokens.colors.greenText} strokeWidth={1.75} />;
    }
  };

  const getCategoryLabel = (category: SearchResultItem['category']) => {
    switch (category) {
      case 'venue':
        return 'Club';
      case 'event':
        return 'Event';
      case 'player':
        return 'Player';
    }
  };

  const showDropdown = isFocused || query.length > 0;

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.inputWrapper,
          isFocused && styles.inputWrapperFocused,
        ]}
        testID="topbar-search-container"
      >
        <Search size={16} color={Tokens.colors.textMuted} strokeWidth={1.75} />
        <TextInput
          ref={inputRef}
          value={query}
          onChangeText={setQuery}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            // Delay closing slightly so item presses register
            setTimeout(() => setIsFocused(false), 200);
          }}
          placeholder={t('searchPlaceholder')}
          placeholderTextColor={Tokens.colors.textMuted}
          style={styles.input}
          testID="topbar-search-input"
          accessibilityLabel={t('navSearch')}
        />
        {query.length > 0 ? (
          <TouchableOpacity
            onPress={handleClear}
            style={styles.clearBtn}
            testID="topbar-search-clear-btn"
            accessibilityLabel="Clear search"
          >
            <X size={14} color={Tokens.colors.textMuted} strokeWidth={2} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Inline Dropdown Popover */}
      {showDropdown ? (
        <View style={styles.popover} testID="topbar-search-popover">
          <View style={styles.popoverHeader}>
            <Text style={styles.popoverHeaderText}>
              {query.trim().length > 0 ? 'Results' : 'Suggested for you'}
            </Text>
          </View>

          {filteredResults.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>{'No results found for "' + query + '"'}</Text>
            </View>
          ) : (
            filteredResults.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.resultRow}
                onPress={() => handleSelectResult(item)}
                accessibilityRole="button"
                accessibilityLabel={`${item.title}, ${item.subtitle}`}
              >
                <View style={styles.iconContainer}>{getCategoryIcon(item.category)}</View>
                <View style={styles.resultTextContainer}>
                  <View style={styles.titleRow}>
                    <Text style={styles.resultTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryBadgeText}>
                        {getCategoryLabel(item.category)}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.resultSubtitle} numberOfLines={1}>
                    {item.subtitle}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: 320,
    zIndex: 100,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.sm,
    backgroundColor: Tokens.colors.background,
    borderWidth: Tokens.borders.width,
    borderColor: Tokens.colors.border,
    borderRadius: Tokens.radii.input,
    paddingHorizontal: Tokens.spacing.base,
    height: Tokens.touch.minTarget,
    minHeight: Tokens.touch.minTarget,
  },
  inputWrapperFocused: {
    borderColor: Tokens.colors.primary,
  },
  input: {
    flex: 1,
    height: '100%',
    fontFamily: Typography.fontFamily.regular,
    fontSize: Tokens.fontSize.sm,
    color: Tokens.colors.text,
    paddingVertical: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
    ...Platform.select({
      web: {
        outlineWidth: 0,
      },
    }),
  },
  clearBtn: {
    padding: Tokens.spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  popover: {
    position: 'absolute',
    top: Tokens.touch.minTarget + 6,
    left: 0,
    right: 0,
    backgroundColor: Tokens.colors.background,
    borderRadius: Tokens.radii.card,
    borderWidth: Tokens.borders.width,
    borderColor: Tokens.colors.border,
    paddingVertical: Tokens.spacing.xs,
    maxHeight: 380,
    ...Platform.select({
      web: {
        boxShadow:
          '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
      },
      default: {
        elevation: 6,
        shadowColor: Tokens.colors.text,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
    }),
  },
  popoverHeader: {
    paddingHorizontal: Tokens.spacing.base,
    paddingVertical: Tokens.spacing.xs,
    borderBottomWidth: Tokens.borders.width,
    borderBottomColor: Tokens.colors.border,
  },
  popoverHeaderText: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.xs,
    color: Tokens.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.sm,
    paddingHorizontal: Tokens.spacing.base,
    paddingVertical: Tokens.spacing.sm,
    borderBottomWidth: Tokens.borders.width,
    borderBottomColor: Tokens.colors.surfaceContainerLow,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: Tokens.radii.xs,
    backgroundColor: Tokens.colors.surfaceContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultTextContainer: {
    flex: 1,
    gap: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Tokens.spacing.xs,
  },
  resultTitle: {
    flex: 1,
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Tokens.fontWeight.medium,
    fontSize: Tokens.fontSize.sm,
    color: Tokens.colors.text,
  },
  categoryBadge: {
    backgroundColor: Tokens.colors.surfaceContainer,
    paddingHorizontal: Tokens.spacing.xs,
    paddingVertical: 1,
    borderRadius: Tokens.radii.xs,
  },
  categoryBadgeText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Tokens.fontSize.xs,
    color: Tokens.colors.textMuted,
  },
  resultSubtitle: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Tokens.fontSize.xs,
    color: Tokens.colors.textMuted,
  },
  emptyContainer: {
    padding: Tokens.spacing.base,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Tokens.fontSize.sm,
    color: Tokens.colors.textMuted,
  },
});
