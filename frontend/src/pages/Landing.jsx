import React, { useState, useEffect } from 'react';
import { 
  Menu, 
  X, 
  Star, 
  ArrowRight, 
  CheckCircle, 
  ShieldCheck, 
  Zap,
  PenTool, 
  Code, 
  TrendingUp, 
  Video, 
  Mic, 
  FileText, 
  Briefcase,
  ChevronRight,
//   Instagram,
//   Twitter,
//   Linkedin,
//   Facebook,
  Award,
  Users,
  MousePointer2,
  Clock,
  ThumbsUp
} from 'lucide-react';

const FEATURED_SERVICES = [
  { 
    id: 1,
    title: 'Desain Logo Profesional untuk Brand & UMKM',
    name: 'Dimas Anggara', 
    avatar: 'https://i.pravatar.cc/150?u=dimas', 
    thumbnail: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=600&q=80',
    rating: 4.9, 
    reviews: 128, 
    price: 750000 
  },
  { 
    id: 2,
    title: 'Pembuatan Website Landing Page Responsif',
    name: 'Siska Amanda', 
    avatar: 'https://i.pravatar.cc/150?u=siska', 
    thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&q=80',
    rating: 5.0, 
    reviews: 340, 
    price: 1500000 
  },
  { 
    id: 3,
    title: 'Video Animasi Explainer 2D Durasi 60 Detik',
    name: 'Raka Putra', 
    avatar: 'https://i.pravatar.cc/150?u=raka', 
    thumbnail: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&q=80',
    rating: 4.8, 
    reviews: 67, 
    price: 500000 
  },
  { 
    id: 4,
    title: 'Penulisan Artikel SEO & Copywriting Produk',
    name: 'Maya Putri', 
    avatar: 'https://i.pravatar.cc/150?u=maya', 
    thumbnail: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=600&q=80',
    rating: 4.9, 
    reviews: 215, 
    price: 350000 
  },
];

const CATEGORIES = [
  { name: 'Desain Grafis', icon: <PenTool size={20} />, color: 'bg-orange-100 text-orange-600' },
  { name: 'Pemrograman', icon: <Code size={20} />, color: 'bg-blue-100 text-blue-600' },
  { name: 'Marketing', icon: <TrendingUp size={20} />, color: 'bg-emerald-100 text-emerald-600' },
  { name: 'Video Editor', icon: <Video size={20} />, color: 'bg-red-100 text-red-600' },
  { name: 'Musik & Audio', icon: <Mic size={20} />, color: 'bg-purple-100 text-purple-600' },
  { name: 'Penulisan', icon: <FileText size={20} />, color: 'bg-cyan-100 text-cyan-600' },
  { name: 'Bisnis', icon: <Briefcase size={20} />, color: 'bg-amber-100 text-amber-600' },
  { name: 'Lainnya', icon: <ChevronRight size={20} />, color: 'bg-slate-100 text-slate-600' },
];

