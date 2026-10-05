import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { PadelBrand } from '@/constants/theme';

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
    let band = '1.0 – 2.0 (Beginner)';
    if (finalLevel >= 2.0 && finalLevel < 3.0) band = '2.0 – 3.0 (Improver)';
    if (finalLevel >= 3.0 && finalLevel < 4.0) band = '3.0 – 4.0 (Intermediate)';
    if (finalLevel >= 4.0 && finalLevel < 5.5) band = '4.0 – 5.5 (Advanced)';
    if (finalLevel >= 5.5) band = '5.5 – 7.0 (Expert)';

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
              { id: '1_to_3', label: '1 – 3 Years' },
              { id: 'more_than_3', label: '3+ Years' },
            ].map((opt) => (
              <TouchableOpacity
                key={opt.id}
                style={[
                  styles.optionChip,
                  yearsPlaying === opt.id && styles.optionChipActive,
                ]}
                onPress={() => setYearsPlaying(opt.id as typeof yearsPlaying)}
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
            >
              <Text style={styles.confirmBtnText}>Save My Level & Continue →</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.calcBtn} onPress={calculate}>
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
    backgroundColor: PadelBrand.charcoal,
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 14,
    marginTop: 4,
    marginBottom: 20,
    lineHeight: 20,
  },
  card: {
    backgroundColor: PadelBrand.cardDark,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: PadelBrand.borderDark,
  },
  questionNum: {
    color: PadelBrand.electricGreen,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  questionText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    marginTop: 4,
    marginBottom: 12,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#1E2623',
    borderWidth: 1,
    borderColor: '#293630',
  },
  optionChipActive: {
    backgroundColor: PadelBrand.electricGreen,
    borderColor: PadelBrand.electricGreen,
  },
  optionChipText: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '600',
  },
  optionChipTextActive: {
    color: '#0B0F0E',
    fontWeight: '700',
  },
  calcBtn: {
    backgroundColor: PadelBrand.electricGreen,
    height: 54,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  calcBtnText: {
    color: '#0B0F0E',
    fontSize: 16,
    fontWeight: '800',
  },
  resultCard: {
    backgroundColor: PadelBrand.cardDark,
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: PadelBrand.electricGreen,
  },
  resultLabel: {
    color: PadelBrand.gold,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  circleGauge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: PadelBrand.electricGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 14,
    backgroundColor: '#0F1513',
  },
  circleScore: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '900',
  },
  circleBand: {
    color: PadelBrand.electricGreen,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  bandTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  resultExpl: {
    color: '#94A3B8',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
    lineHeight: 18,
  },
  confirmBtn: {
    backgroundColor: PadelBrand.electricGreen,
    height: 52,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: {
    color: '#0B0F0E',
    fontSize: 15,
    fontWeight: '800',
  },
});
