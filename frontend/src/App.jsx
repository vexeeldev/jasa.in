import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';

// ============================================
// FREELANCER VIEWS
// ============================================
import HomeView from './freelancer/views/HomeView';
import ExploreView from './freelancer/views/ExploreView';
import ServiceDetailView from './freelancer/views/ServiceDetailView';
import CheckoutView from './freelancer/views/CheckoutView';
import UnifiedOrdersView from './freelancer/views/UnifiedOrdersView';
import OrderTrackView from './freelancer/views/OrderTrackView';
import MessagesView from './freelancer/views/MessagesView';
import UserProfileView from './freelancer/views/UserProfileView';
import SettingsView from './freelancer/views/SettingsView';
import WalletView from './freelancer/views/WalletView';

// ============================================
// CLIENT VIEWS
// ============================================
import ClientHomeView from './client/views/ClientHomeView';
import ClientExploreView from './client/views/ExploreView';
import ClientServiceDetailView from './client/views/ServiceDetailView';
import ClientCheckoutView from './client/views/CheckoutView';
import ClientOrdersView from './client/views/UnifiedOrdersView';
import ClientOrderTrackView from './client/views/OrderTrackView';
import ClientMessagesView from './client/views/MessagesView';
import ClientProfileView from './client/views/UserProfileView';
import ClientSettingsView from './client/views/SettingsView';
import ClientWalletView from './client/views/WalletView';

// ============================================
// AUTH & LANDING
// ============================================
import LoginView from './auth/Login';
import RegisterView from './auth/Register';
import Landing from './freelancer/pages/Landing';

// ============================================
// LAYOUTS
// ============================================
import FreelancerHeader from './freelancer/components/layout/Header';
import FreelancerFooter from './freelancer/components/layout/Footer';
import ClientHeader from './client/components/layout/ClientHeader';

// ============================================
// AUTH CONTEXT
// ============================================
const AuthContext = React.createContext();

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// ============================================
// AUTH PROVIDER
// ============================================
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (savedUser && token) {
      setCurrentUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = (user) => {
    setCurrentUser(user);
    localStorage.setItem('user', JSON.stringify(user));
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// ============================================
// CLIENT LAYOUT (pakai ClientHeader)
// ============================================
const ClientLayout = ({ children }) => {
  const location = useLocation();
  const isMessagesView = location.pathname.includes('/messages');
  const { currentUser } = useAuth();

  console.log('🔵 CLIENT LAYOUT - menggunakan ClientHeader');

  return (
    <div className="min-h-screen bg-white font-sans flex flex-col text-gray-900 selection:bg-emerald-200 selection:text-emerald-900">
      <ClientHeader currentUser={currentUser} />
      <main className="flex-grow w-full bg-white relative">
        {children}
      </main>
      {!isMessagesView && <FreelancerFooter />}
    </div>
  );
};

// ============================================
// FREELANCER LAYOUT (pakai FreelancerHeader)
// ============================================
const FreelancerLayout = ({ children }) => {
  const location = useLocation();
  const isMessagesView = location.pathname.includes('/messages');
  const { currentUser } = useAuth();

  console.log('🟣 FREELANCER LAYOUT - menggunakan FreelancerHeader');

  return (
    <div className="min-h-screen bg-white font-sans flex flex-col text-gray-900 selection:bg-emerald-200 selection:text-emerald-900">
      <FreelancerHeader currentUser={currentUser} />
      <main className="flex-grow w-full bg-white relative">
        {children}
      </main>
      {!isMessagesView && <FreelancerFooter />}
    </div>
  );
};

// ============================================
// Helper function untuk cek role client
// ============================================
const isClient = (role) => {
  return role === 'client' || role === 'klien';
};

// ============================================
// MAIN ROUTING
// ============================================
const AppContent = () => {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  const isAuthPage = ['/login', '/register', '/landing'].includes(location.pathname);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  // Halaman Auth
  if (isAuthPage) {
    return (
      <Routes>
        <Route path="/login" element={<LoginView />} />
        <Route path="/register" element={<RegisterView />} />
        <Route path="/landing" element={<Landing />} />
      </Routes>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  console.log('Current user role:', currentUser.ROLE || currentUser.role);
  console.log('Is client?', isClient(currentUser.ROLE || currentUser.role));

  // ============================================
  // CLIENT ROUTES
  // ============================================
  if (isClient(currentUser.ROLE || currentUser.role)) {
    return (
      <ClientLayout>
        <Routes>
          <Route path="/" element={<Navigate to="/client" replace />} />
          <Route path="/client" element={<ClientHomeView />} />
          <Route path="/client/explore" element={<ClientExploreView />} />
          <Route path="/client/service/:id" element={<ClientServiceDetailView />} />
          <Route path="/client/checkout/:packageId" element={<ClientCheckoutView />} />
          <Route path="/client/orders" element={<ClientOrdersView />} />
          <Route path="/client/order-track/:id" element={<ClientOrderTrackView />} />
          <Route path="/client/messages" element={<ClientMessagesView />} />
          <Route path="/client/profile/:id" element={<ClientProfileView />} />
          <Route path="/client/settings" element={<ClientSettingsView />} />
          <Route path="/client/wallet" element={<ClientWalletView />} />
          
          <Route path="*" element={<Navigate to="/client" replace />} />
        </Routes>
      </ClientLayout>
    );
  }

  // ============================================
  // FREELANCER ROUTES
  // ============================================
  return (
    <FreelancerLayout>
      <Routes>
        <Route path="/" element={<HomeView />} />
        <Route path="/wallet" element={<WalletView />} />
        <Route path="/explore" element={<ExploreView />} />
        <Route path="/service/:id" element={<ServiceDetailView />} />
        <Route path="/checkout/:packageId" element={<CheckoutView />} />
        <Route path="/orders" element={<UnifiedOrdersView />} />
        <Route path="/order-track/:id" element={<OrderTrackView />} />
        <Route path="/messages" element={<MessagesView />} />
        <Route path="/profile/:id" element={<UserProfileView />} />
        <Route path="/settings" element={<SettingsView />} />
        
        <Route path="*" element={<HomeView />} />
      </Routes>
    </FreelancerLayout>
  );
};

// ============================================
// ROOT APP
// ============================================
export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
        
        <style
          dangerouslySetInnerHTML={{
            __html: `
              .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
              .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
              .custom-scrollbar::-webkit-scrollbar-thumb {
                background-color: #cbd5e1;
                border-radius: 20px;
                border: 2px solid white;
              }
              .custom-scrollbar:hover::-webkit-scrollbar-thumb {
                background-color: #94a3b8;
              }
              body {
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
              }
            `,
          }}
        />
      </AuthProvider>
    </Router>
  );
}