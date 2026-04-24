import React, { useState } from 'react';
import { Star, Briefcase, MessageCircle, Shield, Clock, Award, CheckCircle, MapPin, Calendar, Globe, Mail, Phone } from 'lucide-react';
import { DB_FREELANCER_SKILLS, DB_PORTFOLIOS, DB_SERVICES, DB_REVIEWS } from '../data/mockDatabase';
import { getUserById, getProfileByUserId, hydrateService, formatCurrency, formatDate, classNames } from '../data/helpers';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import RatingStars from '../components/ui/RatingStars';

const ClientProfileView = ({ navigate, viewParams }) => {
  const profileUserId = viewParams?.id || 1;
  const user = getUserById(profileUserId);
  const profile = getProfileByUserId(profileUserId);

  const [activeTab, setActiveTab] = useState('services');

  if (!user || !profile) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <User className="w-12 h-12 text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Profil Tidak Ditemukan</h2>
        <p className="text-gray-500 mb-6">Maaf, profil freelancer yang Anda cari tidak tersedia</p>
        <button onClick={() => navigate('/client/explore')} className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-bold">
          Cari Freelancer Lain
        </button>
      </div>
    );
  }

  const userSkills = DB_FREELANCER_SKILLS[profile.profile_id] || [];
  const portfolios = DB_PORTFOLIOS.filter(p => p.freelancer_id === profile.profile_id);
  const userServices = DB_SERVICES.filter(s => s.freelancer_id === profile.profile_id).map(hydrateService);
  const reviews = DB_REVIEWS.filter(r => r.freelancer_id === profile.profile_id);
  
  const completedOrders = profile.total_orders || 0;
  const responseRate = profile.response_rate || 95;
  const avgRating = profile.rating_avg || 4.8;
  const memberSince = new Date(profile.joined_at).getFullYear();

  const handleContact = () => {
    navigate('/client/messages', { sellerId: user.user_id });
  };

  const tabs = [
    { id: 'services', label: 'Layanan', icon: Briefcase, count: userServices.length },
    { id: 'portfolio', label: 'Portofolio', icon: Award, count: portfolios.length },
    { id: 'reviews', label: 'Ulasan', icon: Star, count: reviews.length }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 bg-gray-50 min-h-screen">
      
      {/* Breadcrumb */}
      <div className="flex items-center text-sm text-gray-500 mb-6">
        <button onClick={() => navigate('/client/explore')} className="hover:text-emerald-600 transition-colors">
          Cari Jasa
        </button>
        <span className="mx-2">/</span>
        <span className="text-gray-900 font-semibold">Profil Freelancer</span>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">

        {/* Sidebar - Freelancer Info */}
        <div className="w-full lg:w-1/3">
          <Card className="sticky top-28 overflow-hidden">
            
            {/* Cover/Banner */}
            <div className="h-32 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
            
            {/* Avatar - Centered */}
            <div className="relative px-6">
              <div className="absolute -top-12 left-1/2 transform -translate-x-1/2">
                <Avatar src={user.avatar_url} size="xl" verified={user.is_verified === '1'} />
              </div>
            </div>

            <div className="pt-16 pb-6 px-6 text-center">
              <h1 className="text-2xl font-black text-gray-900">{user.full_name}</h1>
              <p className="text-gray-500 font-medium mb-3">@{user.username}</p>

              <div className="flex justify-center gap-2 mb-4">
                <Badge variant={profile.level === 'top' ? 'purple' : 'success'} className="px-3 py-1">
                  {profile.level === 'top' ? '⭐ Top Rated' : '✓ Pro Freelancer'}
                </Badge>
                {user.is_verified === '1' && (
                  <Badge variant="info" className="px-3 py-1">
                    <CheckCircle className="w-3 h-3 inline mr-1" />
                    Terverifikasi
                  </Badge>
                )}
              </div>

              <Button fullWidth onClick={handleContact} className="mb-4">
                <MessageCircle className="w-4 h-4 mr-2" />
                Hubungi Freelancer
              </Button>
            </div>

            {/* Stats Grid */}
            <div className="border-t border-gray-100 bg-gray-50 p-5">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-2xl font-black text-emerald-600">{avgRating}</p>
                  <p className="text-xs text-gray-500 font-bold">Rating</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-emerald-600">{completedOrders}+</p>
                  <p className="text-xs text-gray-500 font-bold">Proyek Selesai</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-emerald-600">{responseRate}%</p>
                  <p className="text-xs text-gray-500 font-bold">Tingkat Respon</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-emerald-600">~1 jam</p>
                  <p className="text-xs text-gray-500 font-bold">Waktu Respon</p>
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="p-5 space-y-3 border-t border-gray-100">
              <div className="flex items-center text-sm">
                <MapPin className="w-4 h-4 text-gray-400 mr-3" />
                <span className="text-gray-700">{user.location || 'Indonesia'}</span>
              </div>
              <div className="flex items-center text-sm">
                <Calendar className="w-4 h-4 text-gray-400 mr-3" />
                <span className="text-gray-700">Bergabung sejak {memberSince}</span>
              </div>
              <div className="flex items-center text-sm">
                <Globe className="w-4 h-4 text-gray-400 mr-3" />
                <span className="text-gray-700">Bahasa: Indonesia, English</span>
              </div>
              {user.email && (
                <div className="flex items-center text-sm">
                  <Mail className="w-4 h-4 text-gray-400 mr-3" />
                  <span className="text-gray-700">{user.email}</span>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Main Content */}
        <div className="w-full lg:w-2/3 space-y-6">
          
          {/* About Section */}
          <Card>
            <h2 className="text-xl font-black text-gray-900 mb-4 pb-2 border-b border-gray-100 flex items-center">
              <Shield className="w-5 h-5 mr-2 text-emerald-500" />
              Tentang Freelancer
            </h2>
            <p className="text-gray-700 leading-relaxed font-medium whitespace-pre-line">
              {profile.bio || "Freelancer profesional yang siap membantu mewujudkan proyek Anda dengan kualitas terbaik dan hasil yang memuaskan."}
            </p>
          </Card>

          {/* Skills Section */}
          {userSkills.length > 0 && (
            <Card>
              <h2 className="text-xl font-black text-gray-900 mb-4 pb-2 border-b border-gray-100 flex items-center">
                <Star className="w-5 h-5 mr-2 text-emerald-500" />
                Keahlian
              </h2>
              <div className="flex flex-wrap gap-2">
                {userSkills.map((skill, idx) => (
                  <span 
                    key={idx} 
                    className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-full text-sm font-bold hover:bg-emerald-100 transition-colors cursor-pointer"
                    onClick={() => navigate(`/client/explore?skill=${encodeURIComponent(skill)}`)}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </Card>
          )}

          {/* Tabs Navigation */}
          <div className="border-b border-gray-200 bg-white rounded-t-xl">
            <nav className="flex gap-1 px-4">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={classNames(
                      "flex items-center gap-2 px-5 py-3 text-sm font-bold transition-all rounded-t-lg",
                      activeTab === tab.id 
                        ? "bg-white text-emerald-600 border-b-2 border-emerald-600" 
                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                    {tab.count > 0 && (
                      <span className="ml-1 text-xs bg-gray-100 px-1.5 py-0.5 rounded-full">
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content: Services */}
          {activeTab === 'services' && (
            <div>
              {userServices.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {userServices.map(service => (
                    <div 
                      key={service.service_id} 
                      className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
                      onClick={() => navigate(`/client/service/${service.service_id}`)}
                    >
                      <div className="relative h-44 bg-gray-100 overflow-hidden">
                        <img 
                          src={service.thumbnail_url} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                          alt=""
                          onError={(e) => { e.target.src = 'https://via.placeholder.com/400x200?text=No+Image'; }}
                        />
                        {service.featured && (
                          <div className="absolute top-3 left-3 bg-emerald-600 text-white text-xs font-bold px-2 py-1 rounded-md">
                            Unggulan
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-bold text-gray-900 text-base mb-1 line-clamp-2 group-hover:text-emerald-600 transition-colors">
                          {service.title}
                        </h3>
                        <div className="flex items-center gap-2 mb-3">
                          <RatingStars rating={avgRating} size={12} />
                          <span className="text-xs text-gray-500">({completedOrders}+)</span>
                        </div>
                        <div className="flex justify-between items-center border-t border-gray-100 pt-3">
                          <div>
                            <p className="text-[10px] text-gray-400 uppercase">Mulai dari</p>
                            <span className="font-black text-gray-900 text-lg">
                              {formatCurrency(service.packages.basic?.price || 0)}
                            </span>
                          </div>
                          <Badge variant="info" className="text-[10px]">
                            {service.packages.basic?.delivery_days} hari
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Card className="text-center py-12">
                  <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">Belum ada layanan yang ditawarkan</p>
                </Card>
              )}
            </div>
          )}

          {/* Tab Content: Portfolio */}
          {activeTab === 'portfolio' && (
            <div>
              {portfolios.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {portfolios.map(port => (
                    <div key={port.portfolio_id} className="group relative rounded-xl overflow-hidden border border-gray-200 shadow-sm cursor-pointer h-64">
                      <img 
                        src={port.image_url} 
                        alt={port.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => { e.target.src = 'https://via.placeholder.com/400x300?text=Portfolio'; }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-80 group-hover:opacity-100 transition-opacity"></div>
                      <div className="absolute bottom-0 left-0 p-5 w-full">
                        <h3 className="text-white font-black text-lg mb-1">{port.title}</h3>
                        <p className="text-gray-300 text-sm font-medium line-clamp-2">{port.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Card className="text-center py-12">
                  <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">Belum ada portofolio</p>
                </Card>
              )}
            </div>
          )}

          {/* Tab Content: Reviews */}
          {activeTab === 'reviews' && (
            <div>
              {reviews.length > 0 ? (
                <div className="space-y-4">
                  {/* Review Summary */}
                  <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl p-5 mb-4 border border-yellow-100">
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className="text-4xl font-black text-gray-900">{avgRating}</div>
                        <RatingStars rating={avgRating} size={16} />
                        <p className="text-xs text-gray-500 mt-1">{reviews.length} ulasan</p>
                      </div>
                      <div className="flex-1">
                        <div className="space-y-1">
                          {[5,4,3,2,1].map(star => {
                            const count = reviews.filter(r => Math.floor(r.rating) === star).length;
                            const percentage = (count / reviews.length) * 100;
                            return (
                              <div key={star} className="flex items-center gap-2 text-xs">
                                <span className="w-8 font-bold">{star}★</span>
                                <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                  <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${percentage}%` }}></div>
                                </div>
                                <span className="w-8 text-gray-500">{count}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Review List */}
                  {reviews.map(review => {
                    const reviewer = getUserById(review.reviewer_id);
                    return (
                      <Card key={review.review_id} className="p-5">
                        <div className="flex items-start gap-4">
                          <Avatar src={reviewer?.avatar_url} size="sm" />
                          <div className="flex-1">
                            <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                              <div>
                                <h4 className="font-bold text-gray-900">{reviewer?.full_name || 'Anonymous'}</h4>
                                <RatingStars rating={review.rating} size={12} className="mt-1" />
                              </div>
                              <span className="text-xs text-gray-400">{formatDate(review.created_at)}</span>
                            </div>
                            <p className="text-gray-700 text-sm leading-relaxed">"{review.comment}"</p>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <Card className="text-center py-12">
                  <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">Belum ada ulasan untuk freelancer ini</p>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// User icon component
const User = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

export default ClientProfileView;