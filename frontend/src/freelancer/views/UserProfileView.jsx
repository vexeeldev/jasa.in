import React from 'react';
import { Star } from 'lucide-react';
import { DB_FREELANCER_SKILLS, DB_PORTFOLIOS, DB_SERVICES } from '../data/mockDatabase';
import { getUserById, getProfileByUserId, hydrateService, formatCurrency, classNames } from '../data/helpers';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import RatingStars from '../components/ui/RatingStars';

const UserProfileView = ({ navigate, viewParams }) => {
  const profileUserId = viewParams?.id || 1;
  const user          = getUserById(profileUserId);
  const profile       = getProfileByUserId(profileUserId);

  if (!user || !profile) return <div className="p-20 text-center font-bold text-xl text-gray-500">Profile not found.</div>;

  const userSkills   = DB_FREELANCER_SKILLS[profile.profile_id] || [];
  const portfolios   = DB_PORTFOLIOS.filter(p => p.freelancer_id === profile.profile_id);
  const userServices = DB_SERVICES.filter(s => s.freelancer_id === profile.profile_id).map(hydrateService);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col md:flex-row gap-8">

        {/* Sidebar */}
        <div className="w-full md:w-1/3 lg:w-1/4">
          <Card className="text-center sticky top-28">
            <div className="relative inline-block mb-4">
              <Avatar src={user.avatar_url} size="xl" verified={user.is_verified === '1'} />
            </div>
            <h1 className="text-2xl font-black text-gray-900">{user.full_name}</h1>
            <p className="text-gray-500 font-bold mb-4">@{user.username}</p>

            <div className="flex justify-center mb-6">
              <Badge variant={profile.level === 'top' ? 'purple' : 'success'} className="px-3 py-1">
                {profile.level === 'top' ? 'Top Rated Freelancer' : 'Pro Freelancer'}
              </Badge>
            </div>

            <div className="border-t border-gray-100 pt-6 text-left">
              <div className="flex justify-between items-center mb-3 text-sm">
                <span className="text-gray-500 font-bold">Lokasi</span>
                <span className="font-black text-gray-900">{user.location || 'Indonesia'}</span>
              </div>
              <div className="flex justify-between items-center mb-3 text-sm">
                <span className="text-gray-500 font-bold">Bergabung</span>
                <span className="font-black text-gray-900">{new Date(profile.joined_at).getFullYear()}</span>
              </div>
              <div className="flex justify-between items-center mb-3 text-sm">
                <span className="text-gray-500 font-bold">Rating</span>
                <span className="font-black text-gray-900 flex items-center"><Star className="w-3.5 h-3.5 text-yellow-400 fill-current mr-1" /> {profile.rating_avg}</span>
              </div>
            </div>

            <Button fullWidth className="mt-6" onClick={() => navigate('messages')}>Hubungi Saya</Button>
          </Card>
        </div>

        {/* Main Content */}
        <div className="w-full md:w-2/3 lg:w-3/4 space-y-10">

          <Card>
            <h2 className="text-xl font-black text-gray-900 mb-4 pb-2 border-b border-gray-100">Tentang Saya</h2>
            <p className="text-gray-700 leading-relaxed font-medium mb-8 whitespace-pre-line">{profile.bio}</p>

            <h2 className="text-xl font-black text-gray-900 mb-4 pb-2 border-b border-gray-100">Keahlian (Skills)</h2>
            <div className="flex flex-wrap gap-2">
              {userSkills.map((skill, idx) => (
                <span key={idx} className="bg-gray-100 text-gray-700 border border-gray-200 px-4 py-1.5 rounded-full text-sm font-bold">
                  {skill}
                </span>
              ))}
            </div>
          </Card>

          {userServices.length > 0 && (
            <div>
              <h2 className="text-2xl font-black text-gray-900 mb-6">Layanan Saya</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {userServices.map(service => (
                  <div key={service.service_id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all cursor-pointer flex flex-col" onClick={() => navigate('service-detail', { id: service.service_id })}>
                    <div className="h-40 bg-gray-100 overflow-hidden">
                      <img src={service.thumbnail_url} className="w-full h-full object-cover" alt="" />
                    </div>
                    <div className="p-4 flex flex-col flex-grow">
                      <h3 className="font-bold text-gray-900 text-sm mb-2 line-clamp-2">{service.title}</h3>
                      <div className="mt-auto flex justify-between items-center border-t border-gray-100 pt-3">
                        <RatingStars rating={service.seller.rating_avg} count={service.total_orders} />
                        <span className="font-black text-gray-900">{formatCurrency(service.packages.basic?.price || 0)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {portfolios.length > 0 && (
            <div>
              <h2 className="text-2xl font-black text-gray-900 mb-6">Portofolio Pekerjaan</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {portfolios.map(port => (
                  <div key={port.portfolio_id} className="group relative rounded-xl overflow-hidden border border-gray-200 shadow-sm cursor-pointer h-64">
                    <img src={port.image_url} alt={port.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-80 group-hover:opacity-100 transition-opacity"></div>
                    <div className="absolute bottom-0 left-0 p-5 w-full">
                      <h3 className="text-white font-black text-lg mb-1">{port.title}</h3>
                      <p className="text-gray-300 text-sm font-medium line-clamp-2">{port.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfileView;