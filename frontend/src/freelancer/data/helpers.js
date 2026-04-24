import {
  DB_USERS, DB_FREELANCER_PROFILES, DB_CATEGORIES,
  DB_SERVICE_PACKAGES, DB_SERVICES
} from './mockDatabase';

// ── Low-level lookups ──────────────────────────────────────────────────────
export const getUserById            = (id)    => DB_USERS.find(u => u.user_id === id);
export const getProfileByFreelancerId = (f_id)  => DB_FREELANCER_PROFILES.find(p => p.profile_id === f_id);
export const getProfileByUserId     = (u_id)  => DB_FREELANCER_PROFILES.find(p => p.user_id === u_id);
export const getCategoryById        = (id)    => DB_CATEGORIES.find(c => c.category_id === id);

// ── Hydration ──────────────────────────────────────────────────────────────
export const hydrateService = (service) => {
  if (!service) return null;
  const profile  = getProfileByFreelancerId(service.freelancer_id);
  const user     = getUserById(profile?.user_id);
  const packages = DB_SERVICE_PACKAGES.filter(p => p.service_id === service.service_id);
  const category = getCategoryById(service.category_id);

  return {
    ...service,
    seller: { ...user, ...profile },
    category_name: category?.name || 'Uncategorized',
    packages: {
      basic:    packages.find(p => p.package_name === 'basic'),
      standard: packages.find(p => p.package_name === 'standard'),
      premium:  packages.find(p => p.package_name === 'premium')
    }
  };
};

export const hydratedServices = DB_SERVICES.map(hydrateService);

export const hydrateOrder = (order) => {
  const client            = getUserById(order.client_id);
  const freelancerProfile = getProfileByFreelancerId(order.freelancer_id);
  const freelancerUser    = getUserById(freelancerProfile?.user_id);
  const pkg               = DB_SERVICE_PACKAGES.find(p => p.package_id === order.package_id);
  const service           = DB_SERVICES.find(s => s.service_id === pkg?.service_id);

  return {
    ...order,
    client,
    freelancer: { ...freelancerUser, ...freelancerProfile },
    package: pkg,
    service
  };
};

// ── Formatting ─────────────────────────────────────────────────────────────
export const formatCurrency = (amount) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

export const formatDate = (dateString) =>
  new Date(dateString).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });

export const formatDateTime = (dateString) =>
  new Date(dateString).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

// ── Utility ────────────────────────────────────────────────────────────────
export const classNames = (...classes) => classes.filter(Boolean).join(' ');