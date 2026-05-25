import { useEffect, useState } from 'react';
import {
  addLot, addStock, addVaccin, addVente,
  deleteLot, deleteStock, deleteVaccin,
  getDashboardStats, getLots, getStock,
  getVaccins, getVentes, markVaccinDone,
  updateLot, updateStock
} from '../services/database-wrapper';

export const useDatabase = (userId: number | undefined | null) => {
  const [lots, setLots] = useState<any[]>([]);
  const [stock, setStock] = useState<any[]>([]);
  const [ventes, setVentes] = useState<any[]>([]);
  const [vaccins, setVaccins] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    
    loadAllData();
  }, [userId]);

  const loadAllData = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const [lotsData, stockData, ventesData, vaccinsData, statsData] = await Promise.all([
        getLots(userId),
        getStock(userId),
        getVentes(userId),
        getVaccins(userId),
        getDashboardStats(userId)
      ]);
      
      setLots(lotsData || []);
      setStock(stockData || []);
      setVentes(ventesData || []);
      setVaccins(vaccinsData || []);
      setStats(statsData || {});
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createLot = async (lot: any) => {
    if (!userId) return;
    const id = await addLot({ ...lot, user_id: userId });
    await loadAllData();
    return id;
  };

  const editLot = async (id: number, lot: any) => {
    await updateLot(id, lot);
    await loadAllData();
  };

  const removeLot = async (id: number) => {
    await deleteLot(id);
    await loadAllData();
  };

  const createStock = async (stockItem: any) => {
    if (!userId) return;
    const id = await addStock({ ...stockItem, user_id: userId });
    await loadAllData();
    return id;
  };

  const editStock = async (id: number, stockItem: any) => {
    await updateStock(id, stockItem);
    await loadAllData();
  };

  const removeStock = async (id: number) => {
    await deleteStock(id);
    await loadAllData();
  };

  const createVente = async (vente: any) => {
    if (!userId) return;
    const id = await addVente(vente);
    await loadAllData();
    return id;
  };

  const createVaccin = async (vaccin: any) => {
    if (!userId) return;
    const id = await addVaccin(vaccin);
    await loadAllData();
    return id;
  };

  const completeVaccin = async (id: number) => {
    await markVaccinDone(id);
    await loadAllData();
  };

  const removeVaccin = async (id: number) => {
    await deleteVaccin(id);
    await loadAllData();
  };

  const manualSync = async () => {
    return { success: false, message: 'Sync désactivée - mode hors ligne' };
  };

  const refreshData = async () => {
    await loadAllData();
  };

  return {
    loading,
    isOnline: true,
    lots,
    stock,
    ventes,
    vaccins,
    stats,
    createLot,
    editLot,
    removeLot,
    createStock,
    editStock,
    removeStock,
    createVente,
    createVaccin,
    completeVaccin,
    removeVaccin,
    manualSync,
    refreshData
  };
};