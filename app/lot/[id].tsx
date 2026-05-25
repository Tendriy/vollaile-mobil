import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, FlatList, Modal, RefreshControl, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { colors } from '../../constants/colors';
import { useAuth } from '../../hooks/useAuth';
import { addSuivi, cloturerLot, getLots, getStock, getSuivis, updateStock } from '../../services/database-wrapper';
import { appEvents, EVENTS } from '../../services/eventEmitter';

// Types
interface LotType {
  id: number;
  nom_lot: string;
  race?: string;
  fournisseur?: string;
  nombre_initial: number;
  nombre_restant?: number;
  total_morts?: number;
  total_vendus?: number;
  date_arrivee: string;
  statut: 'actif' | 'cloture';
  age?: number;
  taux_mortalite?: number;
}

interface SuiviType {
  id: number;
  date_suivi: string;
  temperature?: number;
  consommation_aliment?: number;
  consommations?: string;
  mortalite_jour?: number;
  observations?: string;
}

interface StockType {
  id: number;
  type_aliment: string;
  quantite: number;
  unite: string;
  seuil_alerte: number;
}

export default function LotDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [suivis, setSuivis] = useState<SuiviType[]>([]);
  const [lot, setLot] = useState<LotType | null>(null);
  const [stocks, setStocks] = useState<StockType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStockForPicker, setSelectedStockForPicker] = useState<{ index: number; visible: boolean }>({ index: -1, visible: false });
  
  const lotId = id ? Number(id) : 0;
  
  const [form, setForm] = useState({
    date_suivi: new Date().toISOString().split('T')[0],
    temperature: '',
    consumptions: [] as { selectedStockId: string; quantite: string; unite: string; type_aliment: string }[],
    mortalite_jour: '0',
    observations: ''
  });

  useEffect(() => {
    if (lotId > 0 && user?.id) {
      loadData();
    }
  }, [lotId, user]);

  // ÉCOUTE DES ÉVÉNEMENTS - Mise à jour automatique
  useEffect(() => {
    const handleDataChange = () => {
      console.log('🔄 Données modifiées, rechargement du lot...');
      if (lotId > 0 && user?.id) {
        loadData();
      }
    };

    // S'abonner aux événements
    appEvents.on(EVENTS.DATA_CHANGED, handleDataChange);
    appEvents.on(EVENTS.SUIVI_ADDED, handleDataChange);
    appEvents.on(EVENTS.VENTE_ADDED, handleDataChange);
    appEvents.on(EVENTS.LOT_ADDED, handleDataChange);
    appEvents.on(EVENTS.STOCK_UPDATED, handleDataChange);

    // Nettoyage
    return () => {
      appEvents.off(EVENTS.DATA_CHANGED, handleDataChange);
      appEvents.off(EVENTS.SUIVI_ADDED, handleDataChange);
      appEvents.off(EVENTS.VENTE_ADDED, handleDataChange);
      appEvents.off(EVENTS.LOT_ADDED, handleDataChange);
      appEvents.off(EVENTS.STOCK_UPDATED, handleDataChange);
    };
  }, [lotId, user?.id]);

  // RECHARGEMENT QUAND L'ÉCRAN EST FOCUS
  useFocusEffect(
    useCallback(() => {
      if (lotId > 0 && user?.id) {
        console.log('📱 Lot detail screen focus, rechargement...');
        loadData();
      }
    }, [lotId, user?.id])
  );

  const loadData = async () => {
    setLoading(true);
    try {
      const lotsData = await getLots(user?.id);
      const foundLot = lotsData.find((l: LotType) => l.id === lotId);
      
      if (foundLot) {
        // Calcul des restants = initial - (morts + vendus)
        const totalMorts = foundLot.total_morts || 0;
        const totalVendus = foundLot.total_vendus || 0;
        const nombreRestant = foundLot.nombre_initial - totalMorts - totalVendus;
        const tauxMortalite = foundLot.nombre_initial > 0 ? (totalMorts / foundLot.nombre_initial) * 100 : 0;
        
        setLot({ 
          ...foundLot, 
          taux_mortalite: tauxMortalite,
          nombre_restant: nombreRestant > 0 ? nombreRestant : 0
        });
      } else {
        setLot(null);
      }
      
      const suivisData = await getSuivis(lotId);
      setSuivis(Array.isArray(suivisData) ? suivisData : []);
      
      const stocksData = await getStock(user?.id);
      setStocks(Array.isArray(stocksData) ? stocksData : []);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Erreur', 'Impossible de charger les données');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const addConsumption = () => {
    setForm({
      ...form,
      consumptions: [...form.consumptions, { selectedStockId: '', quantite: '', unite: 'kg', type_aliment: '' }]
    });
  };

  const removeConsumption = (index: number) => {
    const newConsumptions = [...form.consumptions];
    newConsumptions.splice(index, 1);
    setForm({ ...form, consumptions: newConsumptions });
  };

  const selectStock = (index: number, stock: StockType) => {
    const newConsumptions = [...form.consumptions];
    newConsumptions[index] = {
      ...newConsumptions[index],
      selectedStockId: String(stock.id),
      type_aliment: stock.type_aliment,
      unite: 'kg'
    };
    setForm({ ...form, consumptions: newConsumptions });
    setSelectedStockForPicker({ index: -1, visible: false });
  };

  const updateConsumptionQty = (index: number, quantite: string) => {
    const newConsumptions = [...form.consumptions];
    newConsumptions[index].quantite = quantite;
    setForm({ ...form, consumptions: newConsumptions });
  };

  const updateConsumptionUnit = (index: number, unite: string) => {
    const newConsumptions = [...form.consumptions];
    newConsumptions[index].unite = unite;
    setForm({ ...form, consumptions: newConsumptions });
  };

  const getStockWarnings = (): string[] => {
    const warnings: string[] = [];
    for (const item of form.consumptions) {
      if (!item.selectedStockId || !item.quantite || parseFloat(item.quantite) <= 0) continue;
      
      const stock = stocks.find(s => s.id === parseInt(item.selectedStockId, 10));
      if (!stock) continue;
      
      const quantiteConsommee = parseFloat(item.quantite);
      let stockActuelKg = parseFloat(String(stock.quantite));
      if (stock.unite === 'sac') stockActuelKg = stockActuelKg * 50;
      
      let seuilAlerteKg = parseFloat(String(stock.seuil_alerte)) || 50;
      let quantiteConsommeeKg = quantiteConsommee;
      if (item.unite === 'sac') quantiteConsommeeKg = quantiteConsommee * 50;
      
      if (stockActuelKg < quantiteConsommeeKg) {
        warnings.push(`Stock insuffisant pour "${stock.type_aliment}" ! Reste: ${stockActuelKg.toFixed(2)} kg`);
      } else {
        const resteKg = stockActuelKg - quantiteConsommeeKg;
        if (resteKg <= seuilAlerteKg) {
          warnings.push(`"${stock.type_aliment}" sera en stock faible après consommation`);
        }
      }
    }
    return warnings;
  };

  const saveSuivi = async () => {
    if (!form.date_suivi) {
      Alert.alert('Erreur', 'Veuillez saisir une date');
      return;
    }

    const validConsumptions: { type_aliment: string; quantite: number; unite: string }[] = [];
    let totalEnKg = 0;

    // Vérifier les stocks et préparer les consommations
    for (const item of form.consumptions) {
      if (!item.selectedStockId || !item.quantite || parseFloat(item.quantite) <= 0) continue;
      
      const stock = stocks.find(s => s.id === parseInt(item.selectedStockId, 10));
      if (!stock) continue;
      
      const quantite = parseFloat(item.quantite);
      let quantiteEnKg = quantite;
      if (item.unite === 'sac') quantiteEnKg = quantite * 50;
      
      // Convertir la consommation dans l'unité du stock pour vérification
      let quantiteDansUniteStock = quantite;
      if (stock.unite === 'kg' && item.unite === 'sac') {
        quantiteDansUniteStock = quantite * 50;
      } else if (stock.unite === 'sac' && item.unite === 'kg') {
        quantiteDansUniteStock = quantite / 50;
      }
      
      if (parseFloat(String(stock.quantite)) < quantiteDansUniteStock) {
        Alert.alert('Erreur', `Stock insuffisant pour "${stock.type_aliment}". Il reste ${stock.quantite} ${stock.unite}.`);
        return;
      }
      
      totalEnKg += quantiteEnKg;
      validConsumptions.push({
        type_aliment: stock.type_aliment,
        quantite: quantite,
        unite: item.unite
      });
    }

    // Mettre à jour les stocks
    for (const item of form.consumptions) {
      if (!item.selectedStockId || !item.quantite || parseFloat(item.quantite) <= 0) continue;
      
      const stock = stocks.find(s => s.id === parseInt(item.selectedStockId, 10));
      if (stock) {
        let quantite = parseFloat(item.quantite);
        
        if (stock.unite === 'kg' && item.unite === 'sac') {
          quantite = quantite * 50;
        } else if (stock.unite === 'sac' && item.unite === 'kg') {
          quantite = quantite / 50;
        }
        
        const nouveauStock = parseFloat(String(stock.quantite)) - quantite;
        await updateStock(stock.id, { ...stock, quantite: nouveauStock });
      }
    }

    const mortalite = parseInt(form.mortalite_jour, 10) || 0;

    try {
      await addSuivi({
        lot_id: lotId,
        date_suivi: form.date_suivi,
        temperature: form.temperature ? parseFloat(form.temperature) : null,
        consommation_aliment: totalEnKg,
        consommations: JSON.stringify(validConsumptions),
        mortalite_jour: mortalite,
        observations: form.observations || ''
      });
      
      Alert.alert('Succès', 'Suivi ajouté avec succès');
      setModalVisible(false);
      setForm({
        date_suivi: new Date().toISOString().split('T')[0],
        temperature: '',
        consumptions: [],
        mortalite_jour: '0',
        observations: ''
      });
      await loadData();
      // Émettre l'événement
      appEvents.emit(EVENTS.SUIVI_ADDED);
      appEvents.emit(EVENTS.DATA_CHANGED);
      appEvents.emit(EVENTS.STOCK_UPDATED);
    } catch (error) {
      console.error('Error saving suivi:', error);
      Alert.alert('Erreur', "Erreur lors de l'enregistrement");
    }
  };

  const handleCloturerLot = async () => {
    Alert.alert(
      'Confirmation',
      'Voulez-vous vraiment clôturer ce lot ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Clôturer', onPress: async () => {
          try {
            await cloturerLot(lotId);
            await loadData();
            Alert.alert('Succès', 'Lot clôturé avec succès');
            // Émettre l'événement
            appEvents.emit(EVENTS.LOT_ADDED);
            appEvents.emit(EVENTS.DATA_CHANGED);
          } catch (error) {
            Alert.alert('Erreur', 'Erreur lors de la clôture');
          }
        } }
      ]
    );
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('fr-FR');
    } catch {
      return '—';
    }
  };

  const getConsommations = (consommationsStr?: string) => {
    try {
      return consommationsStr ? JSON.parse(consommationsStr) : [];
    } catch(e) {
      return [];
    }
  };

  const getTauxMortaliteColor = (taux?: number) => {
    if (!taux || taux === 0) return colors.green;
    if (taux > 10) return colors.terra;
    if (taux > 5) return colors.amber;
    return colors.green;
  };

  const stockWarnings = getStockWarnings();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.cream }}>
        <ActivityIndicator size="large" color={colors.amber} />
      </View>
    );
  }

  if (!lot) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.cream }}>
        <Text style={{ marginBottom: 16 }}>Lot non trouvé</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ backgroundColor: colors.amber, padding: 10, borderRadius: 10 }}>
          <Text style={{ color: 'white' }}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const tauxMortalite = lot.taux_mortalite || 0;

  return (
    <ScrollView 
      style={{ flex: 1, backgroundColor: colors.cream }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.amber]} />}
    >
      <View style={{ padding: 16, paddingBottom: 100 }}>
        
        {/* HEADER */}
        <View style={{ marginBottom: 20 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ backgroundColor: 'white', borderWidth: 1.5, borderColor: colors.border, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 100, alignSelf: 'flex-start', marginBottom: 12 }}>
            <Text style={{ color: colors.inkSoft, fontSize: 13 }}>← Retour</Text>
          </TouchableOpacity>
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, color: colors.inkMuted, textTransform: 'uppercase', marginBottom: 4 }}>📋 Détail du lot</Text>
              <Text style={{ fontFamily: 'PlayfairDisplay', fontSize: 24, fontWeight: 'bold', color: colors.ink }}>{lot.nom_lot}</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View style={{ backgroundColor: lot.statut === 'actif' ? colors.greenPale : '#F5F5F4', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100 }}>
                <Text style={{ color: lot.statut === 'actif' ? colors.green : colors.inkMuted, fontSize: 12, fontWeight: '600' }}>
                  {lot.statut === 'actif' ? '🟢 Actif' : '⚫ Clôturé'}
                </Text>
              </View>
              <View style={{ backgroundColor: colors.wheat, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100 }}>
                <Text style={{ color: '#92400E', fontSize: 12, fontWeight: '600' }}>{lot.age || 0} jours</Text>
              </View>
            </View>
          </View>
        </View>

        {/* INFOS GÉNÉRALES */}
        <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.border }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
            <Text style={{ fontWeight: '600', fontSize: 14 }}>ℹ️ Informations générales</Text>
            {lot.statut === 'actif' && (
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity onPress={() => setModalVisible(true)} style={{ backgroundColor: colors.amber, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 100 }}>
                  <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>➕ Suivi</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleCloturerLot} style={{ backgroundColor: 'white', borderWidth: 1.5, borderColor: 'rgba(194,65,12,0.25)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 100 }}>
                  <Text style={{ color: colors.terra, fontSize: 12, fontWeight: '600' }}>🔒 Clôturer</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            <View style={{ width: '48%', backgroundColor: colors.parchment, padding: 12, borderRadius: 12 }}>
              <Text style={{ fontSize: 10, color: colors.inkMuted, textTransform: 'uppercase' }}>Race</Text>
              <Text style={{ fontWeight: '600' }}>{lot.race || '—'}</Text>
            </View>
            <View style={{ width: '48%', backgroundColor: colors.parchment, padding: 12, borderRadius: 12 }}>
              <Text style={{ fontSize: 10, color: colors.inkMuted, textTransform: 'uppercase' }}>Fournisseur</Text>
              <Text style={{ fontWeight: '600' }}>{lot.fournisseur || '—'}</Text>
            </View>
            <View style={{ width: '48%', backgroundColor: colors.parchment, padding: 12, borderRadius: 12 }}>
              <Text style={{ fontSize: 10, color: colors.inkMuted, textTransform: 'uppercase' }}>Nombre initial</Text>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.amber }}>{lot.nombre_initial}</Text>
            </View>
            <View style={{ width: '48%', backgroundColor: colors.parchment, padding: 12, borderRadius: 12 }}>
              <Text style={{ fontSize: 10, color: colors.inkMuted, textTransform: 'uppercase' }}>Restants</Text>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: (lot.nombre_restant || 0) === 0 ? colors.terra : colors.green }}>
                {lot.nombre_restant || 0}
              </Text>
            </View>
            <View style={{ width: '48%', backgroundColor: colors.parchment, padding: 12, borderRadius: 12 }}>
              <Text style={{ fontSize: 10, color: colors.inkMuted, textTransform: 'uppercase' }}>Date d'arrivée</Text>
              <Text style={{ fontWeight: '600' }}>{formatDate(lot.date_arrivee)}</Text>
            </View>
            <View style={{ width: '48%', backgroundColor: colors.parchment, padding: 12, borderRadius: 12 }}>
              <Text style={{ fontSize: 10, color: colors.inkMuted, textTransform: 'uppercase' }}>Âge</Text>
              <Text style={{ fontWeight: '600' }}>{lot.age || 0} jours</Text>
            </View>
            <View style={{ width: '48%', backgroundColor: colors.parchment, padding: 12, borderRadius: 12 }}>
              <Text style={{ fontSize: 10, color: colors.inkMuted, textTransform: 'uppercase' }}>Vendus</Text>
              <Text style={{ fontWeight: '600', color: colors.sky }}>{lot.total_vendus || 0}</Text>
            </View>
            <View style={{ width: '48%', backgroundColor: colors.parchment, padding: 12, borderRadius: 12 }}>
              <Text style={{ fontSize: 10, color: colors.inkMuted, textTransform: 'uppercase' }}>Morts</Text>
              <Text style={{ fontWeight: '600', color: (lot.total_morts || 0) > 0 ? colors.terra : colors.green }}>{lot.total_morts || 0}</Text>
            </View>
            <View style={{ width: '100%', backgroundColor: colors.parchment, padding: 12, borderRadius: 12 }}>
              <Text style={{ fontSize: 10, color: colors.inkMuted, textTransform: 'uppercase' }}>Taux de mortalité</Text>
              <Text style={{ fontWeight: 'bold', fontSize: 18, color: getTauxMortaliteColor(tauxMortalite) }}>
                {tauxMortalite.toFixed(1)}%
              </Text>
            </View>
          </View>
        </View>

        {/* SUIVI QUOTIDIEN */}
        <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ fontWeight: '600', fontSize: 14 }}>📈 Suivi quotidien</Text>
            <View style={{ backgroundColor: colors.wheat, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: '#92400E' }}>{suivis.length} entrées</Text>
            </View>
          </View>
          
          {suivis.length > 0 ? (
            suivis.map((suivi, idx) => {
              const consommations = getConsommations(suivi.consommations);
              return (
                <View key={suivi.id || idx} style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <Text style={{ fontWeight: '600', color: colors.ink }}>{formatDate(suivi.date_suivi)}</Text>
                    {(suivi.mortalite_jour || 0) > 0 && (
                      <View style={{ backgroundColor: colors.terraLight, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 }}>
                        <Text style={{ fontSize: 11, color: colors.terra }}>💀 {suivi.mortalite_jour || 0} morts</Text>
                      </View>
                    )}
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={{ fontSize: 12, color: colors.inkSoft }}>🌡️ Température</Text>
                    <Text style={{ fontWeight: '500' }}>{suivi.temperature ? `${suivi.temperature}°C` : '—'}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={{ fontSize: 12, color: colors.inkSoft }}>🍽️ Consommation</Text>
                    <Text style={{ fontWeight: '500' }}>{suivi.consommation_aliment || 0} kg</Text>
                  </View>
                  {consommations.length > 0 && (
                    <View style={{ marginTop: 4 }}>
                      <Text style={{ fontSize: 11, color: colors.inkMuted, marginBottom: 4 }}>Détails:</Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                        {consommations.map((c: any, i: number) => (
                          <View key={i} style={{ backgroundColor: colors.greenPale, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 }}>
                            <Text style={{ fontSize: 10, color: colors.green }}>{c.type_aliment}: {c.quantite} {c.unite}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                  {suivi.observations && (
                    <Text style={{ fontSize: 12, color: colors.inkSoft, marginTop: 4 }}>📝 {suivi.observations}</Text>
                  )}
                </View>
              );
            })
          ) : (
            <Text style={{ textAlign: 'center', color: colors.inkMuted, paddingVertical: 40 }}>📭 Aucun suivi enregistré</Text>
          )}
        </View>

        {/* MODAL AJOUT SUIVI */}
        <Modal visible={modalVisible} animationType="slide" transparent>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 16 }}>
            <ScrollView style={{ backgroundColor: 'white', borderRadius: 16, maxHeight: '90%' }}>
              <View style={{ padding: 20 }}>
                <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16, textAlign: 'center', color: colors.amber }}>Ajouter un suivi</Text>
                <Text style={{ fontSize: 14, color: colors.inkSoft, textAlign: 'center', marginBottom: 20 }}>{lot.nom_lot}</Text>
                
                {/* Date */}
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', marginBottom: 6, color: colors.ink }}>Date <Text style={{ color: colors.terra }}>*</Text></Text>
                  <TextInput
                    placeholder="YYYY-MM-DD"
                    value={form.date_suivi}
                    onChangeText={text => setForm({...form, date_suivi: text})}
                    style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12, fontSize: 14, backgroundColor: 'white' }}
                  />
                </View>

                {/* Température + Mortalité */}
                <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, fontWeight: '600', marginBottom: 6, color: colors.ink }}>Température (°C)</Text>
                    <TextInput
                      placeholder="28.5"
                      value={form.temperature}
                      onChangeText={text => setForm({...form, temperature: text})}
                      keyboardType="numeric"
                      style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12, backgroundColor: 'white' }}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, fontWeight: '600', marginBottom: 6, color: colors.ink }}>Mortalité</Text>
                    <TextInput
                      placeholder="0"
                      value={form.mortalite_jour}
                      onChangeText={text => setForm({...form, mortalite_jour: text})}
                      keyboardType="numeric"
                      style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12, backgroundColor: 'white' }}
                    />
                  </View>
                </View>

                {/* Consommations */}
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', marginBottom: 6, color: colors.ink }}>Consommations</Text>
                  
                  {form.consumptions.map((item, idx) => {
                    const selectedStock = stocks.find(s => s.id === parseInt(item.selectedStockId, 10));
                    return (
                      <View key={idx} style={{ marginBottom: 12, padding: 10, backgroundColor: colors.parchment, borderRadius: 10 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <Text style={{ fontWeight: '600', fontSize: 14, color: colors.amber }}>Aliment {idx + 1}</Text>
                          <TouchableOpacity onPress={() => removeConsumption(idx)} style={{ backgroundColor: colors.terraLight, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}>
                            <Text style={{ color: colors.terra }}>Supprimer</Text>
                          </TouchableOpacity>
                        </View>
                        
                        <TouchableOpacity
                          onPress={() => setSelectedStockForPicker({ index: idx, visible: true })}
                          style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12, marginBottom: 8, backgroundColor: 'white' }}
                        >
                          <Text style={{ color: selectedStock ? colors.ink : colors.inkMuted }}>
                            {selectedStock ? selectedStock.type_aliment : '— Sélectionner un aliment —'}
                          </Text>
                        </TouchableOpacity>
                        
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                          <TextInput
                            placeholder="Quantité"
                            value={item.quantite}
                            onChangeText={text => updateConsumptionQty(idx, text)}
                            keyboardType="numeric"
                            style={{ flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12, backgroundColor: 'white' }}
                          />
                          <View style={{ flexDirection: 'row', gap: 8, borderWidth: 1, borderColor: colors.border, borderRadius: 10, backgroundColor: 'white', padding: 4 }}>
                            <TouchableOpacity
                              onPress={() => updateConsumptionUnit(idx, 'kg')}
                              style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, backgroundColor: item.unite === 'kg' ? colors.amber : 'transparent' }}
                            >
                              <Text style={{ color: item.unite === 'kg' ? 'white' : colors.ink }}>kg</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => updateConsumptionUnit(idx, 'sac')}
                              style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, backgroundColor: item.unite === 'sac' ? colors.amber : 'transparent' }}
                            >
                              <Text style={{ color: item.unite === 'sac' ? 'white' : colors.ink }}>Sac</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                  
                  <TouchableOpacity onPress={addConsumption} style={{ marginTop: 8, padding: 12, backgroundColor: colors.greenLight, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(21,128,61,0.3)', borderStyle: 'dashed' }}>
                    <Text style={{ color: colors.green, fontSize: 12, fontWeight: '600' }}>➕ Ajouter un aliment</Text>
                  </TouchableOpacity>
                </View>

                {/* Alertes stock */}
                {stockWarnings.length > 0 && (
                  <View style={{ backgroundColor: colors.wheat, borderWidth: 1, borderColor: 'rgba(217,119,6,0.25)', borderRadius: 10, padding: 12, marginBottom: 16 }}>
                    {stockWarnings.map((warning, idx) => (
                      <Text key={idx} style={{ fontSize: 12, color: '#92400E', marginBottom: 4 }}>⚠️ {warning}</Text>
                    ))}
                  </View>
                )}

                {/* Observations */}
                <View style={{ marginBottom: 20 }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', marginBottom: 6, color: colors.ink }}>Observations</Text>
                  <TextInput
                    placeholder="Notes, remarques..."
                    value={form.observations}
                    onChangeText={text => setForm({...form, observations: text})}
                    multiline
                    numberOfLines={3}
                    style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12, textAlignVertical: 'top', minHeight: 80, backgroundColor: 'white' }}
                  />
                </View>

                {/* Actions */}
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                  <TouchableOpacity onPress={() => setModalVisible(false)} style={{ flex: 1, backgroundColor: colors.inkMuted, padding: 12, borderRadius: 10 }}>
                    <Text style={{ color: 'white', textAlign: 'center' }}>Annuler</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={saveSuivi} style={{ flex: 1, backgroundColor: colors.amber, padding: 12, borderRadius: 10 }}>
                    <Text style={{ color: 'white', textAlign: 'center', fontWeight: '600' }}>Enregistrer</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        </Modal>

        {/* MODAL POUR SÉLECTIONNER L'ALIMENT */}
        <Modal visible={selectedStockForPicker.visible} animationType="slide" transparent>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 }}>
            <View style={{ backgroundColor: 'white', borderRadius: 16, maxHeight: '80%' }}>
              <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.amber }}>Sélectionner un aliment</Text>
              </View>
              <FlatList
                data={stocks}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => selectStock(selectedStockForPicker.index, item)}
                    style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}
                  >
                    <Text style={{ fontWeight: '600', color: colors.ink }}>{item.type_aliment}</Text>
                    <Text style={{ fontSize: 12, color: colors.inkSoft }}>
                      Stock: {item.quantite} {item.unite} | Seuil: {item.seuil_alerte} kg
                    </Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={() => (
                  <View style={{ padding: 20, alignItems: 'center' }}>
                    <Text style={{ color: colors.inkMuted }}>Aucun stock disponible</Text>
                  </View>
                )}
              />
              <TouchableOpacity onPress={() => setSelectedStockForPicker({ index: -1, visible: false })} style={{ padding: 16, borderTopWidth: 1, borderTopColor: colors.border }}>
                <Text style={{ textAlign: 'center', color: colors.amber, fontWeight: '600' }}>Fermer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

      </View>
    </ScrollView>
  );
}