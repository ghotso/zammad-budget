import { useSettings } from './hooks/useSettings';
import { translations, type Language } from './translations';

export type TranslationKeys = typeof translations.en;

export function useTranslation() {
  const { settings } = useSettings();
  const t: TranslationKeys = translations[settings.language || 'en'];

  return {
    t,
    language: settings.language as Language
  };
}