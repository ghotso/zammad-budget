import React from 'react';
import { useSettings } from '../lib/hooks/useSettings';
import { useTranslation } from '../lib/useTranslation';
import { Settings as SettingsIcon, Globe, Clock } from 'lucide-react';
import type { Language } from '../lib/translations';

const sessionDurationOptions = [
  { value: 1, label: '1 Day' },
  { value: 2, label: '2 Days' },
  { value: 3, label: '3 Days' },
  { value: 4, label: '4 Days' },
  { value: 5, label: '5 Days' },
  { value: 6, label: '6 Days' },
  { value: 7, label: '7 Days' },
];

const languageOptions: { value: Language; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'de', label: 'Deutsch' },
];

export function SettingsPage() {
  const { settings, updateSettings } = useSettings();
  const { t } = useTranslation();

  const handleSessionDurationChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    updateSettings({ sessionDuration: parseInt(event.target.value, 10) });
  };

  const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    updateSettings({ language: event.target.value as Language });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <SettingsIcon className="w-8 h-8" />
          {t.settings.title}
        </h1>
      </div>

      <div className="glass rounded-lg p-6 max-w-2xl space-y-8">
        {/* Language Settings */}
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Globe className="w-6 h-6" />
            {t.settings.language}
          </h2>
          <div className="space-y-4">
            <div>
              <select
                id="language"
                value={settings.language}
                onChange={handleLanguageChange}
                className="w-full px-3 py-2 rounded-md bg-background border border-white/10 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {languageOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Session Settings */}
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-6 h-6" />
            {t.settings.sessionDuration}
          </h2>
          <div className="space-y-4">
            <div>
              <select
                id="sessionDuration"
                value={settings.sessionDuration}
                onChange={handleSessionDurationChange}
                className="w-full px-3 py-2 rounded-md bg-background border border-white/10 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {sessionDurationOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-sm text-muted-foreground">
                {t.settings.sessionDurationDescription}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}