import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Minus, Plus } from 'lucide-react-native';
import { Tokens, Typography } from '@/constants/theme';
import { Screen, PageHeader, Card, Button, Chip } from '@/components/ui';

export default function CreateEventScreen() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [venueName, setVenueName] = useState('Accra City Padel Club');
  const [format, setFormat] = useState('AMERICANO');
  const [courts, setCourts] = useState(2);
  const [pointTarget, setPointTarget] = useState(24);
  const [priceCedis, setPriceCedis] = useState('60');

  const handleCreate = () => {
    // In production, posts to POST /events
    router.replace('/events' as any);
  };

  return (
    <Screen>
      <PageHeader
        title="Host a Padel Session"
        subtitle="Automated rotations & live scoring"
        showBack
      />

      <Card style={styles.formCard}>
        {/* Title */}
        <Text style={styles.label}>Event Title</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Saturday Morning Mexicano"
          placeholderTextColor={Tokens.colors.textMuted}
          value={title}
          onChangeText={setTitle}
        />

        {/* Venue */}
        <Text style={styles.label}>Venue</Text>
        <TextInput
          style={styles.input}
          placeholder="Select or enter club venue"
          placeholderTextColor={Tokens.colors.textMuted}
          value={venueName}
          onChangeText={setVenueName}
        />

        {/* Format Selector */}
        <Text style={styles.label}>Format</Text>
        <View style={styles.formatRow}>
          {['AMERICANO', 'MEXICANO', 'TEAM_AMERICANO'].map((fmt) => (
            <Chip
              key={fmt}
              label={fmt === 'TEAM_AMERICANO' ? 'TEAM' : fmt}
              selected={format === fmt}
              onPress={() => setFormat(fmt)}
            />
          ))}
        </View>

        {/* Courts & Point Target */}
        <View style={styles.twoColRow}>
          <View style={styles.col}>
            <Text style={styles.label}>Courts Available</Text>
            <View style={styles.stepper}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Decrease courts"
                style={styles.stepBtn}
                onPress={() => setCourts(Math.max(1, courts - 1))}
              >
                <Minus size={16} color={Tokens.colors.text} strokeWidth={2} />
              </Pressable>
              <Text style={[styles.stepVal, Typography.tabularNums]}>{courts}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Increase courts"
                style={styles.stepBtn}
                onPress={() => setCourts(courts + 1)}
              >
                <Plus size={16} color={Tokens.colors.text} strokeWidth={2} />
              </Pressable>
            </View>
          </View>

          <View style={styles.col}>
            <Text style={styles.label}>Point Target</Text>
            <View style={styles.stepper}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Decrease point target"
                style={styles.stepBtn}
                onPress={() => setPointTarget(Math.max(16, pointTarget - 4))}
              >
                <Minus size={16} color={Tokens.colors.text} strokeWidth={2} />
              </Pressable>
              <Text style={[styles.stepVal, Typography.tabularNums]}>{pointTarget}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Increase point target"
                style={styles.stepBtn}
                onPress={() => setPointTarget(pointTarget + 4)}
              >
                <Plus size={16} color={Tokens.colors.text} strokeWidth={2} />
              </Pressable>
            </View>
          </View>
        </View>

        {/* Price */}
        <Text style={styles.label}>Player Entry Fee (GH₵)</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          placeholder="e.g. 60"
          placeholderTextColor={Tokens.colors.textMuted}
          value={priceCedis}
          onChangeText={setPriceCedis}
        />

        {/* Action Button */}
        <Button
          title="Publish Event"
          variant="primary"
          size="lg"
          onPress={handleCreate}
          style={styles.submitBtn}
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  formCard: {
    gap: Tokens.spacing.base,
    padding: Tokens.spacing.xl,
    marginBottom: Tokens.spacing.xxxl,
  },
  label: {
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Tokens.fontWeight.medium,
    fontSize: Tokens.fontSize.sm,
    lineHeight: Tokens.lineHeight.sm,
    color: Tokens.colors.text,
  },
  input: {
    backgroundColor: Tokens.colors.background,
    borderRadius: Tokens.radii.input,
    borderWidth: 1,
    borderColor: Tokens.colors.border,
    paddingHorizontal: Tokens.spacing.base,
    paddingVertical: Tokens.spacing.md,
    color: Tokens.colors.text,
    fontFamily: Typography.fontFamily.regular,
    fontSize: Tokens.fontSize.sm,
    lineHeight: Tokens.lineHeight.sm,
    minHeight: Tokens.touch.minTarget,
  },
  formatRow: {
    flexDirection: 'row',
    gap: Tokens.spacing.sm,
  },
  twoColRow: {
    flexDirection: 'row',
    gap: Tokens.spacing.base,
  },
  col: {
    flex: 1,
    gap: Tokens.spacing.xs,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Tokens.colors.background,
    borderRadius: Tokens.radii.input,
    borderWidth: 1,
    borderColor: Tokens.colors.border,
    height: Tokens.touch.minTarget,
    paddingHorizontal: Tokens.spacing.xs,
  },
  stepBtn: {
    width: Tokens.touch.minTarget,
    height: Tokens.touch.minTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepVal: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.base,
    lineHeight: Tokens.lineHeight.base,
    color: Tokens.colors.text,
  },
  submitBtn: {
    marginTop: Tokens.spacing.md,
  },
});
