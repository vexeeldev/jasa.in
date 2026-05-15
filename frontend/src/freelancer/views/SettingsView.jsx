import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import Card from '../components/ui/Card';
import FreelancerSettingsSidebar from '../components/settings/FreelancerSettingsSidebar';
import FreelancerProfileTab from '../components/settings/FreelancerProfileTab';
import FreelancerSecurityTab from '../components/settings/FreelancerSecurityTab';
import FreelancerBillingTab from '../components/settings/FreelancerBillingTab';

const API_BASE_URL = 'http://localhost:5000/api';

const FreelancerSettingsView = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [skills, setSkills] = useState([]);

  useEffect(() => {
    fetchProfile();
    fetchSkills();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/users/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSkills = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/skills/my/skills`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setSkills(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch skills:', error);
    }
  };

  const handleUpdateProfile = async (formData) => {
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
          bio: formData.bio
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('Profil berhasil diperbarui!');
        fetchProfile();
        window.dispatchEvent(new Event('userUpdated'));
      } else {
        alert(data.message || 'Gagal update profil');
      }
    } catch (error) {
      alert('Terjadi kesalahan');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (passwordData) => {
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
      } else {
        alert(data.message || 'Gagal mengubah password');
      }
    } catch (error) {
      alert('Terjadi kesalahan');
    } finally {
      setSaving(false);
    }
  };

  const handleAddSkill = async (skillName) => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/skills/my/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ skill_name: skillName })
      });
      const data = await res.json();
      if (data.success) {
        fetchSkills();
      } else {
        alert(data.message || 'Gagal menambah skill');
      }
    } catch (error) {
      alert('Terjadi kesalahan');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveSkill = async (skillId) => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/skills/my/remove/${skillId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        fetchSkills();
      } else {
        alert(data.message || 'Gagal menghapus skill');
      }
    } catch (error) {
      alert('Terjadi kesalahan');
    } finally {
      setSaving(false);
    }
  };

  const handleUploadAvatar = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('avatar', file);
    
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/users/avatar`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        alert('Avatar berhasil diupdate!');
        fetchProfile();
      } else {
        alert(data.message || 'Gagal upload avatar');
      }
    } catch (error) {
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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900">Pengaturan Akun</h1>
        <p className="text-gray-500 font-medium mt-1">Kelola profil, keamanan, dan preferensi akun Anda</p>
      </div>

      <Card noPadding className="overflow-hidden shadow-xl border-0">
        <div className="flex flex-col md:flex-row">
          <FreelancerSettingsSidebar activeTab={activeTab} setActiveTab={setActiveTab} user={user} />
          
          <div className="flex-1 p-6 sm:p-8 bg-white">
            {activeTab === 'profile' && (
              <FreelancerProfileTab
                user={user}
                skills={skills}
                onUpdate={handleUpdateProfile}
                onAddSkill={handleAddSkill}
                onRemoveSkill={handleRemoveSkill}
                onUploadAvatar={handleUploadAvatar}
                saving={saving}
              />
            )}
            {activeTab === 'security' && (
              <FreelancerSecurityTab onChangePassword={handleChangePassword} saving={saving} />
            )}
            {activeTab === 'billing' && (
              <FreelancerBillingTab />
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default FreelancerSettingsView;