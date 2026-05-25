import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Modal, RefreshControl, ScrollView, Text, TextInput, TouchableOpacity, View, FlatList } from 'react-native';
import { colors } from '../../constants/colors';
import { useAuth } from '../../hooks/useAuth';
import { addVente, getLots, getVentes } from '../../services/database-wrapper';
import { appEvents, EVENTS } from '../../services/eventEmitter';

// Types
interface VenteType {
  id: number;
  lot_id: number;
  nom_lot?: string;
  date_vente: string;
  nombre_vendu: number;
  prix_unitaire: number;
  acheteur?: string;
}

interface LotType {
  id: number;
  nom_lot: string;
  race?: string;
  nombre_initial: number;
  nombre_restant?: number;
}

export default function VentesScreen() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [ventes, setVentes] = useState<VenteType[]>([]);
  const [lots, setLots] = useState<LotType[]>([]);
  const [chiffreAffaires, setChiffreAffaires] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [lotSelectorVisible, setLotSelectorVisible] = useState(false);
  const [selectedLot, setSelectedLot] = useState<LotType | null>(null);
  const [form, setForm] = useState({
    lot_id: '',
    date_vente: new Date().toISOString().split('T')[0],
    nombre_vendu: '',
    prix_unitaire: '',
    acheteur: ''
  });

  useEffect(() => {
    if (user?.id) {
      loadAllData();
    }
  }, [user]);

  // ÉCOUTE DES ÉVÉNEMENTS - Mise à jour automatique
  useEffect(() => {
    const handleDataChange = () => {
      console.log('🔄 Données modifiées, rechargement des ventes...');
      loadAllData();
    };

    // S'abonner aux événements
    appEvents.on(EVENTS.DATA_CHANGED, handleDataChange);
    appEvents.on(EVENTS.VENTE_ADDED, handleDataChange);
    appEvents.on(EVENTS.LOT_ADDED, handleDataChange);
    appEvents.on(EVENTS.SUIVI_ADDED, handleDataChange);

    // Nettoyage
    return () => {
      appEvents.off(EVENTS.DATA_CHANGED, handleDataChange);
      appEvents.off(EVENTS.VENTE_ADDED, handleDataChange);
      appEvents.off(EVENTS.LOT_ADDED, handleDataChange);
      appEvents.off(EVENTS.SUIVI_ADDED, handleDataChange);
    };
  }, []);

  // RECHARGEMENT QUAND L'ÉCRAN EST FOCUS
  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        console.log('📱 Ventes screen focus, rechargement...');
        loadAllData();
      }
    }, [user?.id])
  );

  const loadAllData = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [ventesData, lotsData] = await Promise.all([
        getVentes(user.id),
        getLots(user.id)
      ]);
      
      const ventesList = Array.isArray(ventesData) ? ventesData : [];
      const lotsList = Array.isArray(lotsData) ? lotsData : [];
      
      setVentes(ventesList);
      setLots(lotsList);
      
      // Calcul du chiffre d'affaires total
      const total = ventesList.reduce((sum, v) => sum + ((v.nombre_vendu || 0) * (v.prix_unitaire || 0)), 0);
      setChiffreAffaires(total);
      
    } catch (error) {
      console.error('Error loading ventes:', error);
      Alert.alert('Erreur', 'Impossible de charger les données');
      setVentes([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
  };

  const formatDate = (dateValue: string) => {
    if (!dateValue) return '-';
    try {
      const d = new Date(dateValue);
      if (isNaN(d.getTime())) return '-';
      return d.toLocaleDateString('fr-FR');
    } catch {
      return '-';
    }
  };

  const formatPrix = (prixValue: number) => {
    if (!prixValue && prixValue !== 0) return '0';
    try {
      return new Intl.NumberFormat('fr-FR').format(Math.round(prixValue));
    } catch {
      return String(prixValue);
    }
  };

  const handleLotSelect = (lot: LotType) => {
    setSelectedLot(lot);
    setForm({ ...form, lot_id: String(lot.id) });
    setLotSelectorVisible(false);
  };

  const saveVente = async () => {
    if (!form.lot_id || !form.nombre_vendu || !form.prix_unitaire) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    const lotChoisi = lots.find(l => l.id === parseInt(form.lot_id, 10));
    const nombreVendu = parseInt(form.nombre_vendu, 10);
    
    if (lotChoisi && lotChoisi.nombre_restant !== undefined && nombreVendu > lotChoisi.nombre_restant) {
      Alert.alert('Erreur', `Il ne reste que ${lotChoisi.nombre_restant} volailles dans ce lot. Impossible de vendre ${nombreVendu}.`);
      return;
    }

    try {
      await addVente({
        lot_id: parseInt(form.lot_id, 10),
        date_vente: form.date_vente,
        nombre_vendu: nombreVendu,
        prix_unitaire: parseFloat(form.prix_unitaire),
        acheteur: form.acheteur || ''
      });
      Alert.alert('Succès', 'Vente enregistrée avec succès');
      closeModal();
      await loadAllData();
      // Émettre l'événement
      appEvents.emit(EVENTS.VENTE_ADDED);
      appEvents.emit(EVENTS.DATA_CHANGED);
    } catch (error) {
      console.error('Error saving vente:', error);
      Alert.alert('Erreur', "Erreur lors de l'enregistrement");
    }
  };

  const getTotalPreview = () => {
    if (form.nombre_vendu && form.prix_unitaire) {
      return parseInt(form.nombre_vendu, 10) * parseFloat(form.prix_unitaire);
    }
    return 0;
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedLot(null);
    setForm({
      lot_id: '',
      date_vente: new Date().toISOString().split('T')[0],
      nombre_vendu: '',
      prix_unitaire: '',
      acheteur: ''
    });
  };

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
                💰 Gestion des revenus
              </Text>
              <Text style={{ fontFamily: 'PlayfairDisplay', fontSize: 28, fontWeight: 'bold', color: '#FEF3C7' }}>
                {t('ventes')}
              </Text>
              <Text style={{ fontSize: 12, color: 'rgba(254,243,199,0.5)' }}>
                {ventes.length} vente{ventes.length > 1 ? 's' : ''} enregistrée{ventes.length > 1 ? 's' : ''}
              </Text>
            </View>
            <TouchableOpacity 
              onPress={() => setModalVisible(true)}
              style={{ backgroundColor: colors.amberLight, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 100 }}
            >
              <Text style={{ color: '#3B1A00', fontWeight: '700', fontSize: 13 }}>➕ {t('new_sale')}</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* CARTE CHIFFRE D'AFFAIRES */}
        <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 20, marginBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 16, borderWidth: 1, borderColor: colors.border, position: 'relative', overflow: 'hidden' }}>
          <View style={{ position: 'absolute', right: -30, top: -30, width: 130, height: 130, backgroundColor: 'rgba(245,158,11,0.08)', borderRadius: 65 }} />
          
          <LinearGradient
            colors={['#FDE68A', '#F59E0B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ width: 52, height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center' }}
          >
            <Text style={{ fontSize: 24 }}>📈</Text>
          </LinearGradient>
          <View>
            <Text style={{ fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, color: colors.inkMuted, marginBottom: 4 }}>
              {t('total_amount')}
            </Text>
            <Text style={{ fontFamily: 'PlayfairDisplay', fontSize: 28, fontWeight: 'bold', color: colors.green }}>
              {formatPrix(chiffreAffaires)} <Text style={{ fontSize: 14, fontWeight: 'normal', color: colors.inkMuted }}>Ar</Text>
            </Text>
          </View>
        </View>

        {/* TABLEAU DES VENTES */}
        <View style={{ backgroundColor: 'white', borderRadius: 16, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={true}>
            <View>
              {/* En-tête */}
              <View style={{ flexDirection: 'row', backgroundColor: colors.parchment, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                <Text style={{ width: 100, paddingHorizontal: 12, fontSize: 10, fontWeight: '700', color: colors.inkMuted }}>{t('date')}</Text>
                <Text style={{ width: 140, paddingHorizontal: 12, fontSize: 10, fontWeight: '700', color: colors.inkMuted }}>{t('lot_name')}</Text>
                <Text style={{ width: 90, paddingHorizontal: 12, fontSize: 10, fontWeight: '700', color: colors.inkMuted, textAlign: 'center' }}>{t('number_sold')}</Text>
                <Text style={{ width: 110, paddingHorizontal: 12, fontSize: 10, fontWeight: '700', color: colors.inkMuted, textAlign: 'right' }}>{t('unit_price')}</Text>
                <Text style={{ width: 130, paddingHorizontal: 12, fontSize: 10, fontWeight: '700', color: colors.inkMuted, textAlign: 'right' }}>{t('total_amount')}</Text>
                <Text style={{ width: 130, paddingHorizontal: 12, fontSize: 10, fontWeight: '700', color: colors.inkMuted }}>{t('buyer')}</Text>
              </View>

              {ventes.map((vente, idx) => {
                const nomLot = vente.nom_lot || 'Lot inconnu';
                const dateVente = vente.date_vente || '';
                const nombreVendu = vente.nombre_vendu || 0;
                const prixUnitaire = vente.prix_unitaire || 0;
                const acheteur = vente.acheteur || '';
                const total = nombreVendu * prixUnitaire;
                
                return (
                  <View key={vente.id || idx} style={{ flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                    <View style={{ width: 100, paddingHorizontal: 12 }}>
                      <View style={{ backgroundColor: colors.skyLight, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, alignSelf: 'flex-start' }}>
                        <Text style={{ color: colors.sky, fontSize: 11, fontWeight: '600' }}>{formatDate(dateVente)}</Text>
                      </View>
                    </View>
                    <View style={{ width: 140, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={{ fontSize: 14 }}>🐔</Text>
                      <Text style={{ fontWeight: '600', fontSize: 13 }} numberOfLines={1}>{nomLot}</Text>
                    </View>
                    <View style={{ width: 90, paddingHorizontal: 12, alignItems: 'center' }}>
                      <View style={{ backgroundColor: colors.amberPale, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 }}>
                        <Text style={{ color: '#92400E', fontSize: 12, fontWeight: '600' }}>{nombreVendu}</Text>
                      </View>
                    </View>
                    <View style={{ width: 110, paddingHorizontal: 12, alignItems: 'flex-end' }}>
                      <Text style={{ color: colors.inkSoft, fontSize: 13 }}>{formatPrix(prixUnitaire)} Ar</Text>
                    </View>
                    <View style={{ width: 130, paddingHorizontal: 12, alignItems: 'flex-end' }}>
                      <View style={{ backgroundColor: colors.greenPale, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 }}>
                        <Text style={{ color: colors.green, fontSize: 12, fontWeight: '700' }}>{formatPrix(total)} Ar</Text>
                      </View>
                    </View>
                    <View style={{ width: 130, paddingHorizontal: 12 }}>
                      {acheteur ? (
                        <View style={{ backgroundColor: colors.wheat, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, alignSelf: 'flex-start' }}>
                          <Text style={{ color: colors.inkSoft, fontSize: 11 }}>👤 {acheteur}</Text>
                        </View>
                      ) : (
                        <Text style={{ color: colors.inkMuted, fontSize: 12 }}>—</Text>
                      )}
                    </View>
                  </View>
                );
              })}

              {ventes.length === 0 && (
                <View style={{ paddingVertical: 48, alignItems: 'center', gap: 10 }}>
                  <Text style={{ fontSize: 32 }}>📭</Text>
                  <Text style={{ color: colors.inkMuted, fontSize: 14 }}>Aucune vente enregistrée</Text>
                  <TouchableOpacity onPress={() => setModalVisible(true)} style={{ backgroundColor: colors.amber, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 100, marginTop: 8 }}>
                    <Text style={{ color: 'white', fontWeight: '600', fontSize: 13 }}>➕ Enregistrer une vente</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </ScrollView>
        </View>

        {/* MODAL AJOUT VENTE */}
        <Modal visible={modalVisible} animationType="slide" transparent>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 16 }}>
            <View style={{ backgroundColor: 'white', borderRadius: 16, maxHeight: '90%' }}>
              <LinearGradient
                colors={['#78350F', '#A16207']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderTopLeftRadius: 16, borderTopRightRadius: 16 }}
              >
                <View style={{ width: 44, height: 44, backgroundColor: 'rgba(254,243,199,0.15)', borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(254,243,199,0.2)' }}>
                  <Text style={{ fontSize: 22 }}>💰</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: 'PlayfairDisplay', fontSize: 16, fontWeight: 'bold', color: '#FEF3C7' }}>
                    {t('new_sale')}
                  </Text>
                  <Text style={{ fontSize: 11, color: 'rgba(254,243,199,0.55)' }}>
                    Enregistrer une nouvelle transaction de vente
                  </Text>
                </View>
                <TouchableOpacity onPress={closeModal} style={{ width: 32, height: 32, backgroundColor: 'rgba(254,243,199,0.12)', borderRadius: 8, justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ color: 'rgba(254,243,199,0.8)', fontSize: 16 }}>✕</Text>
                </TouchableOpacity>
              </LinearGradient>

              <ScrollView style={{ padding: 16 }}>
                {/* Sélecteur de Lot avec TouchableOpacity */}
                <View style={{ marginBottom: 18 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', marginBottom: 7, color: colors.ink }}>
                    {t('lot_name')} <Text style={{ color: colors.terra }}>*</Text>
                  </Text>
                  <TouchableOpacity 
                    onPress={() => setLotSelectorVisible(true)}
                    style={{ borderWidth: 1.5, borderColor: 'rgba(180,120,50,0.22)', borderRadius: 10, padding: 12, flexDirection: 'row', alignItems: 'center', backgroundColor: 'white' }}
                  >
                    <Text style={{ fontSize: 14, marginRight: 8 }}>🐔</Text>
                    <Text style={{ flex: 1, fontSize: 14, color: selectedLot ? colors.ink : colors.inkMuted }}>
                      {selectedLot ? `${selectedLot.nom_lot} — ${selectedLot.race || 'Poulet'} (Restant: ${selectedLot.nombre_restant || 0})` : "Choisir un lot…"}
                    </Text>
                    <Text style={{ fontSize: 12, color: colors.inkMuted }}>▼</Text>
                  </TouchableOpacity>
                </View>

                {/* Date et Quantité */}
                <View style={{ flexDirection: 'row', gap: 12, marginBottom: 18 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: '600', marginBottom: 7, color: colors.ink }}>
                      {t('date')} <Text style={{ color: colors.terra }}>*</Text>
                    </Text>
                    <View style={{ borderWidth: 1.5, borderColor: 'rgba(180,120,50,0.22)', borderRadius: 10, flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={{ paddingLeft: 12, fontSize: 14 }}>📅</Text>
                      <TextInput
                        placeholder="YYYY-MM-DD"
                        value={form.date_vente}
                        onChangeText={text => setForm({...form, date_vente: text})}
                        style={{ flex: 1, padding: 12, fontSize: 14 }}
                      />
                    </View>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: '600', marginBottom: 7, color: colors.ink }}>
                      {t('number_sold')} <Text style={{ color: colors.terra }}>*</Text>
                    </Text>
                    <View style={{ borderWidth: 1.5, borderColor: 'rgba(180,120,50,0.22)', borderRadius: 10, flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={{ paddingLeft: 12, fontSize: 14 }}>🔢</Text>
                      <TextInput
                        placeholder="Ex: 50"
                        value={form.nombre_vendu}
                        onChangeText={text => setForm({...form, nombre_vendu: text})}
                        keyboardType="numeric"
                        style={{ flex: 1, padding: 12, fontSize: 14 }}
                      />
                    </View>
                  </View>
                </View>

                {/* Prix unitaire et Acheteur */}
                <View style={{ flexDirection: 'row', gap: 12, marginBottom: 18 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: '600', marginBottom: 7, color: colors.ink }}>
                      {t('unit_price')} (Ar) <Text style={{ color: colors.terra }}>*</Text>
                    </Text>
                    <View style={{ borderWidth: 1.5, borderColor: 'rgba(180,120,50,0.22)', borderRadius: 10, flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={{ paddingLeft: 12, fontSize: 14 }}>💵</Text>
                      <TextInput
                        placeholder="Ex: 15000"
                        value={form.prix_unitaire}
                        onChangeText={text => setForm({...form, prix_unitaire: text})}
                        keyboardType="numeric"
                        style={{ flex: 1, padding: 12, fontSize: 14 }}
                      />
                    </View>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: '600', marginBottom: 7, color: colors.ink }}>
                      {t('buyer')}
                    </Text>
                    <View style={{ borderWidth: 1.5, borderColor: 'rgba(180,120,50,0.22)', borderRadius: 10, flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={{ paddingLeft: 12, fontSize: 14 }}>👤</Text>
                      <TextInput
                        placeholder="Nom de l'acheteur"
                        value={form.acheteur}
                        onChangeText={text => setForm({...form, acheteur: text})}
                        style={{ flex: 1, padding: 12, fontSize: 14 }}
                      />
                    </View>
                  </View>
                </View>

                {/* Aperçu total */}
                {form.nombre_vendu && form.prix_unitaire && (
                  <View style={{ backgroundColor: colors.greenPale, borderRadius: 10, padding: 12, marginBottom: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ color: colors.green, fontSize: 13, fontWeight: '600' }}>Total estimé</Text>
                    <Text style={{ fontFamily: 'PlayfairDisplay', fontSize: 18, fontWeight: 'bold', color: colors.green }}>
                      {formatPrix(getTotalPreview())} Ar
                    </Text>
                  </View>
                )}

                {/* Actions */}
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 8, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.border }}>
                  <TouchableOpacity onPress={closeModal} style={{ paddingHorizontal: 22, paddingVertical: 10, borderWidth: 1.5, borderColor: colors.border, borderRadius: 100 }}>
                    <Text style={{ color: colors.inkSoft, fontWeight: '500' }}>{t('cancel')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={saveVente} style={{ paddingHorizontal: 26, paddingVertical: 10, backgroundColor: colors.amber, borderRadius: 100, shadowColor: colors.amber, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 3 }}>
                    <Text style={{ color: 'white', fontWeight: '600' }}>💾 {t('new_sale')}</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Modal sélecteur de lot */}
        <Modal visible={lotSelectorVisible} animationType="slide" transparent>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 16 }}>
            <View style={{ backgroundColor: 'white', borderRadius: 16, maxHeight: '80%' }}>
              <LinearGradient
                colors={['#78350F', '#A16207']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ padding: 16, borderTopLeftRadius: 16, borderTopRightRadius: 16 }}
              >
                <Text style={{ fontFamily: 'PlayfairDisplay', fontSize: 18, fontWeight: 'bold', color: '#FEF3C7' }}>Sélectionner un lot</Text>
                <TouchableOpacity onPress={() => setLotSelectorVisible(false)} style={{ position: 'absolute', right: 16, top: 16 }}>
                  <Text style={{ color: 'rgba(254,243,199,0.8)', fontSize: 20 }}>✕</Text>
                </TouchableOpacity>
              </LinearGradient>
              
              <FlatList
                data={lots}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    onPress={() => handleLotSelect(item)}
                    style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 12 }}
                  >
                    <Text style={{ fontSize: 20 }}>🐔</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: '600', fontSize: 14 }}>{item.nom_lot}</Text>
                      <Text style={{ fontSize: 12, color: colors.inkMuted }}>
                        {item.race || 'Poulet'} • Restant: {item.nombre_restant || 0}
                      </Text>
                    </View>
                    {selectedLot?.id === item.id && <Text style={{ color: colors.green, fontSize: 18 }}>✓</Text>}
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </Modal>

      </View>
    </ScrollView>
  );
}