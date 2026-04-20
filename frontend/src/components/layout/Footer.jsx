import React from 'react';
import { Globe, Monitor } from 'lucide-react';

const Footer = () => (
  <footer className="bg-gray-50 border-t border-gray-200 pt-16 pb-8 mt-auto">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
        <div>
          <h4 className="font-bold text-gray-900 mb-4">Kategori Jasa</h4>
          <ul className="space-y-3 text-sm font-medium text-gray-500">
            <li><a href="#" className="hover:text-emerald-600 transition-colors">Desain Grafis</a></li>
            <li><a href="#" className="hover:text-emerald-600 transition-colors">Digital Marketing</a></li>
            <li><a href="#" className="hover:text-emerald-600 transition-colors">Penulisan & Penerjemahan</a></li>
            <li><a href="#" className="hover:text-emerald-600 transition-colors">Video & Animasi</a></li>
            <li><a href="#" className="hover:text-emerald-600 transition-colors">Pemrograman & Tech</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold text-gray-900 mb-4">Tentang Jasa.in</h4>
          <ul className="space-y-3 text-sm font-medium text-gray-500">
            <li><a href="#" className="hover:text-emerald-600 transition-colors">Karir</a></li>
            <li><a href="#" className="hover:text-emerald-600 transition-colors">Berita & Artikel</a></li>
            <li><a href="#" className="hover:text-emerald-600 transition-colors">Kemitraan</a></li>
            <li><a href="#" className="hover:text-emerald-600 transition-colors">Kebijakan Privasi</a></li>
            <li><a href="#" className="hover:text-emerald-600 transition-colors">Syarat & Ketentuan</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold text-gray-900 mb-4">Dukungan</h4>
          <ul className="space-y-3 text-sm font-medium text-gray-500">
            <li><a href="#" className="hover:text-emerald-600 transition-colors">Pusat Bantuan</a></li>
            <li><a href="#" className="hover:text-emerald-600 transition-colors">Keamanan & Kepercayaan</a></li>
            <li><a href="#" className="hover:text-emerald-600 transition-colors">Berjualan di Jasa.in</a></li>
            <li><a href="#" className="hover:text-emerald-600 transition-colors">Membeli di Jasa.in</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold text-gray-900 mb-4">Komunitas</h4>
          <ul className="space-y-3 text-sm font-medium text-gray-500">
            <li><a href="#" className="hover:text-emerald-600 transition-colors">Acara & Webinar</a></li>
            <li><a href="#" className="hover:text-emerald-600 transition-colors">Forum Diskusi</a></li>
            <li><a href="#" className="hover:text-emerald-600 transition-colors">Program Afiliasi</a></li>
            <li><a href="#" className="hover:text-emerald-600 transition-colors">Undang Teman</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row justify-between items-center">
        <div className="flex items-center mb-4 md:mb-0">
          <div className="text-2xl font-black tracking-tighter text-gray-400 mr-4">jasa<span className="text-emerald-400">.in</span></div>
          <p className="text-sm font-medium text-gray-400">© 2026 PT Jasa Inovasi Nusantara.</p>
        </div>
        <div className="flex space-x-4">
          <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-emerald-600 cursor-pointer shadow-sm transition-all hover:-translate-y-1"><Globe className="w-5 h-5"/></div>
          <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-emerald-600 cursor-pointer shadow-sm transition-all hover:-translate-y-1"><Monitor className="w-5 h-5"/></div>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;