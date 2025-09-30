import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { router } from 'expo-router';
import * as Application from 'expo-application';
import { useSettingsStore } from '../../store/settingsStore';
import { IconButton } from '../components/IconButton';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { theme } from '../../lib/theme';
import { haptics } from '../../lib/haptics';
import { exportAllNotes, importNotes } from '../../lib/exportImport';
import { formatFullDate } from '../../utils/date';

export default function SettingsScreen() {
  const { appLockEnabled, lastBackupAt, setAppLockEnabled, setLastBackupAt } = useSettingsStore();
  const [showImportDialog, setShowImportDialog] = useState(false);

  const handleBack = () => {
    router.back();
  };

  const handleToggleAppLock = async (value: boolean) => {
    await setAppLockEnabled(value);
    haptics.light();
  };

  const handleExportNotes = async () => {
    try {
      const fileUri = await exportAllNotes();
      haptics.success();
      Alert.alert(
        'Export Complete',
        `Notes exported to: ${fileUri}`,
        [{ text: 'OK' }]
      );
      setLastBackupAt(Date.now());
    } catch (error) {
      console.error('Export failed:', error);
      Alert.alert('Export Failed', 'Failed to export notes. Please try again.');
    }
  };

  const handleImportNotes = async () => {
    try {
      // TODO: Implement file picker
      Alert.alert(
        'Import Notes',
        'File picker functionality will be implemented in the next version.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Import failed:', error);
      Alert.alert('Import Failed', 'Failed to import notes. Please try again.');
    }
  };

  const confirmImport = () => {
    setShowImportDialog(false);
    handleImportNotes();
  };

  const SettingItem: React.FC<{
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightElement?: React.ReactNode;
    destructive?: boolean;
  }> = ({ title, subtitle, onPress, rightElement, destructive = false }) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, destructive && styles.destructiveText]}>
          {title}
        </Text>
        {subtitle && (
          <Text style={styles.settingSubtitle}>{subtitle}</Text>
        )}
      </View>
      {rightElement && (
        <View style={styles.settingRight}>
          {rightElement}
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <IconButton onPress={handleBack} accessibilityLabel="Go back">
          <Text style={styles.headerIcon}>←</Text>
        </IconButton>
        <Text style={styles.title}>Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content}>
        {/* Security Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>
          
          <SettingItem
            title="App Lock"
            subtitle="Require biometric authentication to open the app"
            rightElement={
              <Switch
                value={appLockEnabled}
                onValueChange={handleToggleAppLock}
                trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
                thumbColor={appLockEnabled ? '#FFFFFF' : theme.colors.textMuted}
              />
            }
          />
        </View>

        {/* Backup & Restore Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Backup & Restore</Text>
          
          <SettingItem
            title="Export Notes"
            subtitle={lastBackupAt ? `Last backup: ${formatFullDate(lastBackupAt)}` : 'Export all notes to JSON file'}
            onPress={handleExportNotes}
            rightElement={<Text style={styles.chevron}>›</Text>}
          />
          
          <SettingItem
            title="Import Notes"
            subtitle="Import notes from JSON file"
            onPress={() => setShowImportDialog(true)}
            rightElement={<Text style={styles.chevron}>›</Text>}
          />
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          
          <SettingItem
            title="Version"
            subtitle={Application.nativeApplicationVersion || '1.0.0'}
          />
          
          <SettingItem
            title="Build"
            subtitle={Application.nativeBuildVersion || '1'}
          />
        </View>
      </ScrollView>

      <ConfirmDialog
        visible={showImportDialog}
        title="Import Notes"
        message="This will import notes from a JSON file. Existing notes with the same ID will be updated, others will be added as new notes."
        confirmText="Import"
        cancelText="Cancel"
        onConfirm={confirmImport}
        onCancel={() => setShowImportDialog(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerSpacer: {
    width: 44, // Same width as back button for centering
  },
  title: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text,
  },
  headerIcon: {
    fontSize: 20,
    color: theme.colors.text,
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text,
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textMuted,
  },
  settingRight: {
    marginLeft: theme.spacing.md,
  },
  chevron: {
    fontSize: 18,
    color: theme.colors.textMuted,
  },
  destructiveText: {
    color: theme.colors.danger,
  },
});
