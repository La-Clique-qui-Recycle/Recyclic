// Fichier : frontend/src/api/axiosClient.ts

import axios from 'axios';

// 1. Création de l'instance unique
const axiosClient = axios.create({
    // La baseURL est lue UNE SEULE FOIS ici, depuis la variable d'environnement.
    // C'est la seule source de vérité pour l'URL de l'API.
    baseURL: import.meta.env.VITE_API_URL,
});

// 2. Intercepteur pour ajouter le token d'authentification
// Ce code s'exécutera avant CHAQUE requête envoyée par cette instance.
axiosClient.interceptors.request.use(
    (config) => {
        // Récupère le token depuis le localStorage
        const token = localStorage.getItem('token'); // Clé 'token' utilisée dans authService.ts

        if (token) {
            // Si un token existe, l'ajoute à l'en-tête Authorization
            config.headers.Authorization = `Bearer ${token}`;
        }
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
        if (error.response?.status === 401 || error.response?.status === 403) {
            // Token expiré, invalide, ou permissions insuffisantes
            localStorage.removeItem('token');
            // Redirection simple pour éviter les dépendances cycliques avec les stores
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// 3. Exporter l'instance pour que toute l'application puisse l'utiliser
export default axiosClient;
