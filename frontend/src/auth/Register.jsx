import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Briefcase, CheckCircle2,
  ArrowRight, ArrowLeft, Check, Star, Users,
} from 'lucide-react';
import { EXISTING_USERS, SKILLS_OPTIONS } from './constants';

const ROLE_LABEL = {
  buyer: 'Pembeli Jasa',
  freelancer: 'Penjual Jasa',
  both: 'Buyer & Freelancer',
};

const INITIAL_FORM = {
  email: '', password: '', confirmPassword: '',
  username: '', fullName: '', phone: '',
  roleChoice: null, bio: '', skills: [],
};

const Register = ({ onRegisterSuccess }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});

  const getRoleLabel = () => ROLE_LABEL[formData.roleChoice] ?? '';
  const isFreelancer = ['freelancer', 'both'].includes(formData.roleChoice);

  // ── VALIDASI ─────────────────────────────────────────────
  const validateField = (name, value) => {
    if (name === 'email') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Format email tidak valid';
      if (EXISTING_USERS.some(u => u.email === value)) return 'Email sudah terdaftar';
    }
    if (name === 'password' && value.length < 8) return 'Password minimal 8 karakter';
    if (name === 'username') {
      if (!/^[a-z0-9_]+$/.test(value)) return 'Gunakan huruf kecil, angka, dan underscore';
      if (EXISTING_USERS.some(u => u.username === value)) return 'Username sudah digunakan';
    }
    if (name === 'phone') {
      if (!value.startsWith('+62')) return 'Gunakan format +62';
      if (value.length < 10) return 'Nomor terlalu pendek';
    }
    if (name === 'confirmPassword' && value !== formData.password)
      return 'Konfirmasi password tidak cocok';
    return '';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
  };

  const handleSkillToggle = (skill) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill],
    }));
  };

  // ── NAVIGASI STEP ────────────────────────────────────────
  const nextStep = () => {
    if (step === 2) {
      const required = ['fullName', 'username', 'email', 'phone', 'password', 'confirmPassword'];
      const stepErrors = {};
      required.forEach(f => {
        const err = validateField(f, formData[f]);
        if (err || !formData[f]) stepErrors[f] = err || 'Wajib diisi';
      });
      if (isFreelancer) {
        if (!formData.bio) stepErrors.bio = 'Bio wajib diisi untuk Freelancer';
        if (formData.skills.length === 0) stepErrors.skills = 'Pilih minimal 1 keahlian';
      }
      if (Object.keys(stepErrors).length > 0) {
        setErrors(stepErrors);
        return;
      }
    }
    setStep(prev => prev + 1);
  };

  const handleRegister = () => {
    onRegisterSuccess?.(formData.roleChoice);
    navigate('/login');
  };

  // ── ROLE CARD (Step 1) ───────────────────────────────────
  const RoleCard = ({ role, icon: Icon, title, desc }) => (
    <button
      onClick={() => setFormData(prev => ({ ...prev, roleChoice: role }))}
      className={`p-5 text-left rounded-2xl border-2 transition-all flex items-center gap-4
        ${formData.roleChoice === role
          ? 'border-emerald-600 bg-emerald-50 shadow-md'
          : 'border-gray-100 hover:border-emerald-200'
        }`}
    >
      <div className={`p-3 rounded-xl ${formData.roleChoice === role ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
        <Icon size={24} />
      </div>
      <div className="flex-1">
        <h4 className="font-bold text-gray-900">{title}</h4>
        <p className="text-[11px] text-gray-500 mt-0.5">{desc}</p>
      </div>
      {formData.roleChoice === role && <CheckCircle2 className="text-emerald-600 shrink-0" size={20} />}
    </button>
  );

  // ── RENDER ───────────────────────────────────────────────
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

        <div className="relative z-10 space-y-4 max-w-sm">
          <div className="p-5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
            <p className="text-2xl font-black">50K+</p>
            <p className="text-xs text-emerald-50/70 mt-1">Freelancer aktif di seluruh Indonesia</p>
          </div>
          <div className="p-5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
            <p className="text-2xl font-black">4.9 ⭐</p>
            <p className="text-xs text-emerald-50/70 mt-1">Rating rata-rata kepuasan pengguna</p>
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

          {/* Logo Mobile */}
          <div className="md:hidden mb-8 flex items-center gap-2">
            <Briefcase className="text-emerald-600" size={32} />
            <h1 className="text-4xl font-black">
              <span className="text-gray-900">Jasa</span>
              <span className="text-emerald-600">.in</span>
            </h1>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                Langkah {step} dari 3
              </span>
              {formData.roleChoice && (
                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-full uppercase">
                  {getRoleLabel()}
                </span>
              )}
            </div>
            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${(step / 3) * 100}%` }}
              />
            </div>
          </div>

          {/* ── STEP 1: PILIH PERAN ── */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-black text-gray-900">Pilih Peranmu</h2>
                <p className="text-gray-500 text-sm mt-1">Kamu bisa ubah ini kapan saja di pengaturan.</p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <RoleCard
                  role="buyer" icon={User}
                  title="Saya ingin MEMBELI Jasa"
                  desc="Cari talent untuk menyelesaikan proyekmu."
                />
                <RoleCard
                  role="freelancer" icon={Briefcase}
                  title="Saya ingin MENJUAL Jasa"
                  desc="Tawarkan keahlianmu dan dapatkan penghasilan."
                />
                <RoleCard
                  role="both" icon={Users}
                  title="Saya ingin KEDUANYA"
                  desc="Bisa beli dan jual jasa dalam satu akun Jasa.in."
                />
              </div>

              <button
                disabled={!formData.roleChoice}
                onClick={nextStep}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 disabled:cursor-not-allowed text-white rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
              >
                Lanjutkan <ArrowRight size={20} />
              </button>

              <button
                onClick={() => navigate('/login')}
                className="w-full text-center text-sm font-bold text-gray-400 hover:text-gray-600"
              >
                Sudah punya akun? Masuk
              </button>
            </div>
          )}

          {/* ── STEP 2: ISI DATA DIRI ── */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-3xl font-black text-gray-900">Isi Data Diri</h2>

              <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-2 custom-scrollbar">

                {/* Nama & Username & Phone */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Nama Lengkap</label>
                    <input
                      name="fullName"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      placeholder="John Doe"
                      value={formData.fullName}
                      onChange={handleChange}
                    />
                    {errors.fullName && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.fullName}</p>}
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Username</label>
                    <input
                      name="username"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      placeholder="johndoe"
                      value={formData.username}
                      onChange={handleChange}
                    />
                    {errors.username && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.username}</p>}
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">WhatsApp</label>
                    <input
                      name="phone"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      placeholder="+62"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                    {errors.phone && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.phone}</p>}
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Email</label>
                  <input
                    name="email"
                    type="email"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    placeholder="nama@email.com"
                    value={formData.email}
                    onChange={handleChange}
                  />
                  {errors.email && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.email}</p>}
                </div>

                {/* Password */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Password</label>
                    <input
                      name="password"
                      type="password"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      placeholder="Min 8 karakter"
                      value={formData.password}
                      onChange={handleChange}
                    />
                    {errors.password && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.password}</p>}
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Konfirmasi</label>
                    <input
                      name="confirmPassword"
                      type="password"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      placeholder="Ulangi password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                    />
                    {errors.confirmPassword && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.confirmPassword}</p>}
                  </div>
                </div>

                {/* Freelancer Section */}
                {isFreelancer && (
                  <div className="pt-4 border-t border-gray-100 space-y-4">
                    <h3 className="text-xs font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                      <Star size={14} /> Profil Freelancer
                    </h3>

                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Bio Singkat</label>
                      <textarea
                        name="bio"
                        rows="3"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none"
                        placeholder="Ceritakan keahlianmu kepada calon buyer..."
                        value={formData.bio}
                        onChange={handleChange}
                      />
                      {errors.bio && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.bio}</p>}
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">
                        Pilih Keahlian (Min. 1)
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {SKILLS_OPTIONS.map(skill => (
                          <button
                            key={skill}
                            type="button"
                            onClick={() => handleSkillToggle(skill)}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border
                              ${formData.skills.includes(skill)
                                ? 'bg-emerald-600 border-emerald-600 text-white'
                                : 'bg-white border-gray-200 text-gray-500 hover:border-emerald-300'
                              }`}
                          >
                            {skill}
                          </button>
                        ))}
                      </div>
                      {errors.skills && <p className="text-[10px] text-red-500 font-bold mt-2">{errors.skills}</p>}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-4 pt-2">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
                >
                  <ArrowLeft size={18} /> Kembali
                </button>
                <button
                  onClick={nextStep}
                  className="flex-[2] py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-200"
                >
                  Review Data <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3: KONFIRMASI ── */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-3xl font-black text-gray-900">Konfirmasi</h2>

              <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100 space-y-4 shadow-inner">
                {/* Avatar & Nama */}
                <div className="flex items-center gap-4 pb-4 border-b border-gray-200">
                  <div className="w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-md">
                    {formData.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-black text-gray-900 leading-none">{formData.fullName}</h4>
                    <p className="text-xs text-emerald-600 font-bold mt-1">@{formData.username}</p>
                  </div>
                </div>

                {/* Detail */}
                <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-xs">
                  <div>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Email</p>
                    <p className="font-bold text-gray-700 truncate">{formData.email}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">WhatsApp</p>
                    <p className="font-bold text-gray-700">{formData.phone}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Peran Akun</p>
                    <p className="font-bold text-emerald-700 uppercase">{getRoleLabel()}</p>
                  </div>
                </div>

                {/* Freelancer Detail */}
                {isFreelancer && (
                  <div className="pt-4 border-t border-gray-200 space-y-3">
                    <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Keahlian</p>
                      <div className="flex flex-wrap gap-1">
                        {formData.skills.map(s => (
                          <span key={s} className="px-2 py-0.5 bg-white border border-gray-200 rounded text-[9px] font-bold text-gray-600">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Bio</p>
                      <p className="text-[10px] text-gray-500 italic leading-relaxed">"{formData.bio}"</p>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={handleRegister}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-lg uppercase tracking-widest shadow-xl shadow-emerald-200 flex items-center justify-center gap-2 transition-all"
              >
                Daftar Sekarang <Check size={20} />
              </button>

              <button
                onClick={() => setStep(2)}
                className="w-full text-center text-sm font-bold text-gray-400 hover:text-gray-600"
              >
                Ada kesalahan? Edit Kembali
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #10b981; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default Register;