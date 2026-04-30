import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Wallet, LayoutGrid, ChevronRight, Settings, LogOut, User, Heart, ShoppingCart, Clock, Star } from 'lucide-react';
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

const ClientHeader = ({ currentUser }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [isScrolled, setIsScrolled] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const isHome = location.pathname === '/' || location.pathname === '/client';

  useEffect(() => {
    const handleScroll = () => {
      // PERBAIKAN 1: Threshold diperkecil ke 10px agar "langsung muncul" saat discroll
      if (window.scrollY > 1) {
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
      ? "bg-transparent border-transparent shadow-none py-2" 
      : "bg-white border-b border-gray-200 shadow-md py-0"
  );

  const textColor = (isHome && !isScrolled) ? "text-white" : "text-gray-700";
  const logoColor = (isHome && !isScrolled) ? "text-white" : "text-gray-900";

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate(`/client/explore?q=${encodeURIComponent(searchQuery)}`);
  };

  const unreadNotifs = DB_NOTIFICATIONS.filter(n => n.user_id === currentUser?.user_id && n.is_read === '0').length;
  const unreadMsgs = DB_MESSAGES.filter(m => m.receiver_id === currentUser?.user_id && m.is_read === '0').length;

  return (
    <>
      <header className={headerClass}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={classNames("flex justify-between items-center transition-all duration-300", isScrolled ? "h-16" : "h-20")}>
            
            <div className="flex items-center flex-1">
              <div
                className={classNames("text-3xl font-black tracking-tighter cursor-pointer mr-8 transition-colors", logoColor)}
                onClick={() => navigate('/client/dashboard')}
              >
                jasa<span className={classNames((isHome && !isScrolled) ? "text-white" : "text-emerald-500")}>.in</span>
              </div>

              {/* Search Bar reveal */}
              <div className={classNames(
                "hidden md:block flex-1 max-w-xl transition-all duration-300 transform",
                (!isHome || isScrolled) ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none"
              )}>
                <form onSubmit={handleSearch} className="flex w-full shadow-sm rounded-md overflow-hidden border border-gray-200 focus-within:border-emerald-500 bg-white">
                  <input
                    type="text"
                    placeholder="Temukan layanan freelance..."
                    className="w-full px-4 py-2.5 border-none focus:ring-0 text-gray-900 text-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <button type="submit" className="bg-[#1e293b] hover:bg-black text-white px-5 transition-colors">
                    <Search className="w-5 h-5" />
                  </button>
                </form>
              </div>
            </div>

            <div className="hidden md:flex items-center space-x-6">
              <button className={classNames("font-bold text-sm hover:opacity-80 transition-colors", textColor)} onClick={() => navigate('/client/explore')}>Eksplorasi</button>
              <button className={classNames("font-bold text-sm hover:opacity-80 transition-colors", textColor)} onClick={() => navigate('/client/messages')}>
                Pesan {unreadMsgs > 0 && <span className="ml-1.5 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{unreadMsgs}</span>}
              </button>
              <button className={classNames("font-bold text-sm hover:opacity-80 transition-colors", textColor)} onClick={() => navigate('/client/orders')}>Pesanan</button>

              <div className="relative cursor-pointer">
                <BellIcon className={classNames("w-6 h-6 hover:opacity-70 transition-colors", textColor)} />
                {unreadNotifs > 0 && <span className="absolute -top-1 -right-1 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white"></span>}
              </div>

              <div className="relative">
                <button onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)} className="flex items-center focus:outline-none ml-2">
                  <Avatar src={currentUser?.avatar_url} size="md" verified={currentUser?.is_verified === '1'} />
                </button>
                {/* Dropdown Menu (Tetap sama) */}
                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-3 w-72 bg-white rounded-xl shadow-2xl py-2 z-50 border border-gray-100 overflow-hidden text-left">
                    <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
                      <p className="font-bold text-gray-900 truncate">{currentUser?.full_name}</p>
                      <p className="text-xs text-gray-500 truncate">@{currentUser?.username}</p>
                    </div>
                    <div className="py-2 text-gray-700">
                      <DropdownItem icon={User} label="Profil Publik" onClick={() => { navigate(`/profile/${currentUser?.user_id}`); setIsProfileMenuOpen(false); }} />
                      <DropdownItem icon={LayoutGrid} label="Kelola Pesanan" onClick={() => { navigate('/client/orders'); setIsProfileMenuOpen(false); }} />
                      <DropdownItem icon={Wallet} label="Dompet & Saldo" onClick={() => { navigate('/client/wallet'); setIsProfileMenuOpen(false); }} />
                      <DropdownItem icon={Heart} label="Jasa Tersimpan" onClick={() => { setIsProfileMenuOpen(false); }} />
                    </div>
                    <div className="border-t border-gray-100 py-2">
                      <DropdownItem icon={Settings} label="Pengaturan Akun" onClick={() => { navigate('/client/settings'); setIsProfileMenuOpen(false); }} />
                      <DropdownItem icon={LogOut} label="Keluar" className="text-red-600" onClick={() => { localStorage.removeItem('currentUser'); navigate('/login'); }} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Categories Bar */}
        <div className={classNames(
          "w-full bg-white border-t border-gray-200 transition-all duration-500 overflow-hidden hidden md:block",
          (!isHome || isScrolled) ? "max-h-20 opacity-100" : "max-h-0 opacity-0 pointer-events-none"
        )}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ul className="flex space-x-8 text-sm font-bold text-gray-600 whitespace-nowrap py-3">
              {DB_CATEGORIES.filter(c => c.parent_id === null).map(cat => (
                <li key={cat.category_id} className="relative group cursor-pointer hover:text-emerald-600">
                  {cat.name}
                  <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-gray-100 shadow-xl rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 py-1">
                    {DB_CATEGORIES.filter(sub => sub.parent_id === cat.category_id).map((subItem) => (
                      <button key={subItem.category_id} onClick={() => navigate(`/client/explore?category=${subItem.slug}`)} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-emerald-600 font-medium">
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

      {/* PERBAIKAN 2: Spacer Dinamis */}
      {/* Jika di Home dan belum discroll, kita beri div kosong bertinggi 0 agar konten Hero bisa mentok ke atas */}
      {/* Tapi di halaman selain Home, kita beri spacer penuh agar konten tidak tertutup header putih */}
      {!isHome ? (
        <div className="h-[120px]"></div>
      ) : (
        /* Di Home, kita beri padding internal supaya teks "Temukan Freelancer" turun sedikit dari atas */
        <div className="h-0"></div>
      )}
    </>
  );
};

export default ClientHeader;