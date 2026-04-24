import {
  PenTool, Code, TrendingUp, Video, Mic, Briefcase,
  Smartphone, LayoutGrid
} from 'lucide-react';

export const DB_USERS = [
  {
    user_id: 1, username: 'dimas_kreatif', email: 'dimas@kreatif.com',
    password_hash: 'hashed_pw_1', full_name: 'Dimas Anggara',
    phone: '+6281234567890', avatar_url: 'https://i.pravatar.cc/150?u=dimas',
    is_freelancer: '1', is_admin: '0', is_verified: '1',
    created_at: '2024-01-15T10:00:00Z'
  },
  {
    user_id: 2, username: 'siska_dev', email: 'siska@dev.com',
    password_hash: 'hashed_pw_2', full_name: 'Siska Amanda',
    phone: '+6281987654321', avatar_url: 'https://i.pravatar.cc/150?u=siska',
    is_freelancer: '1', is_admin: '0', is_verified: '1',
    created_at: '2023-11-20T08:30:00Z'
  },
  {
    user_id: 3, username: 'pt_maju_jaya', email: 'contact@majujaya.com',
    password_hash: 'hashed_pw_3', full_name: 'Arif Rahman (PT Maju Jaya)',
    phone: '+6285555555555', avatar_url: 'https://i.pravatar.cc/150?u=arif',
    is_freelancer: '0', is_admin: '0', is_verified: '1',
    created_at: '2025-02-10T14:15:00Z'
  }
];

export const DB_FREELANCER_PROFILES = [
  {
    profile_id: 101, user_id: 1,
    bio: 'Saya adalah seorang Product Designer dengan pengalaman lebih dari 5 tahun di industri startup. Saya spesialis dalam merancang antarmuka aplikasi seluler yang tidak hanya terlihat indah secara visual (UI), tetapi juga memberikan pengalaman pengguna yang mulus dan intuitif (UX). Komunikasi adalah kunci keberhasilan proyek bagi saya.',
    rating_avg: 4.9, total_orders: 128, level: 'pro',
    joined_at: '2024-01-15T10:00:00Z'
  },
  {
    profile_id: 102, user_id: 2,
    bio: 'Fullstack Web Developer dengan fokus pada React.js, Node.js, dan Laravel. Membantu UMKM dan Startup membangun infrastruktur digital mereka sejak 2021. Kode bersih, terstruktur, dan scalable.',
    rating_avg: 5.0, total_orders: 340, level: 'top',
    joined_at: '2023-11-20T08:30:00Z'
  }
];

export const DB_FREELANCER_SKILLS = {
  101: ['UI/UX Design', 'Figma', 'Prototyping', 'Mobile App Design', 'Wireframing'],
  102: ['React.js', 'Laravel', 'Tailwind CSS', 'API Development', 'Database Design']
};

export const DB_PORTFOLIOS = [
  {
    portfolio_id: 1001, freelancer_id: 101,
    title: 'E-Commerce App Redesign - FinTech',
    description: 'Mendesain ulang antarmuka aplikasi e-commerce terkemuka untuk meningkatkan conversion rate sebesar 25%.',
    image_url: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=800&q=80',
    project_url: 'https://dribbble.com/dimas_kreatif/project1',
    created_at: '2025-01-10T10:00:00Z'
  },
  {
    portfolio_id: 1002, freelancer_id: 101,
    title: 'HealthCare Dashboard UI',
    description: 'Dashboard analitik medis untuk rumah sakit swasta di Jakarta.',
    image_url: 'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?auto=format&fit=crop&w=800&q=80',
    project_url: 'https://dribbble.com/dimas_kreatif/project2',
    created_at: '2025-03-05T10:00:00Z'
  },
  {
    portfolio_id: 1003, freelancer_id: 102,
    title: 'Corporate Landing Page - Tech Startup',
    description: 'Pengembangan landing page super cepat menggunakan React dan Tailwind CSS.',
    image_url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80',
    project_url: 'https://github.com/siska_dev',
    created_at: '2024-12-12T10:00:00Z'
  }
];

