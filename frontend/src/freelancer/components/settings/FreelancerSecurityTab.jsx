import React, { useState } from 'react';
import { Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';

const FreelancerSecurityTab = ({ onChangePassword, saving }) => {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear error for this field
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Password lama wajib diisi';
    }
    if (!formData.newPassword) {
      newErrors.newPassword = 'Password baru wajib diisi';
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = 'Password baru minimal 6 karakter';
    }
    if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Konfirmasi password tidak cocok';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onChangePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });
      // Reset form after submit
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-black text-gray-900 mb-1">Keamanan Akun</h2>
        <p className="text-sm text-gray-500">Perbarui password untuk menjaga keamanan akun Anda</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Password Lama</label>
          <div className="relative">
            <input
              type={showCurrentPassword ? 'text' : 'password'}
              name="currentPassword"
              value={formData.currentPassword}
              autocomplete="one-time-code"
              onChange={handleChange}
              placeholder="Masukkan password lama"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none ${errors.currentPassword ? 'border-red-500' : 'border-gray-300'}`}
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.currentPassword && <p className="text-xs text-red-500 mt-1">{errors.currentPassword}</p>}
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Password Baru</label>
          <div className="relative">
            <input
              type={showNewPassword ? 'text' : 'password'}
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              placeholder="Minimal 6 karakter"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none ${errors.newPassword ? 'border-red-500' : 'border-gray-300'}`}
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.newPassword && <p className="text-xs text-red-500 mt-1">{errors.newPassword}</p>}
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Konfirmasi Password Baru</label>
          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Ulangi password baru"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'}`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword}</p>}
        </div>

        <div className="pt-4 border-t border-gray-200">
          <Button type="submit" disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
            Ganti Password
          </Button>
        </div>
      </form>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
        <h4 className="font-bold text-blue-800 text-sm mb-2">Tips Keamanan:</h4>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• Gunakan password yang kuat (minimal 8 karakter, kombinasi huruf, angka, dan simbol)</li>
          <li>• Jangan gunakan password yang sama dengan akun lain</li>
          <li>• Jangan pernah memberitahukan password kepada siapapun</li>
        </ul>
      </div>
    </div>
  );
};

export default FreelancerSecurityTab;