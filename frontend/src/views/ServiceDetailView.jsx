import React, { useState } from 'react';
import { Star, Clock, Monitor, Shield, Heart, List, ChevronLeft, ChevronRight } from 'lucide-react';
import { DB_SERVICES, DB_REVIEWS } from '../data/mockDatabase';
import { hydrateService, getUserById, formatCurrency, formatDate, classNames } from '../data/helpers';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import RatingStars from '../components/ui/RatingStars';

const ServiceDetailView = ({ navigate, viewParams }) => {
  const serviceId  = viewParams?.id || 5001;
  const rawService = DB_SERVICES.find(s => s.service_id === serviceId);
  const service    = hydrateService(rawService);

  const [activeTab, setActiveTab]             = useState('basic');
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  if (!service) return <div className="p-20 text-center font-bold text-xl text-gray-500">Service not found.</div>;

  const currentPackage = service.packages[activeTab];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-white">

      {/* Breadcrumbs */}
      <nav className="flex text-xs font-bold text-gray-500 mb-6 uppercase tracking-wider">
        <ol className="flex items-center space-x-2">
          <li><button onClick={() => navigate('home')} className="hover:text-emerald-600 transition-colors">Beranda</button></li>
          <li><span className="mx-1 text-gray-300">/</span></li>
          <li><button onClick={() => navigate('explore')} className="hover:text-emerald-600 transition-colors">{service.category_name}</button></li>
        </ol>
      </nav>

      <div className="flex flex-col lg:flex-row gap-12">

        {/* LEFT COLUMN */}
        <div className="lg:w-2/3">
          <h1 className="text-3xl font-black text-gray-900 mb-6 leading-tight">{service.title}</h1>

          {/* Seller Summary */}
          <div className="flex flex-wrap items-center mb-6 text-sm">
            <div className="cursor-pointer" onClick={() => navigate('profile', { id: service.seller.user_id })}>
              <Avatar src={service.seller.avatar_url} size="md" />
            </div>
            <div className="flex flex-wrap items-center ml-3">
              <span className="font-bold text-gray-900 hover:underline cursor-pointer mr-3 text-base" onClick={() => navigate('profile', { id: service.seller.user_id })}>
                {service.seller.full_name}
              </span>
              <Badge variant={service.seller.level === 'top' ? 'purple' : 'success'} className="mr-3">
                {service.seller.level === 'top' ? 'Top Rated' : 'Pro Level'}
              </Badge>
              <span className="text-gray-300 mr-3">|</span>
              <RatingStars rating={service.seller.rating_avg} count={service.total_orders} />
              <span className="text-gray-300 mx-3">|</span>
              <span className="text-gray-500 font-medium flex items-center"><List className="w-4 h-4 mr-1"/> {Math.floor(service.total_orders / 5)} Pesanan Mengantre</span>
            </div>
          </div>

          {/* Image Gallery */}
          <div className="mb-12">
            <div className="relative w-full aspect-[16/9] bg-gray-100 rounded-xl overflow-hidden mb-4 border border-gray-200 shadow-sm">
              <img src={service.gallery?.[activeImageIndex] || service.thumbnail_url} alt="Gig Preview" className="w-full h-full object-cover" />

              {service.gallery?.length > 1 && (
                <>
                  <button
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-md hover:bg-white text-gray-800 transition-colors hover:scale-110"
                    onClick={() => setActiveImageIndex(prev => (prev === 0 ? service.gallery.length - 1 : prev - 1))}
                  ><ChevronLeft className="w-6 h-6" /></button>
                  <button
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-md hover:bg-white text-gray-800 transition-colors hover:scale-110"
                    onClick={() => setActiveImageIndex(prev => (prev === service.gallery.length - 1 ? 0 : prev + 1))}
                  ><ChevronRight className="w-6 h-6" /></button>
                </>
              )}
            </div>

            {service.gallery?.length > 1 && (
              <div className="flex gap-3 overflow-x-auto custom-scrollbar pb-2">
                {service.gallery.map((img, idx) => (
                  <div
                    key={idx}
                    className={classNames(
                      "w-32 aspect-video rounded-lg overflow-hidden cursor-pointer border-2 transition-all opacity-70 hover:opacity-100 flex-shrink-0",
                      activeImageIndex === idx ? "border-emerald-500 opacity-100 shadow-sm" : "border-transparent"
                    )}
                    onClick={() => setActiveImageIndex(idx)}
                  >
                    <img src={img} className="w-full h-full object-cover" alt={`Thumbnail ${idx}`} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Description */}
          <div className="mb-12">
            <h2 className="text-xl font-black text-gray-900 mb-6 pb-3 border-b border-gray-200">Tentang Layanan Ini</h2>
            <div className="max-w-none text-gray-700 text-base leading-relaxed whitespace-pre-line font-medium">
              {service.description}
            </div>
          </div>

          {/* About Seller */}
          <div className="mb-12">
            <h2 className="text-xl font-black text-gray-900 mb-6 pb-3 border-b border-gray-200">Kenali Penjual Anda</h2>
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8">
              <div className="flex flex-col md:flex-row items-center md:items-start text-center md:text-left mb-6">
                <Avatar src={service.seller.avatar_url} size="xl" />
                <div className="md:ml-6 mt-4 md:mt-0 flex-1">
                  <h3 className="text-2xl font-black text-gray-900 cursor-pointer hover:underline" onClick={() => navigate('profile', { id: service.seller.user_id })}>
                    {service.seller.full_name}
                  </h3>
                  <p className="text-gray-500 font-bold mb-3">@{service.seller.username}</p>
                  <div className="flex justify-center md:justify-start items-center mb-4">
                    <RatingStars rating={service.seller.rating_avg} count={service.total_orders} />
                  </div>
                  <Button variant="outline" size="md" onClick={() => navigate('messages')}>Kirim Pesan</Button>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6 mt-2 grid grid-cols-2 gap-y-6 gap-x-8">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Anggota Sejak</p>
                  <p className="font-black text-gray-900">{formatDate(service.seller.joined_at)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Total Pesanan Selesai</p>
                  <p className="font-black text-gray-900">{service.total_orders} Proyek</p>
                </div>
              </div>

              <div className="border-t border-gray-200 mt-6 pt-6 text-gray-700 text-sm font-medium leading-relaxed">
                {service.seller.bio}
              </div>
            </div>
          </div>

          {/* Reviews */}
          <div>
            <div className="flex items-center justify-between mb-8 pb-3 border-b border-gray-200">
              <h2 className="text-xl font-black text-gray-900 flex items-center">
                <span className="mr-3">Ulasan Pelanggan</span>
                <RatingStars rating={service.seller.rating_avg} count={service.total_orders} />
              </h2>
            </div>

            <div className="space-y-8">
              {DB_REVIEWS.map(review => {
                const reviewer = getUserById(review.reviewer_id);
                return (
                  <div key={review.review_id} className="border-b border-gray-100 pb-8">
                    <div className="flex items-start mb-3">
                      <Avatar src={reviewer?.avatar_url} size="md" />
                      <div className="ml-4">
                        <h4 className="font-bold text-gray-900">{reviewer?.full_name || 'Anonymous User'}</h4>
                        <div className="flex items-center mt-1">
                          <div className="flex text-yellow-400 mr-2">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={classNames("w-4 h-4", i < review.rating ? "fill-current" : "text-gray-200")} />
                            ))}
                          </div>
                          <span className="text-xs font-bold text-gray-400 border-l border-gray-200 pl-2 ml-1">{formatDate(review.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-700 text-base leading-relaxed font-medium mt-4">"{review.comment}"</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Sticky Pricing Widget */}
        <div className="lg:w-1/3 relative">
          <div className="sticky top-28">
            <div className="border border-gray-200 rounded-2xl bg-white shadow-xl overflow-hidden">

              {/* Pricing Tabs */}
              <div className="flex bg-gray-50 border-b border-gray-200">
                {['basic', 'standard', 'premium'].map(tabKey => (
                  <button
                    key={tabKey}
                    onClick={() => setActiveTab(tabKey)}
                    className={classNames(
                      "flex-1 py-4 text-sm font-black text-center border-b-2 transition-colors uppercase tracking-wider",
                      activeTab === tabKey ? "border-emerald-500 text-emerald-600 bg-white" : "border-transparent text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                    )}
                  >
                    {tabKey}
                  </button>
                ))}
              </div>

              <div className="p-6 sm:p-8">
                <div className="flex flex-col mb-4">
                  <h3 className="font-bold text-gray-900 text-xl mb-2">{currentPackage?.description.split('.')[0]}</h3>
                  <span className="text-3xl font-black text-gray-900">{formatCurrency(currentPackage?.price || 0)}</span>
                </div>

                <p className="text-gray-500 text-sm mb-6 font-medium leading-relaxed">{currentPackage?.description}</p>

                <div className="flex flex-col gap-3 font-bold text-gray-700 text-sm mb-8">
                  <div className="flex items-center"><Clock className="w-5 h-5 mr-3 text-gray-400" /> Pengerjaan {currentPackage?.delivery_days} Hari</div>
                  <div className="flex items-center"><Monitor className="w-5 h-5 mr-3 text-gray-400" /> {currentPackage?.revisions === 999 ? 'Revisi Tidak Terbatas' : `${currentPackage?.revisions} Kesempatan Revisi`}</div>
                </div>

                <Button size="lg" fullWidth onClick={() => navigate('checkout', { packageId: currentPackage?.package_id })}>
                  Pesan Sekarang
                </Button>
                <div className="mt-4 text-center">
                  <button className="text-gray-500 font-bold text-sm hover:text-emerald-600 transition-colors" onClick={() => navigate('messages')}>Tanya Penjual</button>
                </div>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Button variant="secondary" icon={Heart} className="w-full font-bold shadow-sm">Simpan Jasa Ini</Button>
              <div className="flex items-center justify-center text-gray-500 text-xs font-bold mt-4 bg-gray-50 py-2 rounded-lg border border-gray-200">
                <Shield className="w-4 h-4 mr-2 text-emerald-500" /> Transaksi dilindungi Jasa.in Escrow
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceDetailView;