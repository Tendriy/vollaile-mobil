import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Platform, Text, View } from 'react-native';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import { colors } from '../../constants/colors';
import { useAuth } from '../../hooks/useAuth';

export default function TabsLayout() {
  const { user, loading } = useAuth();
  const { t } = useTranslation();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.cream }}>
        <ActivityIndicator size="large" color={colors.amber} />
      </View>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.cream },
        headerTitleStyle: { fontWeight: 'bold', color: colors.ink },
        headerRight: () => (
          <View style={{ marginRight: 15 }}>
            <LanguageSwitcher />
          </View>
        ),
        tabBarStyle: { 
          backgroundColor: colors.cream, 
          borderTopColor: colors.border, 
          height: 55,  // Réduit la hauteur
          paddingBottom: Platform.OS === 'ios' ? 8 : 5,
          paddingTop: 5,
          // Pour remonter le menu
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
        },
        tabBarActiveTintColor: colors.amber,
        tabBarInactiveTintColor: colors.inkMuted,
        tabBarLabelStyle: { fontSize: 11, marginBottom: 2, fontWeight: '500' },
        tabBarIconStyle: { marginTop:-40 , marginBottom: 2 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('dashboard'),
          tabBarIcon: ({ color, size }) => <Text style={{ fontSize: size, color }}>📊</Text>,
        }}
      />
      <Tabs.Screen
        name="lots"
        options={{
          title: t('lots'),
          tabBarIcon: ({ color, size }) => <Text style={{ fontSize: size, color }}>🐔</Text>,
        }}
      />
      <Tabs.Screen
        name="stock"
        options={{
          title: t('stock'),
          tabBarIcon: ({ color, size }) => <Text style={{ fontSize: size, color }}>📦</Text>,
        }}
      />
      <Tabs.Screen
        name="ventes"
        options={{
          title: t('ventes'),
          tabBarIcon: ({ color, size }) => <Text style={{ fontSize: size, color }}>💰</Text>,
        }}
      />
      <Tabs.Screen
        name="vaccins"
        options={{
          title: t('vaccins'),
          tabBarIcon: ({ color, size }) => <Text style={{ fontSize: size, color }}>💉</Text>,
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }) => <Text style={{ fontSize: size, color }}>👤</Text>,
        }}
      />
    </Tabs>
  );
}