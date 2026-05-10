import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Mail, MapPin, Calendar, MessageCircle, Star, Loader2 } from 'lucide-react';
import Avatar from '../components/ui/Avatar';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

const API_BASE_URL = 'http://localhost:5000/api';

const ClientProfileView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUser();
    fetchUserReviews();
  }, [id]);

  const fetchUser = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/users/profile/${id}`);
      const data = await res.json();
      if (data.success) {
        setUser(data.data);
      } else {
        setError('User tidak ditemukan');
      }
    } catch (err) {
      setError('Gagal memuat profil');
    }
  };

  const fetchUserReviews = async () => {
    try {
      // Ambil review yang DIBERIKAN oleh user ini (sebagai reviewer)
      const res = await fetch(`${API_BASE_URL}/reviews/by-user/${id}`);
      const data = await res.json();
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
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

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Profil Client */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-6">
        <div className="p-6 text-center border-b border-gray-100">
          <Avatar src={user.avatar_url} size="xl" className="mx-auto" />
          <h1 className="text-xl font-bold text-gray-900 mt-3">{user.full_name}</h1>
          <p className="text-sm text-gray-500">@{user.username}</p>
          <span className="inline-block mt-2 px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
            Client
          </span>
        </div>

        <div className="p-6 space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <Mail className="w-4 h-4 text-gray-400" />
            <span className="text-gray-700">{user.email}</span>
          </div>
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
          <div className="p-6 pt-0">
            <p className="text-sm text-gray-600">{user.bio}</p>
          </div>
        )}

        <div className="p-6 pt-0">
          <Button fullWidth variant="outline" onClick={() => navigate('/client/messages', { state: { receiverId: user.user_id } })}>
            <MessageCircle className="w-4 h-4 mr-2" />
            Kirim Pesan
          </Button>
        </div>
      </div>

      {/* Ulasan yang Diberikan */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Ulasan yang Diberikan</h2>
        
        {reviews.length === 0 ? (
          <Card className="text-center py-8">
            <Star className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">Belum memberikan ulasan</p>
          </Card>
        ) : (
          <>
            {/* Statistik Rating */}
            {reviewStats && (
              <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-gray-900">{reviewStats.avg_rating || 0}</p>
                    <div className="flex items-center justify-center gap-0.5 mt-1">
                      {[1,2,3,4,5].map(star => (
                        <Star key={star} className={`w-4 h-4 ${star <= (reviewStats.avg_rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{reviewStats.total_reviews} ulasan</p>
                  </div>
                  <div className="flex-1 space-y-1">
                    {[5,4,3,2,1].map(star => {
                      const count = reviewStats[`rating_${star}`] || 0;
                      const percent = reviewStats.total_reviews ? (count / reviewStats.total_reviews) * 100 : 0;
                      return (
                        <div key={star} className="flex items-center gap-2 text-xs">
                          <span className="w-6">{star}★</span>
                          <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${percent}%` }}></div>
                          </div>
                          <span className="w-8 text-gray-500">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* List Ulasan */}
            <div className="space-y-3">
              {reviews.map(review => (
                <Card key={review.REVIEW_ID} className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar src={review.FREELANCER_AVATAR} size="sm" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <span className="font-medium text-gray-900">{review.FREELANCER_NAME || 'Freelancer'}</span>
                          <div className="flex items-center gap-1 mt-1">
                            {[1,2,3,4,5].map(star => (
                              <Star key={star} className={`w-3 h-3 ${star <= (review.RATING || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                            ))}
                          </div>
                        </div>
                        <span className="text-xs text-gray-400">{new Date(review.CREATED_AT).toLocaleDateString('id-ID')}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">{review.REVIEW_COMMENT}</p>
                      {review.SERVICE_TITLE && (
                        <p className="text-xs text-gray-400 mt-1">Layanan: {review.SERVICE_TITLE}</p>
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