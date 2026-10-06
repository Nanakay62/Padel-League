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
import { PadelBrand } from '@/constants/theme';

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
                <Text style={styles.teamTitle}>
                  {item.team_b_p1} & {item.team_b_p2}
                </Text>
              </View>
            </View>

            {item.venue_name && (
              <Text style={styles.venueText}>📍 {item.venue_name}</Text>
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
                  trackColor={{ false: '#25302C', true: PadelBrand.electricGreen }}
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
                      >
                        <Text style={styles.stepBtnText}>-</Text>
                      </Pressable>
                      <Text style={styles.stepVal}>{setsA}</Text>
                      <Pressable
                        style={styles.stepBtn}
                        onPress={() => setSetsA(setsA + 1)}
                      >
                        <Text style={styles.stepBtnText}>+</Text>
                      </Pressable>
                      <Text style={styles.divider}>:</Text>
                      <Pressable
                        style={styles.stepBtn}
                        onPress={() => setSetsB(Math.max(0, setsB - 1))}
                      >
                        <Text style={styles.stepBtnText}>-</Text>
                      </Pressable>
                      <Text style={styles.stepVal}>{setsB}</Text>
                      <Pressable
                        style={styles.stepBtn}
                        onPress={() => setSetsB(setsB + 1)}
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
                      >
                        <Text style={styles.stepBtnText}>-</Text>
                      </Pressable>
                      <Text style={styles.stepVal}>{gamesA}</Text>
                      <Pressable
                        style={styles.stepBtn}
                        onPress={() => setGamesA(gamesA + 1)}
                      >
                        <Text style={styles.stepBtnText}>+</Text>
                      </Pressable>
                      <Text style={styles.divider}>:</Text>
                      <Pressable
                        style={styles.stepBtn}
                        onPress={() => setGamesB(Math.max(0, gamesB - 1))}
                      >
                        <Text style={styles.stepBtnText}>-</Text>
                      </Pressable>
                      <Text style={styles.stepVal}>{gamesB}</Text>
                      <Pressable
                        style={styles.stepBtn}
                        onPress={() => setGamesB(gamesB + 1)}
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
                placeholderTextColor="#64748B"
              />

              <View style={styles.modalButtons}>
                <Pressable
                  style={styles.cancelBtn}
                  onPress={() => setActiveModalMatch(null)}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[styles.submitBtn, isSubmitting && styles.btnDisabled]}
                  onPress={handleSubmit}
                  disabled={isSubmitting}
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
    backgroundColor: PadelBrand.charcoal,
    padding: 16,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  fixtureCard: {
    backgroundColor: PadelBrand.cardDark,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: PadelBrand.borderDark,
  },
  teamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  teamCol: {
    flex: 1,
  },
  teamTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  vsText: {
    fontSize: 12,
    fontWeight: '700',
    color: PadelBrand.electricGreen,
    paddingHorizontal: 8,
  },
  venueText: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  scoreBadge: {
    backgroundColor: 'rgba(0, 200, 83, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  scoreText: {
    fontSize: 12,
    color: PadelBrand.electricGreen,
    fontWeight: '600',
  },
  scoreButton: {
    backgroundColor: PadelBrand.electricGreen,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 6,
  },
  scoreButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0B0F0E',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: PadelBrand.cardDark,
    borderRadius: 14,
    padding: 20,
    width: '100%',
    borderWidth: 1,
    borderColor: PadelBrand.borderDark,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 16,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#CBD5E1',
    marginBottom: 6,
  },
  stepperRow: {
    marginBottom: 14,
  },
  steppers: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepBtn: {
    backgroundColor: '#25302C',
    width: 36,
    height: 36,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  stepVal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    minWidth: 24,
    textAlign: 'center',
  },
  divider: {
    fontSize: 18,
    fontWeight: '700',
    color: PadelBrand.electricGreen,
    marginHorizontal: 4,
  },
  input: {
    backgroundColor: '#0B0F0E',
    borderWidth: 1,
    borderColor: PadelBrand.borderDark,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 18,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'flex-end',
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#25302C',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#E2E8F0',
  },
  submitBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: PadelBrand.electricGreen,
  },
  submitBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0B0F0E',
  },
  btnDisabled: {
    opacity: 0.5,
  },
});
