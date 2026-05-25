import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';
import { getUserByEmail, initDatabase, registerUser, createDefaultUser } from '../services/database-wrapper';

export const useAuth = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const storedUser = await SecureStore.getItemAsync('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
      await initDatabase();
    } catch (error) {
      console.error('Load user error:', error);
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: {
    nom_complet: string;
    username: string;
    email: string;
    password: string;
  }) => {
    try {
      setLoading(true);
      const result = await registerUser(userData);
      
      if (result.success) {
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Register error:', error);
      return { success: false, error: 'Erreur lors de l\'inscription' };
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const userData = await getUserByEmail(email);
      
      if (!userData) {
        return { success: false, error: 'Email ou mot de passe incorrect' };
      }
      
      // Vérification du mot de passe
      if (userData.password === password) {
        await SecureStore.setItemAsync('token', 'mobile-token-' + Date.now());
        await SecureStore.setItemAsync('user', JSON.stringify(userData));
        await SecureStore.setItemAsync('userId', String(userData.id));
        setUser(userData);
        return { success: true };
      } else {
        return { success: false, error: 'Email ou mot de passe incorrect' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Erreur de connexion' };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await SecureStore.deleteItemAsync('token');
      await SecureStore.deleteItemAsync('user');
      await SecureStore.deleteItemAsync('userId');
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  return { 
    user, 
    loading, 
    login, 
    logout, 
    register 
  };
};