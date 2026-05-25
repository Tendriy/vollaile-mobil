import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../../constants/colors';
import { useAuth } from '../../hooks/useAuth';
import { useDatabase } from '../../hooks/useDatabase';

export default function ProfilScreen() {
  const { user, logout } = useAuth();
  const { isOnline, manualSync } = useDatabase(user?.id);
  const { t } = useTranslation();
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Voulez-vous vraiment vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Déconnecter', onPress: async () => {
        await logout();
        router.replace('/login');
      }, style: 'destructive' }
    ]);
  };

  const handleSync = async () => {
    const result = await manualSync();
    Alert.alert('Synchronisation', result.message);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarIcon}>🐔</Text>
        </View>
        <Text style={styles.userName}>{user?.nom_complet || user?.username}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
        
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: isOnline ? colors.greenPale : colors.terraLight }]}>
            <Text style={[styles.statusText, { color: isOnline ? colors.green : colors.terra }]}>
              {isOnline ? '🟢 En ligne' : '🔴 Hors ligne'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.cardTitle}>Informations du compte</Text>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Nom d'utilisateur</Text>
          <Text style={styles.infoValue}>{user?.username}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Email</Text>
          <Text style={styles.infoValue}>{user?.email}</Text>
        </View>
        
        <View style={[styles.infoRow, styles.lastInfoRow]}>
          <Text style={styles.infoLabel}>Membre depuis</Text>
          <Text style={styles.infoValue}>{user?.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR') : '—'}</Text>
        </View>
      </View>

      <TouchableOpacity onPress={handleSync} style={styles.syncButton}>
        <Text style={styles.syncIcon}>🔄</Text>
        <View style={styles.syncTextContainer}>
          <Text style={styles.syncTitle}>Synchroniser les données</Text>
          <Text style={styles.syncSubtitle}>Synchroniser avec le serveur</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
        <Text style={styles.logoutIcon}>🚪</Text>
        <View style={styles.logoutTextContainer}>
          <Text style={styles.logoutTitle}>Se déconnecter</Text>
          <Text style={styles.logoutSubtitle}>Quitter l'application</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 30,
  },
  avatarContainer: {
    backgroundColor: colors.amber,
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarIcon: {
    fontSize: 40,
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.ink,
  },
  userEmail: {
    fontSize: 14,
    color: colors.inkSoft,
    marginTop: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  cardTitle: {
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 15,
    fontSize: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  lastInfoRow: {
    borderBottomWidth: 0,
  },
  infoLabel: {
    color: colors.inkSoft,
  },
  infoValue: {
    fontWeight: '500',
    color: colors.ink,
  },
  syncButton: {
    backgroundColor: colors.parchment,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 15,
  },
  syncIcon: {
    fontSize: 20,
  },
  syncTextContainer: {
    flex: 1,
  },
  syncTitle: {
    fontWeight: '600',
    color: colors.ink,
  },
  syncSubtitle: {
    fontSize: 11,
    color: colors.inkSoft,
  },
  logoutButton: {
    backgroundColor: colors.terraLight,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 10,
  },
  logoutIcon: {
    fontSize: 20,
  },
  logoutTextContainer: {
    flex: 1,
  },
  logoutTitle: {
    fontWeight: '600',
    color: colors.terra,
  },
  logoutSubtitle: {
    fontSize: 11,
    color: colors.inkSoft,
  },
});