import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PadelBrand } from '@/constants/theme';

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
    router.replace('/events');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
      >
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>← Cancel</Text>
        </Pressable>

        <Text style={styles.title}>Host a Padel Session</Text>
        <Text style={styles.subtitle}>
          Create Americano, Mexicano, or Team Clash with automated rotations.
        </Text>

        <View style={styles.formCard}>
          {/* Title */}
          <Text style={styles.label}>Event Title</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Saturday Morning Mexicano"
            placeholderTextColor="#64748B"
            value={title}
            onChangeText={setTitle}
          />

          {/* Venue */}
          <Text style={styles.label}>Venue</Text>
          <TextInput
            style={styles.input}
            placeholder="Select or enter club venue"
            placeholderTextColor="#64748B"
            value={venueName}
            onChangeText={setVenueName}
          />

          {/* Format Selector */}
          <Text style={styles.label}>Format</Text>
          <View style={styles.formatRow}>
            {['AMERICANO', 'MEXICANO', 'TEAM_AMERICANO'].map((fmt) => (
              <Pressable
                key={fmt}
                style={[
                  styles.formatChip,
                  format === fmt && styles.formatChipActive,
                ]}
                onPress={() => setFormat(fmt)}
              >
                <Text
                  style={[
                    styles.formatChipText,
                    format === fmt && styles.formatChipTextActive,
                  ]}
                >
                  {fmt === 'TEAM_AMERICANO' ? 'TEAM' : fmt}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Courts & Point Target */}
          <View style={styles.twoColRow}>
            <View style={styles.col}>
              <Text style={styles.label}>Courts Available</Text>
              <View style={styles.stepper}>
                <Pressable
                  style={styles.stepBtn}
                  onPress={() => setCourts(Math.max(1, courts - 1))}
                >
                  <Text style={styles.stepBtnText}>-</Text>
                </Pressable>
                <Text style={styles.stepVal}>{courts}</Text>
                <Pressable
                  style={styles.stepBtn}
                  onPress={() => setCourts(courts + 1)}
                >
                  <Text style={styles.stepBtnText}>+</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.col}>
              <Text style={styles.label}>Point Target</Text>
              <View style={styles.stepper}>
                <Pressable
                  style={styles.stepBtn}
                  onPress={() =>
                    setPointTarget(pointTarget === 32 ? 24 : 16)
                  }
                >
                  <Text style={styles.stepBtnText}>-</Text>
                </Pressable>
                <Text style={styles.stepVal}>{pointTarget}</Text>
                <Pressable
                  style={styles.stepBtn}
                  onPress={() =>
                    setPointTarget(pointTarget === 16 ? 24 : 32)
                  }
                >
                  <Text style={styles.stepBtnText}>+</Text>
                </Pressable>
              </View>
            </View>
          </View>

          {/* Price per player */}
          <Text style={styles.label}>Entry Fee per Player (GH₵)</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="60"
            placeholderTextColor="#64748B"
            value={priceCedis}
            onChangeText={setPriceCedis}
          />

          <Pressable style={styles.submitBtn} onPress={handleCreate}>
            <Text style={styles.submitBtnText}>Create & Publish Event</Text>
          </Pressable>
        </View>
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
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  backBtn: {
    marginBottom: 12,
  },
  backBtnText: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '700',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 20,
    lineHeight: 18,
  },
  formCard: {
    backgroundColor: PadelBrand.cardDark,
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: PadelBrand.borderDark,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#CBD5E1',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#0B0F0E',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: PadelBrand.borderDark,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 16,
  },
  formatRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  formatChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#0B0F0E',
    borderWidth: 1,
    borderColor: PadelBrand.borderDark,
  },
  formatChipActive: {
    backgroundColor: PadelBrand.electricGreen,
    borderColor: PadelBrand.electricGreen,
  },
  formatChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
  formatChipTextActive: {
    color: '#0B0F0E',
  },
  twoColRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  col: {
    flex: 1,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#0B0F0E',
    borderRadius: 8,
    padding: 6,
    borderWidth: 1,
    borderColor: PadelBrand.borderDark,
  },
  stepBtn: {
    width: 32,
    height: 32,
    backgroundColor: '#25302C',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  stepVal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  submitBtn: {
    backgroundColor: PadelBrand.electricGreen,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0B0F0E',
  },
});
