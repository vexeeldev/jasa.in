import React, { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import RatingStars from '../components/ui/RatingStars';

const UserProfileView = ({ navigate, viewParams }) => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Silakan login terlebih dahulu');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('http://localhost:5000/api/users/me', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        const result = await response.json();

        if (result.success) {
          setUserData(result.data);
        } else {
          setError(result.message || 'Gagal mengambil data profile');
        }
      } catch (err) {
        setError('Terjadi kesalahan saat menghubungi server');
        console.error('Error fetching user profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  // Helper function untuk format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="p-20 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <p className="mt-4 font-bold text-gray-500">Memuat data profile...</p>
      </div>
    );
  }

  if (error || !userData) {
    return (
      <div className="p-20 text-center font-bold text-xl text-gray-500">
        {error || 'Profile not found.'}
      </div>
    );
  }

  // Extract data dari response API
  const {
    user_id,
    username,
    email,
    full_name,
    phone,
    avatar_url,
    role,
    balance,
    created_at,
    freelancer,
    skills = [],
    portfolios = [],
    total_reviews_given
  } = userData;

  // Menyusun data user untuk ditampilkan
  const user = {
    user_id: user_id,
    username: username,
    full_name: full_name,
    email: email,
    phone: phone,
    avatar_url: avatar_url,
    role: role,
    location: 'Indonesia', // Default karena tidak ada di API
    is_verified: '0', // Default karena tidak ada di API
    created_at: created_at
  };

  // Menyusun data profile untuk ditampilkan
  const profile = {
    profile_id: freelancer?.freelancer_id || user_id,
    bio: freelancer?.bio || 'Belum ada deskripsi',
    level: freelancer?.freelancer_level === 'top' ? 'top' : 
           freelancer?.freelancer_level === 'pro' ? 'pro' : 'new',
    rating_avg: freelancer?.rating_avg || 0,
    total_orders: freelancer?.total_orders || 0,
    joined_at: created_at,
    balance: balance || 0
  };

  // Map skills dari format API
  const userSkills = skills.map(skill => skill.name);
  
  // Map portfolios dari format API
  const userPortfolios = portfolios.map(portfolio => ({
    portfolio_id: portfolio.portfolio_id,
    title: portfolio.title,
    description: portfolio.description,
    image_url: portfolio.image_url
  }));

  // Services tidak ada di response API, jadi array kosong
  const userServices = [];

  // Tentukan badge variant berdasarkan level
  const getBadgeVariant = () => {
    if (profile.level === 'top') return 'purple';
    if (profile.level === 'pro') return 'success';
    return 'default';
  };

  const getBadgeText = () => {
    if (profile.level === 'top') return 'Top Rated Freelancer';
    if (profile.level === 'pro') return 'Pro Freelancer';
    return 'Freelancer';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col md:flex-row gap-8">

        {/* Sidebar */}
        <div className="w-full md:w-1/3 lg:w-1/4">
          <Card className="text-center sticky top-28">
            <div className="relative inline-block mb-4">
              <Avatar 
                src={avatar_url || `https://ui-avatars.com/api/?name=${full_name}&background=random`} 
                size="xl" 
                verified={user.is_verified === '1'} 
              />
            </div>
            <h1 className="text-2xl font-black text-gray-900">{full_name}</h1>
            <p className="text-gray-500 font-bold mb-4">@{username}</p>

            {role === 'freelancer' && (
              <div className="flex justify-center mb-6">
                <Badge variant={getBadgeVariant()} className="px-3 py-1">
                  {getBadgeText()}
                </Badge>
              </div>
            )}

            <div className="border-t border-gray-100 pt-6 text-left">
              <div className="flex justify-between items-center mb-3 text-sm">
                <span className="text-gray-500 font-bold">Lokasi</span>
                <span className="font-black text-gray-900">{user.location}</span>
              </div>
              <div className="flex justify-between items-center mb-3 text-sm">
                <span className="text-gray-500 font-bold">Bergabung</span>
                <span className="font-black text-gray-900">
                  {new Date(created_at).getFullYear()}
                </span>
              </div>
              <div className="flex justify-between items-center mb-3 text-sm">
                <span className="text-gray-500 font-bold">Rating</span>
                <span className="font-black text-gray-900 flex items-center">
                  <Star className="w-3.5 h-3.5 text-yellow-400 fill-current mr-1" /> 
                  {profile.rating_avg}
                </span>
              </div>
              {role === 'freelancer' && (
                <div className="flex justify-between items-center mb-3 text-sm">
                  <span className="text-gray-500 font-bold">Total Order</span>
                  <span className="font-black text-gray-900">{profile.total_orders}</span>
                </div>
              )}
              <div className="flex justify-between items-center mb-3 text-sm">
                <span className="text-gray-500 font-bold">Saldo</span>
                <span className="font-black text-green-600">{formatCurrency(balance)}</span>
              </div>
            </div>

            <Button fullWidth className="mt-6" onClick={() => navigate('messages')}>
              Hubungi Saya
            </Button>
          </Card>
        </div>

        {/* Main Content */}
        <div className="w-full md:w-2/3 lg:w-3/4 space-y-10">

          <Card>
            <h2 className="text-xl font-black text-gray-900 mb-4 pb-2 border-b border-gray-100">Tentang Saya</h2>
            <p className="text-gray-700 leading-relaxed font-medium mb-8 whitespace-pre-line">
              {profile.bio}
            </p>

            <h2 className="text-xl font-black text-gray-900 mb-4 pb-2 border-b border-gray-100">Keahlian (Skills)</h2>
            <div className="flex flex-wrap gap-2">
              {userSkills.length > 0 ? (
                userSkills.map((skill, idx) => (
                  <span key={idx} className="bg-gray-100 text-gray-700 border border-gray-200 px-4 py-1.5 rounded-full text-sm font-bold">
                    {skill}
                  </span>
                ))
              ) : (
                <p className="text-gray-500 text-sm">Belum ada keahlian yang ditambahkan</p>
              )}
            </div>
          </Card>

          {userServices.length > 0 && (
            <div>
              <h2 className="text-2xl font-black text-gray-900 mb-6">Layanan Saya</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {userServices.map(service => (
                  <div 
                    key={service.service_id} 
                    className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all cursor-pointer flex flex-col" 
                    onClick={() => navigate('service-detail', { id: service.service_id })}
                  >
                    <div className="h-40 bg-gray-100 overflow-hidden">
                      <img 
                        src={service.thumbnail_url || 'https://via.placeholder.com/300x200'} 
                        className="w-full h-full object-cover" 
                        alt={service.title} 
                      />
                    </div>
                    <div className="p-4 flex flex-col flex-grow">
                      <h3 className="font-bold text-gray-900 text-sm mb-2 line-clamp-2">{service.title}</h3>
                      <div className="mt-auto flex justify-between items-center border-t border-gray-100 pt-3">
                        <RatingStars 
                          rating={service.rating_avg || profile.rating_avg} 
                          count={service.total_orders || 0} 
                        />
                        <span className="font-black text-gray-900">
                          {formatCurrency(service.price || service.packages?.basic?.price || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {userPortfolios.length > 0 && (
            <div>
              <h2 className="text-2xl font-black text-gray-900 mb-6">Portofolio Pekerjaan</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {userPortfolios.map(port => (
                  <div 
                    key={port.portfolio_id} 
                    className="group relative rounded-xl overflow-hidden border border-gray-200 shadow-sm cursor-pointer h-64"
                  >
                    <img 
                      src={port.image_url} 
                      alt={port.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-80 group-hover:opacity-100 transition-opacity"></div>
                    <div className="absolute bottom-0 left-0 p-5 w-full">
                      <h3 className="text-white font-black text-lg mb-1">{port.title}</h3>
                      <p className="text-gray-300 text-sm font-medium line-clamp-2">{port.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {total_reviews_given > 0 && (
            <Card>
              <h2 className="text-xl font-black text-gray-900 mb-4">Statistik</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-black text-gray-900">{total_reviews_given}</div>
                  <div className="text-sm text-gray-500">Total Review Diberikan</div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfileView;