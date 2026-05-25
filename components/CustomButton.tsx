import { ActivityIndicator, StyleSheet, Text, TextStyle, TouchableOpacity, ViewStyle } from 'react-native';
import { colors } from '../constants/colors';

interface CustomButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'outline';
  loading?: boolean;
  disabled?: boolean;
  icon?: string;
  fullWidth?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export default function CustomButton({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  icon,
  fullWidth = false,
  size = 'medium',
}: CustomButtonProps) {
  
  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {};
    
    // Taille
    switch (size) {
      case 'small':
        baseStyle.paddingVertical = 8;
        baseStyle.paddingHorizontal = 16;
        break;
      case 'large':
        baseStyle.paddingVertical = 14;
        baseStyle.paddingHorizontal = 28;
        break;
      default:
        baseStyle.paddingVertical = 12;
        baseStyle.paddingHorizontal = 20;
    }
    
    // Variante
    switch (variant) {
      case 'primary':
        return { ...baseStyle, backgroundColor: colors.amber };
      case 'secondary':
        return { ...baseStyle, backgroundColor: colors.amberLight, borderWidth: 0 };
      case 'danger':
        return { ...baseStyle, backgroundColor: colors.terra };
      case 'success':
        return { ...baseStyle, backgroundColor: colors.green };
      case 'outline':
        return { ...baseStyle, backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.amber };
      default:
        return { ...baseStyle, backgroundColor: colors.amber };
    }
  };

  const getTextStyle = (): TextStyle => {
    const baseStyle: TextStyle = {};
    
    // Taille
    switch (size) {
      case 'small':
        baseStyle.fontSize = 12;
        break;
      case 'large':
        baseStyle.fontSize = 16;
        break;
      default:
        baseStyle.fontSize = 14;
    }
    
    // Variante
    switch (variant) {
      case 'secondary':
        return { ...baseStyle, color: '#3B1A00' };
      case 'outline':
        return { ...baseStyle, color: colors.amber };
      case 'primary':
      case 'danger':
      case 'success':
      default:
        return { ...baseStyle, color: 'white' };
    }
  };

  const getIconColor = (): string => {
    switch (variant) {
      case 'secondary':
        return '#3B1A00';
      case 'outline':
        return colors.amber;
      default:
        return 'white';
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        getButtonStyle(),
        (disabled || loading) && styles.disabled,
        fullWidth && styles.fullWidth
      ]}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'secondary' || variant === 'outline' ? colors.amber : 'white'} size="small" />
      ) : (
        <>
          {icon && <Text style={[styles.icon, { color: getIconColor() }]}>{icon}</Text>}
          <Text style={[styles.text, getTextStyle()]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 30,
    gap: 8,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.6,
  },
  text: {
    fontWeight: '600',
  },
  icon: {
    fontSize: 16,
  },
});