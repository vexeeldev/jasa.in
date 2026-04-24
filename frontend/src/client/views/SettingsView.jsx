import React, { useState } from 'react';
import { User, Lock, CreditCard, X, Bell, MapPin, Globe, Shield, Smartphone, Mail, Key, Eye, EyeOff, Save } from 'lucide-react';
import Card from '../components/ui/Card';
import Avatar from '../components/ui/Avatar';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { DB_USERS } from '../data/mockDatabase';
import { classNames } from '../data/helpers';

const ClientSettingsView = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Mock current user - client
  const currentUser = DB_USERS.find(u => u.role === 'client') || DB_USERS[0];
  
  // Form states
  const [formData, setFormData] = useState({
    fullName: currentUser?.full_name || 'Sarah Client',
    username: currentUser?.username || 'sarah_client',
    email: currentUser?.email || 'sarah@example.com',
    phone: currentUser?.phone || '08123456789',
    address: 'Jl. Sudirman No. 123, Jakarta Selatan',
    city: 'Jakarta Selatan',
    province: 'DKI Jakarta',
    postalCode: '12190',
    notificationEmail: true,
    notificationWhatsapp: true,
    notificationPromo: false
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

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

  const handleSaveProfile = () => {
    // TODO: API call to update profile
    alert('Profil berhasil diperbarui!');
  };

  const handleChangePassword = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Password baru tidak cocok!');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      alert('Password minimal 6 karakter!');
      return;
    }
    // TODO: API call to change password
    alert('Password berhasil diubah!');
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const tabs = [
    { id: 'profile', label: 'Profil Saya', icon: User },
    { id: 'security', label: 'Keamanan', icon: Lock },
    { id: 'notifications', label: 'Notifikasi', icon: Bell },
    { id: 'billing', label: 'Pembayaran', icon: CreditCard }
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 bg-gray-50 min-h-screen">
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900">Pengaturan Akun</h1>
        <p className="text-gray-500 font-medium mt-1">Kelola profil, keamanan, dan preferensi akun Anda</p>
      </div>

      <Card noPadding className="overflow-hidden shadow-xl border-0">
        <div className="flex flex-col md:flex-row">
          
          {/* Settings Sidebar - Client Version */}
          <div className="w-full md:w-72 bg-gradient-to-b from-gray-50 to-white border-r border-gray-200">
            <div className="p-5 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <Avatar src={currentUser?.avatar_url} size="lg" />
                <div>
                  <h3 className="font-black text-gray-900">{formData.fullName}</h3>
                  <p className="text-xs text-gray-500">@{formData.username}</p>
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

          {/* Settings Content */}
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
                  <Avatar src={currentUser?.avatar_url} size="xl" />
                  <div className="text-center sm:text-left sm:ml-6 mt-4 sm:mt-0">
                    <div className="flex gap-2">
                      <Button variant="secondary" size="sm" className="font-bold">Unggah Foto Baru</Button>
                      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">Hapus</Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Format JPG atau PNG. Maks 2MB.</p>
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
                    onChange={handleInputChange}
                    disabled 
                    helperText="Username tidak dapat diubah"
                  />
                  <Input 
                    label="Email" 
                    id="email" 
                    type="email" 
                    value={formData.email}
                    onChange={handleInputChange}
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

                {/* Address Info - khusus client */}
                <h3 className="font-black text-gray-900 text-lg mb-4 flex items-center mt-6">
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
                  <Button variant="ghost">Batal</Button>
                  <Button onClick={handleSaveProfile} icon={Save}>
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

                {/* Change Password */}
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
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
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
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                        placeholder="Minimal 6 karakter"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Konfirmasi Password Baru
                      </label>
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                        placeholder="Ketik ulang password baru"
                      />
                    </div>

                    <Button onClick={handleChangePassword} className="mt-2">
                      Ubah Password
                    </Button>
                  </div>
                </div>

                {/* Two Factor Authentication - Coming Soon */}
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

                {/* Session Management */}
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
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
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
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
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
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-gray-200 flex justify-end">
                  <Button onClick={() => alert('Preferensi notifikasi disimpan!')}>
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

                {/* Saved Payment Methods */}
                <div className="space-y-3 mb-8">
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-8 bg-blue-600 rounded flex items-center justify-center text-white text-xs font-bold">BCA</div>
                      <div>
                        <p className="font-bold text-gray-900">Bank Central Asia</p>
                        <p className="text-xs text-gray-500">****1234</p>
                      </div>
                    </div>
                    <Badge variant="success">Default</Badge>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-8 bg-red-600 rounded flex items-center justify-center text-white text-xs font-bold">MDR</div>
                      <div>
                        <p className="font-bold text-gray-900">Bank Mandiri</p>
                        <p className="text-xs text-gray-500">****5678</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">Set Default</Button>
                  </div>
                </div>

                <Button variant="outline" className="w-full">
                  + Tambah Metode Pembayaran Baru
                </Button>

                {/* Transaction History Link */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h3 className="font-black text-gray-900 mb-3">Riwayat Transaksi</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Lihat semua riwayat pembayaran dan tagihan Anda
                  </p>
                  <Button variant="secondary" onClick={() => window.location.href = '/client/wallet'}>
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

// Badge component for client settings
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

export default ClientSettingsView;