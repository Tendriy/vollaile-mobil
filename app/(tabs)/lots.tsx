import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Modal, RefreshControl, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { colors } from '../../constants/colors';
import { useAuth } from '../../hooks/useAuth';
import { addLot, deleteLot, getLots, updateLot } from '../../services/database-wrapper';
import { appEvents, EVENTS } from '../../services/eventEmitter';

// Définition des types
interface LotType {
  id: number;
  user_id: number;
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
  created_at?: string;
}

export default function LotsScreen() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingLot, setEditingLot] = useState<LotType | null>(null);
  const [searchText, setSearchText] = useState('');
  const [lots, setLots] = useState<LotType[]>([]);
  const [filteredLots, setFilteredLots] = useState<LotType[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    nom_lot: '',
    race: '',
    fournisseur: '',
    nombre_initial: '',
    date_arrivee: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (user?.id) {
      loadLots();
    }
  }, [user]);

  // ÉCOUTE DES ÉVÉNEMENTS - Mise à jour automatique
  useEffect(() => {
    const handleDataChange = () => {
      console.log('🔄 Données modifiées, rechargement des lots...');
      loadLots();
    };

    // S'abonner aux événements
    appEvents.on(EVENTS.DATA_CHANGED, handleDataChange);
    appEvents.on(EVENTS.LOT_ADDED, handleDataChange);
    appEvents.on(EVENTS.VENTE_ADDED, handleDataChange);
    appEvents.on(EVENTS.SUIVI_ADDED, handleDataChange);

    // Nettoyage
    return () => {
      appEvents.off(EVENTS.DATA_CHANGED, handleDataChange);
      appEvents.off(EVENTS.LOT_ADDED, handleDataChange);
      appEvents.off(EVENTS.VENTE_ADDED, handleDataChange);
      appEvents.off(EVENTS.SUIVI_ADDED, handleDataChange);
    };
  }, []);

  // RECHARGEMENT QUAND L'ÉCRAN EST FOCUS
  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        console.log('📱 Lots screen focus, rechargement...');
        loadLots();
      }
    }, [user?.id])
  );

  const loadLots = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const data = await getLots(user.id);
      const lotsData = Array.isArray(data) ? data : [];
      
      // Calculer les restants pour chaque lot (initial - morts - vendus)
      const lotsWithRestant = lotsData.map(lot => ({
        ...lot,
        nombre_restant: lot.nombre_initial - (lot.total_morts || 0) - (lot.total_vendus || 0)
      }));
      
      setLots(lotsWithRestant);
      setFilteredLots(lotsWithRestant);
    } catch (error) {
      console.error('Error loading lots:', error);
      Alert.alert('Erreur', 'Impossible de charger les lots');
      setLots([]);
      setFilteredLots([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLots();
    setRefreshing(false);
  };

  const handleSearch = (text: string) => {
    setSearchText(text);
    if (!text.trim()) {
      setFilteredLots(lots);
      return;
    }
    const keyword = text.toLowerCase();
    const filtered = lots.filter(lot =>
      (lot.nom_lot && lot.nom_lot.toLowerCase().includes(keyword)) ||
      (lot.race && lot.race.toLowerCase().includes(keyword)) ||
      (lot.fournisseur && lot.fournisseur.toLowerCase().includes(keyword))
    );
    setFilteredLots(filtered);
  };

  const openAddModal = () => {
    setEditingLot(null);
    setForm({
      nom_lot: '',
      race: '',
      fournisseur: '',
      nombre_initial: '',
      date_arrivee: new Date().toISOString().split('T')[0]
    });
    setModalVisible(true);
  };

  // Fonction pour vérifier les doublons et ajouter/modifier un lot
  const saveLot = async () => {
    if (!form.nom_lot.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir un nom de lot');
      return;
    }
    if (!form.nombre_initial || parseInt(form.nombre_initial, 10) <= 0) {
      Alert.alert('Erreur', 'Veuillez saisir un nombre initial valide');
      return;
    }
    if (!form.date_arrivee) {
      Alert.alert('Erreur', 'Veuillez saisir une date d\'arrivée');
      return;
    }

    const nouveauNom = form.nom_lot.trim();
    const nouvelleRace = form.race || '';
    const nouvelleQuantite = parseInt(form.nombre_initial, 10);

    // Récupérer tous les lots actifs de l'utilisateur
    const lotsActifs = lots.filter(l => l.statut === 'actif');

    // Chercher un lot avec le même nom
    const lotExistant = lotsActifs.find(l => l.nom_lot === nouveauNom);

    // Si en mode édition, on vérifie si c'est le même lot
    if (editingLot) {
      if (lotExistant && lotExistant.id !== editingLot.id) {
        if (lotExistant.race !== nouvelleRace) {
          Alert.alert(
            'Erreur',
            `❌ REFUSÉ ! Le lot "${nouveauNom}" existe déjà avec la race "${lotExistant.race}". Vous ne pouvez PAS modifier la race. Utilisez un nom différent ou supprimez d'abord l'ancien lot.`
          );
          return;
        } else {
          Alert.alert(
            'Fusion possible',
            `Un lot "${nouveauNom}" (${lotExistant.race}) existe déjà avec ${lotExistant.nombre_initial} sujets. Voulez-vous fusionner en ajoutant ${nouvelleQuantite} ?`,
            [
              { text: 'Annuler', style: 'cancel' },
              { 
                text: 'Fusionner', 
                onPress: async () => {
                  try {
                    const nouvelleQuantiteTotale = lotExistant.nombre_initial + nouvelleQuantite;
                    await updateLot(lotExistant.id, {
                      ...lotExistant,
                      nombre_initial: nouvelleQuantiteTotale,
                      fournisseur: form.fournisseur || lotExistant.fournisseur
                    });
                    Alert.alert('Succès', `✅ ${nouvelleQuantite} ajoutés au lot "${nouveauNom}". Nouveau total : ${nouvelleQuantiteTotale}`);
                    setModalVisible(false);
                    await loadLots();
                    // Émettre l'événement
                    appEvents.emit(EVENTS.LOT_ADDED);
                    appEvents.emit(EVENTS.DATA_CHANGED);
                  } catch (error) {
                    Alert.alert('Erreur', 'Erreur lors de la fusion');
                  }
                }
              }
            ]
          );
          return;
        }
      }
      
      const lotData = {
        nom_lot: nouveauNom,
        race: nouvelleRace || null,
        fournisseur: form.fournisseur || null,
        nombre_initial: nouvelleQuantite,
        date_arrivee: form.date_arrivee,
        statut: 'actif' as const
      };
      
      try {
        await updateLot(editingLot.id, lotData);
        Alert.alert('Succès', 'Lot modifié avec succès');
        setModalVisible(false);
        await loadLots();
        // Émettre l'événement
        appEvents.emit(EVENTS.LOT_ADDED);
        appEvents.emit(EVENTS.DATA_CHANGED);
      } catch (error) {
        Alert.alert('Erreur', "Erreur lors de la modification");
      }
      return;
    }

    // Mode ajout - Vérifier les doublons
    if (lotExistant) {
      if (lotExistant.race === nouvelleRace) {
        Alert.alert(
          'Fusion possible',
          `Un lot "${nouveauNom}" (${lotExistant.race}) existe déjà avec ${lotExistant.nombre_initial} sujets. Voulez-vous fusionner en ajoutant ${nouvelleQuantite} ?`,
          [
            { text: 'Annuler', style: 'cancel' },
            { 
              text: 'Fusionner', 
              onPress: async () => {
                try {
                  const nouvelleQuantiteTotale = lotExistant.nombre_initial + nouvelleQuantite;
                  await updateLot(lotExistant.id, {
                    ...lotExistant,
                    nombre_initial: nouvelleQuantiteTotale,
                    fournisseur: form.fournisseur || lotExistant.fournisseur
                  });
                  Alert.alert('Succès', `✅ ${nouvelleQuantite} ajoutés au lot "${nouveauNom}". Nouveau total : ${nouvelleQuantiteTotale}`);
                  setModalVisible(false);
                  await loadLots();
                  // Émettre l'événement
                  appEvents.emit(EVENTS.LOT_ADDED);
                  appEvents.emit(EVENTS.DATA_CHANGED);
                } catch (error) {
                  Alert.alert('Erreur', 'Erreur lors de la fusion');
                }
              }
            }
          ]
        );
        return;
      } else {
        Alert.alert(
          'Erreur',
          `❌ REFUSÉ ! Le lot "${nouveauNom}" existe déjà avec la race "${lotExistant.race}". Vous ne pouvez PAS ajouter une nouvelle race "${nouvelleRace}". Utilisez un nom de lot différent.`
        );
        return;
      }
    }

    const lotData = {
      nom_lot: nouveauNom,
      race: nouvelleRace || null,
      fournisseur: form.fournisseur || null,
      nombre_initial: nouvelleQuantite,
      date_arrivee: form.date_arrivee,
      statut: 'actif' as const
    };

    try {
      await addLot({ ...lotData, user_id: user?.id });
      Alert.alert('Succès', 'Lot ajouté avec succès');
      setModalVisible(false);
      await loadLots();
      // Émettre l'événement
      appEvents.emit(EVENTS.LOT_ADDED);
      appEvents.emit(EVENTS.DATA_CHANGED);
    } catch (error) {
      console.error('Error saving lot:', error);
      Alert.alert('Erreur', "Erreur lors de l'enregistrement");
    }
  };

  const confirmDelete = (lot: LotType) => {
    Alert.alert(
      'Confirmation',
      `Supprimer le lot "${lot.nom_lot}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', onPress: async () => {
          try {
            await deleteLot(lot.id);
            await loadLots();
            Alert.alert('Succès', 'Lot supprimé');
            // Émettre l'événement
            appEvents.emit(EVENTS.LOT_ADDED);
            appEvents.emit(EVENTS.DATA_CHANGED);
          } catch (error) {
            Alert.alert('Erreur', 'Erreur lors de la suppression');
          }
        }, style: 'destructive' }
      ]
    );
  };

  const voirLot = (id: number) => {
    router.push(`/lot/${id}`);
  };

  const getRestantColor = (nombre?: number) => {
    const n = nombre || 0;
    if (n <= 0) return colors.terra;
    if (n < 10) return colors.amber;
    return colors.green;
  };

  const getRestantText = (nombre?: number) => {
    const n = nombre || 0;
    return n > 0 ? n : 0;
  };

  const getMortsColor = (morts?: number) => {
    return (morts || 0) > 0 ? colors.terra : colors.green;
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
                🐔 Gestion des élevages
              </Text>
              <Text style={{ fontFamily: 'PlayfairDisplay', fontSize: 28, fontWeight: 'bold', color: '#FEF3C7' }}>
                {t('lots')}
              </Text>
              <Text style={{ fontSize: 12, color: 'rgba(254,243,199,0.5)' }}>
                {lots.length} lot{lots.length > 1 ? 's' : ''} enregistré{lots.length > 1 ? 's' : ''}
              </Text>
            </View>
            <TouchableOpacity 
              onPress={openAddModal}
              style={{ backgroundColor: colors.amberLight, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 100 }}
            >
              <Text style={{ color: '#3B1A00', fontWeight: '700', fontSize: 13 }}>➕ {t('new_lot')}</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* BARRE DE RECHERCHE */}
        <View style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderWidth: 1.5, borderColor: colors.border, borderRadius: 100, paddingHorizontal: 16 }}>
            <Text style={{ fontSize: 14, marginRight: 8 }}>🔍</Text>
            <TextInput
              placeholder={t('search_lot')}
              value={searchText}
              onChangeText={handleSearch}
              style={{ flex: 1, paddingVertical: 12, fontSize: 14 }}
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => handleSearch('')}>
                <Text style={{ color: colors.inkMuted }}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
          {searchText.length > 0 && (
            <Text style={{ fontSize: 11, color: colors.inkMuted, marginTop: 6, paddingLeft: 12 }}>
              {filteredLots.length} résultat{filteredLots.length > 1 ? 's' : ''} pour "{searchText}"
            </Text>
          )}
        </View>

        {/* LISTE DES LOTS */}
        {filteredLots.length > 0 ? (
          filteredLots.map((lot) => {
            const nomLot = lot.nom_lot || 'Lot inconnu';
            const race = lot.race || '—';
            const nombreInitial = lot.nombre_initial || 0;
            // Calcul correct des restants = initial - morts - vendus
            const nombreRestant = lot.nombre_initial - (lot.total_morts || 0) - (lot.total_vendus || 0);
            const totalVendus = lot.total_vendus || 0;
            const totalMorts = lot.total_morts || 0;
            const age = lot.age || 0;
            const statut = lot.statut || 'actif';
            
            return (
              <TouchableOpacity
                key={lot.id}
                onPress={() => voirLot(lot.id)}
                style={{ backgroundColor: 'white', borderRadius: 16, padding: 15, marginBottom: 12, borderWidth: 1, borderColor: colors.border }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={{ backgroundColor: colors.wheat, width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' }}>
                      <Text style={{ fontSize: 20 }}>🐔</Text>
                    </View>
                    <View>
                      <Text style={{ fontWeight: '700', color: colors.ink, fontSize: 16 }}>{nomLot}</Text>
                      <Text style={{ fontSize: 12, color: colors.inkSoft }}>{race}</Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity onPress={() => {
                      setEditingLot(lot);
                      setForm({
                        nom_lot: lot.nom_lot || '',
                        race: lot.race || '',
                        fournisseur: lot.fournisseur || '',
                        nombre_initial: lot.nombre_initial ? lot.nombre_initial.toString() : '',
                        date_arrivee: lot.date_arrivee || new Date().toISOString().split('T')[0]
                      });
                      setModalVisible(true);
                    }} style={{ backgroundColor: colors.wheat, width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' }}>
                      <Text>✏️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => confirmDelete(lot)} style={{ backgroundColor: colors.terraLight, width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' }}>
                      <Text>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                
                {/* Statistiques */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border }}>
                  <View style={{ alignItems: 'center' }}>
                    <Text style={{ fontSize: 10, color: colors.inkMuted }}>Initial</Text>
                    <Text style={{ fontWeight: '700', color: colors.ink, fontSize: 14 }}>{nombreInitial}</Text>
                  </View>
                  <View style={{ alignItems: 'center' }}>
                    <Text style={{ fontSize: 10, color: colors.inkMuted }}>Restants</Text>
                    <Text style={{ fontWeight: '700', color: getRestantColor(nombreRestant), fontSize: 14 }}>{nombreRestant > 0 ? nombreRestant : 0}</Text>
                  </View>
                  <View style={{ alignItems: 'center' }}>
                    <Text style={{ fontSize: 10, color: colors.inkMuted }}>Vendus</Text>
                    <Text style={{ fontWeight: '700', color: colors.sky, fontSize: 14 }}>{totalVendus}</Text>
                  </View>
                  <View style={{ alignItems: 'center' }}>
                    <Text style={{ fontSize: 10, color: colors.inkMuted }}>Morts</Text>
                    <Text style={{ fontWeight: '700', color: getMortsColor(totalMorts), fontSize: 14 }}>{totalMorts}</Text>
                  </View>
                  <View style={{ alignItems: 'center' }}>
                    <Text style={{ fontSize: 10, color: colors.inkMuted }}>Âge</Text>
                    <View style={{ backgroundColor: colors.skyLight, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 }}>
                      <Text style={{ color: colors.sky, fontSize: 11, fontWeight: '600' }}>{age}j</Text>
                    </View>
                  </View>
                </View>
                
                {/* Statut */}
                <View style={{ marginTop: 12, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ backgroundColor: statut === 'actif' ? colors.greenPale : '#F5F5F4', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 }}>
                    <Text style={{ color: statut === 'actif' ? colors.green : colors.inkMuted, fontSize: 11, fontWeight: '600' }}>
                      {statut === 'actif' ? '🟢 ' + t('active') : '⚫ ' + t('closed')}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => voirLot(lot.id)}>
                    <Text style={{ color: colors.amber, fontSize: 12, fontWeight: '600' }}>Voir détails →</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })
        ) : (
          <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 48, alignItems: 'center', borderWidth: 1, borderColor: colors.border }}>
            <Text style={{ fontSize: 40, marginBottom: 10 }}>📭</Text>
            <Text style={{ color: colors.inkMuted, textAlign: 'center', marginBottom: 16 }}>
              {searchText ? 'Aucun lot ne correspond à votre recherche' : 'Aucun lot enregistré'}
            </Text>
            {!searchText && (
              <TouchableOpacity onPress={openAddModal} style={{ backgroundColor: colors.amber, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 100 }}>
                <Text style={{ color: 'white', fontWeight: '600' }}>➕ Créer le premier lot</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

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
                  <Text style={{ fontSize: 22 }}>🐔</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: 'PlayfairDisplay', fontSize: 16, fontWeight: 'bold', color: '#FEF3C7' }}>
                    {editingLot ? t('edit_lot') : t('new_lot')}
                  </Text>
                  <Text style={{ fontSize: 11, color: 'rgba(254,243,199,0.55)' }}>
                    {editingLot ? 'Modifier les informations du lot' : 'Enregistrer un nouveau lot'}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setModalVisible(false)} style={{ width: 32, height: 32, backgroundColor: 'rgba(254,243,199,0.12)', borderRadius: 8, justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ color: 'rgba(254,243,199,0.8)' }}>✕</Text>
                </TouchableOpacity>
              </LinearGradient>

              <View style={{ padding: 16 }}>
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', marginBottom: 6 }}>{t('lot_name')} <Text style={{ color: colors.terra }}>*</Text></Text>
                  <TextInput
                    placeholder={t('lot_name')}
                    value={form.nom_lot}
                    onChangeText={text => setForm({...form, nom_lot: text})}
                    style={{ borderWidth: 1.5, borderColor: 'rgba(180,120,50,0.22)', borderRadius: 10, padding: 11, fontSize: 14 }}
                  />
                </View>

                <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, fontWeight: '600', marginBottom: 6 }}>{t('breed')}</Text>
                    <TextInput
                      placeholder={t('breed')}
                      value={form.race}
                      onChangeText={text => setForm({...form, race: text})}
                      style={{ borderWidth: 1.5, borderColor: 'rgba(180,120,50,0.22)', borderRadius: 10, padding: 11, fontSize: 14 }}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, fontWeight: '600', marginBottom: 6 }}>{t('supplier')}</Text>
                    <TextInput
                      placeholder={t('supplier')}
                      value={form.fournisseur}
                      onChangeText={text => setForm({...form, fournisseur: text})}
                      style={{ borderWidth: 1.5, borderColor: 'rgba(180,120,50,0.22)', borderRadius: 10, padding: 11, fontSize: 14 }}
                    />
                  </View>
                </View>

                <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, fontWeight: '600', marginBottom: 6 }}>{t('initial_number')} <Text style={{ color: colors.terra }}>*</Text></Text>
                    <TextInput
                      placeholder="Ex: 500"
                      value={form.nombre_initial}
                      onChangeText={text => setForm({...form, nombre_initial: text})}
                      keyboardType="numeric"
                      style={{ borderWidth: 1.5, borderColor: 'rgba(180,120,50,0.22)', borderRadius: 10, padding: 11, fontSize: 14 }}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, fontWeight: '600', marginBottom: 6 }}>{t('arrival_date')} <Text style={{ color: colors.terra }}>*</Text></Text>
                    <TextInput
                      placeholder="YYYY-MM-DD"
                      value={form.date_arrivee}
                      onChangeText={text => setForm({...form, date_arrivee: text})}
                      style={{ borderWidth: 1.5, borderColor: 'rgba(180,120,50,0.22)', borderRadius: 10, padding: 11, fontSize: 14 }}
                    />
                  </View>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 8, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.border }}>
                  <TouchableOpacity onPress={() => setModalVisible(false)} style={{ paddingHorizontal: 20, paddingVertical: 10, borderWidth: 1.5, borderColor: colors.border, borderRadius: 100 }}>
                    <Text style={{ color: colors.inkSoft }}>{t('cancel')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={saveLot} style={{ paddingHorizontal: 24, paddingVertical: 10, backgroundColor: colors.amber, borderRadius: 100 }}>
                    <Text style={{ color: 'white', fontWeight: '600' }}>💾 {editingLot ? t('edit') : t('new_lot')}</Text>
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