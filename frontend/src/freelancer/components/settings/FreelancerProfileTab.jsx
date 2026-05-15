import React, { useState } from 'react';
import { User, FileText, Award, Save, Loader2, X, Camera } from 'lucide-react';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';

const STATIC_URL = 'http://localhost:5000';

const FreelancerProfileTab = ({ user, skills, onUpdate, onAddSkill, onRemoveSkill, onUploadAvatar, saving }) => {
  const [formData, setFormData] = useState({
    fullName: user?.full_name || '',
    phone: user?.phone || '',
    bio: user?.bio || user?.freelancer?.bio || ''
  });
  const [newSkill, setNewSkill] = useState('');

  const getFullImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${STATIC_URL}${url}`;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = () => {
    onUpdate(formData);
  };

  const handleAddSkill = () => {
    if (newSkill.trim()) {
      onAddSkill(newSkill);
      setNewSkill('');
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-black text-gray-900 mb-1">Profil Freelancer</h2>
        <p className="text-sm text-gray-500">Perbarui informasi publik Anda</p>
      </div>

      {/* Avatar */}
      <div className="flex flex-col sm:flex-row items-center mb-8 pb-6 border-b border-gray-100">
        <div className="relative">
          <Avatar 
            src={getFullImageUrl(user?.avatar_url)} 
            size="xl" 
            className="border-4 border-white shadow-md"
          />
          <label className="absolute bottom-0 right-0 bg-emerald-500 hover:bg-emerald-600 text-white p-2 rounded-full shadow-md cursor-pointer transition-colors">
            <Camera className="w-4 h-4" />
            <input 
              type="file" 
              accept="image/*" 
              onChange={onUploadAvatar} 
              className="hidden" 
              disabled={saving}
            />
          </label>
        </div>
        <div className="text-center sm:text-left sm:ml-6 mt-4 sm:mt-0">
          <p className="text-xs text-gray-500">Format JPG atau PNG. Maks 2MB.</p>
          <p className="text-xs text-gray-400">Klik ikon kamera untuk ganti foto</p>
        </div>
      </div>

      {/* Informasi Akun */}
      <h3 className="font-black text-gray-900 text-lg mb-4 flex items-center">
        <User className="w-5 h-5 mr-2 text-emerald-500" />
        Informasi Akun
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Nama Lengkap</label>
          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Username</label>
          <input
            type="text"
            value={user?.username || ''}
            disabled
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={user?.email || ''}
            disabled
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Nomor Telepon</label>
          <input
            type="text"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="08123456789"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>
      </div>

      {/* Bio */}
      <h3 className="font-black text-gray-900 text-lg mb-4 flex items-center">
        <FileText className="w-5 h-5 mr-2 text-emerald-500" />
        Bio Profil
      </h3>
      <textarea
        name="bio"
        rows={5}
        value={formData.bio}
        onChange={handleChange}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none mb-8"
        placeholder="Ceritakan tentang diri Anda, keahlian, dan pengalaman..."
      />

      {/* Skills */}
      <h3 className="font-black text-gray-900 text-lg mb-4 flex items-center">
        <Award className="w-5 h-5 mr-2 text-emerald-500" />
        Keahlian (Skills)
      </h3>
      <div className="flex flex-wrap gap-2 mb-3">
        {skills && skills.length > 0 ? (
          skills.map((skill) => (
            <span key={skill.SKILL_ID} className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-full text-sm font-bold flex items-center gap-2">
              {skill.NAME}
              <button 
                onClick={() => onRemoveSkill(skill.SKILL_ID)} 
                className="text-emerald-400 hover:text-red-500 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))
        ) : (
          <p className="text-sm text-gray-400">Belum ada skill yang ditambahkan</p>
        )}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={newSkill}
          onChange={(e) => setNewSkill(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
          placeholder="Tambahkan skill baru..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
        />
        <Button onClick={handleAddSkill} disabled={saving || !newSkill.trim()}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Tambah'}
        </Button>
      </div>

      {/* Save Button */}
      <div className="mt-8 pt-4 border-t border-gray-200 flex justify-end">
        <Button onClick={handleSubmit} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Simpan Perubahan
        </Button>
      </div>
    </div>
  );
};

export default FreelancerProfileTab;