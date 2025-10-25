// Fichier : frontend/src/api/axiosClient.ts

import axios from 'axios';
// OPTIMIZATION: Import auth store to read cached token from memory instead of localStorage
import { useAuthStore } from '../stores/authStore';

// 1. Création de l'instance unique
const rawBaseURL = import.meta.env.VITE_API_URL ?? '/api';
const normalizedBaseURL = rawBaseURL.startsWith('http')
    ? rawBaseURL
    : rawBaseURL.startsWith('/')
        ? rawBaseURL
        : `/${rawBaseURL}`;

const axiosClient = axios.create({
    // La baseURL est lue UNE SEULE FOIS ici, depuis la variable d'environnement.
    // C'est la seule source de vérité pour l'URL de l'API.
    baseURL: normalizedBaseURL,
});

// 2. Intercepteur pour ajouter le token d'authentification
// Ce code s'exécutera avant CHAQUE requête envoyée par cette instance.
axiosClient.interceptors.request.use(
    (config) => {
        // Lorsque la baseURL est relative (ex: '/api'), s'assurer que les URLs
        // de requête ne commencent pas par un slash pour éviter de retomber sur '/v1/...'
        if (
            typeof config.url === 'string' &&
            config.url.startsWith('/') &&
            typeof config.baseURL === 'string' &&
            config.baseURL.startsWith('/')
        ) {
            config.url = config.url.replace(/^\/+/, '');
        }

        // OPTIMIZATION: Get token from memory cache (Zustand store) instead of localStorage
        // This avoids reading from localStorage on every single API request
        const token = useAuthStore.getState().getToken();

        if (token) {
            // Si un token existe, l'ajoute à l'en-tête Authorization
            config.headers.Authorization = `Bearer ${token}`;
        }
        // console.log(config.baseURL, config.url)
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Intercepteur de réponse pour gérer les erreurs d'authentification
axiosClient.interceptors.response.use(
    (response) => response,
    (error) => {
        // Déconnecter UNIQUEMENT sur 401 (token invalide/expiré)
        // Ne PAS déconnecter sur 403 (permissions insuffisantes) - laisser le composant gérer l'erreur
        if (error.response?.status === 401) {
            // Token expiré ou invalide
            localStorage.removeItem('token');
            // OPTIMIZATION: Also clear the cached token from memory
            useAuthStore.getState().setToken(null);
            // Redirection simple pour éviter les dépendances cycliques avec les stores
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// 3. Exporter l'instance pour que toute l'application puisse l'utiliser
export default axiosClient;
