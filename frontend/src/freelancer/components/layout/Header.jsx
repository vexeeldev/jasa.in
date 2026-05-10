import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Wallet, LayoutGrid, ChevronRight, Settings, LogOut, User, CheckCircle, Heart } from 'lucide-react';
import { DB_CATEGORIES, DB_NOTIFICATIONS, DB_MESSAGES } from '../../data/mockDatabase';
import { classNames } from '../../data/helpers';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';

const BellIcon = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
  </svg>
);

const DropdownItem = ({ icon: Icon, label, onClick, className = '' }) => (
  <button
    onClick={onClick}
    className={classNames("w-full text-left px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-emerald-600 flex items-center transition-colors", className)}
  >
    {Icon && <Icon className="w-4 h-4 mr-3 opacity-70" />} {label}
  </button>
);

const Header = ({ currentUser }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [isScrolled, setIsScrolled] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isHome = location.pathname === '/';
  const headerClass = classNames(
    "fixed w-full top-0 z-50 transition-all duration-300 border-b",
    (isHome && !isScrolled) ? "bg-transparent border-transparent" : "bg-white border-gray-200 shadow-sm"
  );
  const textColor = (isHome && !isScrolled) ? "text-white" : "text-gray-700";
  const logoColor = (isHome && !isScrolled) ? "text-white" : "text-gray-900";

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate(`/explore?q=${encodeURIComponent(searchQuery)}`);
  };

  // 🔥 Fungsi Logout yang benar
  const handleLogout = () => {
    // Hapus semua data dari localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('user');
    
    // Redirect ke halaman login
    navigate('/login');
    
    // Tutup dropdown menu
    setIsProfileMenuOpen(false);
  };

  const unreadNotifs = 0;
  const unreadMsgs = 0;

  return (
    <>
      <header className={headerClass}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div className="flex items-center flex-1">
              <div
                className={classNames("text-3xl font-black tracking-tighter cursor-pointer mr-8 transition-colors", logoColor)}
                onClick={() => navigate('/')}
              >
                jasa<span className="text-emerald-500">.in</span>
              </div>

              {/* Search Bar */}
              <div className={classNames("hidden md:block flex-1 max-w-xl transition-opacity duration-300", (!isHome || isScrolled) ? "opacity-100" : "opacity-0 pointer-events-none")}>
                <form onSubmit={handleSearch} className="flex w-full shadow-sm rounded-md overflow-hidden border border-gray-300 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500">
                  <input
                    type="text"
                    placeholder="Temukan layanan freelance..."
                    className="w-full px-4 py-2.5 border-none focus:ring-0 text-gray-900 text-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <button type="submit" className="bg-gray-900 hover:bg-gray-800 text-white px-5 transition-colors">
                    <Search className="w-5 h-5" />
                  </button>
                </form>
              </div>
            </div>

            {/* Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              <button className={classNames("font-bold text-sm hover:text-emerald-500 transition-colors", textColor)} onClick={() => navigate('/explore')}>Eksplorasi</button>

              <button className={classNames("font-bold text-sm hover:text-emerald-500 transition-colors flex items-center", textColor)} onClick={() => navigate('/messages')}>
                Pesan {unreadMsgs > 0 && <span className="ml-1.5 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{unreadMsgs}</span>}
              </button>

              <button className={classNames("font-bold text-sm hover:text-emerald-500 transition-colors", textColor)} onClick={() => navigate('/orders')}>Pesanan</button>

              {/* Notification Bell */}
              <div className="relative cursor-pointer">
                <BellIcon className={classNames("w-6 h-6 hover:text-emerald-500 transition-colors", textColor)} />
                {unreadNotifs > 0 && <span className="absolute -top-1 -right-1 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white"></span>}
              </div>

              {/* Profile Dropdown */}
              <div className="relative">
                <button onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)} className="flex items-center focus:outline-none ml-2">
                  <Avatar src={currentUser?.avatar_url} size="md" verified={currentUser?.is_verified === '1'} />
                </button>

                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-3 w-72 bg-white rounded-xl shadow-2xl py-2 z-50 border border-gray-100 overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
                      <p className="font-bold text-gray-900 truncate">{currentUser?.full_name}</p>
                      <p className="text-xs text-gray-500 truncate">@{currentUser?.username}</p>
                      {currentUser?.is_freelancer === '1' && (
                        <div className="mt-2 flex items-center">
                          <Badge variant="purple" className="text-[10px]">Freelancer Aktif</Badge>
                        </div>
                      )}
                    </div>

                    <div className="py-2">
                      <DropdownItem icon={User} label="Profil Publik" onClick={() => { navigate(`/profile/${currentUser?.user_id}`); setIsProfileMenuOpen(false); }} />
                      <DropdownItem icon={LayoutGrid} label="Kelola Pesanan" onClick={() => { navigate('/orders'); setIsProfileMenuOpen(false); }} />
                      <DropdownItem icon={Wallet} label="Dompet & Saldo" onClick={() => { navigate('/wallet'); setIsProfileMenuOpen(false); }} />
                      <DropdownItem icon={Heart} label="Jasa Tersimpan" onClick={() => { setIsProfileMenuOpen(false); }} />
                    </div>

                    {currentUser?.is_freelancer === '1' ? (
                      <div className="border-t border-gray-100 p-3 bg-emerald-50/50 cursor-pointer hover:bg-emerald-50 transition-colors group">
                        <div className="flex justify-between items-center text-emerald-700 font-bold text-sm">
                          Mode Klien <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                        <p className="text-[10px] text-emerald-600/70 mt-0.5">Beralih untuk membeli jasa</p>
                      </div>
                    ) : (
                      <div className="border-t border-gray-100 p-3 bg-blue-50/50 cursor-pointer hover:bg-blue-50 transition-colors group">
                        <div className="flex justify-between items-center text-blue-700 font-bold text-sm">
                          Mulai Berjualan <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                        <p className="text-[10px] text-blue-600/70 mt-0.5">Buat profil freelancer Anda</p>
                      </div>
                    )}

                    <div className="border-t border-gray-100 py-2">
                      <DropdownItem icon={Settings} label="Pengaturan Akun" onClick={() => { navigate('/settings'); setIsProfileMenuOpen(false); }} />
                      {/* 🔥 Tombol Logout yang sudah diperbaiki */}
                      <DropdownItem 
                        icon={LogOut} 
                        label="Keluar" 
                        className="text-red-600 hover:text-red-700 hover:bg-red-50" 
                        onClick={handleLogout}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Spacer for non-home pages */}
      {!isHome && <div className="h-[120px]"></div>}
    </>
  );
};

export default Header;