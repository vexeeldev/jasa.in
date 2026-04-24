import React, { useState } from 'react';
import { Search, CheckCircle, Shield, Zap, Check, Star, Clock, Award, Users, TrendingUp, Briefcase } from 'lucide-react';
import { DB_CATEGORIES } from '../data/mockDatabase';
import { classNames, formatCurrency } from '../data/helpers';
import Button from '../components/ui/Button';
import RatingStars from '../components/ui/RatingStars';

const ClientHomeView = ({ navigate }) => {
  const [search, setSearch] = useState('');

  const featuredServices = [
    { title: 'Desain Logo Profesional', price: 'Rp 350.000', rating: 4.9, orders: 1240, img: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=300&h=300&q=80' },
    { title: 'Buat Website Company Profile', price: 'Rp 1.200.000', rating: 4.8, orders: 890, img: 'https://images.unsplash.com/photo-1616469829581-73993eb86b02?auto=format&fit=crop&w=300&h=300&q=80' },
    { title: 'Voice Over Professional', price: 'Rp 250.000', rating: 4.9, orders: 560, img: 'https://images.unsplash.com/photo-1589903308904-1010c2294adc?auto=format&fit=crop&w=300&h=300&q=80' },
    { title: 'Video Animasi 2D/3D', price: 'Rp 850.000', rating: 4.7, orders: 430, img: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=300&h=300&q=80' },
  ];

  const testimonials = [
    { name: 'Andi Wijaya', company: 'PT Maju Jaya', text: 'Jasa.in membantu saya menemukan desainer logo terbaik. Prosesnya mudah dan hasilnya luar biasa!', rating: 5, avatar: 'https://randomuser.me/api/portraits/men/1.jpg' },
    { name: 'Siti Rahma', company: 'UKM Berkah', text: 'Website company profile saya jadi dalam 7 hari. Freelancernya profesional dan komunikatif.', rating: 5, avatar: 'https://randomuser.me/api/portraits/women/2.jpg' },
    { name: 'Budi Santoso', company: 'Startup.id', text: 'Tim customer service responsif dan membantu saat saya ada kendala pembayaran.', rating: 4, avatar: 'https://randomuser.me/api/portraits/men/3.jpg' },
  ];

  return (
    <div className="w-full">
      {/* Hero Section - Fokus Cari Jasa */}
      <div className="relative bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 h-[650px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-black/30"></div>
        
        <div className="relative z-10 max-w-5xl mx-auto px-4 w-full text-center pt-20">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight mb-6">
            Temukan <span className="text-emerald-300">Freelancer Terbaik</span> <br />
            untuk Proyek Anda
          </h1>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Ribuan freelancer profesional siap membantu mewujudkan ide Anda
          </p>

          {/* Search Bar - Client Focused */}
          <div className="bg-white rounded-2xl p-2 flex w-full max-w-4xl mx-auto shadow-2xl mb-8 border-2 border-transparent focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/20 transition-all">
            <div className="flex-1 flex items-center px-4">
              <Search className="w-6 h-6 text-gray-400 mr-3 flex-shrink-0" />
              <input
                type="text"
                placeholder="Cari jasa freelance... (contoh: desain logo, buat website, edit video)"
                className="w-full text-gray-900 font-medium border-none outline-none focus:outline-none focus:ring-0 py-3 text-lg bg-transparent"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && navigate(`/client/explore?q=${encodeURIComponent(search)}`)}
              />
            </div>
            <Button size="lg" className="rounded-xl px-8 text-lg shadow-md bg-emerald-600 hover:bg-emerald-700" onClick={() => navigate(`/client/explore?q=${encodeURIComponent(search)}`)}>
              Cari Jasa
            </Button>
          </div>

          {/* Popular Search Tags */}
          <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-white font-bold">
            <span className="opacity-80 font-medium">Populer:</span>
            <button onClick={() => navigate('/client/explore?category=design')} className="border border-white/40 rounded-full px-4 py-1.5 hover:bg-white hover:text-emerald-900 transition-colors shadow-sm text-sm">
              Desain Logo
            </button>
            <button onClick={() => navigate('/client/explore?category=programming')} className="border border-white/40 rounded-full px-4 py-1.5 hover:bg-white hover:text-emerald-900 transition-colors shadow-sm text-sm">
              Buat Website
            </button>
            <button onClick={() => navigate('/client/explore?category=video')} className="border border-white/40 rounded-full px-4 py-1.5 hover:bg-white hover:text-emerald-900 transition-colors shadow-sm text-sm">
              Edit Video
            </button>
            <button onClick={() => navigate('/client/explore?category=marketing')} className="border border-white/40 rounded-full px-4 py-1.5 hover:bg-white hover:text-emerald-900 transition-colors shadow-sm text-sm">
              Digital Marketing
            </button>
          </div>
        </div>
      </div>

      {/* Stats Bar - Kepercayaan Client */}
      <div className="bg-white border-b border-gray-100 py-8 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-black text-emerald-600">10K+</div>
              <div className="text-sm text-gray-500 font-medium mt-1">Proyek Selesai</div>
            </div>
            <div>
              <div className="text-3xl font-black text-emerald-600">5K+</div>
              <div className="text-sm text-gray-500 font-medium mt-1">Freelancer Aktif</div>
            </div>
            <div>
              <div className="text-3xl font-black text-emerald-600">4.9/5</div>
              <div className="text-sm text-gray-500 font-medium mt-1">Rating Klien</div>
            </div>
            <div>
              <div className="text-3xl font-black text-emerald-600">24/7</div>
              <div className="text-sm text-gray-500 font-medium mt-1">Dukungan</div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Services - Buat Client */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-black text-gray-900 mb-2">Layanan Paling Dicari</h2>
            <p className="text-gray-500 font-medium">Pilihan terbaik dari ribuan freelancer profesional</p>
          </div>
          <button 
            onClick={() => navigate('/client/explore')}
            className="text-emerald-600 font-bold hover:underline flex items-center"
          >
            Lihat Semua
            <TrendingUp className="w-4 h-4 ml-1" />
          </button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredServices.map((service, i) => (
            <div 
              key={i} 
              className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group"
              onClick={() => navigate('/client/explore')}
            >
              <div className="relative h-48 overflow-hidden">
                <img src={service.img} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
              </div>
              <div className="p-4">
                <h3 className="font-bold text-gray-900 mb-2 line-clamp-1">{service.title}</h3>
                <div className="flex items-center mb-2">
                  <RatingStars rating={service.rating} size={14} />
                  <span className="text-xs text-gray-500 ml-1">({service.orders}+)</span>
                </div>
                <div className="flex justify-between items-center mt-3">
                  <span className="text-xl font-black text-emerald-600">{service.price}</span>
                  <span className="text-xs text-gray-400">mulai dari</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* How It Works - Untuk Client */}
      <div className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-gray-900 mb-3">Mudah & Cepat</h2>
            <p className="text-gray-500 text-lg">3 langkah mudah temukan freelancer terbaik</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-10 h-10 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">1. Cari Jasa</h3>
              <p className="text-gray-500">Temukan layanan yang Anda butuhkan dari ribuan pilihan</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-10 h-10 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">2. Pilih Freelancer</h3>
              <p className="text-gray-500">Lihat portofolio, rating, dan review dari klien sebelumnya</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">3. Pesan & Selesai</h3>
              <p className="text-gray-500">Lakukan pemesanan dan terima hasil pekerjaan tepat waktu</p>
            </div>
          </div>
        </div>
      </div>

      {/* Value Props - Keuntungan untuk Client */}
      <div className="py-20 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl lg:text-4xl font-black text-gray-900 mb-6 leading-tight">
                Kenapa harus <span className="text-emerald-600">Jasa.in</span>?
              </h2>
              <div className="space-y-6">
                <div className="flex items-start">
                  <Shield className="w-6 h-6 text-emerald-600 mr-3 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 mb-1">Pembayaran 100% Aman</h4>
                    <p className="text-gray-500">Dana ditahan oleh sistem hingga Anda puas dengan hasil pekerjaan</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Clock className="w-6 h-6 text-emerald-600 mr-3 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 mb-1">Pengerjaan Cepat</h4>
                    <p className="text-gray-500">Proyek selesai sesuai deadline dengan garansi revisi</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Users className="w-6 h-6 text-emerald-600 mr-3 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 mb-1">Freelancer Terverifikasi</h4>
                    <p className="text-gray-500">Semua freelancer melalui proses verifikasi ketat</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Award className="w-6 h-6 text-emerald-600 mr-3 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 mb-1">Garansi Kepuasan</h4>
                    <p className="text-gray-500">Pekerjaan direvisi gratis hingga sesuai keinginan Anda</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-500 rounded-2xl transform translate-x-4 translate-y-4 opacity-20"></div>
              <img 
                src="https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=800&q=80" 
                alt="Happy client" 
                className="rounded-2xl shadow-2xl w-full relative z-10 border border-gray-100" 
              />
              <div className="absolute -right-5 top-1/4 bg-white p-4 rounded-xl shadow-xl z-20 flex items-center border border-gray-100">
                <div className="w-10 h-10 bg-green-100 rounded-full flex justify-center items-center mr-3">
                  <Check className="text-green-600 w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Proyek Selesai</p>
                  <p className="font-black text-gray-900">+10.000 Proyek</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials - Social Proof untuk Client */}
      <div className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-gray-900 mb-3">Apa Kata Klien Kami?</h2>
            <p className="text-gray-500">Dipercaya oleh ribuan klien di seluruh Indonesia</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center mb-4">
                  <img src={testimonial.avatar} className="w-12 h-12 rounded-full mr-3" alt="" />
                  <div>
                    <h4 className="font-bold text-gray-900">{testimonial.name}</h4>
                    <p className="text-xs text-gray-500">{testimonial.company}</p>
                  </div>
                </div>
                <RatingStars rating={testimonial.rating} className="mb-3" />
                <p className="text-gray-600 italic">"{testimonial.text}"</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Categories - Client Browse */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black text-gray-900 mb-3">Jelajahi Kategori</h2>
          <p className="text-gray-500">Temukan freelancer berdasarkan keahlian yang Anda butuhkan</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 text-center">
          {DB_CATEGORIES.filter(c => c.parent_id === null).map(cat => {
            const IconComponent = cat.icon;
            return (
              <div
                key={cat.category_id}
                className="group cursor-pointer bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-emerald-200 transition-all duration-300"
                onClick={() => navigate(`/client/explore?category=${cat.slug}`)}
              >
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-50 rounded-full flex items-center justify-center group-hover:bg-emerald-50 transition-colors">
                  <IconComponent className="w-8 h-8 text-gray-400 group-hover:text-emerald-600 transition-colors" />
                </div>
                <h4 className="font-bold text-gray-900 group-hover:text-emerald-600 transition-colors text-sm">{cat.name}</h4>
                <p className="text-xs text-gray-400 mt-1">{cat.count || 100}+ jasa</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* CTA - Untuk Client yang Ingin Berjualan Juga */}
      <div className="bg-gradient-to-r from-emerald-900 to-teal-900 py-20 text-white relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
          <Zap className="w-[500px] h-[500px]" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h2 className="text-4xl font-black mb-4">Punya Keahlian Juga?</h2>
          <p className="text-xl opacity-90 max-w-2xl mx-auto mb-8">
            Bergabunglah menjadi freelancer dan dapatkan penghasilan tambahan dari keahlian Anda!
          </p>
          <Button 
            size="lg" 
            className="bg-white text-emerald-900 hover:bg-gray-100 text-lg px-10 py-4 shadow-lg transform transition hover:-translate-y-1 font-bold"
            onClick={() => navigate('/become-freelancer')}
          >
            Daftar Jadi Freelancer →
          </Button>
          <p className="text-sm opacity-70 mt-4">*Gratis mendaftar, tanpa biaya tersembunyi</p>
        </div>
      </div>
    </div>
  );
};

export default ClientHomeView;