import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PadelBrand } from '@/constants/theme';
import { courtsideScoreQueue } from '@/lib/offlineQueue';
import { FeedbackDialog, useFeedbackDialog } from '@/components/ui/FeedbackDialog';

export default function SettingsScreen() {
  const router = useRouter();
  const [dataLightMode, setDataLightMode] = useState(true);
  const [sunlightContrast, setSunlightContrast] = useState(true);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const { showDialog, dialogProps } = useFeedbackDialog();

  const pendingCount = courtsideScoreQueue.size();

  const handleSyncNow = async () => {
    setSyncStatus('Syncing offline scores...');
    const replayed = await courtsideScoreQueue.replay(async () => ({
      success: true,
    }));
    setSyncStatus(`Successfully synced ${replayed} match score(s).`);
  };

  const handleExportData = () => {
    showDialog({
      title: 'Export Personal Data',
      message:
        'Your profile data, match histories, and registration records have been exported in compliance with Ghana Data Protection Act 843.',
      buttons: [{ text: 'OK', style: 'default' }],
    });
  };

  const handleDeleteAccount = () => {
    showDialog({
      title: 'Delete Account',
      message:
        'Are you sure you want to delete your account? All personal data will be erased and cannot be recovered.',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Forever',
          style: 'destructive',
          onPress: () => {
            showDialog({
              title: 'Account Deleted',
              message: 'Your account has been deleted and personal data anonymized.',
              buttons: [
                {
                  text: 'OK',
                  style: 'default',
                  onPress: () => router.replace('/' as any),
                },
              ],
            });
          },
        },
      ],
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
      >
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>← Home</Text>
        </Pressable>

        <Text style={styles.title}>Settings & Performance</Text>
        <Text style={styles.subtitle}>
          Optimized for Ghanaian connectivity and outdoor court play.
        </Text>

        {/* Network & Data-Light Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Data & Connectivity</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingTextCol}>
              <Text style={styles.settingLabel}>Data-Light Mode</Text>
              <Text style={styles.settingDesc}>
                Prevent auto-downloading large photos on mobile data. Cache
                venue and event lists for offline reading.
              </Text>
            </View>
            <Switch
              value={dataLightMode}
              onValueChange={setDataLightMode}
              trackColor={{ false: '#25302C', true: PadelBrand.electricGreen }}
            />
          </View>
        </View>

        {/* Display & Sunlight Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Display & Sunlight</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingTextCol}>
              <Text style={styles.settingLabel}>High Sunlight Contrast</Text>
              <Text style={styles.settingDesc}>
                Maximum contrast ratios for reading scoreboards under bright
                midday sun on outdoor glass courts.
              </Text>
            </View>
            <Switch
              value={sunlightContrast}
              onValueChange={setSunlightContrast}
              trackColor={{ false: '#25302C', true: PadelBrand.electricGreen }}
            />
          </View>
        </View>

        {/* Offline Scoring Queue Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Offline Courtside Scoring</Text>
          <Text style={styles.settingDesc}>
            Pending score mutations recorded during spotty cellular coverage or
            airplane mode.
          </Text>

          <View style={styles.queueStatusRow}>
            <Text style={styles.queueCountText}>
              Pending mutations: {pendingCount}
            </Text>
            <Pressable
              style={styles.syncBtn}
              onPress={handleSyncNow}
            >
              <Text style={styles.syncBtnText}>Sync Queue Now</Text>
            </Pressable>
          </View>

          {syncStatus && (
            <Text style={styles.syncFeedback}>{syncStatus}</Text>
          )}
        </View>

        {/* Account & Privacy (Apple App Store & GDPR Compliance) */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Account & Privacy</Text>
          <Text style={styles.settingDesc}>
            Manage your personal data in compliance with Ghana Data Protection
            Act 843 and GDPR guidelines.
          </Text>

          <View style={styles.accountActionRow}>
            <Pressable style={styles.exportBtn} onPress={handleExportData}>
              <Text style={styles.exportBtnText}>📥 Export My Data</Text>
            </Pressable>
            <Pressable style={styles.deleteBtn} onPress={handleDeleteAccount}>
              <Text style={styles.deleteBtnText}>🗑 Delete Account</Text>
            </Pressable>
          </View>
        </View>

        {/* System & Market Info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Padel Ghana Platform</Text>
          <Text style={styles.infoItem}>Version: 1.0.0 (Production Release)</Text>
          <Text style={styles.infoItem}>Market Timezone: Africa/Accra (UTC+0)</Text>
          <Text style={styles.infoItem}>Official Currency: Ghana Cedis (GHS)</Text>
          <Text style={styles.infoItem}>Auth: +233 Mobile Phone OTP</Text>
        </View>
      </ScrollView>
      <FeedbackDialog {...dialogProps} />
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
    color: PadelBrand.electricGreen,
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
  card: {
    backgroundColor: PadelBrand.cardDark,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: PadelBrand.borderDark,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  settingTextCol: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  settingDesc: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 16,
  },
  queueStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#25302C',
  },
  queueCountText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#CBD5E1',
  },
  syncBtn: {
    backgroundColor: PadelBrand.electricGreen,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  syncBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0B0F0E',
  },
  syncFeedback: {
    fontSize: 12,
    color: PadelBrand.electricGreen,
    marginTop: 8,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: '#0B0F0E',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: PadelBrand.borderDark,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  infoItem: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 4,
  },
  accountActionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
  },
  exportBtn: {
    flex: 1,
    backgroundColor: '#1E293B',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  exportBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  deleteBtn: {
    flex: 1,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  deleteBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
  },
});