export const DB_CATEGORIES = [
  { category_id: 1,   parent_id: null, name: 'Desain Grafis',      slug: 'desain-grafis',       icon: PenTool },
  { category_id: 2,   parent_id: null, name: 'Pemrograman & Tech', slug: 'pemrograman-tech',    icon: Code },
  { category_id: 3,   parent_id: null, name: 'Digital Marketing',  slug: 'digital-marketing',   icon: TrendingUp },
  { category_id: 4,   parent_id: null, name: 'Video & Animasi',    slug: 'video-animasi',       icon: Video },
  { category_id: 5,   parent_id: null, name: 'Musik & Audio',      slug: 'musik-audio',         icon: Mic },
  { category_id: 6,   parent_id: null, name: 'Bisnis',             slug: 'bisnis',              icon: Briefcase },
  { category_id: 101, parent_id: 1,    name: 'App Design',         slug: 'app-design',          icon: Smartphone },
  { category_id: 102, parent_id: 1,    name: 'Logo Design',        slug: 'logo-design',         icon: PenTool },
  { category_id: 201, parent_id: 2,    name: 'Website Development',slug: 'website-development', icon: LayoutGrid },
];

export const DB_SERVICES = [
  {
    service_id: 5001, freelancer_id: 101, category_id: 101,
    title: 'Saya akan mendesain UI/UX aplikasi mobile profesional dan modern',
    description: `Halo! Selamat datang di layanan Desain UI/UX Mobile App saya.
    
Saya spesialis merancang antarmuka aplikasi seluler yang tidak hanya terlihat indah secara visual (UI), tetapi juga memberikan pengalaman pengguna yang mulus dan intuitif (UX).

**Apa yang akan Anda dapatkan?**
* Desain UI yang unik, modern, dan pixel-perfect.
* Wireframing dan Prototyping interaktif (Figma).
* Aset desain lengkap siap di-handover ke developer.
* Source file Figma.

Silakan hubungi saya sebelum memesan!`,
    thumbnail_url: 'https://images.unsplash.com/photo-1618761714954-0b8cd0026356?auto=format&fit=crop&w=800&q=80',
    status: 'active', total_orders: 45, created_at: '2024-02-01T10:00:00Z',
    gallery: [
      'https://images.unsplash.com/photo-1618761714954-0b8cd0026356?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    service_id: 5002, freelancer_id: 102, category_id: 201,
    title: 'Saya akan membuat website company profile responsif dengan React',
    description: 'Saya akan mengembangkan website yang sangat cepat dan SEO friendly menggunakan React.js dan Tailwind CSS. Cocok untuk UMKM dan Startup.',
    thumbnail_url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
    status: 'active', total_orders: 89, created_at: '2024-03-15T10:00:00Z',
    gallery: [
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80'
    ]
  }
];

export const DB_SERVICE_PACKAGES = [
  { package_id: 801, service_id: 5001, package_name: 'basic',    description: 'Desain UI sederhana untuk maksimal 3 layar. Tanpa prototype.',                    price: 750000,  delivery_days: 3,  revisions: 2   },
  { package_id: 802, service_id: 5001, package_name: 'standard', description: 'Desain lengkap hingga 8 layar dengan interaksi dasar. Ideal untuk MVP.',           price: 1500000, delivery_days: 5,  revisions: 4   },
  { package_id: 803, service_id: 5001, package_name: 'premium',  description: 'Desain full aplikasi (hingga 15 layar) dengan prototype kompleks.',                price: 3000000, delivery_days: 10, revisions: 999 },
  { package_id: 804, service_id: 5002, package_name: 'basic',    description: 'Satu halaman (Single Page) landing page responsif.',                                price: 1500000, delivery_days: 4,  revisions: 3   },
  { package_id: 805, service_id: 5002, package_name: 'standard', description: 'Website standar 5 halaman (Home, About, Services, Portfolio, Contact).',            price: 3500000, delivery_days: 7,  revisions: 5   },
  { package_id: 806, service_id: 5002, package_name: 'premium',  description: 'Website dengan Headless CMS untuk kemudahan update konten.',                        price: 7000000, delivery_days: 14, revisions: 999 },
];

export const DB_ORDERS = [
  {
    order_id: 9001, package_id: 803, client_id: 3, freelancer_id: 101,
    status: 'in_progress', total_price: 3150000,
    deadline: '2026-04-25T10:00:00Z',
    requirements: 'Kami butuh desain aplikasi untuk layanan antar makanan sehat. Target audiens: pekerja kantoran umur 25-40 tahun. Referensi: GoFood, GrabFood.',
    created_at: '2026-04-10T09:00:00Z', completed_at: null
  },
  {
    order_id: 9002, package_id: 805, client_id: 1, freelancer_id: 102,
    status: 'revision', total_price: 3675000,
    deadline: '2026-04-18T15:00:00Z',
    requirements: 'Buatkan website portofolio untuk saya. Referensi dilampirkan.',
    created_at: '2026-04-05T08:00:00Z', completed_at: null
  },
  {
    order_id: 9003, package_id: 801, client_id: 2, freelancer_id: 101,
    status: 'completed', total_price: 787500,
    deadline: '2026-03-20T10:00:00Z',
    requirements: 'Butuh desain 3 screen untuk login, register, dan forgot password.',
    created_at: '2026-03-15T09:00:00Z', completed_at: '2026-03-18T14:20:00Z'
  }
];

export const DB_ORDER_REVISIONS = [
  {
    revision_id: 1, order_id: 9002,
    description: 'Tolong ganti warna primary dari biru menjadi hijau zamrud (#10B981) agar sesuai dengan logo baru saya. Dan bagian footer font-nya kebesaran.',
    attachment_url: null, requested_at: '2026-04-12T10:30:00Z'
  }
];

export const DB_REVIEWS = [
  {
    review_id: 1, order_id: 9003, reviewer_id: 2, rating: 5,
    comment: 'Kerjanya sangat cepat dan desainnya clean banget. Makasih mas Dimas!',
    created_at: '2026-03-18T15:00:00Z'
  }
];

export const DB_PAYMENTS = [
  { payment_id: 1, order_id: 9001, amount: 3150000, method: 'Credit Card',     status: 'success', transaction_ref: 'TRX-9001', paid_at: '2026-04-10T09:05:00Z' },
  { payment_id: 2, order_id: 9002, amount: 3675000, method: 'Bank Transfer',   status: 'success', transaction_ref: 'TRX-9002', paid_at: '2026-04-05T08:15:00Z' },
  { payment_id: 3, order_id: 9003, amount: 787500,  method: 'Jasa.in Balance', status: 'success', transaction_ref: 'TRX-9003', paid_at: '2026-03-15T09:01:00Z' },
];

export const DB_MESSAGES = [
  { message_id: 1, sender_id: 1, receiver_id: 3, order_id: 9001, content: 'Halo Pak Arif, requirements sudah saya terima. Saya akan mulai kerjakan wireframenya hari ini.', is_read: '1', sent_at: '2026-04-10T10:00:00Z' },
  { message_id: 2, sender_id: 3, receiver_id: 1, order_id: 9001, content: 'Terima kasih Mas Dimas. Ditunggu updatenya.', is_read: '1', sent_at: '2026-04-10T10:15:00Z' },
  { message_id: 3, sender_id: 1, receiver_id: 3, order_id: 9001, content: 'Saya sudah upload draft pertama di halaman pesanan. Silakan di-review.', is_read: '0', sent_at: '2026-04-12T16:00:00Z' },
];

export const DB_NOTIFICATIONS = [
  { notif_id: 1, user_id: 1, type: 'order',    title: 'Pesanan Baru',   body: 'PT Maju Jaya telah memesan layanan Anda.',           is_read: '1', created_at: '2026-04-10T09:05:00Z' },
  { notif_id: 2, user_id: 1, type: 'message',  title: 'Pesan Baru',     body: 'Arif Rahman mengirimi Anda pesan.',                  is_read: '0', created_at: '2026-04-10T10:15:00Z' },
  { notif_id: 3, user_id: 1, type: 'revision', title: 'Revisi Diminta', body: 'Siska Amanda meminta revisi pada pesanan ORD-9002.', is_read: '0', created_at: '2026-04-12T10:30:00Z' },
];

export const CURRENT_LOGGED_IN_USER_ID = 1;

export const CHAT_LIST = [
  { id: 1, partner: DB_USERS[2], order: DB_ORDERS[0], lastMessage: 'Saya sudah upload draft pertama...', time: '16:00', unread: 1 },
  { id: 2, partner: DB_USERS[1], order: DB_ORDERS[1], lastMessage: 'Tolong ganti warna primary dari biru...', time: 'Kemarin', unread: 0 },
];