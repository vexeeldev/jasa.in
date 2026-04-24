import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Briefcase } from 'lucide-react';
import { useAuth } from '../App';
import { authAPI } from './api';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors.form) setErrors({});
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    try {
      const response = await authAPI.login({
        email: formData.email,
        password: formData.password
      });

      const { success, data, message } = response.data;

      if (success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        login(data.user);
        
        // Normalisasi role (support 'client' dan 'klien')
        const userRole = (data.user.ROLE || data.user.role || '').toLowerCase();
        
        if (userRole === 'client' || userRole === 'klien') {
          navigate('/client/dashboard');
        } else {
          navigate('/');
        }
      } else {
        setErrors({ form: message || 'Login gagal' });
      }
      
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Terjadi kesalahan koneksi ke server';
      setErrors({ form: errorMsg });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row font-sans overflow-hidden">
      {/* KIRI: BRANDING */}
      <div
        className="hidden md:flex md:w-1/2 relative flex-col justify-between p-12 text-white bg-emerald-900"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=2071')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-emerald-950 via-emerald-900/60 to-transparent z-0" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Briefcase className="text-white" size={28} />
            </div>
            <h1 className="text-5xl font-black tracking-tight">
              <span className="text-white">Jasa</span>
              <span className="text-emerald-400">.in</span>
            </h1>
          </div>
          <p className="text-emerald-50 text-lg font-medium ml-1">
            Marketplace Freelance Terpercaya Indonesia.
          </p>
        </div>

        <div className="relative z-10 space-y-6 max-w-sm">
          <div className="flex items-start gap-4 p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
            <svg className="w-6 h-6 text-emerald-300 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <div>
              <h3 className="font-bold">Keamanan Terjamin</h3>
              <p className="text-xs text-emerald-50/70">
                Sistem escrow melindungi transaksi antara buyer dan freelancer.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
            <svg className="w-6 h-6 text-emerald-300 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <div>
              <h3 className="font-bold">Proses Instan</h3>
              <p className="text-xs text-emerald-50/70">
                Posting pekerjaan atau mulai menjual keahlianmu dalam sekejap.
              </p>
            </div>
          </div>
        </div>

        <div className="relative z-10 pt-8 border-t border-white/10">
          <p className="text-[10px] text-emerald-100/50 uppercase tracking-[0.2em] font-black italic">
            Empowering Indonesian Talent
          </p>
        </div>
      </div>

      {/* KANAN: FORM */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 md:p-12 lg:p-20 overflow-y-auto">
        <div className="max-w-md w-full">
          <div className="md:hidden mb-10 flex items-center gap-2">
            <Briefcase className="text-emerald-600" size={32} />
            <h1 className="text-4xl font-black">
              <span className="text-gray-900">Jasa</span>
              <span className="text-emerald-600">.in</span>
            </h1>
          </div>

          <h2 className="text-4xl font-black text-gray-900 mb-2">Selamat Datang!</h2>
          <p className="text-gray-500 mb-8 font-medium">
            Masuk untuk mengelola proyekmu hari ini.
          </p>

          <form onSubmit={handleLogin} className="space-y-5">
            {errors.form && (
              <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium border border-red-100">
                {errors.form}
              </div>
            )}

            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                <input
                  type="email"
                  name="email"
                  required
                  className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 transition-all outline-none"
                  placeholder="nama@email.com"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1.5">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">
                  Password
                </label>
                <button
                  type="button"
                  className="text-[10px] font-black text-emerald-600 hover:underline"
                >
                  LUPA PASSWORD?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  required
                  className="w-full pl-11 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 transition-all outline-none"
                  placeholder="Masukkan password"
                  value={formData.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="rememberMe"
                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
              />
              <label htmlFor="rememberMe" className="ml-2 text-sm text-gray-600 cursor-pointer font-medium">
                Ingat saya di perangkat ini
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-lg transition-all shadow-lg shadow-emerald-200 uppercase tracking-widest ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isLoading ? 'Sedang Memproses...' : 'Masuk Ke Akun'}
            </button>

            <p className="text-center text-gray-500 text-sm mt-6">
              Belum punya akun?{' '}
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="text-emerald-600 font-black hover:underline"
              >
                DAFTAR DISINI
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;