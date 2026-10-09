import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Tokens } from '@/constants/theme';

interface LevelOnboardingProps {
  onComplete: (calculatedLevel: number, band: string) => void;
}

export function LevelOnboarding({ onComplete }: LevelOnboardingProps) {
  const [yearsPlaying, setYearsPlaying] = useState<'less_than_1' | '1_to_3' | 'more_than_3'>('less_than_1');
  const [experience, setExperience] = useState<'social_only' | 'regular' | 'tournament'>('social_only');
  const [usesBandeja, setUsesBandeja] = useState<boolean>(false);
  const [wallConfidence, setWallConfidence] = useState<'learning' | 'comfortable' | 'advanced'>('learning');
  const [result, setResult] = useState<{ level: number; band: string } | null>(null);

  const calculate = () => {
    let score = 1.5;
    if (yearsPlaying === '1_to_3') score += 0.5;
    if (yearsPlaying === 'more_than_3') score += 1.0;

    if (experience === 'regular') score += 0.5;
    if (experience === 'tournament') score += 1.0;

    if (usesBandeja) score += 0.5;

    if (wallConfidence === 'comfortable') score += 0.3;
    if (wallConfidence === 'advanced') score += 0.7;

    const finalLevel = Math.round(Math.min(7.0, Math.max(1.0, score)) * 10) / 10;
    let band = '1.0 - 2.0 (Beginner)';
    if (finalLevel >= 2.0 && finalLevel < 3.0) band = '2.0 - 3.0 (Improver)';
    if (finalLevel >= 3.0 && finalLevel < 4.0) band = '3.0 - 4.0 (Intermediate)';
    if (finalLevel >= 4.0 && finalLevel < 5.5) band = '4.0 - 5.5 (Advanced)';
    if (finalLevel >= 5.5) band = '5.5 - 7.0 (Expert)';

    setResult({ level: finalLevel, band });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Find Your Padel Level</Text>
        <Text style={styles.subtitle}>
          Answer 4 quick questions. Your initial rating will be provisional and adapt as you play.
        </Text>

        {/* Question 1 */}
        <View style={styles.card}>
          <Text style={styles.questionNum}>QUESTION 1</Text>
          <Text style={styles.questionText}>How long have you been playing padel?</Text>
          <View style={styles.optionsRow}>
            {[
              { id: 'less_than_1', label: '< 1 Year' },
              { id: '1_to_3', label: '1 - 3 Years' },
              { id: 'more_than_3', label: '3+ Years' },
            ].map((opt) => (
              <TouchableOpacity
                key={opt.id}
                style={[
                  styles.optionChip,
                  yearsPlaying === opt.id && styles.optionChipActive,
                ]}
                onPress={() => setYearsPlaying(opt.id as typeof yearsPlaying)}
                accessibilityRole="button"
                accessibilityLabel={opt.label}
              >
                <Text
                  style={[
                    styles.optionChipText,
                    yearsPlaying === opt.id && styles.optionChipTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Question 2 */}
        <View style={styles.card}>
          <Text style={styles.questionNum}>QUESTION 2</Text>
          <Text style={styles.questionText}>What kind of padel do you play?</Text>
          <View style={styles.optionsRow}>
            {[
              { id: 'social_only', label: 'Casual / Social' },
              { id: 'regular', label: 'Club Matches' },
              { id: 'tournament', label: 'Tournaments' },
            ].map((opt) => (
              <TouchableOpacity
                key={opt.id}
                style={[
                  styles.optionChip,
                  experience === opt.id && styles.optionChipActive,
                ]}
                onPress={() => setExperience(opt.id as typeof experience)}
                accessibilityRole="button"
                accessibilityLabel={opt.label}
              >
                <Text
                  style={[
                    styles.optionChipText,
                    experience === opt.id && styles.optionChipTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Question 3 */}
        <View style={styles.card}>
          <Text style={styles.questionNum}>QUESTION 3</Text>
          <Text style={styles.questionText}>Do you comfortably use Bandeja / Víbora?</Text>
          <View style={styles.optionsRow}>
            <TouchableOpacity
              style={[
                styles.optionChip,
                !usesBandeja && styles.optionChipActive,
              ]}
              onPress={() => setUsesBandeja(false)}
              accessibilityRole="button"
              accessibilityLabel="Still Learning"
            >
              <Text
                style={[
                  styles.optionChipText,
                  !usesBandeja && styles.optionChipTextActive,
                ]}
              >
                Still Learning
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.optionChip,
                usesBandeja && styles.optionChipActive,
              ]}
              onPress={() => setUsesBandeja(true)}
              accessibilityRole="button"
              accessibilityLabel="Yes, Deliberately"
            >
              <Text
                style={[
                  styles.optionChipText,
                  usesBandeja && styles.optionChipTextActive,
                ]}
              >
                Yes, Deliberately
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Question 4 */}
        <View style={styles.card}>
          <Text style={styles.questionNum}>QUESTION 4</Text>
          <Text style={styles.questionText}>How confident are you using the glass walls?</Text>
          <View style={styles.optionsRow}>
            {[
              { id: 'learning', label: 'Cautious' },
              { id: 'comfortable', label: 'Comfortable' },
              { id: 'advanced', label: 'Use it Tactically' },
            ].map((opt) => (
              <TouchableOpacity
                key={opt.id}
                style={[
                  styles.optionChip,
                  wallConfidence === opt.id && styles.optionChipActive,
                ]}
                onPress={() => setWallConfidence(opt.id as typeof wallConfidence)}
                accessibilityRole="button"
                accessibilityLabel={opt.label}
              >
                <Text
                  style={[
                    styles.optionChipText,
                    wallConfidence === opt.id && styles.optionChipTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {result ? (
          <View style={styles.resultCard}>
            <Text style={styles.resultLabel}>PROVISIONAL RATING</Text>
            <View style={styles.circleGauge}>
              <Text style={styles.circleScore}>{result.level}</Text>
              <Text style={styles.circleBand}>{result.band.split(' ')[2] || 'Level'}</Text>
            </View>
            <Text style={styles.bandTitle}>{result.band}</Text>
            <Text style={styles.resultExpl}>
              We think you are {result.band}. Your rating starts provisional with 50% reliability and automatically tunes after each match.
            </Text>

            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={() => onComplete(result.level, result.band)}
              accessibilityRole="button"
              accessibilityLabel="Save My Level and Continue"
            >
              <Text style={styles.confirmBtnText}>Save My Level & Continue</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.calcBtn}
            onPress={calculate}
            accessibilityRole="button"
            accessibilityLabel="Calculate My Level"
          >
            <Text style={styles.calcBtnText}>Calculate My Level</Text>
          </TouchableOpacity>
        )}
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
    padding: Tokens.spacing.lg,
    paddingBottom: Tokens.spacing.xl,
  },
  title: {
    color: Tokens.colors.text,
    fontSize: Tokens.fontSize.xl,
    fontWeight: Tokens.fontWeight.semibold,
  },
  subtitle: {
    color: Tokens.colors.textMuted,
    fontSize: Tokens.fontSize.sm,
    marginTop: Tokens.spacing.xs,
    marginBottom: Tokens.spacing.lg,
    lineHeight: 20,
  },
  card: {
    backgroundColor: Tokens.colors.surface,
    borderRadius: Tokens.radii.card,
    padding: Tokens.spacing.md,
    marginBottom: Tokens.spacing.md,
    borderWidth: Tokens.borders.width,
    borderColor: Tokens.colors.border,
  },
  questionNum: {
    color: Tokens.colors.primaryText,
    fontSize: Tokens.fontSize.xs,
    fontWeight: Tokens.fontWeight.semibold,
    letterSpacing: 1,
  },
  questionText: {
    color: Tokens.colors.text,
    fontSize: Tokens.fontSize.base,
    fontWeight: Tokens.fontWeight.semibold,
    marginTop: Tokens.spacing.xs,
    marginBottom: Tokens.spacing.md,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Tokens.spacing.xs,
  },
  optionChip: {
    minHeight: Tokens.dimensions.minTouchTarget,
    paddingVertical: Tokens.spacing.xs,
    paddingHorizontal: Tokens.spacing.md,
    borderRadius: Tokens.radii.sm,
    backgroundColor: Tokens.colors.surface,
    borderWidth: Tokens.borders.width,
    borderColor: Tokens.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionChipActive: {
    backgroundColor: Tokens.colors.primaryLight,
    borderColor: Tokens.colors.primaryText,
  },
  optionChipText: {
    color: Tokens.colors.text,
    fontSize: Tokens.fontSize.sm,
    fontWeight: Tokens.fontWeight.medium,
  },
  optionChipTextActive: {
    color: Tokens.colors.primaryText,
    fontWeight: Tokens.fontWeight.semibold,
  },
  calcBtn: {
    backgroundColor: Tokens.colors.primary,
    minHeight: Tokens.dimensions.minTouchTarget,
    height: 48,
    borderRadius: Tokens.radii.button,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Tokens.spacing.sm,
  },
  calcBtnText: {
    color: Tokens.colors.primaryForeground,
    fontSize: Tokens.fontSize.base,
    fontWeight: Tokens.fontWeight.semibold,
  },
  resultCard: {
    backgroundColor: Tokens.colors.surface,
    borderRadius: Tokens.radii.card,
    padding: Tokens.spacing.lg,
    alignItems: 'center',
    marginTop: Tokens.spacing.md,
    borderWidth: Tokens.borders.width,
    borderColor: Tokens.colors.border,
  },
  resultLabel: {
    color: Tokens.colors.goldText,
    fontSize: Tokens.fontSize.xs,
    fontWeight: Tokens.fontWeight.semibold,
    letterSpacing: 1.5,
  },
  circleGauge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: Tokens.colors.primaryText,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Tokens.spacing.md,
    backgroundColor: Tokens.colors.surfaceMuted,
  },
  circleScore: {
    color: Tokens.colors.text,
    fontSize: Tokens.fontSize.xxl,
    fontWeight: Tokens.fontWeight.semibold,
    fontVariant: ['tabular-nums'],
  },
  circleBand: {
    color: Tokens.colors.primaryText,
    fontSize: Tokens.fontSize.xs,
    fontWeight: Tokens.fontWeight.semibold,
    textTransform: 'uppercase',
  },
  bandTitle: {
    color: Tokens.colors.text,
    fontSize: Tokens.fontSize.lg,
    fontWeight: Tokens.fontWeight.semibold,
  },
  resultExpl: {
    color: Tokens.colors.textMuted,
    fontSize: Tokens.fontSize.sm,
    textAlign: 'center',
    marginTop: Tokens.spacing.xs,
    marginBottom: Tokens.spacing.lg,
    lineHeight: 18,
  },
  confirmBtn: {
    backgroundColor: Tokens.colors.primary,
    minHeight: Tokens.dimensions.minTouchTarget,
    height: 48,
    borderRadius: Tokens.radii.button,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: {
    color: Tokens.colors.primaryForeground,
    fontSize: Tokens.fontSize.base,
    fontWeight: Tokens.fontWeight.semibold,
  },
});
