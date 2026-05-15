import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, CreditCard, X, Bell, MapPin, Globe, Shield, Smartphone, Mail, Key, Eye, EyeOff, Save, Loader2, Plus, Trash2 } from 'lucide-react';
import Card from '../components/ui/Card';
import Avatar from '../components/ui/Avatar';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { classNames } from '../data/helpers';

const API_BASE_URL = 'http://localhost:5000/api';
const STATIC_URL = 'http://localhost:5000';

const ClientSettingsView = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [billingMethods, setBillingMethods] = useState([]);
  const [showAddBilling, setShowAddBilling] = useState(false);
  const [newBilling, setNewBilling] = useState({
    bank_name: '',
    account_number: '',
    account_name: '',
    is_default: false
  });
  
  // Form states
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    province: '',
    postalCode: '',
    notificationEmail: true,
    notificationWhatsapp: true,
    notificationPromo: false
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const getFullImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${STATIC_URL}${url}`;
  };

  // Fetch user profile
  useEffect(() => {
    fetchUserProfile();
    fetchBillingMethods();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/users/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        const user = data.data;
        setCurrentUser(user);
        setFormData({
          fullName: user.full_name || '',
          username: user.username || '',
          email: user.email || '',
          phone: user.phone || '',
          address: user.address || '',
          city: user.city || '',
          province: user.province || '',
          postalCode: user.postal_code || '',
          notificationEmail: user.notification_email !== false,
          notificationWhatsapp: user.notification_whatsapp !== false,
          notificationPromo: user.notification_promo || false
        });
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBillingMethods = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/users/billing`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setBillingMethods(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch billing methods:', error);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value
    });
  };

  const handleCheckboxChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.checked
    });
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          full_name: formData.fullName,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          province: formData.province,
          postal_code: formData.postalCode
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('Profil berhasil diperbarui!');
        fetchUserProfile();
        window.dispatchEvent(new Event('userUpdated'));
      } else {
        alert(data.message || 'Gagal update profil');
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Terjadi kesalahan');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/users/notifications`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          notification_email: formData.notificationEmail,
          notification_whatsapp: formData.notificationWhatsapp,
          notification_promo: formData.notificationPromo
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('Preferensi notifikasi berhasil disimpan!');
      } else {
        alert(data.message || 'Gagal menyimpan preferensi');
      }
    } catch (error) {
      console.error('Failed to save notifications:', error);
      alert('Terjadi kesalahan');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Password baru tidak cocok!');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      alert('Password minimal 6 karakter!');
      return;
    }
    
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          current_password: passwordData.currentPassword,
          new_password: passwordData.newPassword
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('Password berhasil diubah!');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        alert(data.message || 'Gagal mengubah password');
      }
    } catch (error) {
      console.error('Failed to change password:', error);
      alert('Terjadi kesalahan');
    } finally {
      setSaving(false);
    }
  };

  const handleUploadAvatar = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const formDataUpload = new FormData();
    formDataUpload.append('avatar', file);
    
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/users/avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataUpload
      });
      const data = await res.json();
      if (data.success) {
        alert('Avatar berhasil diupdate!');
        fetchUserProfile();
        window.dispatchEvent(new Event('userUpdated'));
      } else {
        alert(data.message || 'Gagal upload avatar');
      }
    } catch (error) {
      console.error('Failed to upload avatar:', error);
      alert('Terjadi kesalahan');
    } finally {
      setSaving(false);
    }
  };

  const triggerFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleAddBilling = async () => {
    if (!newBilling.bank_name || !newBilling.account_number || !newBilling.account_name) {
      alert('Data tidak lengkap');
      return;
    }
    
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/users/billing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newBilling)
      });
      const data = await res.json();
      if (data.success) {
        alert('Metode pembayaran berhasil ditambahkan!');
        setShowAddBilling(false);
        setNewBilling({ bank_name: '', account_number: '', account_name: '', is_default: false });
        fetchBillingMethods();
      } else {
        alert(data.message || 'Gagal menambah metode pembayaran');
      }
    } catch (error) {
      console.error('Failed to add billing:', error);
      alert('Terjadi kesalahan');
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefaultBilling = async (id) => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/users/billing/${id}/default`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        alert('Metode pembayaran default berhasil diubah!');
        fetchBillingMethods();
      } else {
        alert(data.message || 'Gagal mengubah default');
      }
    } catch (error) {
      console.error('Failed to set default billing:', error);
      alert('Terjadi kesalahan');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBilling = async (id) => {
    if (!confirm('Hapus metode pembayaran ini?')) return;
    
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/users/billing/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        alert('Metode pembayaran berhasil dihapus!');
        fetchBillingMethods();
      } else {
        alert(data.message || 'Gagal menghapus');
      }
    } catch (error) {
      console.error('Failed to delete billing:', error);
      alert('Terjadi kesalahan');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profil Saya', icon: User },
    { id: 'security', label: 'Keamanan', icon: Lock },
    { id: 'notifications', label: 'Notifikasi', icon: Bell },
    { id: 'billing', label: 'Pembayaran', icon: CreditCard }
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 bg-gray-50 min-h-screen">
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
        onChange={handleUploadAvatar}
        className="hidden"
      />

      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900">Pengaturan Akun</h1>
        <p className="text-gray-500 font-medium mt-1">Kelola profil, keamanan, dan preferensi akun Anda</p>
      </div>

      <Card noPadding className="overflow-hidden shadow-xl border-0">
        <div className="flex flex-col md:flex-row">
          
          {/* Sidebar */}
          <div className="w-full md:w-72 bg-gradient-to-b from-gray-50 to-white border-r border-gray-200">
            <div className="p-5 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="relative cursor-pointer group" onClick={triggerFileUpload}>
                  <Avatar src={getFullImageUrl(currentUser?.avatar_url)} size="lg" />
                  <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="font-black text-gray-900">{formData.fullName || currentUser?.full_name}</h3>
                  <p className="text-xs text-gray-500">@{formData.username || currentUser?.username}</p>
                  <Badge variant="info" className="mt-1 text-[10px]">Client</Badge>
                </div>
              </div>
            </div>
            
            <nav className="p-3 space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={classNames(
                      "w-full flex items-center px-4 py-3 text-sm font-bold rounded-xl transition-all",
                      activeTab === tab.id 
                        ? "bg-emerald-50 text-emerald-700 shadow-sm" 
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    )}
                  >
                    <Icon className={classNames(
                      "w-5 h-5 mr-3",
                      activeTab === tab.id ? "text-emerald-600" : "text-gray-400"
                    )} />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 sm:p-8 bg-white">
            
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-xl font-black text-gray-900 mb-1">Profil Saya</h2>
                  <p className="text-sm text-gray-500">Perbarui informasi pribadi Anda</p>
                </div>

                {/* Avatar Section */}
                <div className="flex flex-col sm:flex-row items-center mb-8 pb-6 border-b border-gray-100">
                  <div className="relative cursor-pointer group" onClick={triggerFileUpload}>
                    <Avatar src={getFullImageUrl(currentUser?.avatar_url)} size="xl" />
                    <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Camera className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="text-center sm:text-left sm:ml-6 mt-4 sm:mt-0">
                    <div className="flex gap-2">
                      <Button variant="secondary" size="sm" className="font-bold" onClick={triggerFileUpload} disabled={saving}>
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Unggah Foto Baru'}
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">Hapus</Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Format JPG atau PNG. Maks 2MB. Klik foto untuk ganti</p>
                  </div>
                </div>

                {/* Personal Info */}
                <h3 className="font-black text-gray-900 text-lg mb-4 flex items-center">
                  <User className="w-5 h-5 mr-2 text-emerald-500" />
                  Informasi Pribadi
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
                  <Input 
                    label="Nama Lengkap" 
                    id="fullName" 
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="Nama lengkap Anda"
                  />
                  <Input 
                    label="Username" 
                    id="username" 
                    value={formData.username}
                    disabled 
                    helperText="Username tidak dapat diubah"
                  />
                  <Input 
                    label="Email" 
                    id="email" 
                    type="email" 
                    value={formData.email}
                    disabled
                  />
                  <Input 
                    label="Nomor Telepon" 
                    id="phone" 
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="08123456789"
                  />
                </div>

                {/* Address Info */}
                <h3 className="font-black text-gray-900 text-lg mb-4 flex items-center">
                  <MapPin className="w-5 h-5 mr-2 text-emerald-500" />
                  Alamat
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
                  <Input 
                    label="Alamat" 
                    id="address" 
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Nama jalan, gedung, dll"
                  />
                  <Input 
                    label="Kota" 
                    id="city" 
                    value={formData.city}
                    onChange={handleInputChange}
                  />
                  <Input 
                    label="Provinsi" 
                    id="province" 
                    value={formData.province}
                    onChange={handleInputChange}
                  />
                  <Input 
                    label="Kode Pos" 
                    id="postalCode" 
                    value={formData.postalCode}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end gap-3">
                  <Button variant="ghost" onClick={() => fetchUserProfile()}>Batal</Button>
                  <Button onClick={handleSaveProfile} disabled={saving}>
                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                    Simpan Perubahan
                  </Button>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-xl font-black text-gray-900 mb-1">Keamanan Akun</h2>
                  <p className="text-sm text-gray-500">Jaga keamanan akun Anda</p>
                </div>

                <div className="mb-8 p-5 bg-gray-50 rounded-xl">
                  <h3 className="font-black text-gray-900 mb-4 flex items-center">
                    <Key className="w-5 h-5 mr-2 text-emerald-500" />
                    Ubah Password
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Password Saat Ini
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                          placeholder="Masukkan password saat ini"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Password Baru
                      </label>
                      <input
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                        placeholder="Minimal 6 karakter"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Konfirmasi Password Baru
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                          placeholder="Ketik ulang password baru"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                        >
                          {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <Button onClick={handleChangePassword} disabled={saving}>
                      {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Ubah Password
                    </Button>
                  </div>
                </div>

                <div className="p-5 bg-gray-50 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-black text-gray-900 flex items-center">
                        <Shield className="w-5 h-5 mr-2 text-emerald-500" />
                        Verifikasi Dua Langkah (2FA)
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Tingkatkan keamanan akun Anda dengan verifikasi dua langkah
                      </p>
                    </div>
                    <Badge variant="info">Segera Hadir</Badge>
                  </div>
                </div>

                <div className="mt-6 p-5 bg-red-50 rounded-xl border border-red-100">
                  <h3 className="font-black text-gray-900 mb-2">Keluar dari Semua Perangkat</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Keluar dari semua perangkat yang pernah login ke akun ini
                  </p>
                  <Button variant="danger" size="sm">
                    Keluar dari Semua Perangkat
                  </Button>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-xl font-black text-gray-900 mb-1">Preferensi Notifikasi</h2>
                  <p className="text-sm text-gray-500">Atur notifikasi yang ingin Anda terima</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="font-bold text-gray-900">Notifikasi Email</p>
                        <p className="text-xs text-gray-500">Pembaruan pesanan, pesan, dan promo</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        id="notificationEmail"
                        checked={formData.notificationEmail}
                        onChange={handleCheckboxChange}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-emerald-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Smartphone className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="font-bold text-gray-900">Notifikasi WhatsApp</p>
                        <p className="text-xs text-gray-500">Status pesanan dan update penting</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        id="notificationWhatsapp"
                        checked={formData.notificationWhatsapp}
                        onChange={handleCheckboxChange}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-emerald-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Globe className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="font-bold text-gray-900">Promo & Penawaran</p>
                        <p className="text-xs text-gray-500">Diskon khusus dan penawaran menarik</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        id="notificationPromo"
                        checked={formData.notificationPromo}
                        onChange={handleCheckboxChange}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-emerald-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                    </label>
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-gray-200 flex justify-end">
                  <Button onClick={handleSaveNotifications} disabled={saving}>
                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                    Simpan Preferensi
                  </Button>
                </div>
              </div>
            )}

            {/* Billing Tab */}
            {activeTab === 'billing' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-xl font-black text-gray-900 mb-1">Metode Pembayaran</h2>
                  <p className="text-sm text-gray-500">Kelola metode pembayaran untuk transaksi Anda</p>
                </div>

                <div className="space-y-3 mb-6">
                  {billingMethods.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-xl">
                      <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">Belum ada metode pembayaran</p>
                    </div>
                  ) : (
                    billingMethods.map((method) => (
                      <div key={method.PAYMENT_METHOD_ID} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-8 bg-blue-600 rounded flex items-center justify-center text-white text-xs font-bold">
                            {method.BANK_NAME?.substring(0, 3)}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{method.BANK_NAME}</p>
                            <p className="text-xs text-gray-500">****{method.ACCOUNT_NUMBER?.slice(-4)}</p>
                            <p className="text-xs text-gray-400">{method.ACCOUNT_NAME}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {method.IS_DEFAULT === 1 && (
                            <Badge variant="success">Default</Badge>
                          )}
                          {method.IS_DEFAULT !== 1 && (
                            <Button variant="ghost" size="sm" onClick={() => handleSetDefaultBilling(method.PAYMENT_METHOD_ID)}>
                              Set Default
                            </Button>
                          )}
                          <button
                            onClick={() => handleDeleteBilling(method.PAYMENT_METHOD_ID)}
                            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {showAddBilling ? (
                  <div className="border border-gray-200 rounded-xl p-5 mb-4">
                    <h4 className="font-bold text-gray-900 mb-4">Tambah Metode Pembayaran</h4>
                    <div className="space-y-3">
                      <select
                        value={newBilling.bank_name}
                        onChange={(e) => setNewBilling({...newBilling, bank_name: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                      >
                        <option value="">Pilih Bank</option>
                        <option value="BCA">BCA</option>
                        <option value="Mandiri">Mandiri</option>
                        <option value="BNI">BNI</option>
                        <option value="BRI">BRI</option>
                        <option value="Permata">Permata</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Nomor Rekening"
                        value={newBilling.account_number}
                        onChange={(e) => setNewBilling({...newBilling, account_number: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Nama Pemilik Rekening"
                        value={newBilling.account_name}
                        onChange={(e) => setNewBilling({...newBilling, account_name: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={newBilling.is_default}
                          onChange={(e) => setNewBilling({...newBilling, is_default: e.target.checked})}
                        />
                        <span className="text-sm text-gray-700">Jadikan metode pembayaran default</span>
                      </label>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button onClick={handleAddBilling} disabled={saving}>
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Simpan'}
                      </Button>
                      <Button variant="ghost" onClick={() => setShowAddBilling(false)}>Batal</Button>
                    </div>
                  </div>
                ) : (
                  <Button variant="outline" className="w-full" onClick={() => setShowAddBilling(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Tambah Metode Pembayaran Baru
                  </Button>
                )}

                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h3 className="font-black text-gray-900 mb-3">Riwayat Transaksi</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Lihat semua riwayat pembayaran dan tagihan Anda
                  </p>
                  <Button variant="secondary" onClick={() => navigate('/client/wallet')}>
                    Lihat Riwayat Transaksi
                  </Button>
                </div>
              </div>
            )}

          </div>
        </div>
      </Card>
    </div>
  );
};

const Badge = ({ variant, children, className }) => {
  const variants = {
    info: 'bg-blue-100 text-blue-700',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-yellow-100 text-yellow-700'
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${variants[variant] || variants.info} ${className || ''}`}>
      {children}
    </span>
  );
};

// Tambahkan Camera icon jika belum ada
const Camera = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

export default ClientSettingsView;