import React, { useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MapPin } from 'lucide-react-native';
import { Tokens } from '@/constants/theme';

export interface LeagueFixtureItem {
  id: string;
  box_id?: string | null;
  team_a_p1: string;
  team_a_p2: string;
  team_b_p1: string;
  team_b_p2: string;
  team_a_sets?: number | null;
  team_b_sets?: number | null;
  team_a_games?: number | null;
  team_b_games?: number | null;
  is_walkover: boolean;
  walkover_winner?: string | null;
  venue_name?: string | null;
  status: string;
}

export interface ScoreSubmissionData {
  match_id: string;
  team_a_sets: number;
  team_b_sets: number;
  team_a_games: number;
  team_b_games: number;
  is_walkover: boolean;
  walkover_winner?: string | null;
  venue_name: string;
  result_id: string;
}

interface LeagueFixturesViewProps {
  fixtures: LeagueFixtureItem[];
  currentPairName?: string;
  onSubmitScore: (data: ScoreSubmissionData) => Promise<void>;
}

export function LeagueFixturesView({
  fixtures,
  onSubmitScore,
}: LeagueFixturesViewProps) {
  const [activeModalMatch, setActiveModalMatch] =
    useState<LeagueFixtureItem | null>(null);
  const [setsA, setSetsA] = useState(2);
  const [setsB, setSetsB] = useState(0);
  const [gamesA, setGamesA] = useState(12);
  const [gamesB, setGamesB] = useState(4);
  const [isWalkover, setIsWalkover] = useState(false);
  const [venueName, setVenueName] = useState('Accra City Padel Club');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenModal = (match: LeagueFixtureItem) => {
    setActiveModalMatch(match);
    setSetsA(match.team_a_sets ?? 2);
    setSetsB(match.team_b_sets ?? 0);
    setGamesA(match.team_a_games ?? 12);
    setGamesB(match.team_b_games ?? 4);
    setIsWalkover(match.is_walkover ?? false);
    setVenueName(match.venue_name || 'Accra City Padel Club');
  };

  const handleSubmit = async () => {
    if (!activeModalMatch) return;
    setIsSubmitting(true);
    try {
      // Generate idempotent client UUID for score submission
      const clientResultId = `res-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      await onSubmitScore({
        match_id: activeModalMatch.id,
        team_a_sets: setsA,
        team_b_sets: setsB,
        team_a_games: gamesA,
        team_b_games: gamesB,
        is_walkover: isWalkover,
        walkover_winner: isWalkover ? activeModalMatch.team_a_p1 : undefined,
        venue_name: venueName,
        result_id: clientResultId,
      });
      setActiveModalMatch(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionHeader}>Round-Robin Fixtures</Text>
      <FlatList
        data={fixtures}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.fixtureCard}>
            <View style={styles.teamsRow}>
              <View style={styles.teamCol}>
                <Text style={styles.teamTitle}>
                  {item.team_a_p1} & {item.team_a_p2}
                </Text>
              </View>
              <Text style={styles.vsText}>VS</Text>
              <View style={styles.teamCol}>
                <Text style={[styles.teamTitle, { textAlign: 'right' }]}>
                  {item.team_b_p1} & {item.team_b_p2}
                </Text>
              </View>
            </View>

            {item.venue_name && (
              <View style={styles.venueRow}>
                <MapPin size={12} color={Tokens.colors.textMuted} />
                <Text style={styles.venueText}>{item.venue_name}</Text>
              </View>
            )}

            <View style={styles.statusRow}>
              {item.status === 'SCORE_ENTERED' ? (
                <View style={styles.scoreBadge}>
                  <Text style={styles.scoreText}>
                    {item.is_walkover
                      ? `Walkover Awarded`
                      : `Sets: ${item.team_a_sets}-${item.team_b_sets} (${item.team_a_games}-${item.team_b_games} games)`}
                  </Text>
                </View>
              ) : (
                <Pressable
                  style={styles.scoreButton}
                  onPress={() => handleOpenModal(item)}
                  accessibilityRole="button"
                  accessibilityLabel="Enter Score"
                >
                  <Text style={styles.scoreButtonText}>Enter Score</Text>
                </Pressable>
              )}
            </View>
          </View>
        )}
      />

      {/* Courtside Score Modal */}
      {activeModalMatch && (
        <Modal
          visible
          transparent
          animationType="fade"
          onRequestClose={() => setActiveModalMatch(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Submit Match Score</Text>
              <Text style={styles.modalSubtitle}>
                {activeModalMatch.team_a_p1} vs {activeModalMatch.team_b_p1}
              </Text>

              {/* Walkover Switch */}
              <View style={styles.switchRow}>
                <Text style={styles.fieldLabel}>Claim Walkover (Default)</Text>
                <Switch
                  value={isWalkover}
                  onValueChange={setIsWalkover}
                  trackColor={{ false: Tokens.colors.border, true: Tokens.colors.primary }}
                />
              </View>

              {!isWalkover ? (
                <>
                  <View style={styles.stepperRow}>
                    <Text style={styles.fieldLabel}>Sets Won:</Text>
                    <View style={styles.steppers}>
                      <Pressable
                        style={styles.stepBtn}
                        onPress={() => setSetsA(Math.max(0, setsA - 1))}
                        accessibilityRole="button"
                        accessibilityLabel="Decrease sets A"
                      >
                        <Text style={styles.stepBtnText}>-</Text>
                      </Pressable>
                      <Text style={styles.stepVal}>{setsA}</Text>
                      <Pressable
                        style={styles.stepBtn}
                        onPress={() => setSetsA(setsA + 1)}
                        accessibilityRole="button"
                        accessibilityLabel="Increase sets A"
                      >
                        <Text style={styles.stepBtnText}>+</Text>
                      </Pressable>
                      <Text style={styles.divider}>:</Text>
                      <Pressable
                        style={styles.stepBtn}
                        onPress={() => setSetsB(Math.max(0, setsB - 1))}
                        accessibilityRole="button"
                        accessibilityLabel="Decrease sets B"
                      >
                        <Text style={styles.stepBtnText}>-</Text>
                      </Pressable>
                      <Text style={styles.stepVal}>{setsB}</Text>
                      <Pressable
                        style={styles.stepBtn}
                        onPress={() => setSetsB(setsB + 1)}
                        accessibilityRole="button"
                        accessibilityLabel="Increase sets B"
                      >
                        <Text style={styles.stepBtnText}>+</Text>
                      </Pressable>
                    </View>
                  </View>

                  <View style={styles.stepperRow}>
                    <Text style={styles.fieldLabel}>Total Games:</Text>
                    <View style={styles.steppers}>
                      <Pressable
                        style={styles.stepBtn}
                        onPress={() => setGamesA(Math.max(0, gamesA - 1))}
                        accessibilityRole="button"
                        accessibilityLabel="Decrease games A"
                      >
                        <Text style={styles.stepBtnText}>-</Text>
                      </Pressable>
                      <Text style={styles.stepVal}>{gamesA}</Text>
                      <Pressable
                        style={styles.stepBtn}
                        onPress={() => setGamesA(gamesA + 1)}
                        accessibilityRole="button"
                        accessibilityLabel="Increase games A"
                      >
                        <Text style={styles.stepBtnText}>+</Text>
                      </Pressable>
                      <Text style={styles.divider}>:</Text>
                      <Pressable
                        style={styles.stepBtn}
                        onPress={() => setGamesB(Math.max(0, gamesB - 1))}
                        accessibilityRole="button"
                        accessibilityLabel="Decrease games B"
                      >
                        <Text style={styles.stepBtnText}>-</Text>
                      </Pressable>
                      <Text style={styles.stepVal}>{gamesB}</Text>
                      <Pressable
                        style={styles.stepBtn}
                        onPress={() => setGamesB(gamesB + 1)}
                        accessibilityRole="button"
                        accessibilityLabel="Increase games B"
                      >
                        <Text style={styles.stepBtnText}>+</Text>
                      </Pressable>
                    </View>
                  </View>
                </>
              ) : null}

              {/* Venue Selector */}
              <Text style={styles.fieldLabel}>Venue Used (Demand Tracking)</Text>
              <TextInput
                style={styles.input}
                value={venueName}
                onChangeText={setVenueName}
                placeholder="Club / Venue Name"
                placeholderTextColor={Tokens.colors.textMuted}
              />

              <View style={styles.modalButtons}>
                <Pressable
                  style={styles.cancelBtn}
                  onPress={() => setActiveModalMatch(null)}
                  accessibilityRole="button"
                  accessibilityLabel="Cancel"
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[styles.submitBtn, isSubmitting && styles.btnDisabled]}
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                  accessibilityRole="button"
                  accessibilityLabel={isSubmitting ? 'Saving' : 'Submit Result'}
                >
                  <Text style={styles.submitBtnText}>
                    {isSubmitting ? 'Saving...' : 'Submit Result'}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Tokens.colors.background,
    padding: Tokens.spacing.md,
  },
  sectionHeader: {
    fontSize: Tokens.fontSize.base,
    fontWeight: Tokens.fontWeight.semibold,
    color: Tokens.colors.text,
    marginBottom: Tokens.spacing.sm,
  },
  fixtureCard: {
    backgroundColor: Tokens.colors.surface,
    borderRadius: Tokens.radii.card,
    padding: Tokens.spacing.md,
    marginBottom: Tokens.spacing.sm,
    borderWidth: Tokens.borders.width,
    borderColor: Tokens.colors.border,
  },
  teamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Tokens.spacing.xs,
  },
  teamCol: {
    flex: 1,
  },
  teamTitle: {
    fontSize: Tokens.fontSize.sm,
    fontWeight: Tokens.fontWeight.semibold,
    color: Tokens.colors.text,
  },
  vsText: {
    fontSize: Tokens.fontSize.xs,
    fontWeight: Tokens.fontWeight.semibold,
    color: Tokens.colors.textMuted,
    paddingHorizontal: Tokens.spacing.xs,
  },
  venueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.xs,
    marginBottom: Tokens.spacing.xs,
  },
  venueText: {
    fontSize: Tokens.fontSize.xs,
    color: Tokens.colors.textMuted,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: Tokens.spacing.xs,
  },
  scoreBadge: {
    backgroundColor: Tokens.colors.primaryLight,
    paddingHorizontal: Tokens.spacing.sm,
    paddingVertical: Tokens.spacing.xs,
    borderRadius: Tokens.radii.sm,
    borderWidth: Tokens.borders.width,
    borderColor: Tokens.colors.primaryBorder,
  },
  scoreText: {
    fontSize: Tokens.fontSize.xs,
    color: Tokens.colors.primaryText,
    fontWeight: Tokens.fontWeight.semibold,
  },
  scoreButton: {
    backgroundColor: Tokens.colors.primary,
    minHeight: Tokens.dimensions.minTouchTarget,
    paddingHorizontal: Tokens.spacing.md,
    paddingVertical: Tokens.spacing.xs,
    borderRadius: Tokens.radii.button,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreButtonText: {
    fontSize: Tokens.fontSize.sm,
    fontWeight: Tokens.fontWeight.semibold,
    color: Tokens.colors.primaryForeground,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(20, 24, 26, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Tokens.spacing.md,
  },
  modalContent: {
    backgroundColor: Tokens.colors.surface,
    borderRadius: Tokens.radii.card,
    padding: Tokens.spacing.lg,
    width: '100%',
    borderWidth: Tokens.borders.width,
    borderColor: Tokens.colors.border,
  },
  modalTitle: {
    fontSize: Tokens.fontSize.lg,
    fontWeight: Tokens.fontWeight.semibold,
    color: Tokens.colors.text,
    marginBottom: Tokens.spacing.xs,
  },
  modalSubtitle: {
    fontSize: Tokens.fontSize.sm,
    color: Tokens.colors.textMuted,
    marginBottom: Tokens.spacing.md,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Tokens.spacing.md,
  },
  fieldLabel: {
    fontSize: Tokens.fontSize.xs,
    fontWeight: Tokens.fontWeight.semibold,
    color: Tokens.colors.text,
    marginBottom: Tokens.spacing.xs,
  },
  stepperRow: {
    marginBottom: Tokens.spacing.md,
  },
  steppers: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.xs,
  },
  stepBtn: {
    backgroundColor: Tokens.colors.surfaceMuted,
    borderWidth: Tokens.borders.width,
    borderColor: Tokens.colors.border,
    minWidth: Tokens.dimensions.minTouchTarget,
    minHeight: Tokens.dimensions.minTouchTarget,
    borderRadius: Tokens.radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: {
    fontSize: Tokens.fontSize.lg,
    fontWeight: Tokens.fontWeight.semibold,
    color: Tokens.colors.text,
  },
  stepVal: {
    fontSize: Tokens.fontSize.base,
    fontWeight: Tokens.fontWeight.semibold,
    color: Tokens.colors.text,
    minWidth: 24,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  divider: {
    fontSize: Tokens.fontSize.lg,
    fontWeight: Tokens.fontWeight.semibold,
    color: Tokens.colors.textMuted,
    marginHorizontal: Tokens.spacing.xs,
  },
  input: {
    backgroundColor: Tokens.colors.surface,
    borderWidth: Tokens.borders.width,
    borderColor: Tokens.colors.border,
    borderRadius: Tokens.radii.sm,
    paddingHorizontal: Tokens.spacing.sm,
    paddingVertical: Tokens.spacing.xs,
    color: Tokens.colors.text,
    fontSize: Tokens.fontSize.sm,
    marginBottom: Tokens.spacing.md,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: Tokens.spacing.sm,
    justifyContent: 'flex-end',
  },
  cancelBtn: {
    paddingHorizontal: Tokens.spacing.md,
    minHeight: Tokens.dimensions.minTouchTarget,
    justifyContent: 'center',
    borderRadius: Tokens.radii.button,
    backgroundColor: Tokens.colors.surfaceMuted,
    borderWidth: Tokens.borders.width,
    borderColor: Tokens.colors.border,
  },
  cancelBtnText: {
    fontSize: Tokens.fontSize.sm,
    fontWeight: Tokens.fontWeight.semibold,
    color: Tokens.colors.text,
  },
  submitBtn: {
    paddingHorizontal: Tokens.spacing.md,
    minHeight: Tokens.dimensions.minTouchTarget,
    justifyContent: 'center',
    borderRadius: Tokens.radii.button,
    backgroundColor: Tokens.colors.primary,
  },
  submitBtnText: {
    fontSize: Tokens.fontSize.sm,
    fontWeight: Tokens.fontWeight.semibold,
    color: Tokens.colors.primaryForeground,
  },
  btnDisabled: {
    opacity: 0.5,
  },
});
