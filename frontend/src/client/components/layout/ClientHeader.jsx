import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Wallet, LayoutGrid, ChevronRight, Settings, LogOut, User, Heart, ShoppingCart, Clock, Star, Bell } from 'lucide-react';
import { classNames } from '../../data/helpers';
import Avatar from '../ui/Avatar';

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
    {Icon && <Icon className="w-4 h-4 mr-3 opacity-70" />} 
    {label}
  </button>
);

const ClientHeader = ({ currentUser }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [isScrolled, setIsScrolled] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const isHome = location.pathname === '/' || location.pathname === '/client' || location.pathname === '/client/dashboard';

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const headerClass = classNames(
    "fixed w-full top-0 z-50 transition-all duration-300",
    (isHome && !isScrolled) 
      ? "bg-transparent border-transparent shadow-none" 
      : "bg-white border-b border-gray-200 shadow-md"
  );

  const textColor = (isHome && !isScrolled) ? "text-white" : "text-gray-700";
  const logoColor = (isHome && !isScrolled) ? "text-white" : "text-gray-900";
  const buttonBg = (isHome && !isScrolled) ? "bg-white/20 hover:bg-white/30" : "bg-gray-100 hover:bg-gray-200";

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate(`/client/explore?q=${encodeURIComponent(searchQuery)}`);
  };

  // Mock data - nanti ganti dengan API
  const unreadNotifs = 0;
  const unreadMsgs = 0;
  const cartCount = 0;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <>
      <header className={headerClass}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={classNames("flex justify-between items-center transition-all duration-300", isScrolled ? "h-16" : "h-20")}>
            
            {/* Logo */}
            <div className="flex items-center flex-1">
              <div
                className={classNames("text-3xl font-black tracking-tighter cursor-pointer mr-8 transition-colors", logoColor)}
                onClick={() => navigate('/client/dashboard')}
              >
                jasa<span className={classNames((isHome && !isScrolled) ? "text-emerald-300" : "text-emerald-500")}>.in</span>
                <span className="ml-2 text-xs font-medium bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full align-middle">
                  Client
                </span>
              </div>

              {/* Search Bar */}
              <div className={classNames(
                "hidden md:block flex-1 max-w-xl transition-all duration-300",
                (!isHome || isScrolled) ? "opacity-100" : "opacity-0 pointer-events-none"
              )}>
                <form onSubmit={handleSearch} className="flex w-full shadow-sm rounded-md overflow-hidden border border-gray-200 focus-within:border-emerald-500 bg-white">
                  <input
                    type="text"
                    placeholder="Cari jasa freelance... (contoh: desain logo, buat website)"
                    className="w-full px-4 py-2.5 border-none focus:ring-0 text-gray-900 text-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 transition-colors">
                    <Search className="w-5 h-5" />
                  </button>
                </form>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              <button 
                className={classNames("font-medium text-sm transition-colors px-3 py-2 rounded-lg", textColor, buttonBg)} 
                onClick={() => navigate('/client/explore')}
              >
                Eksplorasi
              </button>

              <button 
                className={classNames("font-medium text-sm transition-colors px-3 py-2 rounded-lg flex items-center gap-1", textColor, buttonBg)} 
                onClick={() => navigate('/client/orders')}
              >
                <Clock className="w-4 h-4" />
                Pesanan
              </button>

              <button 
                className={classNames("font-medium text-sm  transition-colors px-3 py-2 rounded-lg flex items-center gap-1 relative", textColor, buttonBg)} 
                onClick={() => navigate('/client/messages')}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                Pesan
                {unreadMsgs > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                    {unreadMsgs}
                  </span>
                )}
              </button>

              {/* Notification Bell */}
              <div className="relative">
                <button className={classNames("p-2 rounded-full transition-colors", buttonBg)}>
                  <BellIcon className={classNames("w-5 h-5", textColor)} />
                </button>
                {unreadNotifs > 0 && (
                  <span className="absolute -top-1 -right-1 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white"></span>
                )}
              </div>

              {/* Cart */}
              <button 
                className={classNames("relative p-2 rounded-full transition-colors", buttonBg)}
                onClick={() => navigate('/client/cart')}
              >
                <ShoppingCart className={classNames("w-5 h-5", textColor)} />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {cartCount}
                  </span>
                )}
              </button>

              {/* Profile Dropdown */}
              <div className="relative">
                <button 
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)} 
                  className="flex items-center focus:outline-none ml-2"
                >
                  <Avatar src={currentUser?.avatar_url} size="md" />
                </button>

                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-3 w-72 bg-white rounded-xl shadow-2xl py-2 z-50 border border-gray-100 overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
                      <p className="font-bold text-gray-900 truncate">{currentUser?.full_name || currentUser?.FULL_NAME || 'Client'}</p>
                      <p className="text-xs text-gray-500 truncate">@{currentUser?.username || currentUser?.USERNAME}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Client</span>
                      </div>
                    </div>

                    <div className="py-2">
                      {/* ✅ PERBAIKAN: Route yang benar untuk client */}
                      <DropdownItem 
                        icon={User} 
                        label="Profil Saya" 
                        onClick={() => { 
                          navigate(`/client/profile/${currentUser?.user_id || currentUser?.USER_ID}`); 
                          setIsProfileMenuOpen(false); 
                        }} 
                      />
                      <DropdownItem 
                        icon={LayoutGrid} 
                        label="Pesanan Saya" 
                        onClick={() => { 
                          navigate('/client/orders'); 
                          setIsProfileMenuOpen(false); 
                        }} 
                      />
                      <DropdownItem 
                        icon={Heart} 
                        label="Jasa Tersimpan" 
                        onClick={() => { 
                          navigate('/client/wishlist'); 
                          setIsProfileMenuOpen(false); 
                        }} 
                      />
                      <DropdownItem 
                        icon={Wallet} 
                        label="Dompet" 
                        onClick={() => { 
                          navigate('/client/wallet'); 
                          setIsProfileMenuOpen(false); 
                        }} 
                      />
                    </div>

                    {/* Tombol Upgrade ke Freelancer */}
                    <div className="border-t border-gray-100 p-3 bg-emerald-50/50 cursor-pointer hover:bg-emerald-50 transition-colors group">
                      <div 
                        className="flex justify-between items-center text-emerald-700 font-bold text-sm"
                        onClick={() => {
                          navigate('/become-freelancer');
                          setIsProfileMenuOpen(false);
                        }}
                      >
                        Mau Jadi Freelancer? <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                      <p className="text-[10px] text-emerald-600/70 mt-0.5">Jual jasa Anda dan dapatkan penghasilan</p>
                    </div>

                    <div className="border-t border-gray-100 py-2">
                      <DropdownItem 
                        icon={Settings} 
                        label="Pengaturan" 
                        onClick={() => { 
                          navigate('/client/settings'); 
                          setIsProfileMenuOpen(false); 
                        }} 
                      />
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

      {/* Spacer */}
      {!isHome && <div className="h-[72px]"></div>}
    </>
  );
};

export default ClientHeader;