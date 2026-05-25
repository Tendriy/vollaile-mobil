import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, FlatList, Modal, RefreshControl, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { colors } from '../../constants/colors';
import { useAuth } from '../../hooks/useAuth';
import { addVaccin, deleteVaccin, getLots, getVaccins, markVaccinDone } from '../../services/database-wrapper';
import { appEvents, EVENTS } from '../../services/eventEmitter';

// Types
interface VaccinType {
  id: number;
  lot_id: number;
  nom_lot?: string;
  type_vaccin: string;
  date_programmee: string;
  date_effectuee?: string;
  statut: 'programme' | 'effectue';
}

interface LotType {
  id: number;
  nom_lot: string;
  race?: string;
  nombre_initial: number;
  nombre_restant?: number;
  statut: string;
}

export default function VaccinsScreen() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [vaccins, setVaccins] = useState<VaccinType[]>([]);
  const [lots, setLots] = useState<LotType[]>([]);
  const [alertesVaccins, setAlertesVaccins] = useState<VaccinType[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [lotSelectorVisible, setLotSelectorVisible] = useState(false);
  const [selectedLot, setSelectedLot] = useState<LotType | null>(null);
  const [filtreActif, setFiltreActif] = useState<'tous' | 'programme' | 'effectue'>('tous');
  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({
    lot_id: '',
    type_vaccin: '',
    date_programmee: today
  });

  useEffect(() => {
    if (user?.id) {
      loadAllData();
    }
  }, [user]);

  // ÉCOUTE DES ÉVÉNEMENTS - Mise à jour automatique
  useEffect(() => {
    const handleDataChange = () => {
      console.log('🔄 Données modifiées, rechargement des vaccins...');
      loadAllData();
    };

    // S'abonner aux événements
    appEvents.on(EVENTS.DATA_CHANGED, handleDataChange);
    appEvents.on(EVENTS.VACCIN_ADDED, handleDataChange);
    appEvents.on(EVENTS.LOT_ADDED, handleDataChange);

    // Nettoyage
    return () => {
      appEvents.off(EVENTS.DATA_CHANGED, handleDataChange);
      appEvents.off(EVENTS.VACCIN_ADDED, handleDataChange);
      appEvents.off(EVENTS.LOT_ADDED, handleDataChange);
    };
  }, []);

  // RECHARGEMENT QUAND L'ÉCRAN EST FOCUS
  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        console.log('📱 Vaccins screen focus, rechargement...');
        loadAllData();
      }
    }, [user?.id])
  );

  const loadAllData = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [vaccinsData, lotsData] = await Promise.all([
        getVaccins(user.id),
        getLots(user.id)
      ]);
      
      const vaccinsList = Array.isArray(vaccinsData) ? vaccinsData : [];
      const lotsList = Array.isArray(lotsData) ? lotsData : [];
      
      setVaccins(vaccinsList);
      setLots(lotsList.filter(l => l && l.statut === 'actif'));
      
      // Calculer les alertes (vaccins dans les 3 jours)
      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);
      const troisJoursPlusTard = new Date(todayDate);
      troisJoursPlusTard.setDate(todayDate.getDate() + 3);
      
      const alertes = vaccinsList.filter(v => {
        if (!v || v.statut !== 'programme') return false;
        try {
          const dateProg = new Date(v.date_programmee);
          return dateProg >= todayDate && dateProg <= troisJoursPlusTard;
        } catch {
          return false;
        }
      });
      setAlertesVaccins(alertes);
    } catch (error) {
      console.error('Error loading vaccins:', error);
      setVaccins([]);
      setAlertesVaccins([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
  };

  const isUrgent = (dateStr: string) => {
    if (!dateStr) return false;
    try {
      const diff = Math.ceil((new Date(dateStr).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      return diff <= 3 && diff >= 0;
    } catch {
      return false;
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '—';
      return d.toLocaleDateString('fr-FR');
    } catch {
      return '—';
    }
  };

  const handleLotSelect = (lot: LotType) => {
    setSelectedLot(lot);
    setForm({ ...form, lot_id: String(lot.id) });
    setLotSelectorVisible(false);
  };

  const saveVaccin = async () => {
    if (!form.lot_id || !form.type_vaccin || !form.date_programmee) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      await addVaccin({
        lot_id: parseInt(form.lot_id, 10),
        type_vaccin: form.type_vaccin,
        date_programmee: form.date_programmee
      });
      Alert.alert('Succès', '✅ Vaccin programmé avec succès');
      setModalVisible(false);
      setSelectedLot(null);
      setForm({
        lot_id: '',
        type_vaccin: '',
        date_programmee: today
      });
      await loadAllData();
      // Émettre l'événement
      appEvents.emit(EVENTS.VACCIN_ADDED);
      appEvents.emit(EVENTS.DATA_CHANGED);
    } catch (error: any) {
      console.error('Error saving vaccin:', error);
      Alert.alert('Erreur', error?.response?.data?.error || '❌ Erreur lors de la programmation');
    }
  };

  const marquerEffectue = async (id: number) => {
    try {
      await markVaccinDone(id);
      await loadAllData();
      Alert.alert('Succès', '✅ Vaccin marqué comme effectué');
      // Émettre l'événement
      appEvents.emit(EVENTS.VACCIN_ADDED);
      appEvents.emit(EVENTS.DATA_CHANGED);
    } catch (error) {
      Alert.alert('Erreur', '❌ Erreur lors de la mise à jour');
    }
  };

  const supprimerVaccin = (id: number) => {
    Alert.alert(
      'Confirmation',
      'Voulez-vous vraiment supprimer ce vaccin programmé ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', onPress: async () => {
          try {
            await deleteVaccin(id);
            await loadAllData();
            Alert.alert('Succès', 'Vaccin supprimé');
            // Émettre l'événement
            appEvents.emit(EVENTS.VACCIN_ADDED);
            appEvents.emit(EVENTS.DATA_CHANGED);
          } catch (error) {
            Alert.alert('Erreur', '❌ Erreur lors de la suppression');
          }
        }, style: 'destructive' }
      ]
    );
  };

  const vaccinsProgrammes = vaccins.filter(v => v && v.statut === 'programme').length;
  const vaccinsEffectues = vaccins.filter(v => v && v.statut === 'effectue').length;

  const vaccinsFiltres = () => {
    if (filtreActif === 'tous') return vaccins;
    return vaccins.filter(v => v && v.statut === filtreActif);
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
                💉 Programme sanitaire
              </Text>
              <Text style={{ fontFamily: 'PlayfairDisplay', fontSize: 28, fontWeight: 'bold', color: '#FEF3C7' }}>
                {t('vaccins')}
              </Text>
              <Text style={{ fontSize: 12, color: 'rgba(254,243,199,0.5)' }}>
                {vaccins.length} vaccin{vaccins.length > 1 ? 's' : ''} enregistré{vaccins.length > 1 ? 's' : ''}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <View style={{ alignItems: 'center', backgroundColor: 'rgba(254,243,199,0.12)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 }}>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#FEF3C7' }}>{vaccinsProgrammes}</Text>
                <Text style={{ fontSize: 9, color: 'rgba(254,243,199,0.55)' }}>⏳ Programmés</Text>
              </View>
              <View style={{ alignItems: 'center', backgroundColor: 'rgba(220,252,231,0.15)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 }}>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#FEF3C7' }}>{vaccinsEffectues}</Text>
                <Text style={{ fontSize: 9, color: 'rgba(254,243,199,0.55)' }}>✅ Effectués</Text>
              </View>
              <TouchableOpacity 
                onPress={() => setModalVisible(true)}
                style={{ backgroundColor: colors.amberLight, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 100 }}
              >
                <Text style={{ color: '#3B1A00', fontWeight: '700', fontSize: 12 }}>➕ Programme</Text>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>

        {/* ALERTES VACCINS - Glassmorphism */}
        {alertesVaccins.length > 0 && (
          <View style={{ marginBottom: 16, borderRadius: 16, overflow: 'hidden', backgroundColor: 'rgba(245,158,11,0.12)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.35)' }}>
            <LinearGradient
              colors={['rgba(255,251,235,0.55)', 'rgba(255,251,235,0.35)']}
              style={{ padding: 16 }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <View style={{ width: 44, height: 44, backgroundColor: 'rgba(217,119,6,0.12)', borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(217,119,6,0.22)' }}>
                  <Text style={{ fontSize: 22 }}>💉</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '700', color: '#92400E', fontSize: 14 }}>{t('vaccine_reminder')}</Text>
                  <Text style={{ fontSize: 11, color: '#B45309' }}>{alertesVaccins.length} vaccin{alertesVaccins.length > 1 ? 's' : ''} à administrer dans les 3 prochains jours</Text>
                </View>
                <View style={{ backgroundColor: 'rgba(217,119,6,0.12)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(217,119,6,0.22)' }}>
                  <Text style={{ color: colors.amber, fontWeight: 'bold', fontSize: 13 }}>{alertesVaccins.length}</Text>
                </View>
              </View>
              
              {alertesVaccins.map((alerte, idx) => (
                <View key={alerte.id || idx} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderTopWidth: idx > 0 ? 1 : 0, borderTopColor: 'rgba(217,119,6,0.15)' }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.amber }} />
                  <Text style={{ flex: 1, fontSize: 12, color: '#78350F', fontWeight: '500' }}>
                    {alerte.nom_lot || 'Lot inconnu'} : {alerte.type_vaccin || 'Vaccin'} le {formatDate(alerte.date_programmee)}
                  </Text>
                  <TouchableOpacity 
                    onPress={() => marquerEffectue(alerte.id)}
                    style={{ backgroundColor: 'rgba(34,197,94,0.12)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(34,197,94,0.25)' }}
                  >
                    <Text style={{ color: colors.green, fontSize: 11, fontWeight: '600' }}>✅ Marquer</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </LinearGradient>
          </View>
        )}

        {/* TABLEAU DES VACCINS */}
        <View style={{ backgroundColor: 'white', borderRadius: 16, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.parchment, flexWrap: 'wrap', gap: 10 }}>
            <Text style={{ fontWeight: '600', fontSize: 14, color: colors.ink }}>📋 {t('vaccins')}</Text>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <TouchableOpacity 
                onPress={() => setFiltreActif('tous')}
                style={{ backgroundColor: filtreActif === 'tous' ? colors.wheat : 'white', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: colors.border }}
              >
                <Text style={{ color: filtreActif === 'tous' ? colors.amber : colors.inkSoft, fontSize: 12, fontWeight: '500' }}>Tous <Text style={{ fontSize: 10 }}>({vaccins.length})</Text></Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => setFiltreActif('programme')}
                style={{ backgroundColor: filtreActif === 'programme' ? colors.wheat : 'white', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: colors.border }}
              >
                <Text style={{ color: filtreActif === 'programme' ? colors.amber : colors.inkSoft, fontSize: 12, fontWeight: '500' }}>⏳ Programmés <Text style={{ fontSize: 10 }}>({vaccinsProgrammes})</Text></Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => setFiltreActif('effectue')}
                style={{ backgroundColor: filtreActif === 'effectue' ? colors.wheat : 'white', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: colors.border }}
              >
                <Text style={{ color: filtreActif === 'effectue' ? colors.amber : colors.inkSoft, fontSize: 12, fontWeight: '500' }}>✅ Effectués <Text style={{ fontSize: 10 }}>({vaccinsEffectues})</Text></Text>
              </TouchableOpacity>
            </View>
          </View>

          {vaccinsFiltres().length === 0 ? (
            <View style={{ paddingVertical: 48, alignItems: 'center', gap: 10 }}>
              <Text style={{ fontSize: 40, opacity: 0.4 }}>💉</Text>
              <Text style={{ color: colors.inkMuted, fontSize: 14 }}>Aucun vaccin dans cette catégorie</Text>
              {filtreActif !== 'effectue' && (
                <TouchableOpacity onPress={() => setModalVisible(true)} style={{ backgroundColor: colors.amber, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 100, marginTop: 8 }}>
                  <Text style={{ color: 'white', fontWeight: '600' }}>➕ Programmer un vaccin</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={true}>
              <View>
                {/* En-tête */}
                <View style={{ flexDirection: 'row', backgroundColor: colors.parchment, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                  <Text style={{ width: 130, paddingHorizontal: 12, fontSize: 10, fontWeight: '700', color: colors.inkMuted }}>{t('lot_name')}</Text>
                  <Text style={{ width: 120, paddingHorizontal: 12, fontSize: 10, fontWeight: '700', color: colors.inkMuted }}>{t('vaccine_type')}</Text>
                  <Text style={{ width: 120, paddingHorizontal: 12, fontSize: 10, fontWeight: '700', color: colors.inkMuted }}>{t('scheduled_date')}</Text>
                  <Text style={{ width: 120, paddingHorizontal: 12, fontSize: 10, fontWeight: '700', color: colors.inkMuted }}>{t('performed_date')}</Text>
                  <Text style={{ width: 110, paddingHorizontal: 12, fontSize: 10, fontWeight: '700', color: colors.inkMuted }}>{t('status')}</Text>
                  <Text style={{ width: 90, paddingHorizontal: 12, fontSize: 10, fontWeight: '700', color: colors.inkMuted, textAlign: 'center' }}>{t('actions')}</Text>
                </View>

                {vaccinsFiltres().map((vaccin, idx) => {
                  const urgent = vaccin && isUrgent(vaccin.date_programmee) && vaccin.statut === 'programme';
                  const nomLot = vaccin?.nom_lot || 'Lot inconnu';
                  const typeVaccin = vaccin?.type_vaccin || 'Vaccin';
                  const dateProgrammee = vaccin?.date_programmee || '';
                  const dateEffectuee = vaccin?.date_effectuee || '';
                  const statut = vaccin?.statut || 'programme';
                  
                  return (
                    <View key={vaccin?.id || idx} style={{ 
                      flexDirection: 'row', 
                      paddingVertical: 12, 
                      borderBottomWidth: 1, 
                      borderBottomColor: colors.border, 
                      backgroundColor: urgent ? 'rgba(254,241,238,0.6)' : (statut === 'effectue' ? 'rgba(0,0,0,0.03)' : 'white') 
                    }}>
                      <View style={{ width: 130, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={{ fontSize: 13 }}>🐔</Text>
                        <Text style={{ fontWeight: '600', fontSize: 13 }} numberOfLines={1}>{nomLot}</Text>
                      </View>
                      <View style={{ width: 120, paddingHorizontal: 12 }}>
                        <View style={{ backgroundColor: colors.wheat, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, alignSelf: 'flex-start' }}>
                          <Text style={{ color: '#92400E', fontSize: 11, fontWeight: '600' }}>{typeVaccin}</Text>
                        </View>
                      </View>
                      <View style={{ width: 120, paddingHorizontal: 12 }}>
                        <Text style={{ color: urgent ? colors.terra : colors.inkSoft, fontSize: 12, fontWeight: urgent ? '700' : '400' }}>
                          {formatDate(dateProgrammee)}
                        </Text>
                        {urgent && <Text style={{ color: colors.terra, fontSize: 11, marginLeft: 4 }}> 🔥</Text>}
                      </View>
                      <View style={{ width: 120, paddingHorizontal: 12 }}>
                        <Text style={{ color: dateEffectuee ? colors.green : colors.inkMuted, fontSize: 12, fontWeight: dateEffectuee ? '500' : '400' }}>
                          {dateEffectuee ? formatDate(dateEffectuee) : '—'}
                        </Text>
                      </View>
                      <View style={{ width: 110, paddingHorizontal: 12 }}>
                        <View style={{ backgroundColor: statut === 'effectue' ? colors.greenPale : colors.wheat, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, alignSelf: 'flex-start' }}>
                          <Text style={{ color: statut === 'effectue' ? colors.green : '#92400E', fontSize: 10, fontWeight: '600' }}>
                            {statut === 'effectue' ? '✅ Effectué' : '⏳ Programmé'}
                          </Text>
                        </View>
                      </View>
                      <View style={{ width: 90, paddingHorizontal: 12, alignItems: 'center' }}>
                        {statut === 'programme' ? (
                          <View style={{ flexDirection: 'row', gap: 8 }}>
                            <TouchableOpacity onPress={() => marquerEffectue(vaccin.id)} style={{ backgroundColor: colors.greenLight, width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(21,128,61,0.15)' }}>
                              <Text style={{ fontSize: 14 }}>✅</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => supprimerVaccin(vaccin.id)} style={{ backgroundColor: colors.terraLight, width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(194,65,12,0.15)' }}>
                              <Text style={{ fontSize: 14 }}>🗑️</Text>
                            </TouchableOpacity>
                          </View>
                        ) : (
                          <Text style={{ color: colors.inkMuted, fontSize: 12 }}>—</Text>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          )}
        </View>

        {/* MODAL AJOUT VACCIN AVEC SÉLECTEUR DE LOT */}
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
                  <Text style={{ fontSize: 22 }}>💉</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: 'PlayfairDisplay', fontSize: 16, fontWeight: 'bold', color: '#FEF3C7' }}>
                    {t('program_vaccine')}
                  </Text>
                  <Text style={{ fontSize: 11, color: 'rgba(254,243,199,0.55)' }}>
                    Planifier une vaccination pour un lot actif
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setModalVisible(false)} style={{ width: 32, height: 32, backgroundColor: 'rgba(254,243,199,0.12)', borderRadius: 8, justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ color: 'rgba(254,243,199,0.8)', fontSize: 16 }}>✕</Text>
                </TouchableOpacity>
              </LinearGradient>

              <ScrollView style={{ padding: 16 }}>
                {/* Sélecteur de Lot personnalisé */}
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
                      {selectedLot ? `${selectedLot.nom_lot} — ${selectedLot.race || 'Race inconnue'} (${selectedLot.nombre_restant || selectedLot.nombre_initial} restants)` : "— Choisir un lot —"}
                    </Text>
                    <Text style={{ fontSize: 12, color: colors.inkMuted }}>▼</Text>
                  </TouchableOpacity>
                </View>

                {/* Type de vaccin */}
                <View style={{ marginBottom: 18 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', marginBottom: 7, color: colors.ink }}>
                    {t('vaccine_type')} <Text style={{ color: colors.terra }}>*</Text>
                  </Text>
                  <View style={{ borderWidth: 1.5, borderColor: 'rgba(180,120,50,0.22)', borderRadius: 10, flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ paddingLeft: 12, fontSize: 14 }}>🧬</Text>
                    <TextInput
                      placeholder="Ex: Newcastle, Gumboro, Bronchite..."
                      value={form.type_vaccin}
                      onChangeText={text => setForm({...form, type_vaccin: text})}
                      style={{ flex: 1, padding: 12, fontSize: 14 }}
                    />
                  </View>
                </View>

                {/* Date programmée */}
                <View style={{ marginBottom: 24 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', marginBottom: 7, color: colors.ink }}>
                    {t('scheduled_date')} <Text style={{ color: colors.terra }}>*</Text>
                  </Text>
                  <View style={{ borderWidth: 1.5, borderColor: 'rgba(180,120,50,0.22)', borderRadius: 10, flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ paddingLeft: 12, fontSize: 14 }}>📅</Text>
                    <TextInput
                      placeholder="YYYY-MM-DD"
                      value={form.date_programmee}
                      onChangeText={text => setForm({...form, date_programmee: text})}
                      style={{ flex: 1, padding: 12, fontSize: 14 }}
                    />
                  </View>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 8, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.border }}>
                  <TouchableOpacity onPress={() => setModalVisible(false)} style={{ paddingHorizontal: 22, paddingVertical: 10, borderWidth: 1.5, borderColor: colors.border, borderRadius: 100 }}>
                    <Text style={{ color: colors.inkSoft, fontWeight: '500' }}>{t('cancel')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={saveVaccin} style={{ paddingHorizontal: 26, paddingVertical: 10, backgroundColor: colors.amber, borderRadius: 100, shadowColor: colors.amber, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 3 }}>
                    <Text style={{ color: 'white', fontWeight: '600' }}>💾 {t('program_vaccine')}</Text>
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
                style={{ padding: 16, borderTopLeftRadius: 16, borderTopRightRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <Text style={{ fontFamily: 'PlayfairDisplay', fontSize: 18, fontWeight: 'bold', color: '#FEF3C7' }}>Sélectionner un lot</Text>
                <TouchableOpacity onPress={() => setLotSelectorVisible(false)} style={{ width: 32, height: 32, backgroundColor: 'rgba(254,243,199,0.12)', borderRadius: 8, justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ color: 'rgba(254,243,199,0.8)', fontSize: 16 }}>✕</Text>
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
                    <View style={{ width: 36, height: 36, backgroundColor: colors.wheat, borderRadius: 8, justifyContent: 'center', alignItems: 'center' }}>
                      <Text style={{ fontSize: 16 }}>🐔</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: '600', fontSize: 14, color: colors.ink }}>{item.nom_lot}</Text>
                      <Text style={{ fontSize: 12, color: colors.inkMuted }}>
                        {item.race || 'Poulet'} • Restant: {item.nombre_restant || item.nombre_initial}
                      </Text>
                    </View>
                    {selectedLot?.id === item.id && (
                      <View style={{ width: 24, height: 24, backgroundColor: colors.greenPale, borderRadius: 12, justifyContent: 'center', alignItems: 'center' }}>
                        <Text style={{ color: colors.green, fontSize: 14 }}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                )}
                ListEmptyComponent={() => (
                  <View style={{ padding: 40, alignItems: 'center' }}>
                    <Text style={{ fontSize: 40, opacity: 0.4 }}>🐔</Text>
                    <Text style={{ color: colors.inkMuted, marginTop: 8 }}>Aucun lot actif disponible</Text>
                  </View>
                )}
              />
            </View>
          </View>
        </Modal>

      </View>
    </ScrollView>
  );
}