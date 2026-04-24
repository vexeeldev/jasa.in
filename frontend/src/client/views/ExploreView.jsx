import React, { useState, useEffect } from 'react';
import { Heart, ChevronLeft, ChevronRight, Menu, Filter, SlidersHorizontal, Clock, Star, TrendingUp, Shield } from 'lucide-react';
import { DB_CATEGORIES } from '../data/mockDatabase';
import { hydratedServices, formatCurrency, classNames } from '../data/helpers';
import Avatar from '../components/ui/Avatar';
import RatingStars from '../components/ui/RatingStars';

const ClientExploreView = ({ navigate, viewParams }) => {
  const searchQuery = viewParams?.q || '';
  const categorySlug = viewParams?.category || '';
  const services = hydratedServices;
  
  // Filter states
  const [selectedCategory, setSelectedCategory] = useState(categorySlug);
  const [selectedFreelancerLevel, setSelectedFreelancerLevel] = useState('');
  const [selectedBudget, setSelectedBudget] = useState('');
  const [selectedDelivery, setSelectedDelivery] = useState('');
  const [selectedSort, setSelectedSort] = useState('recommended');
  const [showProOnly, setShowProOnly] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [visibleServices, setVisibleServices] = useState(12);
  const [wishlist, setWishlist] = useState([]);

  // Apply filters
  const filteredServices = services.filter(service => {
    // Search filter
    if (searchQuery && !service.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Category filter
    if (selectedCategory && service.category_slug !== selectedCategory) {
      return false;
    }
    
    // Freelancer level filter
    if (selectedFreelancerLevel) {
      if (selectedFreelancerLevel === 'top' && service.seller.level !== 'top') return false;
      if (selectedFreelancerLevel === 'high' && !['high', 'top'].includes(service.seller.level)) return false;
      if (selectedFreelancerLevel === 'new' && service.seller.level !== 'new') return false;
    }
    
    // Budget filter
    if (selectedBudget) {
      const price = service.packages.basic?.price || 0;
      if (selectedBudget === 'under-500k' && price >= 500000) return false;
      if (selectedBudget === '500k-2m' && (price < 500000 || price > 2000000)) return false;
      if (selectedBudget === 'above-2m' && price <= 2000000) return false;
    }
    
    // Delivery filter
    if (selectedDelivery) {
      const delivery = service.packages.basic?.delivery_days || 7;
      if (selectedDelivery === '24h' && delivery > 1) return false;
      if (selectedDelivery === '3d' && delivery > 3) return false;
      if (selectedDelivery === '7d' && delivery > 7) return false;
    }
    
    // Pro only filter
    if (showProOnly && service.seller.level !== 'top') return false;
    
    return true;
  });

  // Sort services
  const sortedServices = [...filteredServices].sort((a, b) => {
    switch(selectedSort) {
      case 'popular':
        return (b.total_orders || 0) - (a.total_orders || 0);
      case 'rating':
        return (b.seller.rating_avg || 0) - (a.seller.rating_avg || 0);
      case 'price-low':
        return (a.packages.basic?.price || 0) - (b.packages.basic?.price || 0);
      case 'price-high':
        return (b.packages.basic?.price || 0) - (a.packages.basic?.price || 0);
      case 'newest':
        return (b.created_at || 0) - (a.created_at || 0);
      default:
        return 0; // recommended
    }
  });

  const paginatedServices = sortedServices.slice(0, visibleServices);
  const hasMore = visibleServices < sortedServices.length;

  const toggleWishlist = (serviceId, e) => {
    e.stopPropagation();
    if (wishlist.includes(serviceId)) {
      setWishlist(wishlist.filter(id => id !== serviceId));
    } else {
      setWishlist([...wishlist, serviceId]);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 mb-2">
          {searchQuery 
            ? `Hasil pencarian "${searchQuery}"` 
            : selectedCategory 
              ? `Jasa ${selectedCategory}` 
              : 'Temukan Jasa Freelance Berkualitas'}
        </h1>
        <p className="text-gray-500 font-medium">
          {searchQuery 
            ? `Menampilkan ${filteredServices.length} layanan untuk "${searchQuery}"`
            : 'Ribuan freelancer siap membantu mewujudkan ide Anda'}
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
        {/* Filters Sidebar - Desktop */}
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
                {DB_CATEGORIES.filter(c => c.parent_id !== null).slice(0, 10).map(cat => (
                  <button
                    key={cat.category_id}
                    onClick={() => setSelectedCategory(cat.slug)}
                    className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                      selectedCategory === cat.slug ? 'bg-emerald-50 text-emerald-700 font-bold' : 'hover:bg-gray-50'
                    }`}
                  >
                    {cat.name}
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
                onClick={() => {
                  setSelectedCategory('');
                  setSelectedFreelancerLevel('');
                  setSelectedBudget('');
                  setSelectedDelivery('');
                  setShowProOnly(false);
                }}
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
                Menampilkan <span className="font-bold text-gray-900">{filteredServices.length}</span> layanan
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
          {paginatedServices.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Tidak ada layanan yang ditemukan</h3>
              <p className="text-gray-500">Coba ubah filter atau kata kunci pencarian Anda</p>
              <button
                onClick={() => {
                  setSelectedCategory('');
                  setSelectedFreelancerLevel('');
                  setSelectedBudget('');
                  setSelectedDelivery('');
                  setShowProOnly(false);
                }}
                className="mt-4 px-6 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700"
              >
                Reset Filter
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedServices.map((service) => (
                  <div 
                    key={service.service_id} 
                    className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col group cursor-pointer"
                    onClick={() => navigate('service-detail', { id: service.service_id })}
                  >
                    <div className="relative h-48 overflow-hidden bg-gray-100">
                      <img 
                        src={service.thumbnail_url} 
                        alt={service.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      <button 
                        className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full text-gray-400 hover:text-red-500 hover:scale-110 transition-all z-10 shadow-sm"
                        onClick={(e) => toggleWishlist(service.service_id, e)}
                      >
                        <Heart className={`w-4 h-4 ${wishlist.includes(service.service_id) ? 'fill-red-500 text-red-500' : ''}`} />
                      </button>
                      {service.seller.level === 'top' && (
                        <div className="absolute top-3 left-3 bg-emerald-600 text-white text-xs font-bold px-2 py-1 rounded-md flex items-center">
                          <Shield className="w-3 h-3 mr-1" />
                          PRO
                        </div>
                      )}
                    </div>

                    <div className="p-4 flex-grow flex flex-col">
                      <div className="flex items-center mb-3">
                        <Avatar src={service.seller.avatar_url} size="sm" />
                        <div className="ml-2 flex flex-col">
                          <span className="text-sm font-bold text-gray-900 hover:underline leading-none">{service.seller.full_name}</span>
                          <div className="flex items-center gap-1 mt-1">
                            <RatingStars rating={service.seller.rating_avg} size={12} />
                            <span className="text-xs text-gray-500">({service.total_orders || 0})</span>
                          </div>
                        </div>
                      </div>

                      <h3 className="text-sm font-semibold text-gray-800 leading-snug mb-2 hover:text-emerald-600 line-clamp-2">
                        {service.title}
                      </h3>

                      {/* Package Info */}
                      <div className="mt-auto pt-3 border-t border-gray-100">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-[10px] text-gray-400 uppercase font-bold">Mulai dari</p>
                            <span className="text-lg font-black text-gray-900">
                              {formatCurrency(service.packages.basic?.price || 0)}
                            </span>
                          </div>
                          {service.packages.basic?.delivery_days && (
                            <div className="text-right">
                              <p className="text-[10px] text-gray-400 uppercase font-bold">Estimasi</p>
                              <span className="text-xs font-semibold text-gray-700">
                                {service.packages.basic.delivery_days} hari
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Load More */}
              {hasMore && (
                <div className="text-center mt-12">
                  <button
                    onClick={() => setVisibleServices(visibleServices + 12)}
                    className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 font-bold rounded-lg hover:border-emerald-600 hover:text-emerald-600 transition-colors"
                  >
                    Muat Lebih Banyak
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