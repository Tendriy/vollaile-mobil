import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../constants/colors';

interface SyncStatusProps {
  isOnline: boolean;
  isSyncing: boolean;
  lastSync: Date | null;
  onSync: () => void;
}

export default function SyncStatus({ isOnline, isSyncing, lastSync, onSync }: SyncStatusProps) {
  const formatLastSync = () => {
    if (!lastSync) return null;
    const now = new Date();
    const diff = Math.floor((now.getTime() - lastSync.getTime()) / 1000);
    
    if (diff < 60) return 'à l\'instant';
    if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
    return `le ${lastSync.toLocaleDateString('fr-FR')} à ${lastSync.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
  };

  const getStatusText = () => {
    if (isSyncing) return 'Synchronisation...';
    if (isOnline) return 'En ligne';
    return 'Hors ligne';
  };

  const getStatusIcon = () => {
    if (isSyncing) return '🔄';
    if (isOnline) return '🟢';
    return '🔴';
  };

  return (
    <TouchableOpacity 
      onPress={onSync} 
      style={[styles.container, isSyncing && styles.syncingContainer]} 
      disabled={isSyncing}
      activeOpacity={0.7}
    >
      <View style={styles.row}>
        <View style={[styles.statusDot, { backgroundColor: isOnline ? colors.green : colors.terra }]} />
        <Text style={styles.statusText}>{getStatusText()}</Text>
        
        {!isSyncing && lastSync && (
          <Text style={styles.lastSync}>
            {formatLastSync()}
          </Text>
        )}
        
        <Text style={[styles.syncIcon, isSyncing && styles.syncIconActive]}>
          {getStatusIcon()}
        </Text>
      </View>
      
      {isSyncing && (
        <View style={styles.syncingProgress}>
          <View style={styles.progressBar}>
            <View style={styles.progressFill} />
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.parchment,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  syncingContainer: {
    backgroundColor: colors.wheat,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    color: colors.inkSoft,
    fontWeight: '500',
  },
  lastSync: {
    fontSize: 10,
    color: colors.inkMuted,
  },
  syncIcon: {
    fontSize: 12,
    marginLeft: 'auto',
  },
  syncIconActive: {
    fontSize: 12,
  },
  syncingProgress: {
    marginTop: 6,
    height: 2,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: 'rgba(217,119,6,0.2)',
  },
  progressFill: {
    width: '60%',
    height: '100%',
    backgroundColor: colors.amber,
    borderRadius: 2,
  },
});