export default function Landing({ onNavigate = () => {} }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToContent = () => {
    const element = document.getElementById('marketplace-content');
    if (element) element.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#FDFDFB] font-sans text-slate-900">
      {/* 1. NAVBAR */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${
        isScrolled ? 'bg-white shadow-md py-3' : 'bg-transparent py-6'
      }`}>
        <div className="container mx-auto px-4 md:px-8 flex items-center justify-between">
          <div className="flex items-center gap-12">
            {/* Logo: Jasa (Green) .in (White/Black) */}
            <div 
              className="text-3xl font-black tracking-tighter cursor-pointer flex items-center select-none"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <span className="text-emerald-600">jasa</span>
              <span className={`transition-colors duration-300 ${isScrolled ? 'text-slate-900' : 'text-white'}`}>.in</span>
            </div>
            
            <div className={`hidden lg:flex items-center gap-8 text-sm font-bold tracking-tight transition-colors ${
              isScrolled ? 'text-slate-600' : 'text-white/90'
            }`}>
              <button onClick={scrollToContent} className="hover:text-emerald-500">Jelajahi Jasa</button>
              <button className="hover:text-emerald-500">Cara Pesan</button>
              <button className="hover:text-emerald-500">Jadi Seller</button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => onNavigate('login')}
              className={`hidden md:block px-4 py-2 font-bold text-sm transition-colors ${
                isScrolled ? 'text-slate-600 hover:text-emerald-600' : 'text-white hover:text-emerald-300'
              }`}
            >
              Masuk Akun
            </button>
            <button 
              onClick={() => onNavigate('register')}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-sm transition-all shadow-lg shadow-emerald-900/20 active:scale-95"
            >
              Daftar Gratis
            </button>
            <button 
              className={`md:hidden p-2 transition-colors ${isScrolled ? 'text-slate-600' : 'text-white'}`}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-0 left-0 w-full h-screen bg-white p-8 flex flex-col z-50 animate-in fade-in slide-in-from-top duration-300">
            <div className="flex justify-between items-center mb-12">
              <div className="text-3xl font-black tracking-tighter">
                <span className="text-emerald-600">jasa</span><span className="text-slate-900">.in</span>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 bg-slate-100 rounded-full"><X size={24}/></button>
            </div>
            <div className="flex flex-col gap-8">
              <button onClick={() => setIsMobileMenuOpen(false)} className="text-left font-black text-3xl tracking-tighter">Jelajahi Jasa</button>
              <button onClick={() => setIsMobileMenuOpen(false)} className="text-left font-black text-3xl tracking-tighter">Cara Kerja</button>
              <button onClick={() => setIsMobileMenuOpen(false)} className="text-left font-black text-3xl tracking-tighter">Bantuan</button>
            </div>
            <div className="mt-auto flex flex-col gap-4">
              <button onClick={() => onNavigate('login')} className="w-full py-5 font-black text-slate-600 border-2 border-slate-100 rounded-2xl">Masuk</button>
              <button onClick={() => onNavigate('register')} className="w-full py-5 font-black text-white bg-emerald-600 rounded-2xl shadow-lg">Gabung Sekarang</button>
            </div>
          </div>
        )}
      </nav>

      {/* 2. HERO SECTION - MARKETPLACE VIBE, GREEN TINT IMAGE */}
      <section className="relative min-h-[90vh] flex items-center justify-center pt-20 overflow-hidden text-center px-4">
        {/* Background with Emerald Tint */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=2084&auto=format&fit=crop" 
            alt="Freelancers Working" 
            className="w-full h-full object-cover"
          />
          {/* Overlay: Gelap dengan Tint Hijau */}
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-900/40 via-slate-950/80 to-slate-950"></div>
        </div>

        <div className="container mx-auto relative z-10">
          <div className="max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-emerald-500 text-white px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-8 shadow-xl">
              Pilihan Jasa Terlengkap di Indonesia
            </div>
            
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white tracking-tighter leading-[0.95] mb-8">
              Pesan Jasa <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-200 underline decoration-emerald-500/30 underline-offset-[12px]">Semudah Belanja.</span>
            </h1>
            
            <p className="text-lg md:text-xl text-slate-300 mb-12 max-w-2xl mx-auto leading-relaxed font-medium">
              Temukan ribuan freelancer profesional yang siap mengerjakan proyek Anda. Aman, cepat, dan berkualitas tanpa ribet.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button 
                onClick={scrollToContent}
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white px-10 py-5 rounded-2xl font-black text-xl transition-all shadow-2xl shadow-emerald-900/40 active:scale-95 flex items-center justify-center gap-3"
              >
                Mulai Belanja Jasa <MousePointer2 size={24} />
              </button>
              <button 
                onClick={() => onNavigate('register', { role: 'freelancer' })}
                className="w-full sm:w-auto bg-white/10 backdrop-blur-md border-2 border-white/20 text-white px-10 py-5 rounded-2xl font-black text-xl transition-all hover:bg-white/20 active:scale-95"
              >
                Jadi Seller Jasa
              </button>
            </div>
          </div>
        </div>

        {/* Bottom stats row */}
        <div className="absolute bottom-10 left-0 w-full z-10 hidden md:block">
           <div className="flex justify-center gap-20 text-white/50 text-xs font-black uppercase tracking-[0.2em]">
              <span className="flex items-center gap-2"><ThumbsUp size={14} className="text-emerald-500" /> 100% Puas</span>
              <span className="flex items-center gap-2"><ShieldCheck size={14} className="text-emerald-500" /> Rekber Aman</span>
              <span className="flex items-center gap-2"><Users size={14} className="text-emerald-500" /> 50K+ User</span>
           </div>
        </div>
      </section>

      {/* 3. LOGO STRIP (Bustling Marketplace Style) */}
      <div className="bg-white py-12 border-b border-slate-100 overflow-hidden">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-8">
          <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest text-center">Telah Digunakan Oleh:</p>
          <div className="flex flex-wrap justify-center gap-10 md:gap-20 opacity-40 hover:opacity-100 grayscale hover:grayscale-0 transition-all duration-700">
            {['TOKOPEDIA', 'GOJEK', 'RUANGGURU', 'TRAVELOKA', 'KALIBRR'].map(brand => (
              <span key={brand} className="text-xl font-black text-slate-900 tracking-tighter">{brand}</span>
            ))}
          </div>
        </div>
      </div>

      {/* 4. CATEGORIES - Visual Discovery */}
      <section className="py-24" id="marketplace-content">
        <div className="container mx-auto px-4 md:px-8">
          <div className="mb-16">
            <h2 className="text-3xl md:text-5xl font-black mb-4 tracking-tighter">Cari Berdasarkan Layanan</h2>
            <p className="text-slate-500 text-lg font-medium">Ribuan keahlian tersedia untuk membantu bisnis Anda tumbuh.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {CATEGORIES.map((cat, idx) => (
              <div 
                key={idx} 
                className="group p-6 rounded-3xl border border-slate-100 bg-white hover:border-emerald-500 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer flex flex-col items-center text-center"
              >
                <div className={`w-12 h-12 ${cat.color} rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
                  {cat.icon}
                </div>
                <h3 className="font-black text-slate-800 text-xs md:text-sm leading-tight">{cat.name}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. SERVICE CATALOG - Real Marketplace Feel */}
      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex items-end justify-between mb-16">
             <h2 className="text-3xl md:text-5xl font-black tracking-tighter">Layanan Terpopuler</h2>
             <button className="text-emerald-600 font-black text-sm uppercase tracking-widest flex items-center gap-2 hover:gap-4 transition-all">
                Lihat Semua <ArrowRight size={18} />
             </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {FEATURED_SERVICES.map((service) => (
              <div key={service.id} className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden hover:shadow-2xl transition-all group cursor-pointer flex flex-col">
                {/* Image & Price Tag */}
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img 
                    src={service.thumbnail} 
                    alt={service.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                  />
                  <div className="absolute bottom-4 right-4 bg-white px-4 py-2 rounded-xl shadow-lg">
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none">Mulai Dari</p>
                    <p className="font-black text-emerald-600 text-lg">Rp {(service.price/1000).toLocaleString()}k</p>
                  </div>
                </div>
                
                {/* Info */}
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex items-center gap-2 mb-4">
                    <img src={service.avatar} alt={service.name} className="w-8 h-8 rounded-full border border-slate-100" />
                    <div>
                      <p className="text-xs font-black text-slate-900">{service.name}</p>
                      <p className="text-[10px] text-slate-400 font-bold tracking-tight">Level 2 Seller</p>
                    </div>
                  </div>
                  
                  <h4 className="font-black text-slate-800 text-lg leading-tight mb-4 group-hover:text-emerald-600 transition-colors">
                    {service.title}
                  </h4>

                  <div className="mt-auto flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Star size={16} fill="#fbbf24" className="text-amber-400" />
                      <span className="text-sm font-black text-slate-800">{service.rating}</span>
                      <span className="text-xs text-slate-400 font-bold">({service.reviews})</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-300">
                       <Clock size={14} />
                       <span className="text-[10px] font-black uppercase">2 Hari</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. HOW IT WORKS - Simplified Marketplace Flow */}
      <section className="py-32 bg-white">
        <div className="container mx-auto px-4 max-w-5xl text-center">
          <h2 className="text-4xl md:text-6xl font-black mb-16 tracking-tighter italic">Beli Jasa dengan Aman.</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-20">
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-slate-900 text-white rounded-3xl flex items-center justify-center mb-8 shadow-2xl rotate-3">
                <Users size={32} />
              </div>
              <h3 className="text-2xl font-black mb-4 tracking-tight">Pilih Freelancer</h3>
              <p className="text-slate-500 font-medium">Bandingkan portfolio dan ulasan asli dari pembeli lain sebelum memesan.</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-emerald-600 text-white rounded-3xl flex items-center justify-center mb-8 shadow-2xl -rotate-3">
                <ShieldCheck size={32} />
              </div>
              <h3 className="text-2xl font-black mb-4 tracking-tight">Bayar Lewat Rekber</h3>
              <p className="text-slate-500 font-medium">Uang ditahan sistem Jasa.in dan baru dicairkan setelah hasil kerja Anda setujui.</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-slate-900 text-white rounded-3xl flex items-center justify-center mb-8 shadow-2xl rotate-3">
                <Zap size={32} />
              </div>
              <h3 className="text-2xl font-black mb-4 tracking-tight">Terima Hasil</h3>
              <p className="text-slate-500 font-medium">Dapatkan hasil kerja berkualitas tinggi. Revisi tersedia sesuai paket yang dipilih.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. VALUE PROPOSITION - More Dynamic */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
           <div className="bg-emerald-950 rounded-[4rem] p-12 md:p-20 text-white relative overflow-hidden flex flex-col lg:flex-row items-center gap-16 shadow-2xl shadow-emerald-900/40">
              <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 blur-[120px] rounded-full"></div>
              
              <div className="lg:w-1/2 relative z-10">
                <h2 className="text-4xl md:text-6xl font-black mb-8 leading-tight tracking-tighter">Satu Tempat <br />Untuk <span className="text-emerald-400 italic">Semuanya.</span></h2>
                <div className="space-y-6">
                  {['Dana Aman 100% di Rekber', 'Dukungan CS 24 Jam', 'Freelancer Terkurasi', 'Bebas Biaya Admin'].map(t => (
                    <div key={t} className="flex items-center gap-4 text-xl font-bold">
                       <CheckCircle className="text-emerald-400 shrink-0" size={24} />
                       <span>{t}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:w-1/2 w-full bg-white/5 backdrop-blur-xl rounded-[3rem] p-10 border border-white/10 text-center">
                 <h3 className="text-3xl font-black mb-6 tracking-tight">Siap Kembangkan Bisnis?</h3>
                 <p className="text-slate-400 mb-10 text-lg">Mulai pesan jasa pertama Anda hari ini dan rasakan kemudahannya.</p>
                 <button onClick={() => onNavigate('register')} className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-10 py-5 rounded-2xl font-black text-xl shadow-xl transition-all active:scale-95">
                    Buat Akun Gratis
                 </button>
              </div>
           </div>
        </div>
      </section>

      {/* 8. CTA FINAL - Huge Discovery CTA */}
      <section className="py-40 bg-white text-center px-4">
        <h2 className="text-6xl md:text-[10rem] font-black text-slate-900 tracking-tighter leading-none mb-12 select-none">
          Cari. Pesan. <br />
          <span className="text-emerald-600">Selesai.</span>
        </h2>
        <p className="text-2xl text-slate-400 mb-16 font-bold uppercase tracking-widest">Temukan Solusi Anda Sekarang</p>
        <button 
          onClick={() => onNavigate('register')}
          className="px-16 py-8 bg-slate-950 text-white rounded-[3rem] font-black text-3xl hover:bg-emerald-600 transition-all shadow-2xl active:scale-95"
        >
          Gabung Jasa.in
        </button>
      </section>

      {/* 9. FOOTER - Clean Marketplace Footer */}
      <footer className="pt-32 pb-16 bg-slate-50 border-t border-slate-200">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-16 mb-24">
            <div className="lg:col-span-2">
              <div className="text-4xl font-black tracking-tighter mb-8">
                <span className="text-emerald-600">jasa</span>.in
              </div>
              <p className="text-slate-500 max-w-sm mb-10 font-bold text-xl leading-relaxed italic">
                Platform belanja jasa terpercaya di Indonesia. Memberikan keamanan belanja bagi pembeli dan keadilan bagi freelancer.
              </p>
              {/* <div className="flex gap-4">
                {[Instagram, Twitter, Linkedin, Facebook].map((Icon, i) => (
                  <button key={i} className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:border-emerald-600 transition-all shadow-sm">
                    <Icon size={20} />
                  </button>
                ))}
              </div> */}
            </div>

            <div>
              <h4 className="font-black text-slate-900 mb-8 uppercase tracking-widest text-xs">Produk</h4>
              <ul className="space-y-4 text-slate-500 font-bold text-sm">
                <li><button className="hover:text-emerald-600">Semua Jasa</button></li>
                <li><button className="hover:text-emerald-600">Top Rated Seller</button></li>
                <li><button className="hover:text-emerald-600">Pro Services</button></li>
                <li><button className="hover:text-emerald-600">Katalog Digital</button></li>
              </ul>
            </div>

            <div>
              <h4 className="font-black text-slate-900 mb-8 uppercase tracking-widest text-xs">Perusahaan</h4>
              <ul className="space-y-4 text-slate-500 font-bold text-sm">
                <li><button className="hover:text-emerald-600">Tentang Kami</button></li>
                <li><button className="hover:text-emerald-600">Cara Kerja</button></li>
                <li><button className="hover:text-emerald-600">Biaya Layanan</button></li>
                <li><button className="hover:text-emerald-600">Blog</button></li>
              </ul>
            </div>

            <div>
              <h4 className="font-black text-slate-900 mb-8 uppercase tracking-widest text-xs">Bantuan</h4>
              <ul className="space-y-4 text-slate-500 font-bold text-sm">
                <li><button className="hover:text-emerald-600">Pusat Bantuan</button></li>
                <li><button className="hover:text-emerald-600">Escrow Aman</button></li>
                <li><button className="hover:text-emerald-600">Kontak Kami</button></li>
                <li><button className="hover:text-emerald-600">FAQ</button></li>
              </ul>
            </div>
          </div>

          <div className="pt-12 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-8 text-center md:text-left">
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.4em]">
              © 2026 PT Kabir Fikri Syauqi. #KARYATEAM3
            </p>
            <div className="flex gap-10 text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">
              <button className="hover:text-slate-900">PRIVASI</button>
              <button className="hover:text-slate-900">SYARAT</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
