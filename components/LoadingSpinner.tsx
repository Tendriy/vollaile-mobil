import { View, ActivityIndicator, Text, StyleSheet, Modal, Dimensions } from 'react-native';
import { colors } from '../constants/colors';

const { width, height } = Dimensions.get('window');

interface LoadingSpinnerProps {
  message?: string;
  fullScreen?: boolean;
  transparent?: boolean;
  size?: 'small' | 'large';
}

export default function LoadingSpinner({ 
  message = 'Chargement...', 
  fullScreen = true,
  transparent = false,
  size = 'large'
}: LoadingSpinnerProps) {
  
  const SpinnerContent = (
    <View style={[
      styles.container,
      !fullScreen && styles.inline,
      transparent && styles.transparent
    ]}>
      <View style={[styles.spinnerBox, !fullScreen && styles.inlineBox]}>
        <ActivityIndicator size={size} color={colors.amber} />
        {message && <Text style={styles.message}>{message}</Text>}
      </View>
    </View>
  );

  if (fullScreen) {
    return (
      <Modal transparent={true} visible={true} animationType="fade">
        {SpinnerContent}
      </Modal>
    );
  }

  return SpinnerContent;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.cream,
  },
  inline: {
    flex: 0,
    padding: 20,
    minHeight: 100,
  },
  transparent: {
    backgroundColor: 'rgba(255, 253, 245, 0.9)',
  },
  spinnerBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineBox: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  message: {
    marginTop: 12,
    fontSize: 14,
    color: colors.inkSoft,
    textAlign: 'center',
  },
});