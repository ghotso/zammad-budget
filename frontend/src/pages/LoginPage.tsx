import React, { useState, useEffect } from 'react';
import { LockIcon, AlertCircleIcon } from 'lucide-react';
import { useAuth } from '../lib/hooks/useAuth';
import { useTranslation } from '../lib/useTranslation';

export function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, isLoading } = useAuth();
  const { t } = useTranslation();

  // Clear error when password changes
  useEffect(() => {
    if (error) setError('');
  }, [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim() || isLoading) return;

    setError('');

    try {
      await login(password);
    } catch (err) {
      console.error('Login error:', err);
      if (err instanceof Error) {
        if (err.message.includes('timeout')) {
          setError('Connection timeout. Please try again.');
        } else if (err.message.includes('Network')) {
          setError('Network error. Please check your connection.');
        } else {
          setError(t.auth.invalidPassword);
        }
      } else {
        setError(t.auth.invalidPassword);
      }
      setPassword('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setPassword('');
      setError('');
    }
  };

  return (
    <div 
      className="flex min-h-screen items-center justify-center bg-background"
      role="main"
    >
      <div 
        className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] pointer-events-none opacity-20" 
        aria-hidden="true"
      />
      
      <div className="w-full max-w-md space-y-8 px-4">
        <div 
          className="glass-card p-8 rounded-lg"
          role="region"
          aria-labelledby="login-title"
        >
          <div className="flex flex-col items-center gap-6">
            <div 
              className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center"
              aria-hidden="true"
            >
              <LockIcon className="w-8 h-8 text-primary" />
            </div>
            
            <div className="text-center">
              <h1 
                id="login-title" 
                className="text-2xl font-bold"
              >
                Zammad Budget Manager
              </h1>
              <p className="text-muted-foreground mt-2">
                {t.auth.enterPassword}
              </p>
            </div>

            <form 
              onSubmit={handleSubmit} 
              className="w-full space-y-4"
              aria-label="Login form"
            >
              <div className="space-y-2">
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full h-10 pl-10 rounded-md border bg-background/30 backdrop-blur-sm px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-300"
                    placeholder={t.auth.password}
                    disabled={isLoading}
                    autoFocus
                    aria-label={t.auth.password}
                    aria-invalid={!!error}
                    aria-describedby={error ? "login-error" : undefined}
                  />
                  <LockIcon 
                    className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" 
                    aria-hidden="true"
                  />
                </div>
                {error && (
                  <div 
                    id="login-error"
                    role="alert"
                    className="flex items-center gap-2 text-sm text-red-500 bg-red-500/10 p-2 rounded-md"
                  >
                    <AlertCircleIcon className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={!password.trim() || isLoading}
                className="w-full h-10 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 relative overflow-hidden group"
                aria-busy={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div 
                      className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
                      aria-hidden="true"
                    />
                    <span>{t.common.loading}</span>
                  </div>
                ) : (
                  t.auth.login
                )}
                {!isLoading && (
                  <div 
                    className="absolute inset-0 bg-gradient-to-r from-primary/0 via-white/[0.1] to-primary/0 -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-700"
                    aria-hidden="true"
                  />
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}