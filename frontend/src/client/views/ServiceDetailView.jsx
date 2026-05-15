import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Star, Clock, Monitor, Shield, Heart, List, ChevronLeft, ChevronRight, 
  CheckCircle, AlertCircle, Truck, Award, Users, FileText, MessageCircle,
  Zap, DollarSign, Loader2, UserCircle, Briefcase, Calendar
} from 'lucide-react';
import { formatCurrency, formatDate } from '../data/helpers';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import RatingStars from '../components/ui/RatingStars';

const API_BASE_URL = 'http://localhost:5000/api';
const STATIC_URL = 'http://localhost:5000';

const ClientServiceDetailView = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('basic');
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  
  // WISHLIST STATE
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  const getFullImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${STATIC_URL}${url}`;
  };

  useEffect(() => {
    fetchService();
    checkWishlistStatus();
  }, [id]);

  const fetchService = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/services/${id}`);
      const data = await res.json();
      
      if (data.success) {
        setService(data.data);
      } else {
        setError('Layanan tidak ditemukan');
      }
    } catch (err) {
      console.error('Failed to fetch service:', err);
      setError('Gagal memuat layanan');
    } finally {
      setLoading(false);
    }
  };

  const checkWishlistStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const res = await fetch(`${API_BASE_URL}/wishlist/check/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setIsWishlisted(data.data.is_in_wishlist);
      }
    } catch (error) {
      console.error('Failed to check wishlist:', error);
    }
  };

  const toggleWishlist = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    
    setWishlistLoading(true);
    try {
      if (isWishlisted) {
        const res = await fetch(`${API_BASE_URL}/wishlist/service/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setIsWishlisted(false);
        }
      } else {
        const res = await fetch(`${API_BASE_URL}/wishlist`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ service_id: id })
        });
        const data = await res.json();
        if (data.success) {
          setIsWishlisted(true);
        }
      }
    } catch (error) {
      console.error('Failed to toggle wishlist:', error);
      alert('Gagal menyimpan ke wishlist');
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleBuyNow = (packageId) => {
    navigate(`/client/checkout/${packageId}`);
  };

  const handleContactSeller = () => {
    navigate('/client/messages', { 
      state: { 
        receiverId: service?.SELLER_ID,
        receiverName: service?.SELLER_NAME,
        receiverAvatar: service?.SELLER_AVATAR,
        type: 'direct'
      } 
    });
  };

  // 🔥 Navigasi ke profile freelancer
  const handleViewProfile = () => {
    if (service?.SELLER_ID) {
      navigate(`/client/profile/${service.SELLER_ID}`);
    } else {
      navigate('/client/fprofile');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Layanan Tidak Ditemukan</h2>
        <p className="text-gray-500 mb-6">{error || 'Layanan yang Anda cari tidak tersedia'}</p>
        <button onClick={() => navigate('/client/explore')} className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-bold">
          Cari Layanan Lain
        </button>
      </div>
    );
  }

  const packages = service.PACKAGES || [];
  const currentPackage = packages.find(p => p.PACKAGE_NAME === activeTab) || packages[0];
  
  const getGallery = () => {
    const gallery = [];
    if (service?.IMAGE_1) gallery.push(service.IMAGE_1);
    if (service?.IMAGE_2) gallery.push(service.IMAGE_2);
    if (service?.IMAGE_3) gallery.push(service.IMAGE_3);
    return gallery;
  };
  
  const gallery = getGallery();
  const totalReviews = service.REVIEW_STATS?.total_reviews || 0;
  const avgRating = service.SELLER_RATING || 0;
  const completedOrders = service.SELLER_ORDERS || 0;
  const queueEstimate = Math.floor(completedOrders / 5);
  const deliveryEstimate = (currentPackage?.DELIVERY_DAYS || 0) + queueEstimate;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-white">

      {/* Breadcrumbs */}
      <nav className="flex text-xs font-bold text-gray-500 mb-6 uppercase tracking-wider">
        <ol className="flex items-center space-x-2 flex-wrap">
          <li><button onClick={() => navigate('/client/dashboard')} className="hover:text-emerald-600">Dashboard</button></li>
          <li><span className="mx-1 text-gray-300">/</span></li>
          <li><button onClick={() => navigate('/client/explore')} className="hover:text-emerald-600">Cari Jasa</button></li>
          <li><span className="mx-1 text-gray-300">/</span></li>
          <li><span className="text-gray-700">{service.CATEGORY_NAME}</span></li>
        </ol>
      </nav>

      <div className="flex flex-col lg:flex-row gap-12">

        {/* LEFT COLUMN */}
        <div className="lg:w-2/3">
          
          {/* Title & Badges */}
          <div className="mb-4">
            <div className="flex flex-wrap gap-2 mb-3">
              <Badge variant="success" className="text-xs">
                {service.FREELANCER_LEVEL === 'top' ? '⭐ Top Rated Seller' : '✓ Pro Seller'}
              </Badge>
            </div>
            <h1 className="text-3xl font-black text-gray-900 mb-4 leading-tight">{service.TITLE}</h1>
          </div>

          {/* Seller Summary */}
          <div className="flex flex-wrap items-center justify-between mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
            <div className="flex items-center">
              <div className="cursor-pointer" onClick={handleViewProfile}>
                <Avatar src={getFullImageUrl(service.SELLER_AVATAR) } size="md" />
              </div>
              <div className="ml-3">
                <div className="flex items-center gap-2">
                  <span 
                    className="font-bold text-gray-900 hover:text-emerald-600 cursor-pointer text-base"
                    onClick={handleViewProfile}
                  >
                    {service.SELLER_NAME}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <RatingStars rating={avgRating} size={14} /> 
                  <span className="text-xs text-gray-500">({totalReviews} ulasan)</span>
                  <span className="text-xs text-gray-300">|</span>
                  <span className="text-xs text-gray-500">{completedOrders}+ proyek</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Zap className="w-4 h-4 text-emerald-500" />
              <span className="font-medium text-gray-700">Respon ~1 jam</span>
            </div>
          </div>

          {/* Image Gallery */}
          <div className="mb-8">
            <div className="relative w-full aspect-[16/9] bg-gray-100 rounded-xl overflow-hidden mb-4 border border-gray-200 shadow-sm">
              <img 
                src={getFullImageUrl(service.THUMBNAIL_URL || gallery[0]) || 'https://via.placeholder.com/800x450?text=No+Image'} 
                alt={service.TITLE} 
                className="w-full h-full object-cover"
                onError={(e) => e.target.src = 'https://via.placeholder.com/800x450?text=No+Image'}
              />
            </div>
            
            {gallery.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {gallery.map((img, idx) => (
                  <div
                    key={idx}
                    className={`w-20 h-16 rounded-lg overflow-hidden cursor-pointer border-2 ${
                      activeImageIndex === idx ? 'border-emerald-500' : 'border-transparent'
                    }`}
                    onClick={() => setActiveImageIndex(idx)}
                  >
                    <img src={getFullImageUrl(img)} className="w-full h-full object-cover" alt="" />
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
              {service.DESCRIPTION || 'Tidak ada deskripsi'}
            </div>
          </div>

          {/* What's Included */}
          <div className="mb-8 p-6 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-100">
            <h3 className="font-black text-gray-900 mb-4 flex items-center">
              <CheckCircle className="w-5 h-5 text-emerald-600 mr-2" />
              Yang Anda Dapatkan
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center text-sm text-gray-700">
                <CheckCircle className="w-4 h-4 text-emerald-500 mr-2" />
                {currentPackage?.DELIVERY_DAYS || 3} hari pengerjaan
              </div>
              <div className="flex items-center text-sm text-gray-700">
                <CheckCircle className="w-4 h-4 text-emerald-500 mr-2" />
                {currentPackage?.REVISIONS === 999 ? 'Revisi tidak terbatas' : `${currentPackage?.REVISIONS || 2}x revisi`}
              </div>
              <div className="flex items-center text-sm text-gray-700">
                <CheckCircle className="w-4 h-4 text-emerald-500 mr-2" />
                File source code / master file
              </div>
              <div className="flex items-center text-sm text-gray-700">
                <CheckCircle className="w-4 h-4 text-emerald-500 mr-2" />
                Bebas hak komersial
              </div>
            </div>
          </div>

          {/* 🔥 About Seller - LENGKAP dengan Tombol Lihat Profile */}
          <div className="mb-8">
            <h2 className="text-xl font-black text-gray-900 mb-4 pb-3 border-b border-gray-200 flex items-center">
              <Users className="w-5 h-5 mr-2 text-emerald-500" />
              Tentang Freelancer
            </h2>
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
              <div className="flex flex-col md:flex-row items-center md:items-start text-center md:text-left mb-6">
                <div className="cursor-pointer" onClick={handleViewProfile}>
                  <Avatar src={getFullImageUrl(service.SELLER_AVATAR)} size="xl" />
                </div>
                <div className="md:ml-6 mt-4 md:mt-0 flex-1">
                  <h3 
                    className="text-2xl font-black text-gray-900 hover:text-emerald-600 cursor-pointer"
                    onClick={handleViewProfile}
                  >
                    {service.SELLER_NAME}
                  </h3>
                  <p className="text-gray-500 font-bold mb-2">@{service.USERNAME || service.SELLER_NAME}</p>
                  <div className="flex justify-center md:justify-start items-center gap-3 mb-3">
                    <RatingStars rating={avgRating} size={16} />
                    <span className="text-sm text-gray-500">{totalReviews} ulasan</span>
                    <span className="text-xs text-gray-300">|</span>
                    <span className="text-sm text-gray-500">{completedOrders} proyek selesai</span>
                  </div>
                  <div className="flex gap-3 flex-wrap">
                    <Button size="md" onClick={handleContactSeller}>
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Tanya Sebelum Beli
                    </Button>
                    <Button size="md" variant="outline" onClick={handleViewProfile}>
                      <UserCircle className="w-4 h-4 mr-2" />
                      Lihat Profile Lengkap
                    </Button>
                  </div>
                </div>
              </div>
              <div className="border-t border-gray-200 pt-5 text-gray-700 text-sm leading-relaxed">
                {service.SELLER_BIO || 'Freelancer profesional yang siap membantu proyek Anda.'}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN - Pricing Widget */}
        <div className="lg:w-1/3">
          <div className="sticky top-28">
            
            {/* Package Selection */}
            <div className="border border-gray-200 rounded-2xl bg-white shadow-xl overflow-hidden mb-4">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <h3 className="font-black text-gray-900">Pilih Paket Layanan</h3>
              </div>

              {packages.length > 1 && (
                <div className="flex border-b border-gray-200">
                  {packages.map((pkg) => (
                    <button
                      key={pkg.PACKAGE_NAME}
                      onClick={() => setActiveTab(pkg.PACKAGE_NAME)}
                      className={`flex-1 py-3 text-center font-bold text-sm transition-all ${
                        activeTab === pkg.PACKAGE_NAME 
                          ? "bg-white text-emerald-600 border-b-2 border-emerald-500" 
                          : "bg-gray-50 text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      {pkg.PACKAGE_NAME?.charAt(0).toUpperCase() + pkg.PACKAGE_NAME?.slice(1)}
                    </button>
                  ))}
                </div>
              )}

              <div className="p-6">
                <h4 className="font-bold text-gray-900 text-lg mb-1">
                  {currentPackage?.PACKAGE_NAME?.charAt(0).toUpperCase() + currentPackage?.PACKAGE_NAME?.slice(1)}
                </h4>
                <p className="text-xs text-gray-500 mb-4">{currentPackage?.DESCRIPTION || '-'}</p>

                <div className="mb-4">
                  <span className="text-3xl font-black text-gray-900">{formatCurrency(currentPackage?.PRICE || 0)}</span>
                  <span className="text-sm text-gray-500 ml-1">/ paket</span>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-sm">
                    <Clock className="w-4 h-4 text-gray-400 mr-3" />
                    <span className="text-gray-700">Pengerjaan <strong>{currentPackage?.DELIVERY_DAYS || 3} hari</strong></span>
                    {queueEstimate > 0 && (
                      <span className="ml-2 text-xs text-orange-500">(Antrian ~{queueEstimate} hari)</span>
                    )}
                  </div>
                  <div className="flex items-center text-sm">
                    <Monitor className="w-4 h-4 text-gray-400 mr-3" />
                    <span className="text-gray-700">
                      {currentPackage?.REVISIONS === 999 
                        ? 'Revisi tidak terbatas' 
                        : `${currentPackage?.REVISIONS || 2}x kesempatan revisi`}
                    </span>
                  </div>
                </div>

                <Button size="lg" fullWidth onClick={() => handleBuyNow(currentPackage?.PACKAGE_ID)} className="mb-3">
                  Beli Sekarang
                </Button>
                
                <Button variant="outline" size="md" fullWidth onClick={handleContactSeller}>
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Tanya Sebelum Beli
                </Button>

                <button 
                  onClick={toggleWishlist}
                  disabled={wishlistLoading}
                  className="w-full mt-3 text-center text-sm text-gray-500 hover:text-emerald-600 transition-colors flex items-center justify-center gap-1"
                >
                  {wishlistLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Heart className={`w-4 h-4 ${isWishlisted ? "fill-red-500 text-red-500" : ""}`} />
                  )}
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientServiceDetailView;