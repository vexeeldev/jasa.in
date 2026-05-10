import React, { useState, useEffect } from 'react';
import { Heart, ChevronRight, Menu, Filter, SlidersHorizontal, Clock, Star, TrendingUp, Shield, Loader2 } from 'lucide-react';
import { formatCurrency } from '../data/helpers';
import Avatar from '../components/ui/Avatar';
import RatingStars from '../components/ui/RatingStars';
import { Navigate, useNavigate } from 'react-router-dom';

const API_BASE_URL = 'http://localhost:5000/api';

const ClientExploreView = ({ viewParams }) => {
  const navigate = useNavigate();
  const searchQuery = viewParams?.q || '';
  const categorySlug = viewParams?.category || '';
  
  // State
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visibleServices, setVisibleServices] = useState(12);
  
  // Filter states
  const [selectedCategory, setSelectedCategory] = useState(categorySlug);
  const [selectedFreelancerLevel, setSelectedFreelancerLevel] = useState('');
  const [selectedBudget, setSelectedBudget] = useState('');
  const [selectedDelivery, setSelectedDelivery] = useState('');
  const [selectedSort, setSelectedSort] = useState('recommended');
  const [showProOnly, setShowProOnly] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [wishlist, setWishlist] = useState([]);
  
  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);
  
  // Fetch services when filters change
  useEffect(() => {
    fetchServices();
  }, [searchQuery, selectedCategory, selectedFreelancerLevel, selectedBudget, selectedDelivery, selectedSort, showProOnly]);
  
  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/categories`);
      const data = await response.json();
      
      if (data.success && data.data && data.data.length > 0) {
        const allCategories = data.data.filter(cat => cat.SLUG);
        setCategories(allCategories);
      } else {
        setCategories([
          { CATEGORY_ID: 1, NAME: 'Design', SLUG: 'design' },
          { CATEGORY_ID: 2, NAME: 'Programming', SLUG: 'programming' },
          { CATEGORY_ID: 3, NAME: 'Marketing', SLUG: 'marketing' },
          { CATEGORY_ID: 21, NAME: 'UI/UX Design', SLUG: 'ui/ux' },
          { CATEGORY_ID: 22, NAME: 'Web Development', SLUG: 'webdev' },
          { CATEGORY_ID: 23, NAME: 'Logo Design', SLUG: 'logo' }
        ]);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      setCategories([
        { CATEGORY_ID: 1, NAME: 'Design', SLUG: 'design' },
        { CATEGORY_ID: 2, NAME: 'Programming', SLUG: 'programming' },
        { CATEGORY_ID: 3, NAME: 'Marketing', SLUG: 'marketing' }
      ]);
    }
  };
  
  const fetchServices = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', 1);
      params.append('limit', 100); // Ambil banyak dulu, biar filter jalan di frontend
      
      if (searchQuery) params.append('search', searchQuery);
      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedFreelancerLevel) params.append('level', selectedFreelancerLevel);
      if (selectedBudget) params.append('budget', selectedBudget);
      if (selectedDelivery) params.append('delivery', selectedDelivery);
      if (selectedSort && selectedSort !== 'recommended') params.append('sort', selectedSort);
      if (showProOnly) params.append('level', 'top');
      
      console.log('Fetching with params:', params.toString());
      
      const response = await fetch(`${API_BASE_URL}/services?${params.toString()}`);
      const data = await response.json();
      
      console.log('Total services from API:', data.data?.length || 0);
      
      if (data.success) {
        setServices(data.data || []);
        setVisibleServices(12); // Reset visible services saat filter berubah
      }
    } catch (error) {
      console.error('Failed to fetch services:', error);
      setServices([]);
    } finally {
      setLoading(false);
    }
  };
  
  const resetFilters = () => {
    setSelectedCategory('');
    setSelectedFreelancerLevel('');
    setSelectedBudget('');
    setSelectedDelivery('');
    setSelectedSort('recommended');
    setShowProOnly(false);
  };
  
  const loadMore = () => {
    setVisibleServices(prev => prev + 12);
  };
  
  const toggleWishlist = (serviceId, e) => {
    e.stopPropagation();
    if (wishlist.includes(serviceId)) {
      setWishlist(wishlist.filter(id => id !== serviceId));
    } else {
      setWishlist([...wishlist, serviceId]);
    }
  };
  
  const displayedServices = services.slice(0, visibleServices);
  const hasMore = visibleServices < services.length;
  
  if (loading && services.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 mb-2">
          {searchQuery 
            ? `Hasil pencarian "${searchQuery}"` 
            : selectedCategory 
              ? `Jasa ${categories.find(c => c.SLUG === selectedCategory)?.NAME || selectedCategory}` 
              : 'Temukan Jasa Freelance Berkualitas'}
        </h1>
        <p className="text-gray-500 font-medium">
          {searchQuery 
            ? `Menampilkan ${services.length} layanan untuk "${searchQuery}"`
            : `${services.length} layanan tersedia dari freelancer terbaik`}
        </p>
      </div>
      
      {/* Mobile Filter Button */}
      <div className="lg:hidden mb-4">
        <button 
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-lg"
        >
          <span className="font-bold text-gray-700 flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Filter & Urutkan
          </span>
          <ChevronRight className={`w-5 h-5 transition-transform ${isFilterOpen ? 'rotate-90' : ''}`} />
        </button>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Filters Sidebar */}
        <div className={`lg:w-64 flex-shrink-0 ${isFilterOpen ? 'block' : 'hidden lg:block'}`}>
          <div className="sticky top-28 space-y-6">
            {/* Categories */}
            <div>
              <h3 className="font-black text-gray-900 mb-3 flex items-center">
                <Menu className="w-4 h-4 mr-2" />
                Kategori
              </h3>
              <div className="space-y-2">
                <button 
                  onClick={() => setSelectedCategory('')}
                  className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                    !selectedCategory ? 'bg-emerald-50 text-emerald-700 font-bold' : 'hover:bg-gray-50'
                  }`}
                >
                  Semua Kategori
                </button>
                {categories.slice(0, 10).map(cat => (
                  <button
                    key={cat.CATEGORY_ID}
                    onClick={() => setSelectedCategory(cat.SLUG)}
                    className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                      selectedCategory === cat.SLUG ? 'bg-emerald-50 text-emerald-700 font-bold' : 'hover:bg-gray-50'
                    }`}
                  >
                    {cat.NAME}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Freelancer Level */}
            <div>
              <h3 className="font-black text-gray-900 mb-3 flex items-center">
                <Star className="w-4 h-4 mr-2" />
                Level Freelancer
              </h3>
              <div className="space-y-2">
                {[
                  { value: '', label: 'Semua Level' },
                  { value: 'top', label: '⭐ Top Rated (Pro)' },
                  { value: 'high', label: '📈 Level Tinggi' },
                  { value: 'new', label: '🌱 Pendatang Baru' }
                ].map(option => (
                  <button
                    key={option.value}
                    onClick={() => setSelectedFreelancerLevel(option.value)}
                    className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                      selectedFreelancerLevel === option.value ? 'bg-emerald-50 text-emerald-700 font-bold' : 'hover:bg-gray-50'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Budget Range */}
            <div>
              <h3 className="font-black text-gray-900 mb-3">💰 Anggaran</h3>
              <div className="space-y-2">
                {[
                  { value: '', label: 'Semua Harga' },
                  { value: 'under-500k', label: 'Di bawah Rp 500.000' },
                  { value: '500k-2m', label: 'Rp 500.000 - Rp 2.000.000' },
                  { value: 'above-2m', label: 'Di atas Rp 2.000.000' }
                ].map(option => (
                  <button
                    key={option.value}
                    onClick={() => setSelectedBudget(option.value)}
                    className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                      selectedBudget === option.value ? 'bg-emerald-50 text-emerald-700 font-bold' : 'hover:bg-gray-50'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Delivery Time */}
            <div>
              <h3 className="font-black text-gray-900 mb-3 flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                Estimasi Pengerjaan
              </h3>
              <div className="space-y-2">
                {[
                  { value: '', label: 'Berapa pun' },
                  { value: '24h', label: '⚡ Express (24 jam)' },
                  { value: '3d', label: '📅 1 - 3 hari' },
                  { value: '7d', label: '📆 4 - 7 hari' }
                ].map(option => (
                  <button
                    key={option.value}
                    onClick={() => setSelectedDelivery(option.value)}
                    className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                      selectedDelivery === option.value ? 'bg-emerald-50 text-emerald-700 font-bold' : 'hover:bg-gray-50'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Reset Filters */}
            {(selectedCategory || selectedFreelancerLevel || selectedBudget || selectedDelivery || showProOnly) && (
              <button
                onClick={resetFilters}
                className="w-full py-2 text-sm text-emerald-600 font-bold hover:underline"
              >
                Reset Semua Filter
              </button>
            )}
          </div>
        </div>
        
        {/* Main Content */}
        <div className="flex-1">
          {/* Sorting and Results Info */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-gray-200">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600 font-medium">
                Menampilkan <span className="font-bold text-gray-900">{displayedServices.length}</span> dari <span className="font-bold text-gray-900">{services.length}</span> layanan
              </span>
              
              {/* Pro Only Toggle */}
              <button
                onClick={() => setShowProOnly(!showProOnly)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  showProOnly 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Shield className="w-3 h-3" />
                Pro Services Only
              </button>
            </div>
            
            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-gray-400" />
              <select 
                value={selectedSort}
                onChange={(e) => setSelectedSort(e.target.value)}
                className="text-sm font-semibold text-gray-700 border-none bg-transparent focus:ring-0 cursor-pointer"
              >
                <option value="recommended">Direkomendasikan</option>
                <option value="popular">Terlaris</option>
                <option value="rating">Rating Tertinggi</option>
                <option value="price-low">Harga Terendah</option>
                <option value="price-high">Harga Tertinggi</option>
                <option value="newest">Terbaru</option>
              </select>
            </div>
          </div>
          
          {/* Services Grid */}
          {services.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Tidak ada layanan yang ditemukan</h3>
              <p className="text-gray-500">Coba ubah filter atau kata kunci pencarian Anda</p>
              <button
                onClick={resetFilters}
                className="mt-4 px-6 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700"
              >
                Reset Filter
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayedServices.map((service) => (
                  <div 
                    key={service.SERVICE_ID} 
                    className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col group cursor-pointer"
                    onClick={() => navigate('/client/service/' + service.SERVICE_ID)}
                  >
                    <div className="relative h-48 overflow-hidden bg-gray-100">
                      <img 
                        src={service.THUMBNAIL_URL || 'https://images.unsplash.com/photo-1618761714954-0b8cd0026356?auto=format&fit=crop&w=800&q=80'} 
                        alt={service.TITLE} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      <button 
                        className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full text-gray-400 hover:text-red-500 hover:scale-110 transition-all z-10 shadow-sm"
                        onClick={(e) => toggleWishlist(service.SERVICE_ID, e)}
                      >
                        <Heart className={`w-4 h-4 ${wishlist.includes(service.SERVICE_ID) ? 'fill-red-500 text-red-500' : ''}`} />
                      </button>
                      {service.FREELANCER_LEVEL === 'top' && (
                        <div className="absolute top-3 left-3 bg-emerald-600 text-white text-xs font-bold px-2 py-1 rounded-md flex items-center">
                          <Shield className="w-3 h-3 mr-1" />
                          PRO
                        </div>
                      )}
                    </div>
                    
                    <div className="p-4 flex-grow flex flex-col">
                      <div className="flex items-center mb-3">
                        <Avatar src={service.SELLER_AVATAR} size="sm" />
                        <div className="ml-2 flex flex-col">
                          <span className="text-sm font-bold text-gray-900 hover:underline leading-none">{service.SELLER_NAME || 'Freelancer'}</span>
                          <div className="flex items-center gap-1 mt-1">
                            <RatingStars rating={service.SELLER_RATING || 0} size={12} />
                            <span className="text-xs text-gray-500">({service.SELLER_ORDERS || 0})</span>
                          </div>
                        </div>
                      </div>
                      
                      <h3 className="text-sm font-semibold text-gray-800 leading-snug mb-2 hover:text-emerald-600 line-clamp-2">
                        {service.TITLE}
                      </h3>
                      
                      {/* Package Info */}
                      <div className="mt-auto pt-3 border-t border-gray-100">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-[10px] text-gray-400 uppercase font-bold">Mulai dari</p>
                            <span className="text-lg font-black text-gray-900">
                              {formatCurrency(service.MIN_PRICE || 0)}
                            </span>
                          </div>
                          {service.PACKAGES && service.PACKAGES[0]?.DELIVERY_DAYS && (
                            <div className="text-right">
                              <p className="text-[10px] text-gray-400 uppercase font-bold">Estimasi</p>
                              <span className="text-xs font-semibold text-gray-700">
                                {service.PACKAGES[0].DELIVERY_DAYS} hari
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Load More Button */}
              {hasMore && (
                <div className="text-center mt-12">
                  <button
                    onClick={loadMore}
                    className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 font-bold rounded-lg hover:border-emerald-600 hover:text-emerald-600 transition-colors"
                  >
                    Muat Lebih Banyak ({services.length - visibleServices} lagi)
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientExploreView;