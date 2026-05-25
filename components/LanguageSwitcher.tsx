import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '../constants/colors';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const changeLanguage = async (lng: string) => {
    await i18n.changeLanguage(lng);
  };

  const currentLang = i18n.language;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() => changeLanguage('fr')}
        style={[
          styles.langButton,
          currentLang === 'fr' && styles.activeButton,
        ]}
        activeOpacity={0.7}
      >
        <Text style={[
          styles.langText,
          currentLang === 'fr' && styles.activeText,
        ]}>FR</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => changeLanguage('mg')}
        style={[
          styles.langButton,
          currentLang === 'mg' && styles.activeButton,
        ]}
        activeOpacity={0.7}
      >
        <Text style={[
          styles.langText,
          currentLang === 'mg' && styles.activeText,
        ]}>MG</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.parchment,
    borderRadius: 20,
    padding: 4,
  },
  langButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  activeButton: {
    backgroundColor: colors.amber,
  },
  langText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.inkSoft,
  },
  activeText: {
    color: 'white',
  },
});