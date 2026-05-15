import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, Upload, X } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Textarea from '../components/ui/Textarea';

const API_BASE_URL = 'http://localhost:5000/api';
const STATIC_URL = 'http://localhost:5000';

const FreelancerPortfolioEditView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image_url: '',
    image_file: null,
    project_url: ''
  });

  const getFullImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    if (url.startsWith('/')) return `${STATIC_URL}${url}`;
    return `${STATIC_URL}/${url}`;
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
        const portfolio = data.data;
        setFormData({
          title: portfolio.TITLE || '',
          description: portfolio.DESCRIPTION || '',
          image_url: portfolio.IMAGE_URL || '',
          image_file: null,
          project_url: portfolio.PROJECT_URL || ''
        });
      } else {
        alert(data.message || 'Gagal memuat data');
        navigate('/freelancer/portfolios');
      }
    } catch (error) {
      console.error('Failed to fetch portfolio:', error);
      alert('Terjadi kesalahan');
      navigate('/freelancer/portfolios');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const localPreview = URL.createObjectURL(file);
    setFormData(prev => ({ ...prev, image_url: localPreview, image_file: file }));
    
    setUploading(true);
    const formDataUpload = new FormData();
    formDataUpload.append('portfolio', file);  // ✅ BENAR - 'portfolio'
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/portfolios/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formDataUpload
      });
      const data = await res.json();
      
      if (data.success) {
        URL.revokeObjectURL(localPreview);
        setFormData(prev => ({ ...prev, image_url: data.data.image_url, image_file: null }));
        alert('Gambar berhasil diupload!');
      } else {
        alert(data.message || 'Upload gagal');
        setFormData(prev => ({ ...prev, image_url: '', image_file: null }));
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Terjadi kesalahan saat upload');
      setFormData(prev => ({ ...prev, image_url: '', image_file: null }));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title) {
      alert('Judul portfolio wajib diisi');
      return;
    }
    
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/portfolios/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          image_url: formData.image_url || null,
          project_url: formData.project_url || null
        })
      });
      const data = await res.json();
      
      if (data.success) {
        alert('Portfolio berhasil diupdate!');
        navigate('/freelancer/portfolios');
      } else {
        alert(data.message || 'Gagal mengupdate');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Terjadi kesalahan');
    } finally {
      setSaving(false);
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
    <div className="max-w-2xl mx-auto px-4 py-10">
      <button 
        onClick={() => navigate('/freelancer/portfolios')} 
        className="flex items-center text-gray-500 hover:text-emerald-600 mb-6"
      >
        <ArrowLeft className="w-5 h-5 mr-2" /> Kembali ke Portfolio
      </button>

      <h1 className="text-3xl font-black text-gray-900 mb-2">Edit Portfolio</h1>
      <p className="text-gray-500 mb-8">Perbarui informasi portfolio Anda</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-bold text-gray-700 mb-2">Judul *</label>
            <Input 
              name="title" 
              value={formData.title} 
              onChange={handleChange} 
              placeholder="Contoh: Desain Website E-commerce" 
              required 
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-bold text-gray-700 mb-2">Deskripsi</label>
            <Textarea 
              name="description" 
              value={formData.description} 
              onChange={handleChange} 
              rows={5} 
              placeholder="Ceritakan tentang project ini..." 
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-bold text-gray-700 mb-2">URL Project (Opsional)</label>
            <Input 
              name="project_url" 
              value={formData.project_url} 
              onChange={handleChange} 
              placeholder="https://..." 
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-bold text-gray-700 mb-2">Gambar</label>
            <div className="flex gap-4">
              {formData.image_url ? (
                <div className="relative">
                  <img 
                    src={getFullImageUrl(formData.image_url)} 
                    className="w-48 h-32 object-cover rounded-lg border" 
                    alt="preview"
                    onError={(e) => {
                      e.target.src = 'https://placehold.co/200x150?text=No+Image';
                    }}
                  />
                  <button 
                    type="button" 
                    onClick={() => setFormData(prev => ({ ...prev, image_url: '', image_file: null }))} 
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer">
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageUpload} 
                    className="hidden" 
                    disabled={uploading} 
                  />
                  <div className="w-48 h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-emerald-400 transition-colors cursor-pointer">
                    {uploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6 text-gray-400" />}
                    <span className="text-xs text-gray-400 mt-1">Upload Gambar</span>
                  </div>
                </label>
              )}
            </div>
          </div>
        </Card>

        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={() => navigate('/freelancer/portfolios')}>
            Batal
          </Button>
          <Button type="submit" disabled={saving || uploading}>
            {saving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
            Simpan Perubahan
          </Button>
        </div>
      </form>
    </div>
  );
};

export default FreelancerPortfolioEditView;