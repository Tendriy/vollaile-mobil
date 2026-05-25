import { useRouter, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Dimensions, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../constants/colors';
import { useAuth } from '../../hooks/useAuth';
import { useOfflineSync } from '../../hooks/useOfflineSync';
import { 
  getLots, 
  getStock, 
  getVaccins, 
  getVentes
} from '../../services/database-wrapper';
import { appEvents, EVENTS } from '../../services/eventEmitter';

// Types
interface LotType {
  id: number;
  nom_lot: string;
  race?: string;
  statut: 'actif' | 'cloture';
  nombre_initial: number;
  nombre_restant?: number;
  total_morts?: number;
  total_vendus?: number;
  age?: number;
  created_at?: string;
  date_arrivee?: string;
}

interface StockType {
  id: number;
  type_aliment: string;
  quantite: number;
  unite: string;
  seuil_alerte: number;
}

interface VaccinType {
  id: number;
  lot_id: number;
  nom_lot?: string;
  type_vaccin: string;
  date_programmee: string;
  statut: string;
}

interface VenteType {
  id: number;
  date_vente: string;
  nombre_vendu: number;
  prix_unitaire: number;
  lot_id: number;
  nom_lot?: string;
}

export default function DashboardScreen() {
  const { user, loading: authLoading } = useAuth();
  const { syncNow, isSyncing, lastSync } = useOfflineSync();
  const { t } = useTranslation();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Données brutes de l'API
  const [allLots, setAllLots] = useState<LotType[]>([]);
  const [allStock, setAllStock] = useState<StockType[]>([]);
  const [allVaccins, setAllVaccins] = useState<VaccinType[]>([]);
  const [allVentes, setAllVentes] = useState<VenteType[]>([]);
  
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    const date = new Date();
    setCurrentDate(date.toLocaleDateString('fr-FR', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }));
  }, []);

  // Chargement initial
  useEffect(() => {
    if (user?.id) {
      loadAllData();
    }
  }, [user]);

  // ÉCOUTE DES ÉVÉNEMENTS - Mise à jour automatique
  useEffect(() => {
    const handleDataChange = () => {
      console.log('🔄 Données modifiées, rechargement du dashboard...');
      loadAllData();
    };

    // S'abonner à tous les événements
    appEvents.on(EVENTS.DATA_CHANGED, handleDataChange);
    appEvents.on(EVENTS.LOT_ADDED, handleDataChange);
    appEvents.on(EVENTS.VENTE_ADDED, handleDataChange);
    appEvents.on(EVENTS.VACCIN_ADDED, handleDataChange);
    appEvents.on(EVENTS.STOCK_UPDATED, handleDataChange);
    appEvents.on(EVENTS.SUIVI_ADDED, handleDataChange);

    // Nettoyage des abonnements
    return () => {
      appEvents.off(EVENTS.DATA_CHANGED, handleDataChange);
      appEvents.off(EVENTS.LOT_ADDED, handleDataChange);
      appEvents.off(EVENTS.VENTE_ADDED, handleDataChange);
      appEvents.off(EVENTS.VACCIN_ADDED, handleDataChange);
      appEvents.off(EVENTS.STOCK_UPDATED, handleDataChange);
      appEvents.off(EVENTS.SUIVI_ADDED, handleDataChange);
    };
  }, []);

  // RECHARGEMENT QUAND L'ÉCRAN EST FOCUS
  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        console.log('📱 Dashboard focus, rechargement...');
        loadAllData();
      }
    }, [user?.id])
  );

  const loadAllData = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [lotsData, stockData, vaccinsData, ventesData] = await Promise.all([
        getLots(user.id),
        getStock(user.id),
        getVaccins(user.id),
        getVentes(user.id)
      ]);
      
      setAllLots(Array.isArray(lotsData) ? lotsData : []);
      setAllStock(Array.isArray(stockData) ? stockData : []);
      setAllVaccins(Array.isArray(vaccinsData) ? vaccinsData : []);
      setAllVentes(Array.isArray(ventesData) ? ventesData : []);
      
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAllData();
    await syncNow();
    setRefreshing(false);
  };

  // ==================== CALCULS DYNAMIQUES ====================

  // 1. Calcul des morts par lot (à partir des données du lot lui-même)
  const getMortsParLot = (lot: LotType): number => {
    return lot.total_morts || 0;
  };

  // 2. Calcul des ventes par lot (à partir des données du lot lui-même)
  const getVendusParLot = (lot: LotType): number => {
    return lot.total_vendus || 0;
  };

  // 3. Calcul du nombre restant par lot
  const getRestantParLot = (lot: LotType): number => {
    const morts = getMortsParLot(lot);
    const vendus = getVendusParLot(lot);
    const restant = lot.nombre_initial - morts - vendus;
    return restant > 0 ? restant : 0;
  };

  // 4. Lots avec données complètes
  const lotsWithData = allLots.map(lot => ({
    ...lot,
    total_morts: lot.total_morts || 0,
    total_vendus: lot.total_vendus || 0,
    nombre_restant: getRestantParLot(lot)
  }));

  // 5. Statistiques principales
  const lotsActifs = lotsWithData.filter(l => l.statut === 'actif').length;
  const lotsClosed = lotsWithData.filter(l => l.statut === 'cloture').length;
  const lotsTotal = lotsWithData.length || 1;
  
  // Total des volailles vivantes (uniquement dans les lots actifs)
  const totalVolailles = lotsWithData
    .filter(l => l.statut === 'actif')
    .reduce((sum, l) => sum + l.nombre_restant, 0);
  
  // Alertes stock
  const alertesStock = allStock.filter(item => 
    item && (item.quantite || 0) <= (item.seuil_alerte || 0)
  );
  
  // Vaccins programmés
  const vaccinsProgrammes = allVaccins.filter(v => v && v.statut === 'programme').length;
  
  // Alertes vaccins (dans les 3 jours)
  const alertesVaccins = allVaccins.filter(v => {
    if (!v || v.statut !== 'programme') return false;
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const troisJoursPlusTard = new Date(today);
      troisJoursPlusTard.setDate(today.getDate() + 3);
      const dateProg = new Date(v.date_programmee);
      return dateProg >= today && dateProg <= troisJoursPlusTard;
    } catch {
      return false;
    }
  }).map(v => ({
    ...v,
    message: `${v.nom_lot || 'Lot inconnu'} : ${v.type_vaccin || 'Vaccin'}`
  }));

  // 6. Ventes mensuelles
  const getVentesMensuelles = () => {
    const ventesParMois: Record<string, number> = {};
    let total = 0;
    allVentes.forEach((vente) => {
      if (vente && vente.date_vente) {
        const date = new Date(vente.date_vente);
        if (!isNaN(date.getTime())) {
          const mois = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          const montant = (vente.nombre_vendu || 0) * (vente.prix_unitaire || 0);
          ventesParMois[mois] = (ventesParMois[mois] || 0) + montant;
          total += montant;
        }
      }
    });
    return { ventesParMois, total };
  };

  const { ventesParMois, total: totalVentes } = getVentesMensuelles();

  // 7. Lots avec mortalité élevée (>10%)
  const lotsMortaliteEleve = lotsWithData.filter(lot => {
    if (!lot || lot.statut !== 'actif') return false;
    const totalMorts = lot.total_morts || 0;
    const initial = lot.nombre_initial || 1;
    const taux = (totalMorts / initial) * 100;
    return taux > 10;
  }).map(lot => {
    const totalMorts = lot.total_morts || 0;
    const initial = lot.nombre_initial || 1;
    return {
      ...lot,
      taux_mortalite: ((totalMorts / initial) * 100).toFixed(1)
    };
  });

  // 8. Mortalité moyenne globale
  const totalMortsGlobal = lotsWithData.reduce((s, l) => s + (l.total_morts || 0), 0);
  const totalInitialGlobal = lotsWithData.reduce((s, l) => s + (l.nombre_initial || 0), 0);
  const mortaliteMoyenne = totalInitialGlobal > 0 
    ? ((totalMortsGlobal / totalInitialGlobal) * 100).toFixed(1) 
    : '0';

  // 9. Lots récents (5 derniers)
  const lotsRecents = [...lotsWithData]
    .sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at) : new Date(0);
      const dateB = b.created_at ? new Date(b.created_at) : new Date(0);
      return dateB.getTime() - dateA.getTime();
    })
    .slice(0, 5)
    .map(lot => {
      let age = 0;
      if (lot.date_arrivee) {
        const arrivee = new Date(lot.date_arrivee);
        const aujourdhui = new Date();
        const diffTime = Math.abs(aujourdhui.getTime() - arrivee.getTime());
        age = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }
      return { ...lot, age };
    });

  // 10. Pourcentages pour les graphiques
  const lotsActifsPercent = lotsTotal > 0 ? (lotsActifs / lotsTotal) * 100 : 0;
  const lotsClosedPercent = lotsTotal > 0 ? (lotsClosed / lotsTotal) * 100 : 0;
  
  const stockTotal = allStock.length || 1;
  const stockLow = alertesStock.length;
  const stockLowPercent = stockTotal > 0 ? ((stockLow / stockTotal) * 100).toFixed(1) : '0';
  
  // 11. Données pour le graphique des ventes
  const monthlySalesData = Object.entries(ventesParMois)
    .map(([mois, total]) => ({ mois, total: Number(total) }))
    .sort((a, b) => a.mois.localeCompare(b.mois))
    .slice(-6);
  const maxSales = monthlySalesData.length > 0 ? Math.max(...monthlySalesData.map(d => d.total), 1) : 1;

  const formatPrice = (prix: number) => {
    if (!prix || prix === 0) return '0';
    try {
      return new Intl.NumberFormat('fr-FR').format(Math.round(prix));
    } catch {
      return String(prix);
    }
  };

  const formatMoisCourt = (mois: string) => {
    if (!mois) return '';
    const [annee, moisNum] = mois.split('-');
    const moisNoms = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    return `${moisNoms[parseInt(moisNum, 10) - 1]} ${annee}`;
  };

  const getSalesBarColor = (index: number) => {
    const colorsBar = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
    return colorsBar[index % colorsBar.length];
  };

  const getMortalityClass = (taux: number) => {
    if (taux <= 5) return colors.green;
    if (taux <= 10) return colors.amber;
    return colors.terra;
  };

  const getMortalityBgClass = (taux: number) => {
    if (taux <= 5) return colors.greenPale;
    if (taux <= 10) return colors.wheat;
    return colors.terraLight;
  };

  const voirLot = (id: number) => {
    router.push(`/lot/${id}`);
  };

  const getSyncDisplay = () => {
    if (isSyncing) return '⏳ Synchronisation...';
    if (lastSync) return `🔄 ${new Date(lastSync).toLocaleTimeString()}`;
    return '🔄 Synchroniser';
  };

  if (authLoading || loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.cream }}>
        <ActivityIndicator size="large" color={colors.amber} />
        <Text style={{ marginTop: 16, color: colors.inkSoft }}>Chargement du tableau de bord...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.cream }}>
        <Text style={{ fontSize: 16, color: colors.ink, marginBottom: 16 }}>Veuillez vous connecter</Text>
        <TouchableOpacity 
          onPress={() => router.push('/login')}
          style={{ backgroundColor: colors.amber, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 }}
        >
          <Text style={{ color: 'white', fontWeight: '600' }}>Se connecter</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView 
      style={{ flex: 1, backgroundColor: colors.cream }}
      refreshControl={<RefreshControl refreshing={refreshing || isSyncing} onRefresh={onRefresh} colors={[colors.amber]} />}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ padding: 16, paddingBottom: 80 }}>
        
        {/* HEADER */}
        <LinearGradient
          colors={['#78350F', '#92400E', '#A16207']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ borderRadius: 20, padding: 20, marginBottom: 16 }}
        >
          <View>
            <Text style={{ color: 'rgba(254,243,199,0.6)', fontSize: 11, fontWeight: '600', textTransform: 'uppercase', marginBottom: 4 }}>
              🐔 Fiompiana vorona Nohatraraina
            </Text>
            <Text style={{ fontFamily: 'PlayfairDisplay', color: '#FEF3C7', fontSize: 26, fontWeight: 'bold' }}>
              {t('dashboard')}
            </Text>
            <Text style={{ color: 'rgba(254,243,199,0.5)', fontSize: 11, marginTop: 4 }}>
              {currentDate}
            </Text>
          </View>
          
          {/* Stats dans l'en-tête - TOUT EST DYNAMIQUE */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(254,243,199,0.15)' }}>
            <View style={{ flexDirection: 'row', gap: 20 }}>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontFamily: 'PlayfairDisplay', color: '#FDE68A', fontSize: 22, fontWeight: 'bold' }}>{lotsActifs}</Text>
                <Text style={{ color: 'rgba(254,243,199,0.55)', fontSize: 10 }}>Lots actifs</Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontFamily: 'PlayfairDisplay', color: '#FDE68A', fontSize: 22, fontWeight: 'bold' }}>{totalVolailles}</Text>
                <Text style={{ color: 'rgba(254,243,199,0.55)', fontSize: 10 }}>Volailles</Text>
              </View>
            </View>
            <TouchableOpacity 
              onPress={syncNow}
              style={{ backgroundColor: 'rgba(254,243,199,0.12)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(254,243,199,0.2)' }}
            >
              <Text style={{ color: '#FEF3C7', fontSize: 10 }}>{getSyncDisplay()}</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* ALERTES STOCK - DYNAMIQUE */}
        {alertesStock.length > 0 && (
          <View style={{ backgroundColor: 'white', borderRadius: 16, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: colors.amber, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
            <View style={{ padding: 14, flexDirection: 'row', gap: 12 }}>
              <View style={{ width: 44, height: 44, backgroundColor: colors.wheat, borderRadius: 12, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 22 }}>⚠️</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <Text style={{ fontWeight: '700', color: colors.ink, fontSize: 14 }}>{t('stock_alerts')}</Text>
                  <View style={{ backgroundColor: colors.wheat, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 }}>
                    <Text style={{ color: '#92400E', fontSize: 11, fontWeight: '600' }}>{alertesStock.length}</Text>
                  </View>
                </View>
                {alertesStock.slice(0, 4).map((alerte, idx) => (
                  <View key={alerte.id || idx} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.amber }} />
                    <Text style={{ fontSize: 12, color: colors.inkSoft }}>
                      {alerte.type_aliment || 'Aliment'}: <Text style={{ fontWeight: '600', color: colors.terra }}>{alerte.quantite || 0} {alerte.unite || 'kg'}</Text> restants
                      <Text style={{ fontSize: 10, color: colors.inkMuted }}> (seuil: {alerte.seuil_alerte})</Text>
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* ALERTES VACCINS - DYNAMIQUE */}
        {alertesVaccins.length > 0 && (
          <View style={{ backgroundColor: 'white', borderRadius: 16, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: colors.terra, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
            <View style={{ padding: 14, flexDirection: 'row', gap: 12 }}>
              <View style={{ width: 44, height: 44, backgroundColor: colors.terraLight, borderRadius: 12, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 22 }}>💉</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <Text style={{ fontWeight: '700', color: colors.ink, fontSize: 14 }}>{t('vaccine_reminder')}</Text>
                  <View style={{ backgroundColor: colors.terraLight, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 }}>
                    <Text style={{ color: colors.terra, fontSize: 11, fontWeight: '600' }}>{alertesVaccins.length}</Text>
                  </View>
                </View>
                {alertesVaccins.slice(0, 3).map((vaccin, idx) => (
                  <View key={vaccin.id || idx} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.terra }} />
                    <Text style={{ fontSize: 12, color: colors.inkSoft }}>{vaccin.message}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* ALERTES MORTALITÉ ÉLEVÉE - DYNAMIQUE */}
        {lotsMortaliteEleve.length > 0 && (
          <View style={{ backgroundColor: 'white', borderRadius: 16, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: '#C2410C', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
            <View style={{ padding: 14, flexDirection: 'row', gap: 12 }}>
              <View style={{ width: 44, height: 44, backgroundColor: '#FFF1EE', borderRadius: 12, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 22 }}>📉</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <Text style={{ fontWeight: '700', color: colors.ink, fontSize: 14 }}>⚠️ Alerte mortalité élevée</Text>
                  <View style={{ backgroundColor: '#C2410C', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 }}>
                    <Text style={{ color: 'white', fontSize: 11, fontWeight: '600' }}>{lotsMortaliteEleve.length}</Text>
                  </View>
                </View>
                {lotsMortaliteEleve.slice(0, 3).map((lot, idx) => (
                  <TouchableOpacity key={lot.id || idx} onPress={() => voirLot(lot.id)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, paddingVertical: 4 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#C2410C' }} />
                      <Text style={{ fontSize: 12, color: colors.inkSoft }}>
                        <Text style={{ fontWeight: '600' }}>{lot.nom_lot}</Text>
                      </Text>
                    </View>
                    <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#C2410C' }}>{lot.taux_mortalite}%</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* STATS GRID - 4 CARTES DYNAMIQUES */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
          <TouchableOpacity onPress={() => router.push('/lots')} style={{ width: '48%', backgroundColor: 'white', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
            <View style={{ backgroundColor: colors.greenLight, width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ fontSize: 20 }}>🐔</Text>
            </View>
            <Text style={{ fontSize: 11, color: colors.inkMuted, textTransform: 'uppercase' }}>{t('active_lots')}</Text>
            <Text style={{ fontFamily: 'PlayfairDisplay', fontSize: 28, fontWeight: 'bold', color: colors.ink }}>{lotsActifs}</Text>
            <Text style={{ fontSize: 10, color: colors.green }}>{lotsActifsPercent.toFixed(1)}% du total</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/lots')} style={{ width: '48%', backgroundColor: 'white', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
            <View style={{ backgroundColor: colors.wheat, width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ fontSize: 20 }}>🐓</Text>
            </View>
            <Text style={{ fontSize: 11, color: colors.inkMuted, textTransform: 'uppercase' }}>{t('total_poultry')}</Text>
            <Text style={{ fontFamily: 'PlayfairDisplay', fontSize: 28, fontWeight: 'bold', color: colors.ink }}>{totalVolailles}</Text>
            <Text style={{ fontSize: 10, color: colors.inkSoft }}>vivantes</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/stock')} style={{ width: '48%', backgroundColor: 'white', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
            <View style={{ backgroundColor: '#FFF7ED', width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ fontSize: 20 }}>📦</Text>
            </View>
            <Text style={{ fontSize: 11, color: colors.inkMuted, textTransform: 'uppercase' }}>{t('stock_alerts')}</Text>
            <Text style={{ fontFamily: 'PlayfairDisplay', fontSize: 28, fontWeight: 'bold', color: alertesStock.length > 0 ? colors.amber : colors.green }}>
              {alertesStock.length}
            </Text>
            <Text style={{ fontSize: 10, color: colors.inkSoft }}>{stockLowPercent}% du stock</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/vaccins')} style={{ width: '48%', backgroundColor: 'white', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
            <View style={{ backgroundColor: colors.terraLight, width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ fontSize: 20 }}>💉</Text>
            </View>
            <Text style={{ fontSize: 11, color: colors.inkMuted, textTransform: 'uppercase' }}>Vaccins à venir</Text>
            <Text style={{ fontFamily: 'PlayfairDisplay', fontSize: 28, fontWeight: 'bold', color: vaccinsProgrammes > 0 ? colors.terra : colors.green }}>
              {vaccinsProgrammes}
            </Text>
            <Text style={{ fontSize: 10, color: colors.inkSoft }}>programmés</Text>
          </TouchableOpacity>
        </View>

        {/* RÉPARTITION DES LOTS - DYNAMIQUE */}
        <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <Text style={{ fontWeight: '700', color: colors.ink, fontSize: 14 }}>📊 {t('lots_distribution')}</Text>
            <View style={{ backgroundColor: colors.wheat, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: '#92400E' }}>{lotsTotal} lots</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 24 }}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#15803D' }} />
                <Text style={{ fontSize: 12 }}>{t('active')}: <Text style={{ fontWeight: 'bold' }}>{lotsActifs}</Text> ({lotsActifsPercent.toFixed(1)}%)</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#A8A29E' }} />
                <Text style={{ fontSize: 12 }}>{t('closed')}: <Text style={{ fontWeight: 'bold' }}>{lotsClosed}</Text> ({lotsClosedPercent.toFixed(1)}%)</Text>
              </View>
            </View>
          </View>
          {/* Barre de progression */}
          <View style={{ marginTop: 12, height: 8, backgroundColor: '#E5E7EB', borderRadius: 4, overflow: 'hidden' }}>
            <View style={{ width: `${lotsActifsPercent}%`, height: '100%', backgroundColor: '#15803D' }} />
          </View>
        </View>

        {/* GRAPHIQUE VENTES MENSUELLES - DYNAMIQUE */}
        <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <Text style={{ fontWeight: '700', color: colors.ink, fontSize: 14 }}>💰 {t('monthly_sales')}</Text>
            <View style={{ backgroundColor: colors.greenLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 }}>
              <Text style={{ fontSize: 10, fontWeight: '600', color: colors.green }}>Total: {formatPrice(totalVentes)} Ar</Text>
            </View>
          </View>
          
          {monthlySalesData.length > 0 ? (
            monthlySalesData.map((item, idx) => (
              <View key={idx} style={{ marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: colors.ink }}>{formatMoisCourt(item.mois)}</Text>
                  <Text style={{ fontSize: 11, color: colors.inkSoft }}>{formatPrice(item.total)} Ar</Text>
                </View>
                <View style={{ height: 32, backgroundColor: colors.parchment, borderRadius: 8, overflow: 'hidden' }}>
                  <View 
                    style={{ 
                      height: '100%', 
                      width: `${(item.total / maxSales) * 100}%`, 
                      backgroundColor: getSalesBarColor(idx),
                      borderRadius: 8,
                      justifyContent: 'center',
                      paddingLeft: 8
                    }}
                  >
                    <Text style={{ fontSize: 10, color: 'white', fontWeight: '600' }}>
                      {Math.round((item.total / maxSales) * 100)}%
                    </Text>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View style={{ paddingVertical: 30, alignItems: 'center' }}>
              <Text style={{ fontSize: 32, opacity: 0.4 }}>📊</Text>
              <Text style={{ color: colors.inkMuted }}>Aucune donnée de vente</Text>
            </View>
          )}
        </View>

        {/* STATISTIQUES RAPIDES - DYNAMIQUE */}
        <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          <View style={{ flex: 1, backgroundColor: colors.greenLight, padding: 12, borderRadius: 12 }}>
            <Text style={{ fontSize: 10, color: colors.green }}>Taux mortalité moyen</Text>
            <Text style={{ fontSize: 22, fontWeight: 'bold', color: colors.green }}>{mortaliteMoyenne}%</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: colors.wheat, padding: 12, borderRadius: 12 }}>
            <Text style={{ fontSize: 10, color: colors.amber }}>Lots clôturés</Text>
            <Text style={{ fontSize: 22, fontWeight: 'bold', color: colors.amber }}>{lotsClosed}</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: colors.terraLight, padding: 12, borderRadius: 12 }}>
            <Text style={{ fontSize: 10, color: colors.terra }}>Vaccins programmés</Text>
            <Text style={{ fontSize: 22, fontWeight: 'bold', color: colors.terra }}>{vaccinsProgrammes}</Text>
          </View>
        </View>

        {/* LOTS RÉCENTS - DYNAMIQUE */}
        <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ fontWeight: '700', color: colors.ink, fontSize: 14 }}>📋 {t('recent_lots')}</Text>
            <TouchableOpacity onPress={() => router.push('/lots')}>
              <Text style={{ color: colors.amber, fontSize: 12 }}>Voir tous →</Text>
            </TouchableOpacity>
          </View>
          
          {lotsRecents.map((lot) => (
            <TouchableOpacity 
              key={lot.id} 
              onPress={() => voirLot(lot.id)} 
              style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border }}
            >
              <View style={{ backgroundColor: colors.wheat, width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                <Text>🐔</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '600', color: colors.ink }}>{lot.nom_lot}</Text>
                <Text style={{ fontSize: 10, color: colors.inkSoft }}>{lot.race || '—'} • {lot.age || 0} jours</Text>
              </View>
              <View style={{ backgroundColor: lot.statut === 'actif' ? colors.greenPale : '#F5F5F4', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 }}>
                <Text style={{ fontSize: 10, fontWeight: '600', color: lot.statut === 'actif' ? colors.green : colors.inkMuted }}>
                  {lot.statut === 'actif' ? 'Actif' : 'Clôturé'}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
          {lotsRecents.length === 0 && (
            <View style={{ paddingVertical: 30, alignItems: 'center' }}>
              <Text style={{ fontSize: 32, opacity: 0.4 }}>🐔</Text>
              <Text style={{ color: colors.inkMuted }}>Aucun lot enregistré</Text>
            </View>
          )}
        </View>

        {/* FOOTER STATS - DYNAMIQUE */}
        <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 14, flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ backgroundColor: colors.wheat, width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' }}>
              <Text>📅</Text>
            </View>
            <View>
              <Text style={{ fontSize: 9, color: colors.inkMuted }}>Dernière mise à jour</Text>
              <Text style={{ fontSize: 11, fontWeight: '600', color: colors.ink }}>{new Date().toLocaleTimeString()}</Text>
            </View>
          </View>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ backgroundColor: colors.greenLight, width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' }}>
              <Text>💰</Text>
            </View>
            <View>
              <Text style={{ fontSize: 9, color: colors.inkMuted }}>Chiffre d'affaires</Text>
              <Text style={{ fontSize: 11, fontWeight: '600', color: colors.green }}>{formatPrice(totalVentes)} Ar</Text>
            </View>
          </View>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ backgroundColor: colors.terraLight, width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' }}>
              <Text>🐔</Text>
            </View>
            <View>
              <Text style={{ fontSize: 9, color: colors.inkMuted }}>Mortalité moyenne</Text>
              <Text style={{ fontSize: 11, fontWeight: '600', color: colors.terra }}>{mortaliteMoyenne}%</Text>
            </View>
          </View>
        </View>

      </View>
    </ScrollView>
  );
}