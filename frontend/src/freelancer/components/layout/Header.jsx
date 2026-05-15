import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Wallet, LayoutGrid, ChevronRight, Settings, LogOut, User, CheckCircle, Heart, Briefcase, FolderOpen, ChevronDown, Home } from 'lucide-react';
import { classNames } from '../../data/helpers';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';
import io from 'socket.io-client';

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

const API_BASE_URL = 'http://localhost:5000/api';
const STATIC_URL = 'http://localhost:5000';

const Header = ({ currentUser: propCurrentUser }) => {
  // 🔥 STATE LOKAL untuk user, biar bisa diupdate tanpa refresh
  const [currentUser, setCurrentUser] = useState(propCurrentUser);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [socket, setSocket] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const [isScrolled, setIsScrolled] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isFreelancerMenuOpen, setIsFreelancerMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // 🔥 Fungsi untuk refresh data user
  const refreshUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await fetch(`${API_BASE_URL}/users/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setCurrentUser(data.data);
        // Update localStorage juga
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        const updatedUser = { ...storedUser, ...data.data };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    }
  };

  // 🔥 Update state saat prop berubah (login pertama kali)
  useEffect(() => {
    setCurrentUser(propCurrentUser);
  }, [propCurrentUser]);

  // 🔥 Listen untuk event 'userUpdated' dari halaman settings
  useEffect(() => {
    window.addEventListener('userUpdated', refreshUserData);
    return () => window.removeEventListener('userUpdated', refreshUserData);
  }, []);

  // 🔥 Refresh data setiap kali halaman di-load (optional, untuk jaga-jaga)
  useEffect(() => {
    refreshUserData();
  }, []);

  const getFullImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    if (url.startsWith('/')) return `${STATIC_URL}${url}`;
    return `${STATIC_URL}/${url}`;
  };

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

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('user');
    navigate('/login');
    setIsProfileMenuOpen(false);
  };

  const unreadMsgs = 0;
  const isFreelancer = currentUser?.role === 'freelancer' || currentUser?.is_freelancer === '1';
  const isClient = currentUser?.role === 'client' || (!isFreelancer && currentUser?.role !== 'admin');

  useEffect(() => {
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);
    return () => newSocket.close();
  }, []);

  useEffect(() => {
    if (socket && currentUser?.user_id) {
      socket.emit('register', currentUser.user_id);
      socket.on('new_notification', (notification) => {
        console.log('🔔 New notification:', notification);
        setUnreadNotifs(prev => prev + 1);
      });
    }
    return () => {
      if (socket) {
        socket.off('new_notification');
      }
    };
  }, [socket, currentUser]);

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await fetch(`${API_BASE_URL}/notifications/unread/count`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setUnreadNotifs(data.data.unread_count);
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);
  
  useEffect(() => {
    const handleClickOutside = () => {
      setIsFreelancerMenuOpen(false);
      setIsProfileMenuOpen(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <>
      <header className={headerClass}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 md:h-20">
            {/* Logo */}
            <div className="flex items-center flex-1">
              <div
                className={classNames("text-2xl md:text-3xl font-black tracking-tighter cursor-pointer mr-4 md:mr-8 transition-colors", logoColor)}
                onClick={() => navigate('/')}
              >
                jasa<span className="text-emerald-500">.in</span>
              </div>

              {/* Search Bar */}
              <div className={classNames(
                "hidden md:block flex-1 max-w-xl transition-all mr-12 duration-300",
                (!isHome || isScrolled) ? "opacity-100 visible" : "opacity-0 invisible"
              )}>
                <form onSubmit={handleSearch} className="flex w-full shadow-sm rounded-md overflow-hidden border border-gray-300 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500">
                  <input
                    type="text"
                    placeholder="Temukan layanan freelance..."
                    className="w-full px-4 py-2 text-sm border-none focus:ring-0 text-gray-900"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <button type="submit" className="bg-gray-900 hover:bg-gray-800 text-white px-4 transition-colors">
                    <Search className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>

            {/* Navigation */}
            <div className="hidden md:flex items-center space-x-6 lg:space-x-8">
              
              {isFreelancer && (
                <button 
                  className={classNames("font-semibold text-sm hover:text-emerald-500 transition-colors flex items-center gap-1", textColor)} 
                  onClick={() => navigate('/freelancer/dashboard')}
                >
                  Dashboard
                </button>
              )}

              {isClient && (
                <button 
                  className={classNames("font-semibold text-sm hover:text-emerald-500 transition-colors flex items-center gap-1", textColor)} 
                  onClick={() => navigate('/client/dashboard')}
                >
                  <LayoutGrid className="w-4 h-4" />
                  Dashboard
                </button>
              )}

              <button 
                className={classNames("font-semibold text-sm hover:text-emerald-500 transition-colors", textColor)} 
                onClick={() => navigate('/explore')}
              >
                Eksplorasi
              </button>

              <button 
                className={classNames("font-semibold text-sm hover:text-emerald-500 transition-colors flex items-center", textColor)} 
                onClick={() => navigate('/messages')}
              >
                Pesan {unreadMsgs > 0 && <span className="ml-1.5 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{unreadMsgs}</span>}
              </button>

              <button 
                className={classNames("font-semibold text-sm hover:text-emerald-500 transition-colors", textColor)} 
                onClick={() => navigate(isFreelancer ? '/orders' : '/client/orders')}
              >
                Pesanan
              </button>

              {isFreelancer && (
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsFreelancerMenuOpen(!isFreelancerMenuOpen);
                    }}
                    className={classNames("font-semibold text-sm hover:text-emerald-500 transition-colors flex items-center gap-1", textColor)}
                  >
                    Kelola
                    <ChevronDown className={`w-3 h-3 ml-1 transition-transform ${isFreelancerMenuOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {isFreelancerMenuOpen && (
                    <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                      <button
                        onClick={() => {
                          navigate('/freelancer/services');
                          setIsFreelancerMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-emerald-600 flex items-center gap-2 transition-colors"
                      >
                        <Briefcase className="w-4 h-4" />
                        Jasa Saya
                      </button>
                      <button
                        onClick={() => {
                          navigate('/freelancer/portfolios');
                          setIsFreelancerMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-emerald-600 flex items-center gap-2 transition-colors"
                      >
                        <FolderOpen className="w-4 h-4" />
                        Portfolio
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Notification Bell */}
              <div 
                className="relative cursor-pointer"
                onClick={() => navigate('/freelancer/notifications')}>
                <BellIcon className={classNames("w-5 h-5 hover:text-emerald-500 transition-colors", textColor)} />
                {unreadNotifs > 0 && <span className="absolute -top-1 -right-1 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>}
              </div>

              {/* Profile Dropdown */}
              <div className="relative">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsProfileMenuOpen(!isProfileMenuOpen);
                  }} 
                  className="flex items-center focus:outline-none"
                >
                  {/* 🔥 PAKAI getFullImageUrl AGAR AVATAR TAMPIL */}
                  <Avatar 
                    src={getFullImageUrl(currentUser?.avatar_url)} 
                    size="sm" 
                    verified={currentUser?.is_verified === '1'} 
                  />
                </button>

                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-3 w-72 bg-white rounded-xl shadow-2xl py-2 z-50 border border-gray-100 overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
                      {/* 🔥 PAKAI currentUser DARI STATE */}
                      <p className="font-bold text-gray-900 truncate">{currentUser?.full_name || 'Pengguna'}</p>
                      <p className="text-xs text-gray-500 truncate">@{currentUser?.username || 'username'}</p>
                      {isFreelancer && (
                        <div className="mt-2 flex items-center">
                          <Badge variant="purple" className="text-[10px]">Freelancer Aktif</Badge>
                        </div>
                      )}
                    </div>

                    <div className="py-2">
                      {isFreelancer && (
                        <DropdownItem 
                          icon={LayoutGrid} 
                          label="Dashboard" 
                          onClick={() => { 
                            navigate('/freelancer/dashboard'); 
                            setIsProfileMenuOpen(false); 
                          }} 
                        />
                      )}
                      {isClient && (
                        <DropdownItem 
                          icon={LayoutGrid} 
                          label="Dashboard" 
                          onClick={() => { 
                            navigate('/client/dashboard'); 
                            setIsProfileMenuOpen(false); 
                          }} 
                        />
                      )}
                      
                      {/* 🔥 PROFIL PUBLIK PAKAI user_id */}
                      <DropdownItem 
                        icon={User} 
                        label="Profil Publik" 
                        onClick={() => { 
                          navigate(`/profile/me`); 
                          setIsProfileMenuOpen(false); 
                        }} 
                      />
                      
                      {isFreelancer && (
                        <>
                          <DropdownItem icon={Briefcase} label="Jasa Saya" onClick={() => { navigate('/freelancer/services'); setIsProfileMenuOpen(false); }} />
                          <DropdownItem icon={FolderOpen} label="Portfolio" onClick={() => { navigate('/freelancer/portfolios'); setIsProfileMenuOpen(false); }} />
                        </>
                      )}
                      
                      <DropdownItem icon={Wallet} label="Dompet & Saldo" onClick={() => { navigate('/wallet'); setIsProfileMenuOpen(false); }} />
                      <DropdownItem icon={Heart} label="Jasa Tersimpan" onClick={() => { navigate('/wishlist'); setIsProfileMenuOpen(false); }} />
                    </div>

                    {isFreelancer ? (
                      <div className="border-t border-gray-100 p-3 bg-emerald-50/50 cursor-pointer hover:bg-emerald-50 transition-colors group">
                        <div className="flex justify-between items-center text-emerald-700 font-bold text-sm">
                          Mode Klien <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                        <p className="text-[10px] text-emerald-600/70 mt-0.5">Beralih untuk membeli jasa</p>
                      </div>
                    ) : (
                      <div className="border-t border-gray-100 p-3 bg-blue-50/50 cursor-pointer hover:bg-blue-50 transition-colors group">
                        <div className="flex justify-between items-center text-blue-700 font-bold text-sm">
                          Mode Freelancer <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                        <p className="text-[10px] text-blue-600/70 mt-0.5">Beralih untuk menjual jasa</p>
                      </div>
                    )}

                    <div className="border-t border-gray-100 py-2">
                      <DropdownItem icon={Settings} label="Pengaturan Akun" onClick={() => { navigate('/settings'); setIsProfileMenuOpen(false); }} />
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
      {!isHome && <div className="h-16 md:h-20"></div>}
    </>
  );
};

export default Header;