export type Language = 'en' | 'de';

type TranslationKeys = {
  settings: {
    title: string;
    language: string;
    english: string;
    german: string;
    sessionDuration: string;
    sessionDurationDescription: string;
    days: string;
  };
  common: {
    save: string;
    cancel: string;
    loading: string;
    error: string;
    success: string;
    description: string;
    enterDescription: string;
  };
  auth: {
    login: string;
    logout: string;
    password: string;
    invalidPassword: string;
    enterPassword: string;
    loginTimeout: string;
    networkError: string;
  };
  budget: {
    title: string;
    totalBudget: string;
    trackedTime: string;
    remainingBudget: string;
    addRemoveBudget: string;
    budgetHistory: string;
    monthlyTrackedTime: string;
    willAdd: string;
    willRemove: string;
  };
};

export const translations: Record<Language, TranslationKeys> = {
  en: {
    settings: {
      title: 'Settings',
      language: 'Language',
      english: 'English',
      german: 'German',
      sessionDuration: 'Session Duration',
      sessionDurationDescription: 'Select how long you want to stay logged in before automatic logout.',
      days: 'Days'
    },
    common: {
      save: 'Save',
      cancel: 'Cancel',
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      description: 'Description',
      enterDescription: 'Enter a description'
    },
    auth: {
      login: 'Login',
      logout: 'Logout',
      password: 'Password',
      invalidPassword: 'Invalid password',
      enterPassword: 'Enter your password',
      loginTimeout: 'Login request timed out. Please try again.',
      networkError: 'Network error. Please check your connection.'
    },
    budget: {
      title: 'Budget Management',
      totalBudget: 'Total Budget',
      trackedTime: 'Tracked Time',
      remainingBudget: 'Remaining Budget',
      addRemoveBudget: 'Add/Remove Budget',
      budgetHistory: 'Budget History',
      monthlyTrackedTime: 'Monthly Tracked Time',
      willAdd: 'Will add',
      willRemove: 'Will remove'
    }
  },
  de: {
    settings: {
      title: 'Einstellungen',
      language: 'Sprache',
      english: 'Englisch',
      german: 'Deutsch',
      sessionDuration: 'Sitzungsdauer',
      sessionDurationDescription: 'Wählen Sie aus, wie lange Sie angemeldet bleiben möchten.',
      days: 'Tage'
    },
    common: {
      save: 'Speichern',
      cancel: 'Abbrechen',
      loading: 'Lädt...',
      error: 'Fehler',
      success: 'Erfolg',
      description: 'Beschreibung',
      enterDescription: 'Beschreibung eingeben'
    },
    auth: {
      login: 'Anmelden',
      logout: 'Abmelden',
      password: 'Passwort',
      invalidPassword: 'Ungültiges Passwort',
      enterPassword: 'Geben Sie Ihr Passwort ein',
      loginTimeout: 'Zeitüberschreitung bei der Anmeldung. Bitte versuchen Sie es erneut.',
      networkError: 'Netzwerkfehler. Bitte überprüfen Sie Ihre Verbindung.'
    },
    budget: {
      title: 'Budget-Verwaltung',
      totalBudget: 'Gesamtbudget',
      trackedTime: 'Erfasste Zeit',
      remainingBudget: 'Verbleibendes Budget',
      addRemoveBudget: 'Budget hinzufügen/entfernen',
      budgetHistory: 'Budget-Historie',
      monthlyTrackedTime: 'Monatlich erfasste Zeit',
      willAdd: 'Wird hinzugefügt',
      willRemove: 'Wird entfernt'
    }
  }
};