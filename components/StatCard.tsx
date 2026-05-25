import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../constants/colors';

interface StatCardProps {
  icon: string;
  title: string;
  value: number | string;
  color: 'green' | 'amber' | 'terra' | 'sky';
  onPress?: () => void;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  suffix?: string;
}

const colorStyles = {
  green: { 
    background: colors.greenLight, 
    border: colors.greenPale, 
    text: colors.green,
    iconBg: 'rgba(21,128,61,0.1)'
  },
  amber: { 
    background: colors.wheat, 
    border: colors.amberMid, 
    text: colors.amber,
    iconBg: 'rgba(217,119,6,0.1)'
  },
  terra: { 
    background: colors.terraLight, 
    border: '#FECACA', 
    text: colors.terra,
    iconBg: 'rgba(194,65,12,0.1)'
  },
  sky: { 
    background: colors.skyLight, 
    border: '#BAE6FD', 
    text: colors.sky,
    iconBg: 'rgba(3,105,161,0.1)'
  },
};

export default function StatCard({ 
  icon, 
  title, 
  value, 
  color, 
  onPress, 
  trend,
  suffix = ''
}: StatCardProps) {
  const colorsStyle = colorStyles[color];
  const numericValue = typeof value === 'number' ? value : parseFloat(value) || 0;

  return (
    <TouchableOpacity 
      onPress={onPress} 
      style={[
        styles.card, 
        { 
          backgroundColor: colorsStyle.background, 
          borderColor: colorsStyle.border 
        }
      ]}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      <View style={[styles.iconContainer, { backgroundColor: colorsStyle.iconBg }]}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.valueContainer}>
          <Text style={[styles.value, { color: colorsStyle.text }]}>
            {typeof value === 'number' ? value.toLocaleString('fr-FR') : value}
            {suffix && <Text style={styles.suffix}>{suffix}</Text>}
          </Text>
          
          {trend && (
            <View style={[styles.trendContainer, trend.isPositive ? styles.trendUp : styles.trendDown]}>
              <Text style={styles.trendIcon}>{trend.isPositive ? '▲' : '▼'}</Text>
              <Text style={[styles.trendValue, trend.isPositive ? styles.trendUpText : styles.trendDownText]}>
                {Math.abs(trend.value)}%
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    flex: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 24,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 11,
    textTransform: 'uppercase',
    color: colors.inkMuted,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  value: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'PlayfairDisplay-Bold' : 'Playfair Display',
  },
  suffix: {
    fontSize: 12,
    fontWeight: 'normal',
    marginLeft: 2,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  trendUp: {
    backgroundColor: 'rgba(21,128,61,0.15)',
  },
  trendDown: {
    backgroundColor: 'rgba(194,65,12,0.15)',
  },
  trendIcon: {
    fontSize: 8,
    marginRight: 2,
  },
  trendValue: {
    fontSize: 10,
    fontWeight: '600',
  },
  trendUpText: {
    color: colors.green,
  },
  trendDownText: {
    color: colors.terra,
  },
});