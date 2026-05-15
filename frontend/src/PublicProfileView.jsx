import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Star, MapPin, Calendar, Briefcase, MessageCircle, Loader2, 
  CheckCircle, Clock, Users, Award, Mail, Phone, Globe,  Heart, Eye, ShoppingBag,
  Shield, Zap, FileText, FolderOpen
} from 'lucide-react';
import Avatar from './client/components/ui/Avatar';
import Button from './client/components/ui/Button';
import Card from './client/components/ui/Card';
import Badge from './client/components/ui/Badge';
import RatingStars from './client/components/ui/RatingStars';
import { formatCurrency, formatDate } from './client/data/helpers';

const API_BASE_URL = 'http://localhost:5000/api';
const STATIC_URL = 'http://localhost:5000';

const PublicProfileView = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [services, setServices] = useState([]);
  const [portfolios, setPortfolios] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('services');
  const [showAllReviews, setShowAllReviews] = useState(false);

  const getFullImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${STATIC_URL}${url}`;
  };

  useEffect(() => {
    fetchProfile();
    fetchServices();
    fetchPortfolios();
    fetchReviews();
  }, [userId]);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/users/profile/${userId}`);
      const data = await res.json();
      if (data.success) {
        setProfile(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  };

  const fetchServices = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/services?freelancer=${userId}&limit=6`);
      const data = await res.json();
      if (data.success) {
        setServices(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch services:', error);
    }
  };

  const fetchPortfolios = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/portfolios/freelancer/${userId}`);
      const data = await res.json();
      if (data.success) {
        setPortfolios(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch portfolios:', error);
    }
  };

  const fetchReviews = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/reviews/freelancer/${userId}?limit=5`);
      const data = await res.json();
      if (data.success) {
        setReviews(data.data?.reviews || []);
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    }
  };

  const handleMessage = () => {
    navigate('/client/messages', {
      state: {
        receiverId: userId,
        receiverName: profile?.full_name,
        receiverAvatar: profile?.avatar_url,
        type: 'direct'
      }
    });
  };

  const handleServiceClick = (serviceId) => {
    navigate(`/client/service/${serviceId}`);
  };

  const displayedReviews = showAllReviews ? reviews : reviews.slice(0, 3);

  if (loading && !profile) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Profil tidak ditemukan</p>
        <button onClick={() => navigate('/explore')} className="mt-4 text-emerald-600">
          Kembali ke Beranda
        </button>
      </div>
    );
  }

  const isFreelancer = profile.role === 'freelancer' || profile.freelancer;
  const freelancerData = profile.freelancer || {};
  const rating = freelancerData.rating_avg || 0;
  const totalReviews = freelancerData.total_reviews || reviews.length;
  const completedOrders = freelancerData.total_orders || 0;
  const memberSince = profile.created_at || profile.joined_at;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 md:p-8 mb-8 text-white">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          <Avatar src={getFullImageUrl(profile.avatar_url)} size="xl" className="border-4 border-white" />
          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-2">
              <h1 className="text-3xl md:text-4xl font-black">{profile.full_name}</h1>
              {isFreelancer && freelancerData.freelancer_level === 'top' && (
                <Badge variant="purple" className="bg-yellow-400 text-gray-900">
                  ⭐ Top Rated
                </Badge>
              )}
            </div>
            <p className="text-emerald-100 mb-3">@{profile.username}</p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-4">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span className="font-bold">{rating}</span>
                <span className="text-emerald-100">({totalReviews} ulasan)</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                <span>{completedOrders} proyek selesai</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>Bergabung {memberSince ? new Date(memberSince).getFullYear() : '2024'}</span>
              </div>
            </div>
            <div className="flex gap-3 justify-center md:justify-start">
              <Button onClick={handleMessage} variant="white">
                <MessageCircle className="w-4 h-4 mr-2" />
                Kirim Pesan
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Sidebar */}
        <div className="lg:w-1/3">
          <Card className="p-5 mb-6">
            <h3 className="font-black text-gray-900 mb-4 pb-2 border-b">Informasi Profil</h3>
            
            {profile.bio || freelancerData.bio ? (
              <div className="mb-4">
                <p className="text-sm text-gray-600">{profile.bio || freelancerData.bio}</p>
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic mb-4">Belum ada deskripsi</p>
            )}
            
            <div className="space-y-3 text-sm">
              {profile.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">{profile.location}</span>
                </div>
              )}
              {profile.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">{profile.email}</span>
                </div>
              )}
              {profile.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">{profile.phone}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Skills */}
          {freelancerData.skills && freelancerData.skills.length > 0 && (
            <Card className="p-5 mb-6">
              <h3 className="font-black text-gray-900 mb-3">Keahlian</h3>
              <div className="flex flex-wrap gap-2">
                {freelancerData.skills.map((skill, idx) => (
                  <span key={idx} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-medium">
                    {skill.name || skill}
                  </span>
                ))}
              </div>
            </Card>
          )}

          {/* Stats Card */}
          {isFreelancer && (
            <Card className="p-5 bg-gradient-to-r from-emerald-50 to-teal-50">
              <h3 className="font-black text-gray-900 mb-3">Statistik</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-black text-emerald-600">{completedOrders}</div>
                  <div className="text-xs text-gray-500">Proyek Selesai</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-black text-emerald-600">{rating}</div>
                  <div className="text-xs text-gray-500">Rating Rata-rata</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-black text-emerald-600">{totalReviews}</div>
                  <div className="text-xs text-gray-500">Ulasan</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-black text-emerald-600">
                    {freelancerData.response_time || '~1 jam'}
                  </div>
                  <div className="text-xs text-gray-500">Respon Rate</div>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Main Content Area */}
        <div className="lg:w-2/3">
          
          {/* Tab Navigation */}
          <div className="flex gap-2 border-b border-gray-200 mb-6">
            <button
              onClick={() => setActiveTab('services')}
              className={`px-4 py-2 font-bold text-sm transition-colors ${
                activeTab === 'services' 
                  ? 'text-emerald-600 border-b-2 border-emerald-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Briefcase className="w-4 h-4 inline mr-2" />
              Layanan ({services.length})
            </button>
            <button
              onClick={() => setActiveTab('portfolios')}
              className={`px-4 py-2 font-bold text-sm transition-colors ${
                activeTab === 'portfolios' 
                  ? 'text-emerald-600 border-b-2 border-emerald-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <FolderOpen className="w-4 h-4 inline mr-2" />
              Portofolio ({portfolios.length})
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`px-4 py-2 font-bold text-sm transition-colors ${
                activeTab === 'reviews' 
                  ? 'text-emerald-600 border-b-2 border-emerald-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Star className="w-4 h-4 inline mr-2" />
              Ulasan ({totalReviews})
            </button>
          </div>

          {/* Services Tab */}
          {activeTab === 'services' && (
            <div>
              {profile.services && profile.services.length === 0 ? (
                <Card className="text-center py-12">
                  <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Belum ada layanan yang ditawarkan</p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {profile.services?.map((service) => (
                    <div 
                      key={service.service_id}
                      onClick={() => navigate(`/client/service/${service.service_id}`)}
                      className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-all cursor-pointer"
                    >
                      <img 
                        src={getFullImageUrl(service.thumbnail_url) || 'https://placehold.co/400x200'} 
                        className="w-full h-40 object-cover"
                        alt={service.title}
                      />
                      <div className="p-4">
                        <h4 className="font-bold text-gray-900 mb-1 line-clamp-2">{service.title}</h4>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-emerald-600 font-bold">
                            {formatCurrency(service.min_price || 0)}
                          </span>
                          <span className="text-xs text-gray-400">mulai dari</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Portfolios Tab */}
          {activeTab === 'portfolios' && (
            <div>
              {portfolios.length === 0 ? (
                <Card className="text-center py-12">
                  <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Belum ada portofolio yang ditampilkan</p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {portfolios.map((portfolio) => (
                    <div key={portfolio.PORTFOLIO_ID} className="bg-white border border-gray-200 rounded-xl overflow-hidden group">
                      <img 
                        src={getFullImageUrl(portfolio.IMAGE_URL) || 'https://placehold.co/400x300'} 
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                        alt={portfolio.TITLE}
                      />
                      <div className="p-4">
                        <h4 className="font-bold text-gray-900 mb-1">{portfolio.TITLE}</h4>
                        <p className="text-sm text-gray-500 line-clamp-2">{portfolio.DESCRIPTION}</p>
                        {portfolio.PROJECT_URL && (
                          <a 
                            href={portfolio.PROJECT_URL} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-xs text-emerald-600 hover:underline mt-2 inline-block"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Lihat Project →
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Reviews Tab */}
          {activeTab === 'reviews' && (
            <div>
              {reviews.length === 0 ? (
                <Card className="text-center py-12">
                  <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Belum ada ulasan dari client</p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {displayedReviews.map((review) => (
                    <Card key={review.REVIEW_ID} className="p-5">
                      <div className="flex items-start gap-4">
                        <Avatar src={getFullImageUrl(review.REVIEWER_AVATAR)} size="md" />
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                            <div>
                              <p className="font-bold text-gray-900">{review.REVIEWER_NAME}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <RatingStars rating={review.RATING} size={14} />
                                <span className="text-xs text-gray-400">{formatDate(review.CREATED_AT)}</span>
                              </div>
                            </div>
                          </div>
                          <p className="text-gray-600 text-sm">{review.REVIEW_COMMENT}</p>
                          {review.SERVICE_TITLE && (
                            <p className="text-xs text-gray-400 mt-2">
                              Layanan: {review.SERVICE_TITLE}
                            </p>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                  {reviews.length > 3 && !showAllReviews && (
                    <button 
                      onClick={() => setShowAllReviews(true)}
                      className="w-full text-center text-emerald-600 hover:text-emerald-700 font-medium py-2"
                    >
                      Lihat Semua Ulasan ({reviews.length})
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublicProfileView;