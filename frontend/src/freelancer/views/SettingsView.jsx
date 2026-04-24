import React from 'react';
import { User, Lock, CreditCard, X } from 'lucide-react';
// Sesuaikan path import dengan struktur UI components kamu
import Card from '../components/ui/Card';
import Avatar from '../components/ui/Avatar';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Textarea from '../components/ui/Textarea';
// Import mock data
import { DB_USERS, DB_FREELANCER_PROFILES, DB_FREELANCER_SKILLS } from '../data/mockDatabase';

const SettingsView = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900">Pengaturan Akun</h1>
        <p className="text-gray-500 font-medium mt-1">Perbarui profil publik, data diri, dan keamanan akun Anda.</p>
      </div>

      <Card noPadding className="overflow-hidden shadow-lg border-gray-200">
        <div className="flex flex-col md:flex-row">

          {/* Settings Sidebar */}
          <div className="w-full md:w-64 bg-gray-50 border-r border-gray-200">
            <nav className="p-4 space-y-2">
              <button className="w-full flex items-center px-4 py-3 text-sm font-bold rounded-lg bg-emerald-50 text-emerald-700 shadow-sm">
                <User className="w-5 h-5 mr-3" /> Data Publik & Bio
              </button>
              <button className="w-full flex items-center px-4 py-3 text-sm font-bold rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors">
                <Lock className="w-5 h-5 mr-3 text-gray-400" /> Keamanan Akun
              </button>
              <button className="w-full flex items-center px-4 py-3 text-sm font-bold rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors">
                <CreditCard className="w-5 h-5 mr-3 text-gray-400" /> Penagihan & Pajak
              </button>
            </nav>
          </div>

          {/* Settings Content */}
          <div className="flex-1 p-6 sm:p-10 bg-white">

            {/* Avatar Row */}
            <div className="flex flex-col sm:flex-row items-center mb-10 pb-10 border-b border-gray-100">
              <Avatar src={DB_USERS[0].avatar_url} size="xl" />
              <div className="text-center sm:text-left sm:ml-8 mt-4 sm:mt-0">
                <Button variant="secondary" size="sm" className="mb-2 font-bold shadow-sm">Unggah Foto Baru</Button>
                <p className="text-xs text-gray-500 font-medium">Format JPG atau PNG. Maks 2MB.</p>
              </div>
            </div>

            <h3 className="font-black text-gray-900 text-lg mb-6">Informasi Akun (Tabel: USERS)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
              <Input label="Nama Lengkap"   id="fullname" defaultValue={DB_USERS[0].full_name} />
              <Input label="Username"       id="username" defaultValue={DB_USERS[0].username}  disabled />
              <Input label="Email"          id="email"    type="email" defaultValue={DB_USERS[0].email} disabled />
              <Input label="Nomor Telepon"  id="phone"    defaultValue={DB_USERS[0].phone} />
            </div>

            <h3 className="font-black text-gray-900 text-lg mb-6">Profil Freelancer (Tabel: FREELANCER_PROFILES)</h3>
            <Textarea
              label="Bio / Deskripsi Profil"
              id="bio"
              rows={6}
              defaultValue={DB_FREELANCER_PROFILES[0].bio}
              className="mb-8"
            />

            <div className="mb-10">
              <label className="block text-sm font-bold text-gray-700 mb-3">Keahlian (Skills)</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {DB_FREELANCER_SKILLS[101].map((skill, idx) => (
                  <span key={idx} className="bg-gray-100 text-gray-800 px-4 py-1.5 rounded-full text-sm font-bold flex items-center border border-gray-200">
                    {skill} <button className="ml-2 text-gray-400 hover:text-red-500"><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
              <div className="flex">
                <input type="text" placeholder="Tambahkan skill baru..." className="block w-full sm:w-64 rounded-l-lg border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm px-4 py-2.5 border-y border-l outline-none font-medium text-gray-900" />
                <button className="bg-gray-900 text-white rounded-r-lg px-6 hover:bg-gray-800 transition-colors text-sm font-bold shadow-sm">Tambah</button>
              </div>
            </div>

            <div className="mt-10 pt-6 border-t border-gray-200 flex justify-end gap-4">
              <Button variant="ghost">Batal</Button>
              <Button size="lg" className="px-8 shadow-md">Simpan Perubahan</Button>
            </div>

          </div>
        </div>
      </Card>
    </div>
  );
};

export default SettingsView;