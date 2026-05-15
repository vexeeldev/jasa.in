import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye, Loader2 } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { formatCurrency } from '../data/helpers';

const API_BASE_URL = 'http://localhost:5000/api';
const STATIC_URL = 'http://localhost:5000';  // 🔥 TAMBAHKAN INI

const FreelancerServicesView = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔥 TAMBAHKAN FUNGSI INI
  const getFullImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    if (url.startsWith('/')) return `${STATIC_URL}${url}`;
    return `${STATIC_URL}/${url}`;
  };

  useEffect(() => {
    fetchMyServices();
  }, []);

  const fetchMyServices = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/services/my-services/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setServices(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch services:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (serviceId) => {
    if (!confirm('Yakin ingin menghapus jasa ini?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/services/${serviceId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        alert('Jasa berhasil dihapus');
        fetchMyServices();
      } else {
        alert(data.message || 'Gagal menghapus');
      }
    } catch (error) {
      console.error('Failed to delete service:', error);
      alert('Terjadi kesalahan');
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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Jasa Saya</h1>
          <p className="text-gray-500 mt-1">Kelola layanan yang Anda tawarkan</p>
        </div>
        <Button onClick={() => navigate('/freelancer/services/create')}>
          <Plus className="w-4 h-4 mr-2" /> Tambah Jasa
        </Button>
      </div>

      {services.length === 0 ? (
        <Card className="text-center py-16">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Eye className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Belum Ada Jasa</h3>
          <p className="text-gray-500 mb-4">Mulai tawarkan keahlian Anda</p>
          <Button onClick={() => navigate('/freelancer/services/create')}>
            <Plus className="w-4 h-4 mr-2" /> Tambah Jasa
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {services.map(service => (
            <Card key={service.SERVICE_ID} className="p-5 hover:shadow-md transition">
              <div className="flex gap-4">
                {/* 🔥 PERBAIKI BAGIAN GAMBAR INI */}
                <img 
                  src={getFullImageUrl(service.THUMBNAIL_URL) || 'https://placehold.co/100x100?text=No+Image'} 
                  className="w-24 h-24 object-cover rounded-lg border"
                  alt={service.TITLE}
                  onError={(e) => {
                    e.target.src = 'https://placehold.co/100x100?text=No+Image';
                  }}
                />
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900">{service.TITLE}</h3>
                  <p className="text-xs text-gray-500 mb-2">{service.CATEGORY_NAME}</p>
                  <p className="text-emerald-600 font-bold">{formatCurrency(service.MIN_PRICE || 0)}</p>
                  <Badge variant={service.STATUS === 'active' ? 'success' : 'default'} className="mt-2 text-[10px]">
                    {service.STATUS === 'active' ? 'Aktif' : 'Nonaktif'}
                  </Badge>
                </div>
              </div>
              <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => navigate(`/freelancer/service/${service.SERVICE_ID}`)}>
                  <Eye className="w-4 h-4 mr-1" /> Detail
                </Button>
                <Button variant="outline" size="sm" className="flex-1" onClick={() => navigate(`/freelancer/services/edit/${service.SERVICE_ID}`)}>
                  <Edit className="w-4 h-4 mr-1" /> Edit
                </Button>
                <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-50" onClick={() => handleDelete(service.SERVICE_ID)}>
                  <Trash2 className="w-4 h-4 mr-1" /> Hapus
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default FreelancerServicesView;