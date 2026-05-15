import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Mail, MapPin, Calendar, MessageCircle, Star, Loader2, ArrowLeft, User } from 'lucide-react';
import Avatar from '../components/ui/Avatar';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

const API_BASE_URL = 'http://localhost:5000/api';
const STATIC_URL = 'http://localhost:5000';

const ClientProfileView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  const getFullImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${STATIC_URL}${url}`;
  };

  useEffect(() => {
    checkOwnProfile();
    fetchUser();
  }, [id]);

  const checkOwnProfile = () => {
    const token = localStorage.getItem('token');
    if (!id && token) {
      setIsOwnProfile(true);
    }
  };

  const fetchUser = async () => {
    try {
      let url;
      if (id) {
        url = `${API_BASE_URL}/users/${id}`;
      } else {
        url = `${API_BASE_URL}/users/me`;
      }
      
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      const res = await fetch(url, { headers });
      const data = await res.json();
      
      if (data.success) {
        setUser(data.data);
        fetchUserReviews(data.data.user_id);
      } else {
        setError('User tidak ditemukan');
        setLoading(false);
      }
    } catch (err) {
      console.error('Failed to fetch user:', err);
      setError('Gagal memuat profil');
      setLoading(false);
    }
  };

  const fetchUserReviews = async (userId) => {
    try {
      console.log('Fetching reviews for user:', userId);
      const res = await fetch(`${API_BASE_URL}/reviews/by-user/${userId}`);
      const data = await res.json();
      console.log('Reviews response:', data);
      
      if (data.success) {
        setReviews(data.data || []);
        setReviewStats(data.stats);
      }
    } catch (err) {
      console.error('Gagal memuat review:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMessage = () => {
    navigate('/client/messages', { 
      state: { 
        receiverId: user?.user_id,
        receiverName: user?.full_name,
        receiverAvatar: user?.avatar_url,
        type: 'direct'
      } 
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">{error || 'User tidak ditemukan'}</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-emerald-600">Kembali</button>
      </div>
    );
  }

  const joinedYear = user.created_at ? new Date(user.created_at).getFullYear() : '-';
  const isFreelancer = user.role === 'freelancer' || user.freelancer;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Back Button */}
      <button 
        onClick={() => navigate(-1)} 
        className="flex items-center text-gray-500 hover:text-emerald-600 mb-6"
      >
        <ArrowLeft className="w-5 h-5 mr-2" /> Kembali
      </button>

      {/* Profile Card */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden mb-6 shadow-sm">
        <div className="h-24 bg-gradient-to-r from-emerald-400 to-teal-500"></div>
        
        <div className="px-6 pb-6">
          <div className="relative -mt-12 mb-4">
            <Avatar 
              src={getFullImageUrl(user.avatar_url)} 
              size="xl" 
              className="border-4 border-white shadow-md mx-auto"
            />
          </div>
          
          <div className="text-center">
            <h1 className="text-2xl font-black text-gray-900">{user.full_name}</h1>
            <p className="text-sm text-gray-500">@{user.username}</p>
            <div className="flex justify-center gap-2 mt-2">
              <span className="inline-block px-3 py-1 text-xs rounded-full bg-gray-100 text-gray-600 font-medium">
                {isFreelancer ? 'Freelancer' : 'Client'}
              </span>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {user.email && (
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-gray-700">{user.email}</span>
              </div>
            )}
            <div className="flex items-center gap-3 text-sm">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span className="text-gray-700">{user.location || 'Indonesia'}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-gray-700">Bergabung {joinedYear}</span>
            </div>
          </div>

          {user.bio && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-600">{user.bio}</p>
            </div>
          )}

          {!isOwnProfile && (
            <div className="mt-6">
              <Button fullWidth variant="outline" onClick={handleMessage}>
                <MessageCircle className="w-4 h-4 mr-2" />
                Kirim Pesan
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Reviews Given Section */}
      <div>
        <h2 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-500" />
          Ulasan yang Diberikan
        </h2>
        
        {reviews.length === 0 ? (
          <Card className="text-center py-12">
            <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Belum memberikan ulasan</p>
            <p className="text-xs text-gray-400 mt-1">Setelah order selesai, Anda bisa memberi rating</p>
          </Card>
        ) : (
          <>
            {/* Rating Statistics */}
            {reviewStats && reviewStats.total_reviews > 0 && (
              <div className="bg-gray-50 rounded-xl p-5 mb-5 border border-gray-100">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="text-center">
                    <p className="text-4xl font-black text-gray-900">{reviewStats.avg_rating || 0}</p>
                    <div className="flex items-center justify-center gap-0.5 mt-1">
                      {[1,2,3,4,5].map(star => (
                        <Star key={star} className={`w-4 h-4 ${star <= Math.round(reviewStats.avg_rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{reviewStats.total_reviews} ulasan</p>
                  </div>
                  <div className="flex-1 space-y-1.5">
                    {[5,4,3,2,1].map(star => {
                      const count = reviewStats[`rating_${star}`] || 0;
                      const percent = reviewStats.total_reviews ? (count / reviewStats.total_reviews) * 100 : 0;
                      return (
                        <div key={star} className="flex items-center gap-2 text-xs">
                          <span className="w-8 font-medium">{star} ★</span>
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-yellow-400 rounded-full" 
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <span className="w-8 text-gray-500 text-right">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* 🔥 PERBAIKI REVIEWS LIST - TAMBAHKAN getFullImageUrl */}
            <div className="space-y-4">
              {reviews.map((review) => (
                <Card key={review.REVIEW_ID} className="p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    <Avatar 
                      src={getFullImageUrl(review.FREELANCER_AVATAR || review.RECEIVER_AVATAR)} 
                      size="md" 
                    />
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <div>
                          <span className="font-bold text-gray-900">
                            {review.FREELANCER_NAME || review.RECEIVER_NAME || 'Freelancer'}
                          </span>
                          <div className="flex items-center gap-1 mt-1">
                            {[1,2,3,4,5].map(star => (
                              <Star 
                                key={star} 
                                className={`w-3.5 h-3.5 ${star <= (review.RATING || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                              />
                            ))}
                          </div>
                        </div>
                        <span className="text-xs text-gray-400">
                          {review.CREATED_AT ? new Date(review.CREATED_AT).toLocaleDateString('id-ID') : '-'}
                        </span>
                      </div>
                      {review.REVIEW_COMMENT && (
                        <p className="text-sm text-gray-600 mt-2">"{review.REVIEW_COMMENT}"</p>
                      )}
                      {review.SERVICE_TITLE && (
                        <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                          <span>Layanan:</span>
                          <span className="font-medium">{review.SERVICE_TITLE}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ClientProfileView;