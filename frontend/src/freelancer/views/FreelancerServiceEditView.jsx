import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, X, Loader2, Upload, Image } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Textarea from '../components/ui/Textarea';

const API_BASE_URL = 'http://localhost:5000/api';
const STATIC_URL = 'http://localhost:5000';

const FreelancerServiceEditView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState(null);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    category_id: '',
    title: '',
    description: '',
    thumbnail_url: '',
    thumbnail_file: null,
    status: 'active',
    packages: [
      { package_name: 'basic', description: '', price: '', delivery_days: '', revisions: 2 },
      { package_name: 'standard', description: '', price: '', delivery_days: '', revisions: 4 },
      { package_name: 'premium', description: '', price: '', delivery_days: '', revisions: 999 }
    ],
    gallery: ['', '', '']
  });

  const getFullImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    if (url.startsWith('/')) return `${STATIC_URL}${url}`;
    return `${STATIC_URL}/${url}`;
  };

  useEffect(() => {
    fetchCategories();
    fetchService();
  }, [id]);

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/categories`);
      const data = await res.json();
      if (data.success) setCategories(data.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchService = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/services/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.success) {
        const service = data.data;
        
        const gallery = ['', '', ''];
        if (service.IMAGE_1) gallery[0] = service.IMAGE_1;
        if (service.IMAGE_2) gallery[1] = service.IMAGE_2;
        if (service.IMAGE_3) gallery[2] = service.IMAGE_3;
        
        const packages = [...formData.packages];
        if (service.PACKAGES) {
          service.PACKAGES.forEach(pkg => {
            const idx = packages.findIndex(p => p.package_name === pkg.PACKAGE_NAME);
            if (idx !== -1) {
              packages[idx] = {
                package_name: pkg.PACKAGE_NAME,
                description: pkg.DESCRIPTION || '',
                price: pkg.PRICE,
                delivery_days: pkg.DELIVERY_DAYS,
                revisions: pkg.REVISIONS
              };
            }
          });
        }
        
        setFormData(prev => ({
          ...prev,
          category_id: service.CATEGORY_ID || '',
          title: service.TITLE || '',
          description: service.DESCRIPTION || '',
          thumbnail_url: service.THUMBNAIL_URL || '',
          status: service.STATUS || 'active',
          packages: packages,
          gallery: gallery
        }));
      }
    } catch (error) {
      console.error('Failed to fetch service:', error);
      alert('Gagal memuat data jasa');
    } finally {
      setLoading(false);
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

  // 🔥 API khusus update gallery ke database
  const updateGalleryToDatabase = async (galleryUrls) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/services/${id}/gallery`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ gallery: galleryUrls })
      });
      const data = await res.json();
      console.log('Gallery update to DB response:', data);
      return data.success;
    } catch (error) {
      console.error('Error updating gallery:', error);
      return false;
    }
  };

  // Upload thumbnail
  const handleThumbnailUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 10 * 1024 * 1024) {
      alert('Ukuran file maksimal 10MB');
      return;
    }
    
    const localPreview = URL.createObjectURL(file);
    setFormData(prev => ({ ...prev, thumbnail_url: localPreview, thumbnail_file: file }));
    
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
        URL.revokeObjectURL(localPreview);
        setFormData(prev => ({ 
          ...prev, 
          thumbnail_url: data.data.url, 
          thumbnail_file: null 
        }));
        alert('Thumbnail berhasil diupload!');
      } else {
        alert(data.message || 'Upload gagal');
        setFormData(prev => ({ ...prev, thumbnail_url: '', thumbnail_file: null }));
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Terjadi kesalahan saat upload');
      setFormData(prev => ({ ...prev, thumbnail_url: '', thumbnail_file: null }));
    } finally {
      setUploading(false);
    }
  };

