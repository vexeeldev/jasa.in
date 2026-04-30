import { Search, CheckCircle, Shield, Zap, Check } from 'lucide-react';
import { useState } from 'react';
import { DB_CATEGORIES } from '../data/mockDatabase';
import { classNames } from '../data/helpers';
import Button from '../components/ui/Button';

const HomeView = ({ navigate }) => {
  const [search, setSearch] = useState('');

  return (
    <div className="w-full">
      {/* Hero Section */}
      <div className="relative bg-emerald-900 h-[600px] flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-overlay"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1920&q=80')" }}
        ></div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 w-full text-center sm:text-left pt-20">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight mb-6">
            Temukan layanan freelance <br className="hidden md:block"/> <span className="font-serif italic text-emerald-300">sempurna</span> untuk bisnis Anda
          </h1>

          <div className="bg-white rounded-2xl p-2 flex w-full max-w-3xl shadow-2xl mb-8 border-2 border-transparent focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/20 transition-all sm:mx-0 mx-auto">
            <div className="flex-1 flex items-center px-4">
              <Search className="w-6 h-6 text-gray-400 mr-3 flex-shrink-0" />
              <input
                type="text"
                placeholder="Cari layanan (mis. 'Desain Logo', 'Buat Website')..."
                className="w-full text-gray-900 font-medium border-none outline-none focus:outline-none focus:ring-0 py-3 text-lg bg-transparent"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && navigate(`/explore?q=${encodeURIComponent(search)}`)}
              />
            </div>
            <Button size="lg" className="rounded-xl px-8 text-lg shadow-md" onClick={() => navigate(`/explore?q=${encodeURIComponent(search)}`)}>
              Cari
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-sm text-white font-bold">
            <span className="opacity-80 font-medium">Populer:</span>
            <button onClick={() => navigate('/explore')} className="border border-white/40 rounded-full px-4 py-1 hover:bg-white hover:text-emerald-900 transition-colors shadow-sm">Website Builder</button>
            <button onClick={() => navigate('/explore')} className="border border-white/40 rounded-full px-4 py-1 hover:bg-white hover:text-emerald-900 transition-colors shadow-sm">Logo Design</button>
            <button onClick={() => navigate('/explore')} className="border border-white/40 rounded-full px-4 py-1 hover:bg-white hover:text-emerald-900 transition-colors shadow-sm">SEO Optimization</button>
          </div>
        </div>

        {/* Wave Bottom */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none z-20">
          <svg
            viewBox="0 0 1440 80"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
            className="w-full h-16 md:h-20"
          >
            <path
              d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z"
              fill="#f9fafb"
            />
          </svg>
        </div>
      </div>

      {/* Trust Bar */}
      <div className="bg-gray-50 border-b border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap justify-center sm:justify-between items-center text-gray-400 font-black opacity-60">
          <span className="mx-4 my-2 text-2xl tracking-tighter">META</span>
          <span className="mx-4 my-2 text-2xl tracking-tighter">GOOGLE</span>
          <span className="mx-4 my-2 text-2xl tracking-tighter">NETFLIX</span>
          <span className="mx-4 my-2 text-2xl tracking-tighter">P&G</span>
          <span className="mx-4 my-2 text-2xl tracking-tighter">PAYPAL</span>
        </div>
      </div>

      {/* Popular Services Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-3xl font-black text-gray-900 mb-8">Layanan Terpopuler Bulan Ini</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {[
            { title: 'Desain Logo',   desc: 'Bangun identitas brand',      img: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=300&h=400&q=80' },
            { title: 'WordPress',     desc: 'Kustomisasi website Anda',    img: 'https://images.unsplash.com/photo-1616469829581-73993eb86b02?auto=format&fit=crop&w=300&h=400&q=80' },
            { title: 'Voice Over',    desc: 'Sampaikan pesan Anda',        img: 'https://images.unsplash.com/photo-1589903308904-1010c2294adc?auto=format&fit=crop&w=300&h=400&q=80' },
            { title: 'Video Animasi', desc: 'Libatkan audiens Anda',       img: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=300&h=400&q=80' },
            { title: 'SEO',           desc: 'Dapatkan lebih banyak trafik',img: 'https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?auto=format&fit=crop&w=300&h=400&q=80' }
          ].map((item, i) => (
            <div key={i} className="relative rounded-xl overflow-hidden h-80 cursor-pointer group shadow-md hover:shadow-2xl transition-all duration-300" onClick={() => navigate('explore')}>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent group-hover:from-black/90 transition-colors z-10"></div>
              <img src={item.img} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
              <div className="absolute bottom-0 left-0 p-5 z-20 text-white w-full">
                <p className="text-sm font-medium mb-1 opacity-90">{item.desc}</p>
                <h3 className="text-2xl font-black leading-tight">{item.title}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Value Props Section */}
      <div className="bg-emerald-50 py-20 border-y border-emerald-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center">
          <div className="lg:w-1/2 pr-0 lg:pr-16 mb-10 lg:mb-0">
            <h2 className="text-3xl lg:text-4xl font-black text-gray-900 mb-10 leading-tight">Solusi terbaik untuk menyelesaikan proyek Anda.</h2>
            <div className="space-y-8">
              <div>
                <h4 className="text-xl font-bold text-gray-900 mb-2 flex items-center"><CheckCircle className="w-6 h-6 text-gray-400 mr-3" /> Harga terjangkau, sesuai anggaran</h4>
                <p className="text-gray-600 text-lg font-medium">Temukan layanan berkualitas tinggi di setiap titik harga. Pembayaran dilakukan berbasis proyek (fixed-price), bukan per jam.</p>
              </div>
              <div>
                <h4 className="text-xl font-bold text-gray-900 mb-2 flex items-center"><CheckCircle className="w-6 h-6 text-gray-400 mr-3" /> Pekerjaan cepat & berkualitas</h4>
                <p className="text-gray-600 text-lg font-medium">Temukan freelancer terverifikasi yang tepat dalam hitungan menit dan pantau hasil kerjanya secara real-time.</p>
              </div>
              <div>
                <h4 className="text-xl font-bold text-gray-900 mb-2 flex items-center"><Shield className="w-6 h-6 text-gray-400 mr-3" /> Transaksi dilindungi sepenuhnya</h4>
                <p className="text-gray-600 text-lg font-medium">Dana Anda ditahan dengan aman oleh sistem Jasa.in dan baru diteruskan setelah Anda menyetujui hasil kerjanya.</p>
              </div>
            </div>
          </div>
          <div className="lg:w-1/2 relative">
            <div className="absolute inset-0 bg-emerald-500 rounded-2xl transform translate-x-4 translate-y-4 opacity-20"></div>
            <img src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=800&q=80" alt="Working" className="rounded-2xl shadow-2xl w-full relative z-10 border border-gray-100" />
            <div className="absolute -left-10 top-1/4 bg-white p-4 rounded-xl shadow-xl z-20 flex items-center border border-gray-100 animate-bounce" style={{ animationDuration: '3s' }}>
              <div className="w-10 h-10 bg-green-100 rounded-full flex justify-center items-center mr-3"><Check className="text-green-600 w-5 h-5"/></div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Status</p>
                <p className="font-black text-gray-900">Pesanan Selesai!</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Explore Categories */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-3xl font-black text-gray-900 mb-10">Jelajahi Kategori Keahlian</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 text-center">
          {DB_CATEGORIES.filter(c => c.parent_id === null).map(cat => {
            const IconComponent = cat.icon;
            return (
              <div
                key={cat.category_id}
                className="group cursor-pointer bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-emerald-200 transition-all duration-300"
                onClick={() => navigate('explore')}
              >
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-50 rounded-full flex items-center justify-center group-hover:bg-emerald-50 transition-colors">
                  <IconComponent className="w-8 h-8 text-gray-400 group-hover:text-emerald-600 transition-colors" />
                </div>
                <h4 className="font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">{cat.name}</h4>
              </div>
            );
          })}
        </div>
      </div>

      {/* CTA */}
      <div className="bg-gray-900 py-20 text-white relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-1/4 translate-y-1/4">
          <Zap className="w-[500px] h-[500px]" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col md:flex-row items-center justify-between">
          <div className="mb-8 md:mb-0">
            <h2 className="text-4xl font-black mb-4">Punya keahlian? <br/><span className="text-emerald-400">Temukan klien Anda.</span></h2>
            <p className="text-xl opacity-80 max-w-xl font-medium leading-relaxed">Bergabunglah dengan ribuan freelancer sukses di Jasa.in. Tawarkan keahlian Anda, atur jadwal sendiri, dan hasilkan pendapatan tanpa batas.</p>
          </div>
          <Button size="lg" className="bg-emerald-500 hover:bg-emerald-400 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)] text-lg px-10 py-4 border-none transform transition hover:-translate-y-1">Mulai Berjualan Sekarang</Button>
        </div>
      </div>
    </div>
  );
};

export default HomeView;