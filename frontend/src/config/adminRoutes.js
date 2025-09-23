import { Users, Monitor, MapPin, Home, BarChart3 } from 'lucide-react';

/**
 * Configuration centralisée des routes d'administration
 * Cette configuration évite la duplication et facilite la maintenance
 */

export const ADMIN_ROUTES = {
  HOME: '/admin',
  USERS: '/admin/users',
  CASH_REGISTERS: '/admin/cash-registers',
  SITES: '/admin/sites',
  REPORTS: '/admin/reports',
  HEALTH: '/admin/health',
  SETTINGS: '/admin/settings'
};

export const ADMIN_NAVIGATION_ITEMS = [
  {
    path: ADMIN_ROUTES.HOME,
    label: 'Tableau de bord',
    icon: Home,
    exact: true,
    description: 'Vue d\'ensemble du système'
  },
  {
    path: ADMIN_ROUTES.USERS,
    label: 'Utilisateurs',
    icon: Users,
    description: 'Gestion des comptes utilisateurs'
  },
  {
    path: ADMIN_ROUTES.CASH_REGISTERS,
    label: 'Postes de caisse',
    icon: Monitor,
    description: 'Configuration des postes de caisse'
  },
  {
    path: ADMIN_ROUTES.SITES,
    label: 'Sites',
    icon: MapPin,
    description: 'Gestion des sites et emplacements'
  }
];

export const ADMIN_QUICK_ACTIONS = [
  {
    title: 'Gestion des utilisateurs',
    description: 'Gérer les comptes utilisateurs, les rôles et les permissions',
    icon: Users,
    path: ADMIN_ROUTES.USERS,
    color: '#2e7d32'
  },
  {
    title: 'Postes de caisse',
    description: 'Configurer et superviser les postes de caisse',
    icon: Monitor,
    path: ADMIN_ROUTES.CASH_REGISTERS,
    color: '#1976d2'
  },
  {
    title: 'Sites et emplacements',
    description: 'Gérer les sites et leurs configurations',
    icon: MapPin,
    path: ADMIN_ROUTES.SITES,
    color: '#7c3aed'
  },
  {
    title: 'Rapports détaillés',
    description: 'Accéder aux rapports complets et statistiques',
    icon: BarChart3,
    path: ADMIN_ROUTES.REPORTS,
    color: '#dc2626'
  }
];

/**
 * Utilitaire pour vérifier si une route est une route d'administration
 * @param {string} path - Le chemin à vérifier
 * @returns {boolean} - true si c'est une route admin
 */
export const isAdminRoute = (path) => {
  return Object.values(ADMIN_ROUTES).some(route =>
    path === route || path.startsWith(route + '/')
  );
};

/**
 * Utilitaire pour obtenir la configuration d'une route admin
 * @param {string} path - Le chemin de la route
 * @returns {object|null} - L'objet de configuration ou null
 */
export const getAdminRouteConfig = (path) => {
  return ADMIN_NAVIGATION_ITEMS.find(item =>
    item.exact ? item.path === path : path.startsWith(item.path)
  ) || null;
};