import React from 'react';
import { Heart, ChevronLeft, ChevronRight, Menu } from 'lucide-react';
import { DB_CATEGORIES } from '../data/mockDatabase';
import { hydratedServices, formatCurrency, classNames } from '../data/helpers';
import Avatar from '../components/ui/Avatar';
import RatingStars from '../components/ui/RatingStars';

const ExploreView = ({ navigate, viewParams }) => {
  const searchQuery = viewParams?.q || '';
  const services    = hydratedServices;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 mb-2">
          {searchQuery ? `Hasil pencarian untuk "${searchQuery}"` : 'Eksplorasi Jasa Freelance'}
        </h1>
        <p className="text-gray-500 font-medium">Temukan profesional untuk mewujudkan ide Anda menjadi kenyataan.</p>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-8 pb-4 border-b border-gray-200">
        <select className="border border-gray-300 rounded-md py-2.5 px-4 text-sm font-bold text-gray-700 bg-white hover:bg-gray-50 focus:ring-emerald-500 focus:border-emerald-500 cursor-pointer shadow-sm outline-none">
          <option>Kategori Layanan</option>
          {DB_CATEGORIES.filter(c => c.parent_id !== null).map(c => (
            <option key={c.category_id}>{c.name}</option>
          ))}
        </select>
        <select className="border border-gray-300 rounded-md py-2.5 px-4 text-sm font-bold text-gray-700 bg-white hover:bg-gray-50 focus:ring-emerald-500 focus:border-emerald-500 cursor-pointer shadow-sm outline-none">
          <option>Opsi Freelancer</option>
          <option>Top Rated (Pro)</option>
          <option>Level Tinggi</option>
          <option>Pendatang Baru</option>
        </select>
        <select className="border border-gray-300 rounded-md py-2.5 px-4 text-sm font-bold text-gray-700 bg-white hover:bg-gray-50 focus:ring-emerald-500 focus:border-emerald-500 cursor-pointer shadow-sm outline-none">
          <option>Anggaran (Budget)</option>
          <option>Di bawah Rp 500k</option>
          <option>Rp 500k - Rp 2Jt</option>
          <option>Di atas Rp 2Jt</option>
        </select>
        <select className="border border-gray-300 rounded-md py-2.5 px-4 text-sm font-bold text-gray-700 bg-white hover:bg-gray-50 focus:ring-emerald-500 focus:border-emerald-500 cursor-pointer shadow-sm outline-none">
          <option>Waktu Pengiriman</option>
          <option>Express 24 Jam</option>
          <option>Hingga 3 Hari</option>
          <option>Hingga 7 Hari</option>
        </select>

        <div className="ml-auto flex items-center text-sm">
          <span className="text-gray-500 font-bold mr-2">Urutkan:</span>
          <select className="border-none bg-transparent font-black text-gray-900 focus:ring-0 cursor-pointer p-0 outline-none text-base">
            <option>Direkomendasikan</option>
            <option>Terlaris</option>
            <option>Ulasan Terbanyak</option>
            <option>Terbaru</option>
          </select>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <span className="text-sm text-gray-500 font-bold">{services.length * 12} layanan tersedia</span>
        <div className="flex items-center gap-2 border border-gray-200 px-3 py-1.5 rounded-full bg-white shadow-sm">
          <span className="text-xs font-bold text-gray-700">Pro Services Only</span>
          <div className="w-8 h-4 bg-gray-200 rounded-full flex items-center px-0.5 cursor-pointer hover:bg-gray-300 transition-colors">
            <div className="w-3 h-3 bg-white rounded-full shadow-sm"></div>
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {services.map((service) => (
          <div key={service.service_id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col group h-full">
            <div className="relative h-48 overflow-hidden bg-gray-100 cursor-pointer" onClick={() => navigate('service-detail', { id: service.service_id })}>
              <img src={service.thumbnail_url} alt={service.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              <button className="absolute top-3 right-3 p-1.5 bg-white/90 backdrop-blur-sm rounded-full text-gray-400 hover:text-red-500 hover:scale-110 transition-all z-10 shadow-sm" onClick={(e) => { e.stopPropagation(); }}>
                <Heart className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 flex-grow flex flex-col">
              <div className="flex items-center mb-3 cursor-pointer" onClick={() => navigate('profile', { id: service.seller.user_id })}>
                <Avatar src={service.seller.avatar_url} size="sm" />
                <div className="ml-2 flex flex-col">
                  <span className="text-sm font-bold text-gray-900 hover:underline leading-none">{service.seller.full_name}</span>
                  <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider mt-1">{service.seller.level === 'top' ? 'Top Rated' : `Level ${service.seller.level}`}</span>
                </div>
              </div>

              <h3 className="text-base font-medium text-gray-800 leading-snug mb-3 hover:text-emerald-600 cursor-pointer line-clamp-2" onClick={() => navigate('service-detail', { id: service.service_id })}>
                {service.title}
              </h3>

              <div className="flex items-center mt-auto">
                <RatingStars rating={service.seller.rating_avg} count={service.total_orders} />
              </div>
            </div>

            <div className="border-t border-gray-100 px-4 py-3 flex justify-between items-center bg-gray-50/50">
              <button className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-200 transition-colors"><Menu className="w-4 h-4"/></button>
              <div className="text-right cursor-pointer" onClick={() => navigate('service-detail', { id: service.service_id })}>
                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-0.5">Mulai Dari</p>
                <span className="text-lg font-black text-gray-900">{formatCurrency(service.packages.basic?.price || 0)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="mt-12 flex justify-center">
        <nav className="flex space-x-2">
          <button className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-50"><ChevronLeft className="w-5 h-5"/></button>
          <button className="w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold shadow-md">1</button>
          <button className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-gray-700 font-bold hover:bg-gray-50">2</button>
          <button className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-gray-700 font-bold hover:bg-gray-50">3</button>
          <span className="w-10 h-10 flex items-center justify-center text-gray-400 font-bold">...</span>
          <button className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:bg-gray-50"><ChevronRight className="w-5 h-5"/></button>
        </nav>
      </div>
    </div>
  );
};

export default ExploreView;