import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PadelBrand } from '@/constants/theme';
import { VenueItem, VenueListScreen } from '@/features/venues/VenueListScreen';

const SAMPLE_VENUES: VenueItem[] = [
  {
    id: 'v1',
    name: 'Accra City Padel Club',
    address: 'Ring Road Central, Kanda, Accra',
    ghanapostGps: 'GA-492-8012',
    courtCount: 3,
    outdoorCourts: 3,
    baseRateFormatted: 'GH₵ 250 / hr',
    mapsUrl: 'https://maps.google.com/?q=accra_padel',
    bookingPhone: '+233240001122',
  },
  {
    id: 'v2',
    name: 'Trust Sports Emporium Padel',
    address: 'Bukom, High Street, Accra',
    ghanapostGps: 'GA-110-3344',
    courtCount: 2,
    indoorCourts: 2,
    baseRateFormatted: 'GH₵ 300 / hr',
    mapsUrl: 'https://maps.google.com/?q=trust_emporium',
    bookingPhone: '+233240003344',
  },
  {
    id: 'v3',
    name: 'Burma Camp Padel Court',
    address: 'Burma Camp Officers Mess, Accra',
    ghanapostGps: 'GL-045-8901',
    courtCount: 2,
    outdoorCourts: 2,
    baseRateFormatted: 'GH₵ 200 / hr',
    mapsUrl: 'https://maps.google.com/?q=burma_camp',
    bookingPhone: '+233240005566',
  },
];

export default function VenuesIndexScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backText}>← Home</Text>
        </Pressable>
      </View>
      <VenueListScreen venues={SAMPLE_VENUES} />
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
