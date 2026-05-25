import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../constants/colors';

interface AlertItem {
  id: number;
  message: string;
  onPress?: () => void;
}

interface AlertCardProps {
  type: 'stock' | 'vaccin' | 'mortality';
  title: string;
  count: number;
  items: AlertItem[];
  onViewAll?: () => void;
}

const typeStyles = {
  stock: { 
    borderColor: colors.amber, 
    icon: '⚠️', 
    background: colors.wheat,
    dotColor: colors.amber
  },
  vaccin: { 
    borderColor: colors.terra, 
    icon: '💉', 
    background: colors.terraLight,
    dotColor: colors.terra
  },
  mortality: { 
    borderColor: '#C2410C', 
    icon: '📉', 
    background: '#FFF1EE',
    dotColor: '#C2410C'
  },
};

export default function AlertCard({ type, title, count, items, onViewAll }: AlertCardProps) {
  const style = typeStyles[type];
  const displayItems = items.slice(0, 3);

  return (
    <View style={[styles.container, { borderLeftColor: style.borderColor, backgroundColor: style.background }]}>
      {/* En-tête */}
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: 'rgba(255,255,255,0.5)' }]}>
          <Text style={styles.icon}>{style.icon}</Text>
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.count}>
            {count} alerte{count > 1 ? 's' : ''}
          </Text>
        </View>
      </View>
      
      {/* Liste des alertes */}
      <View style={styles.itemsContainer}>
        {displayItems.map((item, idx) => (
          <TouchableOpacity 
            key={item.id || idx} 
            onPress={item.onPress} 
            style={styles.item}
            activeOpacity={0.7}
          >
            <View style={[styles.dot, { backgroundColor: style.dotColor }]} />
            <Text style={styles.itemText} numberOfLines={2}>
              {item.message}
            </Text>
          </TouchableOpacity>
        ))}
        
        {/* Lien "Voir plus" */}
        {items.length > 3 && onViewAll && (
          <TouchableOpacity onPress={onViewAll} style={styles.viewAll}>
            <Text style={styles.viewAllText}>
              ... et {items.length - 3} autre{items.length - 3 > 1 ? 's' : ''} alerte{items.length - 3 > 1 ? 's' : ''}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 20,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.ink,
  },
  count: {
    fontSize: 11,
    color: colors.inkSoft,
    marginTop: 2,
  },
  itemsContainer: {
    gap: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  itemText: {
    fontSize: 12,
    color: colors.inkSoft,
    flex: 1,
    lineHeight: 16,
  },
  viewAll: {
    marginTop: 4,
    paddingLeft: 14,
    paddingVertical: 4,
  },
  viewAllText: {
    fontSize: 11,
    color: colors.inkMuted,
    fontStyle: 'italic',
  },
});