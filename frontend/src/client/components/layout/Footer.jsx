import React from 'react';
import { Globe, Monitor, HelpCircle, Shield, Truck, CreditCard } from 'lucide-react';

const Footer = () => (
  <footer className="bg-gray-50 border-t border-gray-200 pt-16 pb-8 mt-auto">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      {/* Client Benefits Section - Tambahan untuk client */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12 pb-8 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <Shield className="w-8 h-8 text-emerald-500" />
          <div>
            <h4 className="font-bold text-gray-900 text-sm">Aman & Terpercaya</h4>
            <p className="text-xs text-gray-500">Dana ditahan hingga selesai</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Truck className="w-8 h-8 text-emerald-500" />
          <div>
            <h4 className="font-bold text-gray-900 text-sm">Garansi Pengerjaan</h4>
            <p className="text-xs text-gray-500">Revisi hingga puas</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <CreditCard className="w-8 h-8 text-emerald-500" />
          <div>
            <h4 className="font-bold text-gray-900 text-sm">Pembayaran Mudah</h4>
            <p className="text-xs text-gray-500">Transfer, QRIS, Kartu Kredit</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <HelpCircle className="w-8 h-8 text-emerald-500" />
          <div>
            <h4 className="font-bold text-gray-900 text-sm">Dukungan 24/7</h4>
            <p className="text-xs text-gray-500">CS siap membantu Anda</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
        {/* Untuk Client: Fokus ke layanan yang dicari */}
        <div>
          <h4 className="font-bold text-gray-900 mb-4">Jasa Populer</h4>
          <ul className="space-y-3 text-sm font-medium text-gray-500">
            <li><a href="/client/explore?category=design" className="hover:text-emerald-600 transition-colors">Desain Logo & Branding</a></li>
            <li><a href="/client/explore?category=marketing" className="hover:text-emerald-600 transition-colors">Social Media Management</a></li>
            <li><a href="/client/explore?category=writing" className="hover:text-emerald-600 transition-colors">Copywriting & Artikel</a></li>
            <li><a href="/client/explore?category=video" className="hover:text-emerald-600 transition-colors">Video Editing & Animasi</a></li>
            <li><a href="/client/explore?category=programming" className="hover:text-emerald-600 transition-colors">Website & Aplikasi</a></li>
          </ul>
        </div>

        {/* Untuk Client: Panduan membeli */}
        <div>
          <h4 className="font-bold text-gray-900 mb-4">Panduan Pembeli</h4>
          <ul className="space-y-3 text-sm font-medium text-gray-500">
            <li><a href="/client/how-to-buy" className="hover:text-emerald-600 transition-colors">Cara Membeli Jasa</a></li>
            <li><a href="/client/payment-guide" className="hover:text-emerald-600 transition-colors">Metode Pembayaran</a></li>
            <li><a href="/client/order-process" className="hover:text-emerald-600 transition-colors">Proses Pengerjaan</a></li>
            <li><a href="/client/dispute-resolution" className="hover:text-emerald-600 transition-colors">Penyelesaian Sengketa</a></li>
            <li><a href="/client/refund-policy" className="hover:text-emerald-600 transition-colors">Kebijakan Refund</a></li>
          </ul>
        </div>

        {/* Tentang Jasa.in (sama) */}
        <div>
          <h4 className="font-bold text-gray-900 mb-4">Tentang Jasa.in</h4>
          <ul className="space-y-3 text-sm font-medium text-gray-500">
            <li><a href="/about" className="hover:text-emerald-600 transition-colors">Tentang Kami</a></li>
            <li><a href="/careers" className="hover:text-emerald-600 transition-colors">Karir</a></li>
            <li><a href="/blog" className="hover:text-emerald-600 transition-colors">Blog & Artikel</a></li>
            <li><a href="/privacy" className="hover:text-emerald-600 transition-colors">Kebijakan Privasi</a></li>
            <li><a href="/terms" className="hover:text-emerald-600 transition-colors">Syarat & Ketentuan</a></li>
          </ul>
        </div>

        {/* Untuk Client: Dukungan khusus pembeli */}
        <div>
          <h4 className="font-bold text-gray-900 mb-4">Dukungan Client</h4>
          <ul className="space-y-3 text-sm font-medium text-gray-500">
            <li><a href="/client/help-center" className="hover:text-emerald-600 transition-colors">Pusat Bantuan</a></li>
            <li><a href="/client/faq" className="hover:text-emerald-600 transition-colors">FAQ</a></li>
            <li><a href="/contact" className="hover:text-emerald-600 transition-colors">Hubungi CS</a></li>
            <li><a href="/client/report-issue" className="hover:text-emerald-600 transition-colors">Laporkan Masalah</a></li>
            <li><a href="/client/feedback" className="hover:text-emerald-600 transition-colors">Berikan Masukan</a></li>
          </ul>
        </div>
      </div>

      {/* CTA untuk upgrade ke freelancer */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-6 mb-12">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <h3 className="font-bold text-gray-900 text-lg mb-1">Punya keahlian?</h3>
            <p className="text-gray-600 text-sm">Jadilah freelancer dan dapatkan penghasilan dari keahlian Anda!</p>
          </div>
          <a 
            href="/become-freelancer" 
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-lg transition-colors shadow-sm"
          >
            Mulai Berjualan →
          </a>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row justify-between items-center">
        <div className="flex items-center mb-4 md:mb-0">
          <div className="text-2xl font-black tracking-tighter text-gray-400 mr-4">
            jasa<span className="text-emerald-500">.in</span>
          </div>
          <p className="text-sm font-medium text-gray-400">
            © 2026 PT Jasa Inovasi Nusantara. Untuk Client
          </p>
        </div>
        
        <div className="flex space-x-4">
          {/* Social Media Icons */}
          <a href="#" className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-emerald-600 hover:border-emerald-200 transition-all hover:-translate-y-1 shadow-sm">
            <Globe className="w-5 h-5" />
          </a>
          <a href="#" className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-emerald-600 hover:border-emerald-200 transition-all hover:-translate-y-1 shadow-sm">
            <Monitor className="w-5 h-5" />
          </a>
          <a href="#" className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-emerald-600 hover:border-emerald-200 transition-all hover:-translate-y-1 shadow-sm">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879v-6.99h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.99C18.343 21.128 22 16.991 22 12z"/>
            </svg>
          </a>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;