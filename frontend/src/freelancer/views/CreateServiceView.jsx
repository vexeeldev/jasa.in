import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, X, Upload, Loader2, ChevronLeft, Image, Trash2 } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Textarea from '../components/ui/Textarea';

const API_BASE_URL = 'http://localhost:5000/api';

const CreateServiceView = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    category_id: '',
    title: '',
    description: '',
    thumbnail_url: '',
    packages: [
      { package_name: 'basic', description: '', price: '', delivery_days: '', revisions: 2 },
      { package_name: 'standard', description: '', price: '', delivery_days: '', revisions: 4 },
      { package_name: 'premium', description: '', price: '', delivery_days: '', revisions: 999 }
    ],
    gallery: ['', '', '']
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/categories`);
      const data = await res.json();
      if (data.success) {
        const subCategories = data.data.filter(cat => cat.PARENT_ID !== null);
        setCategories(subCategories);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePackageChange = (index, field, value) => {
    const updatedPackages = [...formData.packages];
    updatedPackages[index][field] = value;
    setFormData({ ...formData, packages: updatedPackages });
  };

  // 🔥 Upload thumbnail
  const handleThumbnailUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploading(true);
    const formDataUpload = new FormData();
    formDataUpload.append('image', file);
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/services/upload-thumbnail`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formDataUpload
      });
      const data = await res.json();
      if (data.success) {
        setFormData(prev => ({ ...prev, thumbnail_url: data.data.url }));
      } else {
        alert(data.message || 'Upload gagal');
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Terjadi kesalahan saat upload');
    } finally {
      setUploading(false);
    }
  };

  // 🔥 Upload gallery
  const handleGalleryUpload = async (e, index) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploading(true);
    const formDataUpload = new FormData();
    formDataUpload.append('image', file);
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/services/upload-thumbnail`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formDataUpload
      });
      const data = await res.json();
      if (data.success) {
        const updatedGallery = [...formData.gallery];
        updatedGallery[index] = data.data.url;
        setFormData(prev => ({ ...prev, gallery: updatedGallery }));
      } else {
        alert(data.message || 'Upload gagal');
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Terjadi kesalahan saat upload');
    } finally {
      setUploading(false);
    }
  };

  const removeGalleryImage = (index) => {
    const updatedGallery = [...formData.gallery];
    updatedGallery[index] = '';
    setFormData(prev => ({ ...prev, gallery: updatedGallery }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.category_id) {
      alert('Pilih kategori terlebih dahulu');
      return;
    }
    if (!formData.title) {
      alert('Judul layanan wajib diisi');
      return;
    }
    
    const validPackages = formData.packages.filter(pkg => pkg.price && parseInt(pkg.price) > 0);
    if (validPackages.length === 0) {
      alert('Minimal 1 paket harus diisi dengan harga yang valid');
      return;
    }
    
    const validGallery = formData.gallery.filter(url => url && url.trim() !== '');
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/services`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          category_id: parseInt(formData.category_id),
          title: formData.title,
          description: formData.description,
          thumbnail_url: formData.thumbnail_url || null,
          packages: validPackages.map(pkg => ({
            package_name: pkg.package_name,
            description: pkg.description,
            price: parseInt(pkg.price),
            delivery_days: parseInt(pkg.delivery_days),
            revisions: pkg.revisions === 999 ? 999 : parseInt(pkg.revisions)
          })),
          gallery: validGallery
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('Jasa berhasil ditambahkan!');
        navigate('/freelancer/services');
      } else {
        alert(data.message || 'Gagal menambahkan jasa');
      }
    } catch (error) {
      console.error('Failed to create service:', error);
      alert('Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <button 
        onClick={() => navigate('/freelancer/services')} 
        className="flex items-center text-gray-500 hover:text-emerald-600 mb-6"
      >
        <ChevronLeft className="w-5 h-5 mr-2" /> Kembali ke Daftar Jasa
      </button>

      <h1 className="text-3xl font-black text-gray-900 mb-2">Tambah Jasa Baru</h1>
      <p className="text-gray-500 mb-8">Isi detail layanan yang akan Anda tawarkan</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Informasi Dasar</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-bold text-gray-700 mb-2">Kategori *</label>
            <select
              name="category_id"
              value={formData.category_id}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              required
            >
              <option value="">Pilih Kategori</option>
              {categories.map(cat => (
                <option key={cat.CATEGORY_ID} value={cat.CATEGORY_ID}>
                  {cat.NAME}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-bold text-gray-700 mb-2">Judul Layanan *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
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
              className="w-full"
              placeholder="Jelaskan detail layanan yang Anda tawarkan..."
            />
          </div>

          {/* Thumbnail Upload */}
          <div className="mb-4">
            <label className="block text-sm font-bold text-gray-700 mb-2">Thumbnail</label>
            <div className="flex items-center gap-4">
              {formData.thumbnail_url ? (
                <div className="relative">
                  <img src={formData.thumbnail_url} className="w-32 h-32 object-cover rounded-lg border" alt="thumbnail" />
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, thumbnail_url: '' }))}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                  <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-emerald-400 transition-colors">
                    {uploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6 text-gray-400" />}
                    <span className="text-xs text-gray-400 mt-1">Upload</span>
                  </div>
                </label>
              )}
            </div>
          </div>
        </Card>

        {/* Packages */}
        <Card className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Paket Layanan</h2>
          
          {formData.packages.map((pkg, idx) => (
            <div key={pkg.package_name} className="mb-6 pb-6 border-b border-gray-100 last:border-0">
              <h3 className="font-bold text-gray-900 mb-3 capitalize">
                Paket {pkg.package_name}
                {pkg.package_name === 'basic' && <span className="text-xs text-gray-400 ml-2">(Minimal 1 paket)</span>}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Harga (Rp)</label>
                  <input
                    type="number"
                    value={pkg.price}
                    onChange={(e) => handlePackageChange(idx, 'price', e.target.value)}
                    placeholder="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Estimasi (hari)</label>
                  <input
                    type="number"
                    value={pkg.delivery_days}
                    onChange={(e) => handlePackageChange(idx, 'delivery_days', e.target.value)}
                    placeholder="3"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Revisi</label>
                  <input
                    type="number"
                    value={pkg.revisions}
                    onChange={(e) => handlePackageChange(idx, 'revisions', e.target.value)}
                    placeholder="2"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none"
                  />
                  <p className="text-xs text-gray-400">999 = Tidak terbatas</p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Deskripsi Paket</label>
                  <input
                    type="text"
                    value={pkg.description}
                    onChange={(e) => handlePackageChange(idx, 'description', e.target.value)}
                    placeholder="Apa saja yang didapat di paket ini?"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none"
                  />
                </div>
              </div>
            </div>
          ))}
          <p className="text-xs text-gray-400 mt-2">*Basic wajib diisi, Standard dan Premium opsional</p>
        </Card>

        {/* Gallery */}
        <Card className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Galeri (Opsional)</h2>
          <p className="text-sm text-gray-500 mb-4">Tambahkan gambar contoh pekerjaan Anda</p>
          
          <div className="grid grid-cols-3 gap-4">
            {formData.gallery.map((url, idx) => (
              <div key={idx} className="relative">
                {url ? (
                  <div className="relative">
                    <img src={url} className="w-full h-32 object-cover rounded-lg border" alt={`gallery-${idx}`} />
                    <button
                      type="button"
                      onClick={() => removeGalleryImage(idx)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer block">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleGalleryUpload(e, idx)}
                      className="hidden"
                      disabled={uploading}
                    />
                    <div className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-emerald-400 transition-colors">
                      {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Image className="w-6 h-6 text-gray-400" />}
                      <span className="text-xs text-gray-400 mt-1">Gambar {idx + 1}</span>
                    </div>
                  </label>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Submit Buttons */}
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={() => navigate('/freelancer/services')}>
            Batal
          </Button>
          <Button type="submit" disabled={loading || uploading}>
            {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Plus className="w-5 h-5 mr-2" />}
            Tambah Jasa
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateServiceView;