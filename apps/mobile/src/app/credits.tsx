import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PadelBrand } from '@/constants/theme';
import { formatGhanaCedis } from '@/lib/formatting';

export default function CreditsScreen() {
  const router = useRouter();
  const balancePesewas = 5000; // GH₵ 50.00

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <Pressable
          style={styles.backBtn}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Credits</Text>

        <View style={styles.card}>
          <Text style={styles.balanceLabel}>Current Balance</Text>
          <Text style={styles.balanceValue}>
            {formatGhanaCedis(balancePesewas)}
          </Text>
          <Text style={styles.description}>
            Credit balance and cancellation credits arrive with payments (Phase 5)
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: PadelBrand.charcoal,
  },
  topBar: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  backBtn: {
    paddingVertical: 8,
    paddingRight: 16,
    alignSelf: 'flex-start',
  },
  backText: {
    fontSize: 14,
    color: PadelBrand.electricGreen,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  card: {
    backgroundColor: PadelBrand.cardDark,
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: PadelBrand.borderDark,
  },
  balanceLabel: {
    fontSize: 12,
    color: '#94A3B8',
    textTransform: 'uppercase',
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  balanceValue: {
    fontSize: 28,
    fontWeight: '800',
    color: PadelBrand.electricGreen,
    marginBottom: 12,
  },
  description: {
    fontSize: 13,
    color: '#CBD5E1',
    lineHeight: 18,
  },
});
