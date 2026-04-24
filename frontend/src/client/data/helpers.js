import {
  DB_USERS, 
  DB_FREELANCER_PROFILES, 
  DB_CATEGORIES,
  DB_SERVICE_PACKAGES, 
  DB_SERVICES,
  DB_ORDERS,
  // Data tambahan untuk client
  DB_CLIENT_TRANSACTIONS,
  DB_WISHLIST
} from './mockDatabase';

// ── Low-level lookups ──────────────────────────────────────────────────────
export const getUserById = (id) => DB_USERS.find(u => u.user_id === id);
export const getProfileByFreelancerId = (f_id) => DB_FREELANCER_PROFILES.find(p => p.profile_id === f_id);
export const getProfileByUserId = (u_id) => DB_FREELANCER_PROFILES.find(p => p.user_id === u_id);
export const getCategoryById = (id) => DB_CATEGORIES.find(c => c.category_id === id);

// ── Client specific lookups ────────────────────────────────────────────────
export const getClientOrders = (clientId) => DB_ORDERS.filter(o => o.client_id === clientId);
export const getClientTransactions = (clientId) => DB_CLIENT_TRANSACTIONS?.filter(t => t.client_id === clientId) || [];
export const getClientWishlist = (clientId) => DB_WISHLIST?.filter(w => w.client_id === clientId) || [];
export const isInWishlist = (clientId, serviceId) => {
  const wishlist = getClientWishlist(clientId);
  return wishlist.some(item => item.service_id === serviceId);
};

// ── Hydration Service ──────────────────────────────────────────────────────
export const hydrateService = (service) => {
  if (!service) return null;
  const profile = getProfileByFreelancerId(service.freelancer_id);
  const user = getUserById(profile?.user_id);
  const packages = DB_SERVICE_PACKAGES.filter(p => p.service_id === service.service_id);
  const category = getCategoryById(service.category_id);

  return {
    ...service,
    seller: { 
      ...user, 
      ...profile,
      // Client-specific seller info
      response_rate: profile?.response_rate || 95,
      response_time: profile?.response_time || '~1 jam',
      total_reviews: profile?.total_reviews || 0
    },
    category_name: category?.name || 'Uncategorized',
    category_slug: category?.slug || '',
    packages: {
      basic: packages.find(p => p.package_name === 'basic'),
      standard: packages.find(p => p.package_name === 'standard'),
      premium: packages.find(p => p.package_name === 'premium')
    },
    // Client-specific fields
    featured: service.featured || false,
    total_orders: service.total_orders || 0,
    created_at: service.created_at || new Date().toISOString()
  };
};

export const hydratedServices = DB_SERVICES.map(hydrateService);

// ── Hydration Order (Client Perspective) ───────────────────────────────────
export const hydrateOrder = (order) => {
  const client = getUserById(order.client_id);
  const freelancerProfile = getProfileByFreelancerId(order.freelancer_id);
  const freelancerUser = getUserById(freelancerProfile?.user_id);
  const pkg = DB_SERVICE_PACKAGES.find(p => p.package_id === order.package_id);
  const service = DB_SERVICES.find(s => s.service_id === pkg?.service_id);

  return {
    ...order,
    client,
    freelancer: { 
      ...freelancerUser, 
      ...freelancerProfile,
      rating: freelancerProfile?.rating_avg || 4.5
    },
    package: pkg,
    service: service ? hydrateService(service) : null,
    // Client-specific fields
    status_label: getOrderStatusLabel(order.status),
    can_cancel: ['pending', 'in_progress'].includes(order.status),
    can_request_revision: order.status === 'waiting_approval',
    estimated_delivery: calculateEstimatedDelivery(order.created_at, pkg?.delivery_days || 7)
  };
};

// ── Order Status Helper ────────────────────────────────────────────────────
export const getOrderStatusLabel = (status) => {
  const statusMap = {
    'pending': 'Menunggu Pembayaran',
    'in_progress': 'Sedang Dikerjakan',
    'waiting_approval': 'Menunggu Persetujuan',
    'revision': 'Revisi Diminta',
    'completed': 'Selesai',
    'cancelled': 'Dibatalkan'
  };
  return statusMap[status] || status;
};

export const getOrderStatusColor = (status) => {
  const colorMap = {
    'pending': 'yellow',
    'in_progress': 'blue',
    'waiting_approval': 'purple',
    'revision': 'orange',
    'completed': 'green',
    'cancelled': 'red'
  };
  return colorMap[status] || 'gray';
};

