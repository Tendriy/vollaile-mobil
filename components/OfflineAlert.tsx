import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../constants/colors';

interface OfflineAlertProps {
  isOnline: boolean;
  onSync?: () => void;
  isSyncing?: boolean;
  lastSync?: Date | null;
}

export default function OfflineAlert({ isOnline, onSync, isSyncing, lastSync }: OfflineAlertProps) {
  // Ne rien afficher si en ligne
  if (isOnline) return null;

  const formatLastSync = () => {
    if (!lastSync) return null;
    const now = new Date();
    const diff = Math.floor((now.getTime() - lastSync.getTime()) / 1000);
    
    if (diff < 60) return 'il y a quelques secondes';
    if (diff < 3600) return `il y a ${Math.floor(diff / 60)} minute(s)`;
    if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} heure(s)`;
    return `le ${lastSync.toLocaleDateString('fr-FR')}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>📴</Text>
        </View>
        
        <View style={styles.textContainer}>
          <Text style={styles.title}>Mode hors ligne</Text>
          <Text style={styles.subtitle}>
            {isSyncing 
              ? 'Synchronisation en cours...' 
              : lastSync 
                ? `Dernière synchronisation ${formatLastSync()}`
                : 'Les données sont stockées localement'}
          </Text>
        </View>
        
        {onSync && (
          <TouchableOpacity 
            onPress={onSync} 
            style={[styles.syncButton, isSyncing && styles.syncButtonDisabled]}
            disabled={isSyncing}
            activeOpacity={0.7}
          >
            <Text style={styles.syncText}>
              {isSyncing ? '⏳' : '🔄'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      
      {/* Barre de progression de synchronisation */}
      {isSyncing && (
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBar} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.terraLight,
    borderBottomWidth: 1,
    borderBottomColor: colors.terra,
    ...Platform.select({
      ios: {
        shadowColor: colors.terra,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(194, 65, 12, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 22,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.terra,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 11,
    color: colors.inkSoft,
    lineHeight: 14,
  },
  syncButton: {
    backgroundColor: colors.terra,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 44,
    alignItems: 'center',
  },
  syncButtonDisabled: {
    opacity: 0.6,
  },
  syncText: {
    fontSize: 16,
    color: 'white',
  },
  progressBarContainer: {
    height: 3,
    backgroundColor: 'rgba(194, 65, 12, 0.2)',
    overflow: 'hidden',
  },
  progressBar: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.terra,
    borderRadius: 3,
  },
});