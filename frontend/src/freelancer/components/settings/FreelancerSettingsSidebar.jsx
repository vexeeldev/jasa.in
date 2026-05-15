import React from 'react';
import { User, Shield, CreditCard, Camera } from 'lucide-react';
import Avatar from '../ui/Avatar';

const FreelancerSettingsSidebar = ({ activeTab, setActiveTab, user, onUploadAvatar }) => {
  const getFullImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `http://localhost:5000${url}`;
  };

  const menuItems = [
    { id: 'profile', label: 'Profil', icon: User },
    { id: 'security', label: 'Keamanan', icon: Shield },
    { id: 'billing', label: 'Tagihan', icon: CreditCard },
  ];

  return (
    <div className="w-full md:w-72 bg-gray-50 border-r border-gray-200 p-6">
      <div className="text-center mb-6">
        <div className="relative inline-block">
          <Avatar 
            src={getFullImageUrl(user?.avatar_url)} 
            size="lg" 
            className="border-4 border-white shadow-md"
          />
          <button
            onClick={onUploadAvatar}
            className="absolute bottom-0 right-0 bg-emerald-500 hover:bg-emerald-600 text-white p-1.5 rounded-full shadow-md transition-colors"
          >
            <Camera className="w-3 h-3" />
          </button>
        </div>
        <h3 className="font-bold text-gray-900 mt-3">{user?.full_name || 'Pengguna'}</h3>
        <p className="text-xs text-gray-500">@{user?.username}</p>
      </div>
      
      <nav className="space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === item.id
                  ? 'bg-emerald-50 text-emerald-600'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default FreelancerSettingsSidebar;