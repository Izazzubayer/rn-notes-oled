import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

interface SettingsStore {
  appLockEnabled: boolean;
  lastBackupAt?: number;
  setAppLockEnabled: (enabled: boolean) => Promise<void>;
  setLastBackupAt: (timestamp: number) => void;
  loadSettings: () => Promise<void>;
}

const STORAGE_KEYS = {
  APP_LOCK_ENABLED: 'app_lock_enabled',
  LAST_BACKUP_AT: 'last_backup_at',
} as const;

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  appLockEnabled: false,
  lastBackupAt: undefined,
  
  setAppLockEnabled: async (enabled) => {
    try {
      await SecureStore.setItemAsync(STORAGE_KEYS.APP_LOCK_ENABLED, enabled.toString());
      set({ appLockEnabled: enabled });
    } catch (error) {
      console.error('Failed to save app lock setting:', error);
    }
  },
  
  setLastBackupAt: (timestamp) => {
    set({ lastBackupAt: timestamp });
    // Store in AsyncStorage for persistence
    SecureStore.setItemAsync(STORAGE_KEYS.LAST_BACKUP_AT, timestamp.toString()).catch(console.error);
  },
  
  loadSettings: async () => {
    try {
      const [appLockEnabled, lastBackupAt] = await Promise.all([
        SecureStore.getItemAsync(STORAGE_KEYS.APP_LOCK_ENABLED),
        SecureStore.getItemAsync(STORAGE_KEYS.LAST_BACKUP_AT),
      ]);
      
      set({
        appLockEnabled: appLockEnabled === 'true',
        lastBackupAt: lastBackupAt ? parseInt(lastBackupAt, 10) : undefined,
      });
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  },
}));
