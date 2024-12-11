import React, { createContext, useState, useEffect } from 'react';
import type { Language } from './translations';

interface Settings {
  language: Language;
  sessionDuration: number;
}

interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
}

// Default session duration set to 30 minutes
const defaultSettings: Settings = {
  language: 'en',
  sessionDuration: 30,
};

export const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettings,
  updateSettings: () => {},
});

const SETTINGS_KEY = 'app_settings';

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => {
    const savedSettings = localStorage.getItem(SETTINGS_KEY);
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        // Ensure session duration is at least 5 minutes
        return {
          ...parsed,
          sessionDuration: Math.max(parsed.sessionDuration || defaultSettings.sessionDuration, 5)
        };
      } catch {
        console.warn('Failed to parse saved settings, using defaults');
        return defaultSettings;
      }
    }
    return defaultSettings;
  });

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      console.log('Settings saved:', settings);
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }, [settings]);

  const updateSettings = (newSettings: Partial<Settings>) => {
    console.log('Updating settings:', newSettings);
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      // Ensure session duration is at least 5 minutes
      if (updated.sessionDuration < 5) {
        console.warn('Session duration cannot be less than 5 minutes, setting to 5');
        updated.sessionDuration = 5;
      }
      return updated;
    });
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}