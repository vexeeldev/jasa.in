import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Trash2, ShoppingBag, Star, Loader2, Eye } from 'lucide-react';
import { formatCurrency } from '../data/helpers';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

const API_BASE_URL = 'http://localhost:5000/api';
const STATIC_URL = 'http://localhost:5000';

const ClientWishlistView = () => {
  const navigate = useNavigate();
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);

  const getFullImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${STATIC_URL}${url}`;
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/wishlist`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setWishlist(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (serviceId, e) => {
    e.stopPropagation();
    if (!confirm('Hapus dari wishlist?')) return;
    
    setRemovingId(serviceId);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/wishlist/service/${serviceId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setWishlist(wishlist.filter(item => item.SERVICE_ID !== serviceId));
      }
    } catch (error) {
      console.error('Failed to remove:', error);
      alert('Gagal menghapus dari wishlist');
    } finally {
      setRemovingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-6">
        <Heart className="w-8 h-8 text-emerald-500 fill-current" />
        <div>
          <h1 className="text-3xl font-black text-gray-900">Wishlist Saya</h1>
          <p className="text-gray-500 mt-1">{wishlist.length} jasa tersimpan</p>
        </div>
      </div>

      {wishlist.length === 0 ? (
        <Card className="text-center py-16">
          <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Belum Ada Jasa Tersimpan</h3>
          <p className="text-gray-500 mb-6">Temukan jasa favorit dan klik ikon hati untuk menyimpannya</p>
          <Button onClick={() => navigate('/client/explore')}>
            <ShoppingBag className="w-4 h-4 mr-2" />
            Cari Jasa
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {wishlist.map((item) => (
            <Card key={item.WISHLIST_ID} className="overflow-hidden hover:shadow-md transition cursor-pointer group">
              <div onClick={() => navigate(`/client/service/${item.SERVICE_ID}`)}>
                <img 
                  src={getFullImageUrl(item.THUMBNAIL_URL) || 'https://placehold.co/400x250'} 
                  className="w-full h-48 object-cover"
                  alt={item.TITLE}
                />
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <h3 className="font-bold text-gray-900 mb-1 line-clamp-2 flex-1">{item.TITLE}</h3>
                    <button 
                      onClick={(e) => handleRemove(item.SERVICE_ID, e)}
                      className="ml-2 p-1 text-gray-400 hover:text-red-500 transition"
                      disabled={removingId === item.SERVICE_ID}
                    >
                      {removingId === item.SERVICE_ID ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-400 fill-current" />
                      <span className="text-sm text-gray-600">{item.FREELANCER_RATING || 0}</span>
                    </div>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500">{item.FREELANCER_NAME}</span>
                  </div>
                  
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xl font-bold text-emerald-600">
                      {formatCurrency(item.MIN_PRICE || 0)}
                    </span>
                    <span className="text-xs text-gray-400">mulai dari</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClientWishlistView;