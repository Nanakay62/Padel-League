import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PadelBrand } from '@/constants/theme';
import { PartnerFinder, PartnerItem } from '@/features/partners/PartnerFinder';

const SAMPLE_PARTNERS: PartnerItem[] = [
  {
    id: 'u1',
    displayName: 'Kojo Ansah',
    level: 3.4,
    levelBand: 'Intermediate',
    preferredSide: 'LEFT',
    homeVenueName: 'Accra City Padel Club',
  },
  {
    id: 'u2',
    displayName: 'Yaw Boateng',
    level: 3.8,
    levelBand: 'Intermediate',
    preferredSide: 'RIGHT',
    homeVenueName: 'Trust Sports Emporium',
  },
  {
    id: 'u3',
    displayName: 'Esi Appiah',
    level: 2.9,
    levelBand: 'Improver',
    preferredSide: 'EITHER',
    homeVenueName: 'Burma Camp Padel Court',
  },
  {
    id: 'u4',
    displayName: 'Fiifi Sam',
    level: 4.2,
    levelBand: 'Advanced',
    preferredSide: 'LEFT',
    homeVenueName: 'Accra City Padel Club',
  },
];

export default function PartnersIndexScreen() {
  const router = useRouter();

  const handleInvite = (partnerId: string) => {
    // In production, opens WhatsApp link or sends match invitation
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backText}>← Home</Text>
        </Pressable>
      </View>
      <PartnerFinder partners={SAMPLE_PARTNERS} onInvite={handleInvite} />
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
  },
  backText: {
    fontSize: 13,
    color: PadelBrand.electricGreen,
    fontWeight: '700',
  },
});
