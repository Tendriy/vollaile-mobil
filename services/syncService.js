import * as SecureStore from 'expo-secure-store';
import api from './api';
import { getDatabase } from './database-wrapper';

let db = null;

const checkInternetConnection = async () => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const response = await fetch('https://www.google.com', { 
      method: 'HEAD',
      signal: controller.signal 
    });
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    return false;
  }
};

export const syncData = async () => {
  try {
    const isConnected = await checkInternetConnection();
    if (!isConnected) {
      return { success: false, message: 'Pas de connexion internet' };
    }
    
    db = getDatabase();
    if (!db) {
      return { success: false, message: 'Base de données non initialisée' };
    }
    
    const token = await SecureStore.getItemAsync('token');
    if (!token) {
      return { success: false, message: 'Non authentifié' };
    }
    
    const userId = await SecureStore.getItemAsync('userId');
    if (!userId) {
      return { success: false, message: 'Utilisateur non identifié' };
    }
    
    // Synchronisation des lots
    await syncLots(parseInt(userId));
    await syncStock(parseInt(userId));
    
    return { success: true, message: 'Synchronisation terminée' };
  } catch (error) {
    console.error('Sync error:', error);
    return { success: false, message: 'Erreur de synchronisation' };
  }
};

const syncLots = async (userId) => {
  if (!db) return;
  
  try {
    const lotsToSync = db.getAllSync(
      'SELECT * FROM lots WHERE synced = 0 AND deleted = 0 AND user_id = ?',
      [userId]
    );
    
    for (const lot of lotsToSync) {
      try {
        if (lot.id && lot.id > 0) {
          await api.put(`/lots/${lot.id}`, lot);
          db.runSync('UPDATE lots SET synced = 1 WHERE id = ?', [lot.id]);
        }
      } catch (error) {
        console.error('Error syncing lot:', error);
      }
    }
  } catch (error) {
    console.error('Error in syncLots:', error);
  }
};

const syncStock = async (userId) => {
  if (!db) return;
  
  try {
    const stockToSync = db.getAllSync(
      'SELECT * FROM stock_aliment WHERE synced = 0 AND deleted = 0 AND user_id = ?',
      [userId]
    );
    
    for (const item of stockToSync) {
      try {
        if (item.id && item.id > 0) {
          await api.put(`/stock/${item.id}`, item);
          db.runSync('UPDATE stock_aliment SET synced = 1 WHERE id = ?', [item.id]);
        }
      } catch (error) {
        console.error('Error syncing stock:', error);
      }
    }
  } catch (error) {
    console.error('Error in syncStock:', error);
  }
};