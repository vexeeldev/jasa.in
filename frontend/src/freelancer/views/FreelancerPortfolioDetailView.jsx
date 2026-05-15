import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, ExternalLink, Calendar, Loader2 } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

const API_BASE_URL = 'http://localhost:5000/api';
const STATIC_URL = 'http://localhost:5000';

const FreelancerPortfolioDetailView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);

  const getFullImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${STATIC_URL}${url}`;
  };

  useEffect(() => {
    fetchPortfolio();
  }, [id]);

  const fetchPortfolio = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/portfolios/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setPortfolio(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch portfolio:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
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
        navigate('/freelancer/portfolios');
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

  if (!portfolio) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Portfolio tidak ditemukan</p>
        <button onClick={() => navigate('/freelancer/portfolios')} className="mt-4 text-emerald-600">
          Kembali ke Portfolio
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <button 
        onClick={() => navigate('/freelancer/portfolios')} 
        className="flex items-center text-gray-500 hover:text-emerald-600 mb-6"
      >
        <ArrowLeft className="w-5 h-5 mr-2" /> Kembali ke Portfolio
      </button>

      <div className="flex justify-end gap-2 mb-4">
        <Button variant="outline" onClick={() => navigate(`/freelancer/portfolios/edit/${portfolio.PORTFOLIO_ID}`)}>
          <Edit className="w-4 h-4 mr-2" /> Edit
        </Button>
        <Button variant="outline" className="text-red-600 hover:bg-red-50" onClick={handleDelete}>
          <Trash2 className="w-4 h-4 mr-2" /> Hapus
        </Button>
      </div>

      <Card className="overflow-hidden">
        {portfolio.IMAGE_URL && (
          <img 
            src={getFullImageUrl(portfolio.IMAGE_URL)} 
            className="w-full h-96 object-cover"
            alt={portfolio.TITLE}
            onError={(e) => e.target.src = 'https://placehold.co/800x400?text=No+Image'}
          />
        )}
        <div className="p-6">
          <h1 className="text-3xl font-black text-gray-900 mb-2">{portfolio.TITLE}</h1>
          
          <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              Dibuat: {new Date(portfolio.CREATED_AT).toLocaleDateString('id-ID')}
            </span>
            {portfolio.PROJECT_URL && (
              <a href={portfolio.PROJECT_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-emerald-600 hover:underline">
                <ExternalLink className="w-4 h-4" />
                Lihat Project
              </a>
            )}
          </div>

          {portfolio.DESCRIPTION && (
            <div className="mt-4 pt-4 border-t">
              <h2 className="font-bold text-gray-900 mb-2">Deskripsi</h2>
              <p className="text-gray-700 whitespace-pre-line">{portfolio.DESCRIPTION}</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default FreelancerPortfolioDetailView;