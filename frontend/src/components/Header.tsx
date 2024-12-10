import React from 'react';
import { Link } from 'react-router-dom';
import { WalletIcon, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../lib/hooks/useAuth';
import { useTranslation } from '../lib/useTranslation';

export function Header() {
  const { logout } = useAuth();
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-background/50 backdrop-blur-xl backdrop-filter">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <WalletIcon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-white via-white/90 to-white/80 bg-clip-text text-transparent">
                Zammad Budget Manager
              </h1>
              <p className="text-sm text-muted-foreground">
                {t.budget.title}
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            <Link
              to="/settings"
              className="p-2 rounded-full hover:bg-white/5 transition-colors"
              title={t.settings.title}
            >
              <Settings className="w-5 h-5 text-muted-foreground" />
            </Link>
            <button
              onClick={logout}
              className="p-2 rounded-full hover:bg-white/5 transition-colors"
              title={t.auth.logout}
            >
              <LogOut className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}