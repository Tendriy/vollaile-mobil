import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Modal, RefreshControl, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { colors } from '../../constants/colors';
import { useAuth } from '../../hooks/useAuth';
import { addStock, deleteStock, getStock, updateStock } from '../../services/database-wrapper';
import { appEvents, EVENTS } from '../../services/eventEmitter';

// Définition des types
interface StockItemType {
  id: number;
  user_id: number;
  type_aliment: string;
  quantite: number;
  unite: string;
  seuil_alerte: number;
  date_achat?: string;
  created_at?: string;
}

interface StockFusionneType {
  type_aliment: string;
  items: StockItemType[];
  quantite_kg: number;
  seuil_alerte_kg: number;
  quantite_affichee: string;
  unite_affichee: string;
  alerte: boolean;
  date_achat_affiche: string;
}

export default function StockScreen() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingStock, setEditingStock] = useState<StockFusionneType | null>(null);
  const [stock, setStock] = useState<StockItemType[]>([]);
  const [stockFusionne, setStockFusionne] = useState<StockFusionneType[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    type_aliment: '',
    quantite: '',
    unite: 'kg',
    seuil_alerte: '50',
    date_achat: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (user?.id) {
      loadStock();
    }
  }, [user]);

  // ÉCOUTE DES ÉVÉNEMENTS - Mise à jour automatique
  useEffect(() => {
    const handleDataChange = () => {
      console.log('🔄 Données modifiées, rechargement du stock...');
      loadStock();
    };

    // S'abonner aux événements
    appEvents.on(EVENTS.DATA_CHANGED, handleDataChange);
    appEvents.on(EVENTS.STOCK_UPDATED, handleDataChange);
    appEvents.on(EVENTS.LOT_ADDED, handleDataChange);

    // Nettoyage
    return () => {
      appEvents.off(EVENTS.DATA_CHANGED, handleDataChange);
      appEvents.off(EVENTS.STOCK_UPDATED, handleDataChange);
      appEvents.off(EVENTS.LOT_ADDED, handleDataChange);
    };
  }, []);

  // RECHARGEMENT QUAND L'ÉCRAN EST FOCUS
  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        console.log('📱 Stock screen focus, rechargement...');
        loadStock();
      }
    }, [user?.id])
  );

  const loadStock = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const data = await getStock(user.id);
      const stockData = Array.isArray(data) ? data : [];
      setStock(stockData);
      fusionnerStock(stockData);
    } catch (error) {
      console.error('Error loading stock:', error);
      Alert.alert('Erreur', 'Impossible de charger les stocks');
      setStock([]);
    } finally {
      setLoading(false);
    }
  };

  const fusionnerStock = (stockData: StockItemType[]) => {
    const groupes: { [key: string]: any } = {};
    
    for (const item of stockData) {
      const type = item.type_aliment;
      
      if (!groupes[type]) {
        groupes[type] = {
          type_aliment: type,
          items: [],
          quantite_kg: 0,
          seuil_alerte_kg: 0,
          dates: [],
          unite_affichee: 'kg'
        };
      }
      
      groupes[type].items.push(item);
      
      // Convertir la quantité en kg
      let quantiteEnKg = parseFloat(String(item.quantite));
      if (item.unite === 'sac') quantiteEnKg = quantiteEnKg * 50;
      
      // Le seuil est déjà en kg dans la base de données
      let seuilEnKg = parseFloat(String(item.seuil_alerte));
      if (isNaN(seuilEnKg)) seuilEnKg = 50;
      
      groupes[type].quantite_kg += quantiteEnKg;
      groupes[type].seuil_alerte_kg += seuilEnKg;
      groupes[type].dates.push(item.date_achat || item.created_at || '');
    }
    
    const fusionne = Object.values(groupes).map((group: any) => {
      const seuilTotalKg = group.seuil_alerte_kg;
      const alerte = group.quantite_kg <= seuilTotalKg;
      
      // Calculer l'affichage selon l'unité choisie
      let quantite_affichee = group.quantite_kg;
      if (group.unite_affichee === 'sac') {
        quantite_affichee = group.quantite_kg / 50;
      }
      
      return {
        type_aliment: group.type_aliment,
        items: group.items,
        quantite_kg: group.quantite_kg,
        seuil_alerte_kg: seuilTotalKg,
        quantite_affichee: quantite_affichee.toFixed(2),
        unite_affichee: group.unite_affichee,
        alerte: alerte,
        date_achat_affiche: group.dates[0] ? new Date(group.dates[0]).toLocaleDateString('fr-FR') : '—'
      };
    });
    
    setStockFusionne(fusionne);
  };

  const changerUnite = (item: StockFusionneType, nouvelleUnite: string) => {
    const newStockFusionne = [...stockFusionne];
    const index = newStockFusionne.findIndex(s => s.type_aliment === item.type_aliment);
    if (index !== -1) {
      newStockFusionne[index].unite_affichee = nouvelleUnite;
      if (nouvelleUnite === 'kg') {
        newStockFusionne[index].quantite_affichee = newStockFusionne[index].quantite_kg.toFixed(2);
      } else {
        newStockFusionne[index].quantite_affichee = (newStockFusionne[index].quantite_kg / 50).toFixed(2);
      }
      setStockFusionne(newStockFusionne);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStock();
    setRefreshing(false);
  };

  const openModal = (item: StockFusionneType | null = null) => {
    if (item) {
      setEditingStock(item);
      const premierItem = item.items[0];
      setForm({
        type_aliment: premierItem.type_aliment || '',
        quantite: premierItem.quantite ? premierItem.quantite.toString() : '',
        unite: premierItem.unite || 'kg',
        seuil_alerte: premierItem.seuil_alerte ? premierItem.seuil_alerte.toString() : '50',
        date_achat: premierItem.date_achat || new Date().toISOString().split('T')[0]
      });
    } else {
      setEditingStock(null);
      setForm({
        type_aliment: '',
        quantite: '',
        unite: 'kg',
        seuil_alerte: '50',
        date_achat: new Date().toISOString().split('T')[0]
      });
    }
    setModalVisible(true);
  };

  const saveStock = async () => {
    if (!form.type_aliment.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir le type d\'aliment');
      return;
    }
    if (!form.quantite || parseFloat(form.quantite) <= 0) {
      Alert.alert('Erreur', 'Veuillez saisir une quantité valide');
      return;
    }

    let seuilAlerte = parseFloat(form.seuil_alerte);
    if (isNaN(seuilAlerte)) seuilAlerte = 50;

    const stockData = {
      type_aliment: form.type_aliment,
      quantite: parseFloat(form.quantite),
      unite: form.unite,
      seuil_alerte: seuilAlerte,
      date_achat: form.date_achat
    };

    try {
      if (editingStock) {
        const premierItem = editingStock.items[0];
        await updateStock(premierItem.id, stockData);
        Alert.alert('Succès', 'Stock modifié avec succès');
      } else {
        await addStock({ ...stockData, user_id: user?.id });
        Alert.alert('Succès', 'Stock ajouté avec succès');
      }
      setModalVisible(false);
      await loadStock();
      // Émettre l'événement
      appEvents.emit(EVENTS.STOCK_UPDATED);
      appEvents.emit(EVENTS.DATA_CHANGED);
    } catch (error) {
      console.error('Error saving stock:', error);
      Alert.alert('Erreur', "Erreur lors de l'enregistrement");
    }
  };

  const deleteStockItem = (item: StockFusionneType) => {
    Alert.alert(
      'Confirmation',
      `Voulez-vous vraiment supprimer TOUS les stocks de "${item.type_aliment}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', onPress: async () => {
          try {
            for (const subItem of item.items) {
              await deleteStock(subItem.id);
            }
            await loadStock();
            Alert.alert('Succès', 'Tous les stocks supprimés avec succès');
            // Émettre l'événement
            appEvents.emit(EVENTS.STOCK_UPDATED);
            appEvents.emit(EVENTS.DATA_CHANGED);
          } catch (error) {
            Alert.alert('Erreur', 'Erreur lors de la suppression');
          }
        }, style: 'destructive' }
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

  const stockAlerte = stockFusionne.filter(s => s.alerte);
  const stockNormal = stockFusionne.filter(s => !s.alerte);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.cream }}>
        <ActivityIndicator size="large" color={colors.amber} />
      </View>
    );
  }

  return (
    <ScrollView 
      style={{ flex: 1, backgroundColor: colors.cream }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.amber]} />}
    >
      <View style={{ padding: 16, paddingBottom: 80 }}>
        
        {/* HEADER */}
        <LinearGradient
          colors={['#78350F', '#92400E', '#A16207']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ borderRadius: 16, padding: 20, marginBottom: 16 }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
            <View>
              <Text style={{ fontSize: 11, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase', color: 'rgba(254,243,199,0.6)', marginBottom: 4 }}>
                📦 Gestion des ressources
              </Text>
              <Text style={{ fontFamily: 'PlayfairDisplay', fontSize: 28, fontWeight: 'bold', color: '#FEF3C7' }}>
                {t('stock')}
              </Text>
              <Text style={{ fontSize: 12, color: 'rgba(254,243,199,0.5)' }}>
                {stockFusionne.length} article{stockFusionne.length > 1 ? 's' : ''} en stock
              </Text>
            </View>
            <TouchableOpacity 
              onPress={() => openModal()}
              style={{ backgroundColor: colors.amberLight, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 100 }}
            >
              <Text style={{ color: '#3B1A00', fontWeight: '700', fontSize: 13 }}>➕ {t('add_stock')}</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* ALERTES STOCK - GLASSMORPHISM */}
        {stockAlerte.length > 0 && (
          <View style={{ backgroundColor: colors.wheat, borderRadius: 16, marginBottom: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(217,119,6,0.3)' }}>
            <View style={{ padding: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <View style={{ width: 44, height: 44, backgroundColor: 'rgba(217,119,6,0.15)', borderRadius: 12, justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ fontSize: 22 }}>⚠️</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '700', color: colors.ink, fontSize: 14 }}>{t('stock_alerts')}</Text>
                  <Text style={{ fontSize: 11, color: colors.inkSoft }}>{stockAlerte.length} aliment(s) en dessous du seuil</Text>
                </View>
                <View style={{ backgroundColor: 'rgba(194,65,12,0.15)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 }}>
                  <Text style={{ color: colors.terra, fontWeight: 'bold', fontSize: 12 }}>{stockAlerte.length}</Text>
                </View>
              </View>
              
              {stockAlerte.map((item, idx) => {
                const pourcentage = item.seuil_alerte_kg > 0 ? Math.min((item.quantite_kg / item.seuil_alerte_kg) * 100, 100) : 0;
                return (
                  <View key={idx} style={{ marginBottom: 12, paddingVertical: 8, borderTopWidth: idx > 0 ? 1 : 0, borderTopColor: 'rgba(217,119,6,0.15)' }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.terra }} />
                        <Text style={{ fontWeight: '600', color: colors.ink, fontSize: 13 }}>{item.type_aliment}</Text>
                      </View>
                      <View style={{ backgroundColor: colors.terraLight, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 }}>
                        <Text style={{ fontSize: 11, fontWeight: '600', color: colors.terra }}>{item.quantite_affichee} {item.unite_affichee}</Text>
                      </View>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text style={{ fontSize: 10, color: colors.inkMuted }}>seuil: {item.seuil_alerte_kg} kg</Text>
                    </View>
                    <View style={{ height: 6, backgroundColor: 'rgba(194,65,12,0.2)', borderRadius: 4, overflow: 'hidden' }}>
                      <View style={{ width: `${pourcentage}%`, height: '100%', backgroundColor: colors.terra, borderRadius: 4 }} />
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* TABLEAU DES STOCKS */}
        <View style={{ backgroundColor: 'white', borderRadius: 16, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.parchment }}>
            <Text style={{ fontWeight: '600', fontSize: 14 }}>🌾 Inventaire complet</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Text style={{ color: colors.green, fontSize: 11, fontWeight: '600' }}>{stockNormal.length} normaux</Text>
              <Text style={{ color: colors.inkMuted }}>·</Text>
              <Text style={{ color: colors.terra, fontSize: 11, fontWeight: '600' }}>{stockAlerte.length} en alerte</Text>
            </View>
          </View>

          {stockFusionne.length > 0 ? (
            stockFusionne.map((item, idx) => {
              const isAlerte = item.alerte;
              const pourcentage = item.seuil_alerte_kg > 0 ? Math.min((item.quantite_kg / (item.seuil_alerte_kg * 2)) * 100, 100) : 0;
              
              return (
                <View key={idx} style={{ padding: 16, borderBottomWidth: idx < stockFusionne.length - 1 ? 1 : 0, borderBottomColor: colors.border, backgroundColor: isAlerte ? 'rgba(255,241,238,0.4)' : 'white' }}>
                  {/* En-tête */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <View style={{ backgroundColor: colors.wheat, width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' }}>
                        <Text style={{ fontSize: 18 }}>🌾</Text>
                      </View>
                      <Text style={{ fontWeight: '700', color: colors.ink, fontSize: 16 }}>{item.type_aliment}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TouchableOpacity onPress={() => openModal(item)} style={{ backgroundColor: colors.wheat, width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' }}>
                        <Text>✏️</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => deleteStockItem(item)} style={{ backgroundColor: colors.terraLight, width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' }}>
                        <Text>🗑️</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  {/* Quantité et unité */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 11, color: colors.inkMuted, marginBottom: 4 }}>Quantité</Text>
                      <Text style={{ fontSize: 20, fontWeight: 'bold', color: isAlerte ? colors.terra : colors.green }}>
                        {item.quantite_affichee} {item.unite_affichee}
                      </Text>
                    </View>
                    <View>
                      <Text style={{ fontSize: 11, color: colors.inkMuted, marginBottom: 4 }}>Changer l'unité</Text>
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        <TouchableOpacity
                          onPress={() => changerUnite(item, 'kg')}
                          style={{ paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, backgroundColor: item.unite_affichee === 'kg' ? colors.amber : colors.parchment }}
                        >
                          <Text style={{ color: item.unite_affichee === 'kg' ? 'white' : colors.ink }}>kg</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => changerUnite(item, 'sac')}
                          style={{ paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, backgroundColor: item.unite_affichee === 'sac' ? colors.amber : colors.parchment }}
                        >
                          <Text style={{ color: item.unite_affichee === 'sac' ? 'white' : colors.ink }}>Sac</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                  
                  {/* Seuil et barre de progression */}
                  <View style={{ marginBottom: 12 }}>
                    <Text style={{ fontSize: 11, color: colors.inkMuted, marginBottom: 4 }}>Seuil d'alerte: {item.seuil_alerte_kg} kg</Text>
                    <View style={{ height: 8, backgroundColor: colors.parchment, borderRadius: 4, overflow: 'hidden' }}>
                      <View style={{ width: `${pourcentage}%`, height: '100%', backgroundColor: isAlerte ? colors.terra : colors.green, borderRadius: 4 }} />
                    </View>
                  </View>
                  
                  {/* Date et statut */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 11, color: colors.inkSoft }}>Achat: {item.date_achat_affiche}</Text>
                    <View style={{ backgroundColor: isAlerte ? colors.terraLight : colors.greenPale, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 }}>
                      <Text style={{ fontSize: 10, fontWeight: '600', color: isAlerte ? colors.terra : colors.green }}>
                        {isAlerte ? '⚠️ Stock faible' : '✅ Normal'}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })
          ) : (
            <View style={{ paddingVertical: 48, alignItems: 'center', gap: 10 }}>
              <Text style={{ fontSize: 40 }}>📦</Text>
              <Text style={{ color: colors.inkMuted }}>Aucun stock enregistré</Text>
              <TouchableOpacity onPress={() => openModal()} style={{ backgroundColor: colors.amber, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 100, marginTop: 8 }}>
                <Text style={{ color: 'white', fontWeight: '600' }}>➕ Ajouter un aliment</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* MODAL AJOUT / ÉDITION */}
        <Modal visible={modalVisible} animationType="slide" transparent>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 16 }}>
            <View style={{ backgroundColor: colors.cream, borderRadius: 16, maxHeight: '90%' }}>
              <LinearGradient
                colors={['#78350F', '#A16207']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderTopLeftRadius: 16, borderTopRightRadius: 16 }}
              >
                <View style={{ width: 44, height: 44, backgroundColor: 'rgba(254,243,199,0.15)', borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(254,243,199,0.2)' }}>
                  <Text style={{ fontSize: 22 }}>📦</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: 'PlayfairDisplay', fontSize: 16, fontWeight: 'bold', color: '#FEF3C7' }}>
                    {editingStock ? t('edit_stock') : t('add_stock')}
                  </Text>
                  <Text style={{ fontSize: 11, color: 'rgba(254,243,199,0.55)' }}>
                    {editingStock ? 'Modifier les informations du stock' : 'Enregistrer un nouvel aliment'}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setModalVisible(false)} style={{ width: 32, height: 32, backgroundColor: 'rgba(254,243,199,0.12)', borderRadius: 8, justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ color: 'rgba(254,243,199,0.8)' }}>✕</Text>
                </TouchableOpacity>
              </LinearGradient>

              <View style={{ padding: 16 }}>
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', marginBottom: 6 }}>{t('feed_type')} <Text style={{ color: colors.terra }}>*</Text></Text>
                  <TextInput
                    placeholder="Ex: Maïs concassé"
                    value={form.type_aliment}
                    onChangeText={text => setForm({...form, type_aliment: text})}
                    style={{ borderWidth: 1.5, borderColor: 'rgba(180,120,50,0.22)', borderRadius: 10, padding: 12, fontSize: 14 }}
                  />
                </View>

                <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, fontWeight: '600', marginBottom: 6 }}>{t('quantity')} <Text style={{ color: colors.terra }}>*</Text></Text>
                    <TextInput
                      placeholder="0.00"
                      value={form.quantite}
                      onChangeText={text => setForm({...form, quantite: text})}
                      keyboardType="numeric"
                      style={{ borderWidth: 1.5, borderColor: 'rgba(180,120,50,0.22)', borderRadius: 10, padding: 12, fontSize: 14 }}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, fontWeight: '600', marginBottom: 6 }}>{t('unit')}</Text>
                    <View style={{ flexDirection: 'row', gap: 10, borderWidth: 1.5, borderColor: 'rgba(180,120,50,0.22)', borderRadius: 10, padding: 4 }}>
                      <TouchableOpacity 
                        onPress={() => setForm({...form, unite: 'kg'})}
                        style={{ flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: form.unite === 'kg' ? colors.amber : 'transparent' }}
                      >
                        <Text style={{ textAlign: 'center', color: form.unite === 'kg' ? 'white' : colors.ink, fontWeight: form.unite === 'kg' ? '600' : '400' }}>kg</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        onPress={() => setForm({...form, unite: 'sac'})}
                        style={{ flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: form.unite === 'sac' ? colors.amber : 'transparent' }}
                      >
                        <Text style={{ textAlign: 'center', color: form.unite === 'sac' ? 'white' : colors.ink, fontWeight: form.unite === 'sac' ? '600' : '400' }}>Sac</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, fontWeight: '600', marginBottom: 6 }}>{t('alert_threshold')} (kg)</Text>
                    <TextInput
                      placeholder="50"
                      value={form.seuil_alerte}
                      onChangeText={text => setForm({...form, seuil_alerte: text})}
                      keyboardType="numeric"
                      style={{ borderWidth: 1.5, borderColor: 'rgba(180,120,50,0.22)', borderRadius: 10, padding: 12, fontSize: 14 }}
                    />
                    <Text style={{ fontSize: 10, color: colors.inkMuted, marginTop: 4 }}>Le seuil est toujours en kg</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, fontWeight: '600', marginBottom: 6 }}>{t('purchase_date')}</Text>
                    <TextInput
                      placeholder="YYYY-MM-DD"
                      value={form.date_achat}
                      onChangeText={text => setForm({...form, date_achat: text})}
                      style={{ borderWidth: 1.5, borderColor: 'rgba(180,120,50,0.22)', borderRadius: 10, padding: 12, fontSize: 14 }}
                    />
                  </View>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 8, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.border }}>
                  <TouchableOpacity onPress={() => setModalVisible(false)} style={{ paddingHorizontal: 20, paddingVertical: 10, borderWidth: 1.5, borderColor: colors.border, borderRadius: 100 }}>
                    <Text style={{ color: colors.inkSoft }}>{t('cancel')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={saveStock} style={{ paddingHorizontal: 24, paddingVertical: 10, backgroundColor: colors.amber, borderRadius: 100 }}>
                    <Text style={{ color: 'white', fontWeight: '600' }}>💾 {editingStock ? t('edit') : t('add_stock')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Modal>

      </View>
    </ScrollView>
  );
}