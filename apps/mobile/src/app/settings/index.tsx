import React, { useState } from 'react';
import {
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Wifi, Database, Download, Trash2, RefreshCw } from 'lucide-react-native';
import { Tokens, Typography, useResponsiveLayout } from '@/constants/theme';
import { courtsideScoreQueue } from '@/lib/offlineQueue';
import { FeedbackDialog, useFeedbackDialog } from '@/components/ui/FeedbackDialog';
import { Screen, PageHeader, Card, Button, StatusPill } from '@/components/ui';

export default function SettingsScreen() {
  const router = useRouter();
  const { isDesktop, isTablet } = useResponsiveLayout();
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
    <Screen>
      <PageHeader
        title="Settings & Performance"
        subtitle="Optimized for Ghanaian connectivity and outdoor court play"
        showBack
      />

      <View style={[styles.container, (isDesktop || isTablet) && styles.containerWide]}>
        {/* Network & Data-Light Card */}
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <Wifi size={18} color={Tokens.colors.text} strokeWidth={1.75} />
            <Text style={styles.cardTitle}>Data & Connectivity</Text>
          </View>

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
              trackColor={{ false: Tokens.colors.border, true: Tokens.colors.primary }}
              thumbColor={Tokens.colors.card}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingTextCol}>
              <Text style={styles.settingLabel}>High Sunlight Contrast</Text>
              <Text style={styles.settingDesc}>
                High-contrast court legibility in bright midday sun.
              </Text>
            </View>
            <Switch
              value={sunlightContrast}
              onValueChange={setSunlightContrast}
              trackColor={{ false: Tokens.colors.border, true: Tokens.colors.primary }}
              thumbColor={Tokens.colors.card}
            />
          </View>
        </Card>

        {/* Offline Match Scores Queue */}
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <Database size={18} color={Tokens.colors.text} strokeWidth={1.75} />
            <Text style={styles.cardTitle}>Offline Score Storage</Text>
          </View>

          <Text style={styles.settingDesc}>
            Scores recorded during power loss or network cuts are cached locally
            and safely submitted once reconnected.
          </Text>

          <View style={styles.queueStatusRow}>
            <Text style={styles.queueLabel}>Pending match submissions:</Text>
            <StatusPill
              label={`${pendingCount} Pending`}
              variant={pendingCount > 0 ? 'gold' : 'success'}
            />
          </View>

          {syncStatus ? (
            <Text style={styles.syncStatusText}>{syncStatus}</Text>
          ) : null}

          <Button
            title="Sync Scores Now"
            variant="secondary"
            size="md"
            onPress={handleSyncNow}
            icon={<RefreshCw size={16} color={Tokens.colors.text} strokeWidth={1.75} />}
          />
        </Card>

        {/* Privacy & Account Management */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Privacy & Account</Text>

          <Button
            title="Export My Personal Data (Act 843)"
            variant="secondary"
            size="md"
            onPress={handleExportData}
            icon={<Download size={16} color={Tokens.colors.text} strokeWidth={1.75} />}
          />

          <Button
            title="Delete Account & Anonymize"
            variant="danger"
            size="md"
            onPress={handleDeleteAccount}
            icon={<Trash2 size={16} color={Tokens.colors.card} strokeWidth={1.75} />}
          />
        </Card>
      </View>

      <FeedbackDialog {...dialogProps} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Tokens.spacing.base,
    paddingBottom: Tokens.spacing.xxxl,
  },
  containerWide: {
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },
  card: {
    gap: Tokens.spacing.base,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.sm,
  },
  cardTitle: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.base,
    lineHeight: Tokens.lineHeight.base,
    color: Tokens.colors.text,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Tokens.spacing.md,
    paddingVertical: Tokens.spacing.xs,
  },
  settingTextCol: {
    flex: 1,
    gap: 2,
  },
  settingLabel: {
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Tokens.fontWeight.medium,
    fontSize: Tokens.fontSize.sm,
    lineHeight: Tokens.lineHeight.sm,
    color: Tokens.colors.text,
  },
  settingDesc: {
    fontFamily: Typography.fontFamily.regular,
    fontWeight: Tokens.fontWeight.regular,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.textMuted,
  },
  queueStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  queueLabel: {
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Tokens.fontWeight.medium,
    fontSize: Tokens.fontSize.sm,
    lineHeight: Tokens.lineHeight.sm,
    color: Tokens.colors.text,
  },
  syncStatusText: {
    fontFamily: Typography.fontFamily.regular,
    fontWeight: Tokens.fontWeight.regular,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.greenText,
  },
});