// ── Calculation Helpers ────────────────────────────────────────────────────
export const calculateEstimatedDelivery = (createdAt, deliveryDays) => {
  const created = new Date(createdAt);
  const estimated = new Date(created);
  estimated.setDate(created.getDate() + deliveryDays);
  return estimated;
};

export const getRemainingDays = (deadline) => {
  const today = new Date();
  const deadlineDate = new Date(deadline);
  const diffTime = deadlineDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

export const getProgressPercentage = (order) => {
  const steps = {
    'pending': 10,
    'in_progress': 40,
    'waiting_approval': 70,
    'revision': 50,
    'completed': 100,
    'cancelled': 0
  };
  return steps[order.status] || 0;
};

// ── Formatting (Client specific) ───────────────────────────────────────────
export const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', { 
    style: 'currency', 
    currency: 'IDR', 
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

export const formatDate = (dateString) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('id-ID', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
};

export const formatDateTime = (dateString) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('id-ID', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

export const formatRelativeTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Baru saja';
  if (diffMins < 60) return `${diffMins} menit lalu`;
  if (diffHours < 24) return `${diffHours} jam lalu`;
  if (diffDays < 7) return `${diffDays} hari lalu`;
  return formatDate(dateString);
};

export const formatShortNumber = (num) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(0) + 'K';
  return num.toString();
};

// ── Filter & Sort Helpers ──────────────────────────────────────────────────
export const filterServices = (services, filters) => {
  let filtered = [...services];

  // Search query
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(s => 
      s.title.toLowerCase().includes(searchLower) ||
      s.description?.toLowerCase().includes(searchLower)
    );
  }

  // Category
  if (filters.category) {
    filtered = filtered.filter(s => s.category_slug === filters.category);
  }

  // Budget
  if (filters.budget) {
    filtered = filtered.filter(s => {
      const price = s.packages.basic?.price || 0;
      switch (filters.budget) {
        case 'under-500k': return price < 500000;
        case '500k-2m': return price >= 500000 && price <= 2000000;
        case 'above-2m': return price > 2000000;
        default: return true;
      }
    });
  }

  // Delivery time
  if (filters.delivery) {
    filtered = filtered.filter(s => {
      const delivery = s.packages.basic?.delivery_days || 7;
      switch (filters.delivery) {
        case '24h': return delivery <= 1;
        case '3d': return delivery <= 3;
        case '7d': return delivery <= 7;
        default: return true;
      }
    });
  }

  // Freelancer level
  if (filters.level) {
    filtered = filtered.filter(s => {
      switch (filters.level) {
        case 'top': return s.seller?.level === 'top';
        case 'high': return ['high', 'top'].includes(s.seller?.level);
        case 'new': return s.seller?.level === 'new';
        default: return true;
      }
    });
  }

  // Rating
  if (filters.minRating) {
    filtered = filtered.filter(s => (s.seller?.rating_avg || 0) >= filters.minRating);
  }

  return filtered;
};

export const sortServices = (services, sortBy) => {
  const sorted = [...services];
  
  switch (sortBy) {
    case 'popular':
      return sorted.sort((a, b) => (b.total_orders || 0) - (a.total_orders || 0));
    case 'rating':
      return sorted.sort((a, b) => (b.seller?.rating_avg || 0) - (a.seller?.rating_avg || 0));
    case 'price-low':
      return sorted.sort((a, b) => (a.packages.basic?.price || 0) - (b.packages.basic?.price || 0));
    case 'price-high':
      return sorted.sort((a, b) => (b.packages.basic?.price || 0) - (a.packages.basic?.price || 0));
    case 'newest':
      return sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    default:
      return sorted;
  }
};

// ── Pagination Helper ──────────────────────────────────────────────────────
export const paginate = (items, page, itemsPerPage = 12) => {
  const start = (page - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return {
    items: items.slice(start, end),
    totalPages: Math.ceil(items.length / itemsPerPage),
    currentPage: page,
    totalItems: items.length
  };
};

// ── Validation Helpers ─────────────────────────────────────────────────────
export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePhone = (phone) => {
  const re = /^[0-9]{10,13}$/;
  return re.test(phone);
};

// ── General Utility ────────────────────────────────────────────────────────
export const classNames = (...classes) => classes.filter(Boolean).join(' ');

export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export const truncateText = (text, maxLength = 100) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// ── Rating Helpers ─────────────────────────────────────────────────────────
export const getRatingPercentage = (rating, totalRatings) => {
  if (totalRatings === 0) return 0;
  return (rating / totalRatings) * 100;
};

export const getRatingDistribution = (reviews) => {
  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach(review => {
    const rating = Math.floor(review.rating);
    if (distribution[rating]) distribution[rating]++;
  });
  return distribution;
};