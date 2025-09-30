import { useEffect, useState } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import { useSettingsStore } from '../store/settingsStore';

export const useBiometricGate = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { appLockEnabled } = useSettingsStore();

  const authenticate = async (): Promise<boolean> => {
    if (!appLockEnabled) {
      setIsAuthenticated(true);
      return true;
    }

    setIsLoading(true);
    
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock Notes',
        fallbackLabel: 'Use PIN',
        disableDeviceFallback: false,
      });
      
      setIsAuthenticated(result.success);
      return result.success;
    } catch (error) {
      console.error('Biometric authentication error:', error);
      setIsAuthenticated(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const checkBiometricAvailability = async (): Promise<boolean> => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      return hasHardware && isEnrolled;
    } catch (error) {
      console.error('Error checking biometric availability:', error);
      return false;
    }
  };

  useEffect(() => {
    if (appLockEnabled) {
      authenticate();
    } else {
      setIsAuthenticated(true);
    }
  }, [appLockEnabled]);

  return {
    isAuthenticated,
    isLoading,
    authenticate,
    checkBiometricAvailability,
  };
};
