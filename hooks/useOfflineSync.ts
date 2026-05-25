import { useState } from 'react';

export const useOfflineSync = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const syncNow = async () => {
    console.log('Synchronisation désactivée - mode hors ligne');
    return { success: false, message: 'Sync désactivée' };
  };

  return {
    isOnline: true,
    isSyncing: false,
    lastSync: null,
    syncNow
  };
};