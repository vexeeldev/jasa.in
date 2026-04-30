import React, { useState } from 'react';
import { 
  Search, CheckCircle, Shield, Zap, Check, Star, 
  Clock, Award, Users, TrendingUp, Briefcase,
  Layout, Code, Video, Megaphone, PenTool, Globe
} from 'lucide-react';

/**
 * KOMPONEN INTERNAL & DATA MOCK
 * Kita sertakan di sini agar Preview dapat berjalan tanpa error "Could not resolve".
 */

const DB_CATEGORIES = [
  { category_id: 1, name: 'Desain Grafis', slug: 'design', icon: PenTool, parent_id: null, count: 1200 },
  { category_id: 2, name: 'Programming', slug: 'programming', icon: Code, parent_id: null, count: 850 },
  { category_id: 3, name: 'Video & Animasi', slug: 'video', icon: Video, parent_id: null, count: 640 },
  { category_id: 4, name: 'Digital Marketing', slug: 'marketing', icon: Megaphone, parent_id: null, count: 920 },
  { category_id: 5, name: 'UI/UX Design', slug: 'uiux', icon: Layout, parent_id: null, count: 430 },
  { category_id: 6, name: 'Penulisan', slug: 'writing', icon: Globe, parent_id: null, count: 310 },
];

const classNames = (...classes) => classes.filter(Boolean).join(' ');

// Komponen Button dengan perbaikan agar bisa rata tengah (inline-flex)
const Button = ({ children, className = "", size = "md", onClick, variant = "primary", ...props }) => {
  const baseClasses = "font-bold rounded-xl transition-all duration-200 inline-flex items-center justify-center active:scale-95";
  const sizeClasses = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg"
  };
  const variantClasses = {
    primary: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-md hover:shadow-emerald-200",
    outline: "border-2 border-white/40 text-white hover:bg-white hover:text-emerald-900",
    secondary: "bg-white text-emerald-900 border border-gray-200 hover:bg-gray-50"
  };

  return (
    <button 
      className={classNames(baseClasses, sizeClasses[size], variantClasses[variant], className)}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

// Komponen RatingStars
const RatingStars = ({ rating, size = 16, className = "" }) => {
  return (
    <div className={classNames("flex items-center", className)}>
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          size={size}
          className={classNames(
            "mr-0.5",
            i < Math.floor(rating) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
          )}
        />
      ))}
      <span className="ml-1 text-sm font-bold text-gray-700">{rating}</span>
    </div>
  );
};

