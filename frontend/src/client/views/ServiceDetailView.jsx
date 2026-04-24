import React, { useState } from 'react';
import { 
  Star, Clock, Monitor, Shield, Heart, List, ChevronLeft, ChevronRight, 
  CheckCircle, AlertCircle, Truck, Award, Users, FileText, MessageCircle,
  Zap, TrendingUp, DollarSign
} from 'lucide-react';
import { DB_SERVICES, DB_REVIEWS } from '../data/mockDatabase';
import { hydrateService, getUserById, formatCurrency, formatDate, classNames } from '../data/helpers';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import RatingStars from '../components/ui/RatingStars';

const ClientServiceDetailView = ({ navigate, viewParams }) => {
  const serviceId = viewParams?.id || 5001;
  const rawService = DB_SERVICES.find(s => s.service_id === serviceId);
  const service = hydrateService(rawService);

  const [activeTab, setActiveTab] = useState('basic');
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);

  if (!service) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Layanan Tidak Ditemukan</h2>
        <p className="text-gray-500 mb-6">Maaf, layanan yang Anda cari tidak tersedia</p>
        <button onClick={() => navigate('/client/explore')} className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-bold">
          Cari Layanan Lain
        </button>
      </div>
    );
  }

  const currentPackage = service.packages[activeTab];
  const totalReviews = DB_REVIEWS.filter(r => r.service_id === serviceId).length;
  const avgRating = service.seller.rating_avg || 4.5;
  const completedOrders = service.total_orders || 0;

  // Hitung estimasi antrian
  const queueEstimate = Math.floor(completedOrders / 5);
  const deliveryEstimate = currentPackage?.delivery_days + queueEstimate;

  const handleBuyNow = () => {
    navigate('/client/checkout', { packageId: currentPackage?.package_id });
  };

  const handleContactSeller = () => {
    navigate('/client/messages', { sellerId: service.seller.user_id });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-white">

      {/* Breadcrumbs - Client Path */}
      <nav className="flex text-xs font-bold text-gray-500 mb-6 uppercase tracking-wider">
        <ol className="flex items-center space-x-2 flex-wrap">
          <li><button onClick={() => navigate('/client/dashboard')} className="hover:text-emerald-600 transition-colors">Dashboard</button></li>
          <li><span className="mx-1 text-gray-300">/</span></li>
          <li><button onClick={() => navigate('/client/explore')} className="hover:text-emerald-600 transition-colors">Cari Jasa</button></li>
          <li><span className="mx-1 text-gray-300">/</span></li>
          <li><span className="text-gray-700">{service.category_name}</span></li>
        </ol>
      </nav>

      <div className="flex flex-col lg:flex-row gap-12">

        {/* LEFT COLUMN - Service Info */}
        <div className="lg:w-2/3">
          
          {/* Title & Badges */}
          <div className="mb-4">
            <div className="flex flex-wrap gap-2 mb-3">
              <Badge variant="success" className="text-xs">
                {service.seller.level === 'top' ? '⭐ Top Rated Seller' : '✓ Pro Seller'}
              </Badge>
              {service.featured && (
                <Badge variant="purple" className="text-xs">🔥 Layanan Unggulan</Badge>
              )}
            </div>
            <h1 className="text-3xl font-black text-gray-900 mb-4 leading-tight">{service.title}</h1>
          </div>

          {/* Seller Summary - Enhanced untuk Client */}
          <div className="flex flex-wrap items-center justify-between mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
            <div className="flex items-center">
              <div className="cursor-pointer" onClick={() => navigate(`/client/profile/${service.seller.user_id}`)}>
                <Avatar src={service.seller.avatar_url} size="md" />
              </div>
              <div className="ml-3">
                <div className="flex items-center gap-2">
                  <span 
                    className="font-bold text-gray-900 hover:text-emerald-600 cursor-pointer text-base"
                    onClick={() => navigate(`/client/profile/${service.seller.user_id}`)}
                  >
                    {service.seller.full_name}
                  </span>
                  {service.seller.is_verified && (
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <RatingStars rating={avgRating} size={14} />
                  <span className="text-xs text-gray-500">({totalReviews} ulasan)</span>
                  <span className="text-xs text-gray-300">|</span>
                  <span className="text-xs text-gray-500">{completedOrders}+ proyek</span>
                </div>
              </div>
            </div>
            
            {/* Response Time Badge */}
            <div className="flex items-center gap-2 text-sm">
              <Zap className="w-4 h-4 text-emerald-500" />
              <span className="font-medium text-gray-700">Respon ~1 jam</span>
            </div>
          </div>

          {/* Image Gallery */}
          <div className="mb-8">
            <div className="relative w-full aspect-[16/9] bg-gray-100 rounded-xl overflow-hidden mb-4 border border-gray-200 shadow-sm">
              <img 
                src={service.gallery?.[activeImageIndex] || service.thumbnail_url} 
                alt="Service Preview" 
                className="w-full h-full object-cover"
                onError={(e) => { e.target.src = 'https://via.placeholder.com/800x450?text=No+Image'; }}
              />

              {service.gallery?.length > 1 && (
                <>
                  <button
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-md hover:bg-white text-gray-800 transition-colors hover:scale-110"
                    onClick={() => setActiveImageIndex(prev => (prev === 0 ? service.gallery.length - 1 : prev - 1))}
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-md hover:bg-white text-gray-800 transition-colors hover:scale-110"
                    onClick={() => setActiveImageIndex(prev => (prev === service.gallery.length - 1 ? 0 : prev + 1))}
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>

            {service.gallery?.length > 1 && (
              <div className="flex gap-3 overflow-x-auto custom-scrollbar pb-2">
                {service.gallery.map((img, idx) => (
                  <div
                    key={idx}
                    className={classNames(
                      "w-28 aspect-video rounded-lg overflow-hidden cursor-pointer border-2 transition-all opacity-70 hover:opacity-100 flex-shrink-0",
                      activeImageIndex === idx ? "border-emerald-500 opacity-100 shadow-sm" : "border-transparent"
                    )}
                    onClick={() => setActiveImageIndex(idx)}
                  >
                    <img src={img} className="w-full h-full object-cover" alt={`Thumbnail ${idx + 1}`} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Description */}
          <div className="mb-8">
            <h2 className="text-xl font-black text-gray-900 mb-4 pb-3 border-b border-gray-200 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-emerald-500" />
              Tentang Layanan Ini
            </h2>
            <div className="prose max-w-none text-gray-700 text-base leading-relaxed whitespace-pre-line">
              {service.description}
            </div>
          </div>

          {/* What's Included - Client Benefits */}
          <div className="mb-8 p-6 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-100">
            <h3 className="font-black text-gray-900 mb-4 flex items-center">
              <CheckCircle className="w-5 h-5 text-emerald-600 mr-2" />
              Yang Anda Dapatkan
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center text-sm text-gray-700">
                <CheckCircle className="w-4 h-4 text-emerald-500 mr-2" />
                {currentPackage?.delivery_days} hari pengerjaan
              </div>
              <div className="flex items-center text-sm text-gray-700">
                <CheckCircle className="w-4 h-4 text-emerald-500 mr-2" />
                {currentPackage?.revisions === 999 ? 'Revisi tidak terbatas' : `${currentPackage?.revisions}x revisi`}
              </div>
              <div className="flex items-center text-sm text-gray-700">
                <CheckCircle className="w-4 h-4 text-emerald-500 mr-2" />
                File source code / master file
              </div>
              <div className="flex items-center text-sm text-gray-700">
                <CheckCircle className="w-4 h-4 text-emerald-500 mr-2" />
                Bebas hak komersial
              </div>
              <div className="flex items-center text-sm text-gray-700">
                <CheckCircle className="w-4 h-4 text-emerald-500 mr-2" />
                Garansi revisi hingga puas
              </div>
              <div className="flex items-center text-sm text-gray-700">
                <CheckCircle className="w-4 h-4 text-emerald-500 mr-2" />
                Support pasca pengiriman 3 hari
              </div>
            </div>
          </div>

          {/* About Seller - Enhanced */}
          <div className="mb-8">
            <h2 className="text-xl font-black text-gray-900 mb-4 pb-3 border-b border-gray-200 flex items-center">
              <Users className="w-5 h-5 mr-2 text-emerald-500" />
              Tentang Freelancer
            </h2>
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
              <div className="flex flex-col md:flex-row items-center md:items-start text-center md:text-left mb-6">
                <Avatar src={service.seller.avatar_url} size="xl" />
                <div className="md:ml-6 mt-4 md:mt-0 flex-1">
                  <h3 
                    className="text-2xl font-black text-gray-900 cursor-pointer hover:text-emerald-600 transition-colors"
                    onClick={() => navigate(`/client/profile/${service.seller.user_id}`)}
                  >
                    {service.seller.full_name}
                  </h3>
                  <p className="text-gray-500 font-bold mb-2">@{service.seller.username}</p>
                  <div className="flex justify-center md:justify-start items-center gap-3 mb-3">
                    <RatingStars rating={avgRating} size={16} />
                    <span className="text-sm text-gray-500">{totalReviews} ulasan</span>
                  </div>
                  <div className="flex gap-2">
                    <Button size="md" onClick={handleContactSeller}>
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Kirim Pesan
                    </Button>
                    <Button variant="outline" size="md">
                      Lihat Portofolio
                    </Button>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-5 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold">Bergabung Sejak</p>
                  <p className="font-black text-gray-900 text-sm">{formatDate(service.seller.joined_at)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold">Proyek Selesai</p>
                  <p className="font-black text-gray-900 text-sm">{completedOrders}+</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold">Tingkat Respon</p>
                  <p className="font-black text-gray-900 text-sm">~1 jam</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold">Pesanan Aktif</p>
                  <p className="font-black text-gray-900 text-sm">{queueEstimate}</p>
                </div>
              </div>

              <div className="border-t border-gray-200 mt-5 pt-5 text-gray-700 text-sm leading-relaxed">
                {service.seller.bio || "Freelancer profesional yang siap membantu mewujudkan proyek Anda dengan kualitas terbaik."}
              </div>
            </div>
          </div>

          {/* Reviews Section */}
          <div>
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-gray-200">
              <h2 className="text-xl font-black text-gray-900 flex items-center">
                <Star className="w-5 h-5 mr-2 text-yellow-500 fill-yellow-500" />
                Ulasan Pelanggan
              </h2>
              <button className="text-sm text-emerald-600 font-bold hover:underline">
                Lihat Semua ({totalReviews})
              </button>
            </div>

            {DB_REVIEWS.slice(0, 3).map(review => {
              const reviewer = getUserById(review.reviewer_id);
              return (
                <div key={review.review_id} className="border-b border-gray-100 pb-6 mb-6 last:border-0">
                  <div className="flex items-start mb-3">
                    <Avatar src={reviewer?.avatar_url} size="sm" />
                    <div className="ml-3">
                      <h4 className="font-bold text-gray-900">{reviewer?.full_name || 'Anonymous'}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <RatingStars rating={review.rating} size={12} />
                        <span className="text-xs text-gray-400">{formatDate(review.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed">"{review.comment}"</p>
                </div>
              );
            })}

            {totalReviews === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Star className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>Belum ada ulasan untuk layanan ini</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN - Sticky Pricing Widget untuk Client */}
        <div className="lg:w-1/3">
          <div className="sticky top-28">
            
            {/* Package Selection */}
            <div className="border border-gray-200 rounded-2xl bg-white shadow-xl overflow-hidden mb-4">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <h3 className="font-black text-gray-900">Pilih Paket Layanan</h3>
              </div>

              {/* Package Tabs */}
              <div className="flex border-b border-gray-200">
                {['basic', 'standard', 'premium'].map((tabKey, idx) => {
                  const pkg = service.packages[tabKey];
                  if (!pkg) return null;
                  return (
                    <button
                      key={tabKey}
                      onClick={() => setActiveTab(tabKey)}
                      className={classNames(
                        "flex-1 py-3 text-center font-bold text-sm transition-all",
                        activeTab === tabKey 
                          ? "bg-white text-emerald-600 border-b-2 border-emerald-500" 
                          : "bg-gray-50 text-gray-500 hover:text-gray-700"
                      )}
                    >
                      {tabKey.charAt(0).toUpperCase() + tabKey.slice(1)}
                    </button>
                  );
                })}
              </div>

              <div className="p-6">
                {/* Package Name */}
                <h4 className="font-bold text-gray-900 text-lg mb-1">
                  {currentPackage?.package_name}
                </h4>
                <p className="text-xs text-gray-500 mb-4">{currentPackage?.description}</p>

                {/* Price */}
                <div className="mb-4">
                  <span className="text-3xl font-black text-gray-900">{formatCurrency(currentPackage?.price || 0)}</span>
                  <span className="text-sm text-gray-500 ml-1">/ paket</span>
                </div>

                {/* Package Features */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-sm">
                    <Clock className="w-4 h-4 text-gray-400 mr-3" />
                    <span className="text-gray-700">Pengerjaan <strong>{currentPackage?.delivery_days} hari</strong></span>
                    {queueEstimate > 0 && (
                      <span className="ml-2 text-xs text-orange-500">(Antrian ~{queueEstimate} hari)</span>
                    )}
                  </div>
                  <div className="flex items-center text-sm">
                    <Monitor className="w-4 h-4 text-gray-400 mr-3" />
                    <span className="text-gray-700">
                      {currentPackage?.revisions === 999 
                        ? 'Revisi tidak terbatas' 
                        : `${currentPackage?.revisions}x kesempatan revisi`}
                    </span>
                  </div>
                  <div className="flex items-center text-sm">
                    <DollarSign className="w-4 h-4 text-gray-400 mr-3" />
                    <span className="text-gray-700">Harga sudah termasuk pajak</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <Button size="lg" fullWidth onClick={handleBuyNow} className="mb-3">
                  Beli Sekarang
                </Button>
                
                <Button variant="outline" size="md" fullWidth onClick={handleContactSeller}>
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Tanya Sebelum Beli
                </Button>

                <button 
                  onClick={() => setIsWishlisted(!isWishlisted)}
                  className="w-full mt-3 text-center text-sm text-gray-500 hover:text-emerald-600 transition-colors flex items-center justify-center gap-1"
                >
                  <Heart className={classNames("w-4 h-4", isWishlisted && "fill-red-500 text-red-500")} />
                  {isWishlisted ? 'Hapus dari Tersimpan' : 'Simpan ke Daftar Tersimpan'}
                </button>
              </div>
            </div>

            {/* Estimated Delivery Card */}
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-100 mb-4">
              <div className="flex items-start gap-3">
                <Truck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-black text-gray-900 text-sm">Estimasi Pengerjaan</h4>
                  <p className="text-xs text-gray-600 mt-1">
                    Proyek akan selesai dalam waktu <strong>{deliveryEstimate} hari</strong> setelah order diproses.
                  </p>
                </div>
              </div>
            </div>

            {/* Security Guarantee */}
            <div className="text-center">
              <div className="flex items-center justify-center text-xs text-gray-500 bg-white py-2 rounded-lg">
                <Shield className="w-4 h-4 mr-2 text-emerald-500" />
                <span>Transaksi 100% aman dengan escrow Jasa.in</span>
              </div>
            </div>

            {/* FAQ Hint */}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-[10px] text-gray-400 text-center">
                💡 Punya pertanyaan? <button onClick={handleContactSeller} className="text-emerald-600 font-bold hover:underline">Tanya freelancer</button> sebelum order
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientServiceDetailView;