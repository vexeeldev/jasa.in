import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Wallet, LayoutGrid, ChevronRight, Settings, LogOut, User, Heart, ShoppingCart, Clock, Star } from 'lucide-react';
import { DB_CATEGORIES, DB_NOTIFICATIONS, DB_MESSAGES } from '../../data/mockDatabase';
import { classNames } from '../../data/helpers';
import Avatar from '../ui/Avatar';

const BellIcon = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
  </svg>
);

const DropdownItem = ({ icon: Icon, label, onClick, className = '', badge }) => (
  <button
    onClick={onClick}
    className={classNames("w-full text-left px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-emerald-600 flex items-center justify-between transition-colors", className)}
  >
    <div className="flex items-center">
      {Icon && <Icon className="w-4 h-4 mr-3 opacity-70" />}
      <span>{label}</span>
    </div>
    {badge && <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">{badge}</span>}
  </button>
);

const ClientHeader = ({ currentUser }) => {
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

  // Client specific: always white background
  const headerClass = classNames(
    "fixed w-full top-0 z-50 transition-all duration-300 border-b bg-white border-gray-200 shadow-sm"
  );
  const textColor = "text-gray-700";
  const logoColor = "text-gray-900";

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate(`/client/explore?q=${encodeURIComponent(searchQuery)}`);
  };

  const unreadNotifs = DB_NOTIFICATIONS.filter(n => n.user_id === currentUser.user_id && n.is_read === '0').length;
  const unreadMsgs = DB_MESSAGES.filter(m => m.receiver_id === currentUser.user_id && m.is_read === '0').length;
  
  // Cart count (nanti dari context)
  const cartCount = 0;

  return (
    <>
      <header className={headerClass}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div className="flex items-center flex-1">
              <div
                className={classNames("text-3xl font-black tracking-tighter cursor-pointer mr-8 transition-colors", logoColor)}
                onClick={() => navigate('/client/dashboard')}
              >
                jasa<span className="text-emerald-500">.in</span>
                <span className="ml-2 text-xs font-medium bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full align-middle">
                  Client
                </span>
              </div>

              {/* Search Bar - Client cari jasa */}
              <div className="hidden md:block flex-1 max-w-xl">
                <form onSubmit={handleSearch} className="flex w-full shadow-sm rounded-md overflow-hidden border border-gray-300 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500">
                  <input
                    type="text"
                    placeholder="Cari jasa freelance... (contoh: desain logo, web, artikel)"
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

            {/* Navigation - Client Specific */}
            <div className="hidden md:flex items-center space-x-6">
              {/* Explore Services */}
              <button 
                className={classNames("font-bold text-sm hover:text-emerald-500 transition-colors", textColor)} 
                onClick={() => navigate('/client/explore')}
              >
                Cari Jasa
              </button>

              {/* Messages */}
              <button 
                className={classNames("font-bold text-sm hover:text-emerald-500 transition-colors flex items-center", textColor)} 
                onClick={() => navigate('/client/messages')}
              >
                Pesan
                {unreadMsgs > 0 && (
                  <span className="ml-1.5 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                    {unreadMsgs}
                  </span>
                )}
              </button>

              {/* My Orders - Client liat pesanan mereka */}
              <button 
                className={classNames("font-bold text-sm hover:text-emerald-500 transition-colors flex items-center", textColor)} 
                onClick={() => navigate('/client/orders')}
              >
                <Clock className="w-4 h-4 mr-1" />
                Pesanan Saya
              </button>

              {/* Wishlist / Saved Services */}
              <button 
                className={classNames("font-bold text-sm hover:text-emerald-500 transition-colors flex items-center", textColor)} 
                onClick={() => navigate('/client/wishlist')}
              >
                <Heart className="w-4 h-4 mr-1" />
                Tersimpan
              </button>

              {/* Notification Bell */}
              <div className="relative cursor-pointer">
                <BellIcon className={classNames("w-6 h-6 hover:text-emerald-500 transition-colors", textColor)} />
                {unreadNotifs > 0 && (
                  <span className="absolute -top-1 -right-1 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white"></span>
                )}
              </div>

              {/* Cart - Client specific */}
              <button 
                className="relative p-1.5 hover:bg-gray-100 rounded-full transition-colors"
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
                  <Avatar src={currentUser.avatar_url} size="md" />
                </button>

                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-3 w-72 bg-white rounded-xl shadow-2xl py-2 z-50 border border-gray-100 overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
                      <p className="font-bold text-gray-900 truncate">{currentUser.full_name}</p>
                      <p className="text-xs text-gray-500 truncate">@{currentUser.username}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Client</span>
                        <span className="text-xs text-gray-500">Mencari jasa</span>
                      </div>
                    </div>

                    <div className="py-2">
                      <DropdownItem 
                        icon={User} 
                        label="Profil Saya" 
                        onClick={() => { navigate('/client/profile'); setIsProfileMenuOpen(false); }} 
                      />
                      <DropdownItem 
                        icon={LayoutGrid} 
                        label="Pesanan Saya" 
                        onClick={() => { navigate('/client/orders'); setIsProfileMenuOpen(false); }} 
                        badge={3} // contoh jumlah pesanan aktif
                      />
                      <DropdownItem 
                        icon={Heart} 
                        label="Jasa Tersimpan" 
                        onClick={() => { navigate('/client/wishlist'); setIsProfileMenuOpen(false); }} 
                      />
                      <DropdownItem 
                        icon={Wallet} 
                        label="Dompet" 
                        onClick={() => { navigate('/client/wallet'); setIsProfileMenuOpen(false); }} 
                      />
                    </div>

                    {/* Tombol Switch ke Freelancer Mode */}
                    <div className="border-t border-gray-100 p-3 bg-emerald-50/50 cursor-pointer hover:bg-emerald-50 transition-colors group">
                      <div 
                        className="flex justify-between items-center text-emerald-700 font-bold text-sm"
                        onClick={() => {
                          // TODO: Switch role ke freelancer
                          // Redirect ke halaman upgrade ke freelancer
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
                        onClick={() => { navigate('/client/settings'); setIsProfileMenuOpen(false); }} 
                      />
                      <DropdownItem 
                        icon={LogOut} 
                        label="Keluar" 
                        className="text-red-600 hover:text-red-700 hover:bg-red-50" 
                        onClick={() => {
                          // Handle logout
                          localStorage.removeItem('currentUser');
                          navigate('/login');
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Categories - Client bisa filter jasa by kategori */}
        <div className="w-full bg-white border-t border-gray-200 overflow-x-auto custom-scrollbar">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ul className="flex space-x-8 text-sm font-bold text-gray-600 whitespace-nowrap py-3">
              <li 
                className="cursor-pointer hover:text-emerald-600 transition-colors"
                onClick={() => navigate('/client/explore')}
              >
                Semua Jasa
              </li>
              {DB_CATEGORIES.filter(c => c.parent_id === null).slice(0, 8).map(cat => (
                <li 
                  key={cat.category_id} 
                  className="relative group cursor-pointer hover:text-emerald-600 pb-1"
                >
                  {cat.name}
                  <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-gray-100 shadow-xl rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden py-1">
                    {DB_CATEGORIES.filter(sub => sub.parent_id === cat.category_id).map((subItem) => (
                      <button 
                        key={subItem.category_id} 
                        onClick={() => navigate(`/client/explore?category=${subItem.slug}`)} 
                        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-emerald-600 font-medium"
                      >
                        {subItem.name}
                      </button>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </header>

      {/* Spacer */}
      <div className="h-[140px]"></div>
    </>
  );
};

export default ClientHeader;