// Upload GALLERY - HANYA UPDATE STATE, TIDAK LANGSUNG KE DATABASE
const handleGalleryUpload = async (e, index) => {
  const file = e.target.files[0];
  if (!file) return;
  
  setUploadingIndex(index);
  
  const formDataUpload = new FormData();
  formDataUpload.append('images', file);
  
  try {
    const token = localStorage.getItem('token');
    
    // Step 1: Upload file
    const uploadRes = await fetch(`${API_BASE_URL}/services/upload-gallery`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formDataUpload
    });
    const uploadData = await uploadRes.json();
    
    if (uploadData.success && uploadData.data.length > 0) {
      const newUrl = uploadData.data[0].url;
      
      // Step 2: Update state SAJA (tidak langsung ke database)
      const newGallery = [...formData.gallery];
      newGallery[index] = newUrl;
      setFormData(prev => ({ ...prev, gallery: newGallery }));
      
      alert(`Gambar ${index + 1} berhasil diupload! Jangan lupa klik Simpan.`);
    } else {
      alert('Upload gagal');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Terjadi kesalahan');
  } finally {
    setUploadingIndex(null);
  }
};

  const removeGalleryImage = (index) => {
    const updatedGallery = [...formData.gallery];
    updatedGallery[index] = '';
    setFormData(prev => ({ ...prev, gallery: updatedGallery }));
    
    // Langsung update ke database setelah hapus
    updateGalleryToDatabase(updatedGallery);
    alert(`Gambar ${index + 1} telah dihapus`);
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (!formData.category_id) {
    alert('Pilih kategori');
    return;
  }
  
  const validPackages = formData.packages.filter(p => p.price && parseInt(p.price) > 0);
  if (validPackages.length === 0) {
    alert('Minimal 1 paket harus diisi');
    return;
  }
  
  // 🔥 KIRIM GALLERY
  const validGallery = formData.gallery.filter(url => url && url.trim() !== '');
  
  console.log('📤 SUBMIT - Gallery to send:', validGallery);
  
  setSaving(true);
  try {
    const token = localStorage.getItem('token');
    const requestBody = {
      category_id: parseInt(formData.category_id),
      title: formData.title,
      description: formData.description,
      thumbnail_url: formData.thumbnail_url || null,
      status: formData.status,
      packages: validPackages.map(p => ({
        package_name: p.package_name,
        description: p.description,
        price: parseInt(p.price),
        delivery_days: parseInt(p.delivery_days),
        revisions: p.revisions === 999 ? 999 : parseInt(p.revisions)
      })),
      gallery: validGallery  // 🔥 KIRIM GALLERY
    };
    
    const res = await fetch(`${API_BASE_URL}/services/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(requestBody)
    });
    const data = await res.json();
    
    if (data.success) {
      alert('Berhasil diupdate!');
      navigate(`/freelancer/service/${id}`);
    } else {
      alert(data.message || 'Gagal update');
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
    <div className="max-w-4xl mx-auto px-4 py-10">
      <button 
        onClick={() => navigate(`/freelancer/service/${id}`)} 
        className="flex items-center text-gray-500 hover:text-emerald-600 mb-6"
      >
        <ArrowLeft className="w-5 h-5 mr-2" /> Kembali ke Detail Jasa
      </button>

      <h1 className="text-3xl font-black text-gray-900 mb-2">Edit Jasa</h1>
      <p className="text-gray-500 mb-8">Perbarui informasi layanan Anda</p>

      <form onSubmit={handleSubmit} className="space-y-6">
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
            <label className="block text-sm font-bold text-gray-700 mb-2">Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value="active">Aktif</option>
              <option value="inactive">Nonaktif</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-bold text-gray-700 mb-2">Deskripsi</label>
            <Textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={5}
              className="w-full"
            />
          </div>

          {/* Thumbnail Upload */}
          <div className="mb-4">
            <label className="block text-sm font-bold text-gray-700 mb-2">Thumbnail</label>
            <div className="flex items-center gap-4">
              {formData.thumbnail_url && !formData.thumbnail_file ? (
                <div className="relative">
                  <img 
                    src={getFullImageUrl(formData.thumbnail_url)}
                    className="w-32 h-32 object-cover rounded-lg border" 
                    alt="thumbnail"
                    onError={(e) => { 
                      e.target.src = 'https://placehold.co/128x128?text=Image+Not+Found';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, thumbnail_url: '', thumbnail_file: null }))}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : formData.thumbnail_file ? (
                <div className="relative">
                  <img 
                    src={URL.createObjectURL(formData.thumbnail_file)} 
                    className="w-32 h-32 object-cover rounded-lg border" 
                    alt="thumbnail preview"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, thumbnail_url: '', thumbnail_file: null }))}
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
                    onChange={handleThumbnailUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                  <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-emerald-400 transition-colors cursor-pointer">
                    {uploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6 text-gray-400" />}
                    <span className="text-xs text-gray-400 mt-1">Upload Thumbnail</span>
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
              <h3 className="font-bold text-gray-900 mb-3 capitalize">Paket {pkg.package_name}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Harga (Rp)</label>
                  <input
                    type="number"
                    value={pkg.price}
                    onChange={(e) => handlePackageChange(idx, 'price', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Estimasi (hari)</label>
                  <input
                    type="number"
                    value={pkg.delivery_days}
                    onChange={(e) => handlePackageChange(idx, 'delivery_days', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Revisi</label>
                  <input
                    type="number"
                    value={pkg.revisions}
                    onChange={(e) => handlePackageChange(idx, 'revisions', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Deskripsi Paket</label>
                  <input
                    type="text"
                    value={pkg.description}
                    onChange={(e) => handlePackageChange(idx, 'description', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none"
                  />
                </div>
              </div>
            </div>
          ))}
        </Card>

        {/* Gallery Upload */}
        <Card className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Galeri</h2>
          <p className="text-sm text-gray-500 mb-2">Upload gambar akan langsung tersimpan</p>
          <div className="grid grid-cols-3 gap-4">
            {[0, 1, 2].map((idx) => (
              <div key={idx} className="relative">
                {formData.gallery[idx] ? (
                  <div className="relative">
                    <img 
                      src={getFullImageUrl(formData.gallery[idx])}
                      className="w-full h-32 object-cover rounded-lg border" 
                      alt={`gallery-${idx}`}
                      onError={(e) => { 
                        e.target.src = 'https://placehold.co/128x128?text=Image+Not+Found';
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => removeGalleryImage(idx)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    {uploadingIndex === idx && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-white" />
                      </div>
                    )}
                  </div>
                ) : (
                  <label className="cursor-pointer block">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleGalleryUpload(e, idx)}
                      className="hidden"
                      disabled={uploadingIndex !== null}
                    />
                    <div className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-emerald-400 transition-colors cursor-pointer">
                      {uploadingIndex === idx ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Image className="w-6 h-6 text-gray-400" />
                      )}
                      <span className="text-xs text-gray-400 mt-1">Gambar {idx + 1}</span>
                    </div>
                  </label>
                )}
              </div>
            ))}
          </div>
        </Card>

        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={() => navigate(`/freelancer/service/${id}`)}>
            Batal
          </Button>
          <Button type="submit" disabled={saving || uploading || uploadingIndex !== null}>
            {saving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
            Simpan Perubahan
          </Button>
        </div>
      </form>
    </div>
  );
};

export default FreelancerServiceEditView;