const ClientHomeView = ({ navigate = (path) => console.log('Navigasi ke:', path) }) => {
  const [search, setSearch] = useState('');

  const featuredServices = [
    { title: 'Desain Logo Profesional & Branding', price: 'Rp 350.000', rating: 4.9, orders: 1240, img: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=400&h=300&q=80' },
    { title: 'Website Company Profile Responsive', price: 'Rp 1.200.000', rating: 4.8, orders: 890, img: 'https://images.unsplash.com/photo-1616469829581-73993eb86b02?auto=format&fit=crop&w=400&h=300&q=80' },
    { title: 'Voice Over Iklan Kualitas Studio', price: 'Rp 250.000', rating: 4.9, orders: 560, img: 'https://images.unsplash.com/photo-1589903308904-1010c2294adc?auto=format&fit=crop&w=400&h=300&q=80' },
    { title: 'Video Animasi Explainer 2D/3D', price: 'Rp 850.000', rating: 4.7, orders: 430, img: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=400&h=300&q=80' },
  ];

  const testimonials = [
    { name: 'Andi Wijaya', company: 'PT Maju Jaya', text: 'Jasa.in membantu saya menemukan desainer logo terbaik. Prosesnya mudah dan hasilnya luar biasa!', rating: 5, avatar: 'https://randomuser.me/api/portraits/men/1.jpg' },
    { name: 'Siti Rahma', company: 'UKM Berkah', text: 'Website company profile saya jadi dalam 7 hari. Freelancernya profesional dan komunikatif.', rating: 5, avatar: 'https://randomuser.me/api/portraits/women/2.jpg' },
    { name: 'Budi Santoso', company: 'Startup.id', text: 'Tim customer service responsif dan membantu saat saya ada kendala pembayaran.', rating: 4, avatar: 'https://randomuser.me/api/portraits/men/3.jpg' },
  ];

  return (
    <div className="w-full font-sans antialiased bg-white">
      {/* Hero Section - Diperbaiki untuk mencegah distorsi teks */}
      <div className="relative h-[650px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1920&q=80" 
            alt="Freelance Background"
            className="w-full h-full object-cover"
          />
          {/* Overlay Gelap yang lebih solid untuk meningkatkan keterbacaan teks tanpa shadow */}
          <div className="absolute inset-0 bg-black/65"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/40 via-transparent to-black/20"></div>
        </div>
        
        <div className="relative z-10 max-w-6xl mx-auto px-6 w-full text-center">
          {/* Perbaikan: Menggunakan font-extrabold dan menghapus drop-shadow untuk menghindari aliasing glitch */}
          <h1 className="pt-32 text-4xl md:text-6xl font-extrabold text-white leading-[1.1] mb-6 subpixel-antialiased tracking-tight">
            Temukan <span className="text-emerald-400">Freelancer Terbaik</span> <br />
            untuk Proyek Anda
          </h1>
          <p className="text-lg md:text-xl text-white/90 mb-10 max-w-2xl mx-auto font-medium">
            Jasa.in menghubungkan Anda dengan ribuan ahli profesional untuk mewujudkan ide brilian Anda.
          </p>

          {/* Search Bar */}
          <div className="bg-white rounded-2xl p-2 flex flex-col md:flex-row w-full max-w-4xl mx-auto shadow-2xl mb-8 border border-white/20 transition-all focus-within:ring-4 focus-within:ring-emerald-500/20">
            <div className="flex-1 flex items-center px-4 py-2 md:py-0">
              <Search className="w-6 h-6 text-emerald-600 mr-3 flex-shrink-0" />
              <input
                type="text"
                placeholder="Apa yang Anda butuhkan? (contoh: desain logo, website)"
                className="w-full text-gray-900 font-medium border-none outline-none focus:ring-0 py-3 text-lg bg-transparent placeholder:text-gray-400"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && navigate(`/client/explore?q=${encodeURIComponent(search)}`)}
              />
            </div>
            <Button 
              size="lg" 
              className="md:w-auto w-full rounded-xl px-10" 
              onClick={() => navigate(`/client/explore?q=${encodeURIComponent(search)}`)}
            >
              Cari Jasa
            </Button>
          </div>

          {/* Popular Search Tags */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <span className="text-white font-bold mr-2 text-sm">Populer:</span>
            {['Desain Logo', 'Buat Website', 'Edit Video', 'Copywriting'].map((tag) => (
              <Button 
                key={tag}
                variant="outline"
                className="rounded-full px-5 py-1.5 text-xs font-black uppercase tracking-wider"
                onClick={() => navigate(`/client/explore?q=${tag}`)}
              >
                {tag}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-white border-b border-gray-100 py-10 shadow-sm relative z-20 -mt-8 mx-auto max-w-6xl rounded-2xl shadow-xl">
        <div className="px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: 'Proyek Selesai', value: '10K+' },
              { label: 'Freelancer Aktif', value: '5K+' },
              { label: 'Rating Klien', value: '4.9/5' },
              { label: 'Dukungan', value: '24/7' }
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl md:text-4xl font-black text-emerald-600">{stat.value}</div>
                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Featured Services */}
      <div className="max-w-7xl mx-auto px-6 py-24">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
          <div>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-2">Layanan Paling Dicari</h2>
            <p className="text-gray-500 font-medium text-lg">Inspirasi terbaik untuk memulai proyek besar Anda.</p>
          </div>
          <button 
            onClick={() => navigate('/client/explore')}
            className="group text-emerald-600 font-black flex items-center hover:text-emerald-700 transition-colors"
          >
            Lihat Semua
            <TrendingUp className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {featuredServices.map((service, i) => (
            <div 
              key={i} 
              className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-500 cursor-pointer group"
              onClick={() => navigate('/client/explore')}
            >
              <div className="relative h-56 overflow-hidden">
                <img src={service.img} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={service.title} />
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full shadow-sm">
                  <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Premium</span>
                </div>
              </div>
              <div className="p-6">
                <h3 className="font-bold text-gray-900 mb-2 line-clamp-1 group-hover:text-emerald-600 transition-colors leading-snug">
                  {service.title}
                </h3>
                <div className="flex items-center mb-4">
                  <RatingStars rating={service.rating} size={14} />
                  <span className="text-xs text-gray-400 ml-2">({service.orders}+ pesanan)</span>
                </div>
                <div className="flex justify-between items-center pt-5 border-t border-gray-50">
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Mulai Dari</p>
                    <p className="text-xl font-black text-emerald-600">{service.price}</p>
                  </div>
                  <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                    <Check size={20} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-emerald-50/50 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4 tracking-tight">Mudah & Cepat</h2>
            <p className="text-gray-500 text-lg">3 langkah mudah mewujudkan proyek impian Anda</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center relative">
            <div className="hidden md:block absolute top-1/4 left-0 w-full h-0.5 bg-emerald-100 z-0"></div>
            {[
              { icon: Search, title: "1. Cari Jasa", desc: "Temukan layanan yang Anda butuhkan dari ribuan pilihan yang tersedia." },
              { icon: Briefcase, title: "2. Pilih Freelancer", desc: "Lihat portofolio, rating, dan review asli dari klien sebelumnya." },
              { icon: CheckCircle, title: "3. Terima Hasil", desc: "Lakukan pemesanan aman dan terima hasil pekerjaan berkualitas tinggi." }
            ].map((step, idx) => (
              <div key={idx} className="relative z-10 group">
                <div className="w-24 h-24 bg-white rounded-[2rem] shadow-xl flex items-center justify-center mx-auto mb-8 group-hover:-translate-y-2 transition-transform duration-300 border border-emerald-50">
                  <step.icon className="w-10 h-10 text-emerald-600" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-500 font-medium leading-relaxed px-4">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Value Props */}
      <div className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div>
              <h2 className="text-4xl font-black text-gray-900 mb-8 leading-tight">
                Kenapa Klien Memilih <br /><span className="text-emerald-600">Jasa.in</span>?
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                {[
                  { icon: Shield, title: "Aman", desc: "Dana ditahan sistem hingga Anda puas." },
                  { icon: Clock, title: "Cepat", desc: "Deadline terjamin dengan garansi." },
                  { icon: Users, title: "Ahli", desc: "Freelancer melalui seleksi ketat." },
                  { icon: Award, title: "Kualitas", desc: "Garansi revisi sampai sesuai brief." }
                ].map((item, idx) => (
                  <div key={idx} className="flex flex-col items-start p-6 rounded-2xl bg-gray-50 hover:bg-white hover:shadow-xl transition-all border border-transparent hover:border-emerald-100">
                    <item.icon className="w-8 h-8 text-emerald-600 mb-4" />
                    <h4 className="text-lg font-black text-gray-900 mb-1">{item.title}</h4>
                    <p className="text-sm text-gray-500 font-medium leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=800&q=80" 
                alt="Client Satisfaction" 
                className="rounded-[3rem] shadow-2xl w-full object-cover h-[500px]" 
              />
              <div className="absolute -left-10 bottom-10 bg-emerald-600 p-8 rounded-3xl shadow-2xl text-white hidden md:block animate-bounce-slow">
                <Check className="w-10 h-10 mb-2" />
                <p className="text-2xl font-black">100%</p>
                <p className="text-xs font-bold uppercase tracking-widest opacity-80">Aman & Terjamin</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="max-w-7xl mx-auto px-6 py-24 bg-gray-900 rounded-[3rem] my-20">
        <div className="text-center mb-16 px-4">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">Jelajahi Berdasarkan Kategori</h2>
          <p className="text-emerald-100/60 text-lg">Apapun industrinya, kami memiliki freelancer yang tepat untuk Anda.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 px-10">
          {DB_CATEGORIES.map(cat => {
            const IconComponent = cat.icon;
            return (
              <div
                key={cat.category_id}
                className="group cursor-pointer bg-white/5 border border-white/10 rounded-2xl p-8 text-center hover:bg-emerald-600 hover:border-emerald-500 transition-all duration-300"
                onClick={() => navigate(`/client/explore?category=${cat.slug}`)}
              >
                <div className="w-14 h-14 mx-auto mb-5 bg-white/10 rounded-xl flex items-center justify-center group-hover:bg-white/20 transition-colors">
                  <IconComponent className="w-8 h-8 text-emerald-400 group-hover:text-white transition-colors" />
                </div>
                <h4 className="font-bold text-white text-sm leading-tight">{cat.name}</h4>
                <p className="text-[10px] text-emerald-100/40 mt-2 font-bold uppercase tracking-widest group-hover:text-white/60">{cat.count || 100}+ Jasa</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* CTA Section - Sekarang tombol rata tengah */}
      <div className="max-w-7xl mx-auto px-6 mb-24">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-[3rem] py-20 px-10 text-white text-center relative overflow-hidden shadow-2xl">
          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-1/4 translate-y-1/4">
            <Zap className="w-[400px] h-[400px]" />
          </div>
          <div className="relative z-10">
            <h2 className="text-4xl md:text-5xl font-black mb-6 leading-tight">Punya Keahlian Juga?</h2>
            <p className="text-xl text-emerald-50 max-w-2xl mx-auto mb-10 font-medium opacity-90">
              Bergabunglah menjadi freelancer dan mulai hasilkan pendapatan dari keahlian yang Anda miliki hari ini!
            </p>
            <Button 
              size="lg" 
              variant="secondary"
              className="text-emerald-900 hover:bg-white hover:scale-105 shadow-xl px-12 py-5 text-xl rounded-2xl"
              onClick={() => navigate('/become-freelancer')}
            >
              Daftar Jadi Freelancer Sekarang
            </Button>
            <p className="text-sm text-white/60 mt-6 font-bold uppercase tracking-widest">Daftar gratis tanpa biaya pendaftaran</p>
          </div>
        </div>
      </div>

      {/* Footer Minimalist */}
      <footer className="bg-white py-12 border-t border-gray-100 text-center">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <Zap className="text-white w-5 h-5 fill-white" />
            </div>
            <span className="text-2xl font-black text-gray-900 tracking-tighter">Jasa.in</span>
          </div>
          <p className="text-gray-400 font-medium text-sm">© 2024 Jasa.in Marketplace. Menghubungkan bakat terbaik Indonesia.</p>
        </div>
      </footer>
    </div>
  );
};

export default ClientHomeView;