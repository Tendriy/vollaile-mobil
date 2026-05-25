import axios from 'axios';

// Configuration pour le mode hors ligne
// L'API n'est pas utilisée actuellement car l'application fonctionne 100% en local avec SQLite

// Pour une éventuelle synchronisation future, décommentez et configurez votre IP
// const SERVER_IP = '192.168.0.110'; // Remplacez par l'IP de votre serveur
// const PORT = '3000';
// const API_URL = `http://${SERVER_IP}:${PORT}/api`;

// Version pour développement (ne fait rien en mode hors ligne)
const API_URL = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Intercepteur pour logger les requêtes (optionnel)
api.interceptors.request.use(
  (config) => {
    console.log(`📤 [API] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('📤 [API] Request error:', error);
    return Promise.reject(error);
  }
);

// Intercepteur pour logger les réponses
api.interceptors.response.use(
  (response) => {
    console.log(`📥 [API] ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    if (error.response) {
      console.error(`📥 [API] Error ${error.response.status}:`, error.response.data);
    } else if (error.request) {
      console.error('📥 [API] No response from server:', error.request);
    } else {
      console.error('📥 [API] Request error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;