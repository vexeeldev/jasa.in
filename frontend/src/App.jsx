import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';

// Views
import HomeView from './views/HomeView';
import ExploreView from './views/ExploreView';
import ServiceDetailView from './views/ServiceDetailView';
import CheckoutView from './views/CheckoutView';
import UnifiedOrdersView from './views/UnifiedOrdersView';
import OrderTrackView from './views/OrderTrackView';
import MessagesView from './views/MessagesView';
import UserProfileView from './views/UserProfileView';
import SettingsView from './views/SettingsView';
import WalletView from './views/WalletView';

// 🔥 AUTH
import LoginView from './auth/Login';
import RegisterView from './auth/Register';

// Layout
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';

// Data
import { DB_USERS } from './data/mockDatabase';

//landing page
import Landing from './pages/Landing';


// ✅ Layout (pakai children)
const AppLayout = ({ children, currentUser }) => {
  const location = useLocation();
  const isMessagesView = location.pathname.startsWith('/messages');

  return (
    <div className="min-h-screen bg-white font-sans flex flex-col text-gray-900 selection:bg-emerald-200 selection:text-emerald-900">
      
      <Header currentUser={currentUser} />

      <main className="flex-grow w-full bg-white relative">
        {children}
      </main>

      {!isMessagesView && <Footer />}
    </div>
  );
};


// 🔥 Core routing logic
const AppContent = () => {
  const [currentUser] = useState(DB_USERS[0]);
  const location = useLocation();

 // 🔥 semua halaman tanpa layout
  const isAuthPage =
    location.pathname === '/login' ||
    location.pathname === '/register' ||
    location.pathname === '/landing';

  // 🔓 TANPA LAYOUT
  if (isAuthPage) {
    return (
      <Routes>
        <Route path="/login" element={<LoginView />} />
        <Route path="/register" element={<RegisterView />} />
        <Route path="/landing" element={<Landing />} />
      </Routes>
    );
  }

  // 🔒 APP (pakai layout)
  return (
    <AppLayout currentUser={currentUser}>
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

        {/* fallback */}
        <Route path="*" element={<HomeView />} />
      </Routes>
    </AppLayout>
  );
};


// 🎯 ROOT
export default function App() {
  return (
    <Router>

      <AppContent />

      {/* ✅ GLOBAL STYLE */}
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

    </Router>
  );
}