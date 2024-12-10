import { Routes, Route, Navigate } from 'react-router-dom';
import { OrganizationsList } from './pages/OrganizationsList';
import { OrganizationDetails } from './pages/OrganizationDetails';
import { LoginPage } from './pages/LoginPage';
import { SettingsPage } from './pages/SettingsPage';
import { Header } from './components/Header';
import { useAuth } from './lib/hooks/useAuth';

function App() {
  const { isAuthenticated } = useAuth();

  // The loading state is now handled by the AuthProvider component
  // which shows a loading spinner while checking auth status

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] pointer-events-none opacity-20" />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] pointer-events-none opacity-20" />
      <Header />
      <Routes>
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="/" element={<OrganizationsList />} />
        <Route path="/organizations/:id" element={<OrganizationDetails />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;