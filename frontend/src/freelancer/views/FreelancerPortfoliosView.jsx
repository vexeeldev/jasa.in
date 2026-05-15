import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye, Loader2, ExternalLink } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

const API_BASE_URL = 'http://localhost:5000/api';
const STATIC_URL = 'http://localhost:5000';

const FreelancerPortfoliosView = () => {
  const navigate = useNavigate();
  const [portfolios, setPortfolios] = useState([]);
  const [loading, setLoading] = useState(true);

  const getFullImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${STATIC_URL}${url}`;
  };

  useEffect(() => {
    fetchPortfolios();
  }, []);

  const fetchPortfolios = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/portfolios/my/portfolios`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setPortfolios(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch portfolios:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Yakin ingin menghapus portfolio ini?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/portfolios/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        alert('Portfolio berhasil dihapus');
        fetchPortfolios();
      }
    } catch (error) {
      console.error('Failed to delete:', error);
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
          <h1 className="text-3xl font-black text-gray-900">Portfolio Saya</h1>
          <p className="text-gray-500 mt-1">Kumpulkan hasil karya terbaik Anda</p>
        </div>
        <Button onClick={() => navigate('/freelancer/portfolios/create')}>
          <Plus className="w-4 h-4 mr-2" /> Tambah Portfolio
        </Button>
      </div>

      {portfolios.length === 0 ? (
        <Card className="text-center py-16">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Eye className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Belum Ada Portfolio</h3>
          <p className="text-gray-500 mb-4">Tampilkan hasil karya Anda</p>
          <Button onClick={() => navigate('/freelancer/portfolios/create')}>
            <Plus className="w-4 h-4 mr-2" /> Tambah Portfolio
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {portfolios.map(portfolio => (
            <Card key={portfolio.PORTFOLIO_ID} className="p-4 hover:shadow-md transition">
              <img 
                src={getFullImageUrl(portfolio.IMAGE_URL) || 'https://placehold.co/400x300?text=No+Image'}
                className="w-full h-48 object-cover rounded-lg mb-3"
                alt={portfolio.TITLE}
                onError={(e) => e.target.src = 'https://placehold.co/400x300?text=No+Image'}
              />
              <h3 className="font-bold text-gray-900 mb-1">{portfolio.TITLE}</h3>
              <p className="text-sm text-gray-500 line-clamp-2 mb-3">{portfolio.DESCRIPTION}</p>
              {portfolio.PROJECT_URL && (
                <a href={portfolio.PROJECT_URL} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-600 hover:underline flex items-center gap-1 mb-3">
                  <ExternalLink className="w-3 h-3" /> Lihat Project
                </a>
              )}
              <div className="flex gap-2 pt-3 border-t">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => navigate(`/freelancer/portfolios/${portfolio.PORTFOLIO_ID}`)}>
                  <Eye className="w-4 h-4 mr-1" /> Detail
                </Button>
                <Button variant="outline" size="sm" className="flex-1" onClick={() => navigate(`/freelancer/portfolios/edit/${portfolio.PORTFOLIO_ID}`)}>
                  <Edit className="w-4 h-4 mr-1" /> Edit
                </Button>
                <Button variant="outline" size="sm" className="text-red-600" onClick={() => handleDelete(portfolio.PORTFOLIO_ID)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default FreelancerPortfoliosView;