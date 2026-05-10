import React, { useState, useEffect } from 'react';
import { Heart, ChevronLeft, ChevronRight, Menu, Loader2 } from 'lucide-react';
import { formatCurrency } from '../data/helpers';
import Avatar from '../components/ui/Avatar';
import RatingStars from '../components/ui/RatingStars';

const API_BASE_URL = 'http://localhost:5000/api';

const ExploreView = ({ navigate, viewParams }) => {
  const searchQuery = viewParams?.q || '';
  
  // State
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  
  // Filter states
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedBudget, setSelectedBudget] = useState('');
  const [selectedDelivery, setSelectedDelivery] = useState('');
  const [selectedSort, setSelectedSort] = useState('recommended');
  const [proOnly, setProOnly] = useState(false);
  
  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);
  
  // Fetch services when filters change
  useEffect(() => {
    fetchServices();
  }, [searchQuery, selectedCategory, selectedLevel, selectedBudget, selectedDelivery, selectedSort, proOnly, pagination.page]);
  
  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/categories`);
      const data = await response.json();
      
      if (data.success && data.data && data.data.length > 0) {
        // Ambil semua kategori yang punya slug
        const allCategories = data.data.filter(cat => cat.SLUG);
        setCategories(allCategories);
        console.log('Categories loaded:', allCategories.length);
      } else {
        // Fallback categories jika API gagal
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
      // Fallback categories
      setCategories([
        { CATEGORY_ID: 1, NAME: 'Design', SLUG: 'design' },
        { CATEGORY_ID: 2, NAME: 'Programming', SLUG: 'programming' },
        { CATEGORY_ID: 3, NAME: 'Marketing', SLUG: 'marketing' },
        { CATEGORY_ID: 21, NAME: 'UI/UX Design', SLUG: 'ui/ux' },
        { CATEGORY_ID: 22, NAME: 'Web Development', SLUG: 'webdev' },
        { CATEGORY_ID: 23, NAME: 'Logo Design', SLUG: 'logo' }
      ]);
    }
  };
  
  const fetchServices = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', pagination.page);
      params.append('limit', 12);
      
      if (searchQuery) params.append('search', searchQuery);
      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedLevel) params.append('level', selectedLevel);
      if (selectedBudget) params.append('budget', selectedBudget);
      if (selectedDelivery) params.append('delivery', selectedDelivery);
      if (selectedSort && selectedSort !== 'recommended') params.append('sort', selectedSort);
      if (proOnly) params.append('level', 'top');
      
      const response = await fetch(`${API_BASE_URL}/services?${params.toString()}`);
      const data = await response.json();
      
      if (data.success) {
        setServices(data.data);
        setPagination({
          page: data.pagination.page,
          totalPages: data.pagination.totalPages,
          total: data.pagination.total
        });
      }
    } catch (error) {
      console.error('Failed to fetch services:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  
  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };
  
  const handleLevelChange = (e) => {
    setSelectedLevel(e.target.value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };
  
  const handleBudgetChange = (e) => {
    setSelectedBudget(e.target.value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };
  
  const handleDeliveryChange = (e) => {
    setSelectedDelivery(e.target.value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };
  
  const handleSortChange = (e) => {
    setSelectedSort(e.target.value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };
  
  const resetFilters = () => {
    setSelectedCategory('');
    setSelectedLevel('');
    setSelectedBudget('');
    setSelectedDelivery('');
    setSelectedSort('recommended');
    setProOnly(false);
    setPagination(prev => ({ ...prev, page: 1 }));
  };
  
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
          {searchQuery ? `Hasil pencarian untuk "${searchQuery}"` : 'Eksplorasi Jasa Freelance'}
        </h1>
        <p className="text-gray-500 font-medium">Temukan profesional untuk mewujudkan ide Anda menjadi kenyataan.</p>
      </div>
      
      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-8 pb-4 border-b border-gray-200">
        {/* Category Filter */}
        <select 
          className="border border-gray-300 rounded-md py-2.5 px-4 text-sm font-bold text-gray-700 bg-white focus:ring-emerald-500 focus:border-emerald-500 cursor-pointer shadow-sm outline-none"
          value={selectedCategory}
          onChange={handleCategoryChange}
        >
          <option value="">Semua Kategori</option>
          {categories.map(cat => (
            <option key={cat.CATEGORY_ID} value={cat.SLUG}>
              {cat.NAME}
            </option>
          ))}
        </select>
        
        {/* Level Filter */}
        <select 
          className="border border-gray-300 rounded-md py-2.5 px-4 text-sm font-bold text-gray-700 bg-white focus:ring-emerald-500 focus:border-emerald-500 cursor-pointer shadow-sm outline-none"
          value={selectedLevel}
          onChange={handleLevelChange}
        >
          <option value="">Semua Level</option>
          <option value="top">Top Rated (Pro)</option>
          <option value="high">Level Tinggi</option>
          <option value="new">Pendatang Baru</option>
        </select>
        
        {/* Budget Filter */}
        <select 
          className="border border-gray-300 rounded-md py-2.5 px-4 text-sm font-bold text-gray-700 bg-white focus:ring-emerald-500 focus:border-emerald-500 cursor-pointer shadow-sm outline-none"
          value={selectedBudget}
          onChange={handleBudgetChange}
        >
          <option value="">Semua Budget</option>
          <option value="under-500k">Di bawah Rp 500k</option>
          <option value="500k-2m">Rp 500k - Rp 2Jt</option>
          <option value="above-2m">Di atas Rp 2Jt</option>
        </select>
        
        {/* Delivery Filter */}
        <select 
          className="border border-gray-300 rounded-md py-2.5 px-4 text-sm font-bold text-gray-700 bg-white focus:ring-emerald-500 focus:border-emerald-500 cursor-pointer shadow-sm outline-none"
          value={selectedDelivery}
          onChange={handleDeliveryChange}
        >
          <option value="">Semua Waktu</option>
          <option value="24h">Express 24 Jam</option>
          <option value="3d">Hingga 3 Hari</option>
          <option value="7d">Hingga 7 Hari</option>
        </select>
        
        {/* Sort */}
        <div className="ml-auto flex items-center text-sm">
          <span className="text-gray-500 font-bold mr-2">Urutkan:</span>
          <select 
            className="border-none bg-transparent font-black text-gray-900 focus:ring-0 cursor-pointer p-0 outline-none text-base"
            value={selectedSort}
            onChange={handleSortChange}
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
      
      {/* Info Bar */}
      <div className="flex items-center justify-between mb-6">
        <span className="text-sm text-gray-500 font-bold">{pagination.total} layanan tersedia</span>
        <div className="flex items-center gap-2">
          <button 
            onClick={resetFilters}
            className="text-xs text-emerald-600 font-bold hover:underline px-3 py-1.5 rounded-full border border-emerald-200 hover:bg-emerald-50 transition"
          >
            Reset Filter
          </button>
          <div className="flex items-center gap-2 border border-gray-200 px-3 py-1.5 rounded-full bg-white shadow-sm">
            <span className="text-xs font-bold text-gray-700">Pro Services Only</span>
            <button 
              onClick={() => {
                setProOnly(!proOnly);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className={`w-8 h-4 rounded-full flex items-center px-0.5 transition-colors ${proOnly ? 'bg-emerald-500' : 'bg-gray-300'}`}
            >
              <div className={`w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${proOnly ? 'translate-x-4' : ''}`}></div>
            </button>
          </div>
        </div>
      </div>
      
      {/* Services Grid */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        </div>
      ) : services.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-500">Tidak ada layanan yang ditemukan</p>
          <button 
            onClick={resetFilters}
            className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition"
          >
            Reset Filter
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {services.map((service) => (
              <div key={service.SERVICE_ID} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col group h-full">
                <div 
                  className="relative h-48 overflow-hidden bg-gray-100 cursor-pointer" 
                  onClick={() => navigate('/client/service/' + service.SERVICE_ID)}
                >
                  <img 
                    src={service.THUMBNAIL_URL || 'https://images.unsplash.com/photo-1618761714954-0b8cd0026356?auto=format&fit=crop&w=800&q=80'} 
                    alt={service.TITLE} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                  />
                  <button 
                    className="absolute top-3 right-3 p-1.5 bg-white/90 backdrop-blur-sm rounded-full text-gray-400 hover:text-red-500 transition-all z-10 shadow-sm" 
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Heart className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="p-4 flex-grow flex flex-col">
                  <div 
                    className="flex items-center mb-3 cursor-pointer" 
                    onClick={() => navigate('/client/profile/' + service.SELLER_ID)}
                  >
                    <Avatar src={service.SELLER_AVATAR} size="sm" />
                    <div className="ml-2 flex flex-col">
                      <span className="text-sm font-bold text-gray-900 hover:underline leading-none">{service.SELLER_NAME || 'Freelancer'}</span>
                      <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider mt-1">
                        {service.FREELANCER_LEVEL === 'top' ? 'Top Rated' : service.FREELANCER_LEVEL === 'pro' ? 'Pro' : `Level ${service.FREELANCER_LEVEL || 'new'}`}
                      </span>
                    </div>
                  </div>
                  
                  <h3 
                    className="text-base font-medium text-gray-800 leading-snug mb-3 hover:text-emerald-600 cursor-pointer line-clamp-2" 
                    onClick={() => navigate('/client/service/' + service.SERVICE_ID)}
                  >
                    {service.TITLE}
                  </h3>
                  
                  <div className="flex items-center mt-auto">
                    <RatingStars rating={service.SELLER_RATING || 0} count={service.SELLER_ORDERS || 0} />
                  </div>
                </div>
                
                <div className="border-t border-gray-100 px-4 py-3 flex justify-between items-center bg-gray-50/50">
                  <button className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-200 transition-colors">
                    <Menu className="w-4 h-4"/>
                  </button>
                  <div 
                    className="text-right cursor-pointer" 
                    onClick={() => navigate('/client/service/' + service.SERVICE_ID)}
                  >
                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-0.5">Mulai Dari</p>
                    <span className="text-lg font-black text-gray-900">{formatCurrency(service.MIN_PRICE || 0)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="mt-12 flex justify-center">
              <nav className="flex space-x-2">
                <button 
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5"/>
                </button>
                
                {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
                  let pageNum;
                  if (pagination.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (pagination.page <= 3) {
                    pageNum = i + 1;
                  } else if (pagination.page >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + i;
                  } else {
                    pageNum = pagination.page - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                        pagination.page === pageNum 
                          ? 'bg-gray-900 text-white shadow-md' 
                          : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button 
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-5 h-5"/>
                </button>
              </nav>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ExploreView;