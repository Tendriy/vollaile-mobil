import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { colors } from '../constants/colors';
import { useAuth } from '../hooks/useAuth';
import { LinearGradient } from 'expo-linear-gradient';

export default function LoginScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setErrorMessage(t('error') || 'Veuillez remplir tous les champs');
      return;
    }
    
    setLoading(true);
    setErrorMessage('');
    
    try {
      const result = await login(email, password);
      if (result.success) {
        router.replace('/(tabs)');
      } else {
        setErrorMessage(result.error || t('error') || 'Erreur de connexion');
      }
    } catch (error) {
      setErrorMessage('Impossible de contacter le serveur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={{ flex: 1, backgroundColor: colors.cream }}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={{ flex: 1, flexDirection: Platform.OS === 'web' ? 'row' : 'column', minHeight: '100%' }}>
          
          {/* PANNEAU GAUCHE */}
          <LinearGradient
            colors={['#78350F', '#92400E', '#A16207']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ flex: 1.1, padding: 40, justifyContent: 'center' }}
          >
            <View>
              {/* Retour accueil */}
              <TouchableOpacity onPress={() => router.push('/')} style={{ marginBottom: 36 }}>
                <Text style={{ color: 'rgba(254,243,199,0.65)', fontSize: 13 }}>← {t('home')}</Text>
              </TouchableOpacity>

              {/* Logo */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 32 }}>
                <Text style={{ fontSize: 32 }}>🐔</Text>
                <View>
                  <Text style={{ fontFamily: 'PlayfairDisplay', fontSize: 18, color: '#FEF3C7', fontWeight: '700' }}>
                    Fiompiana Vorona{' '}
                    <Text style={{ color: colors.amberMid, fontStyle: 'italic' }}>Nohatraraina</Text>
                  </Text>
                </View>
              </View>

              <Text style={{ fontFamily: 'PlayfairDisplay', fontSize: 44, fontWeight: '900', color: 'white', marginBottom: 16 }}>
                {t('welcome')}!
              </Text>
              <Text style={{ fontSize: 14, color: 'rgba(254,243,199,0.7)', marginBottom: 36, lineHeight: 22 }}>
                {t('login_subtitle')}
              </Text>

              {/* Features */}
              <View style={{ gap: 12, marginBottom: 36 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{ width: 36, height: 36, backgroundColor: 'rgba(254,243,199,0.1)', borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(254,243,199,0.15)' }}>
                    <Text>📈</Text>
                  </View>
                  <Text style={{ fontSize: 13, color: 'rgba(254,243,199,0.8)' }}>Suivi journalier automatisé</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{ width: 36, height: 36, backgroundColor: 'rgba(254,243,199,0.1)', borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(254,243,199,0.15)' }}>
                    <Text>💉</Text>
                  </View>
                  <Text style={{ fontSize: 13, color: 'rgba(254,243,199,0.8)' }}>Programme vaccinal intelligent</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{ width: 36, height: 36, backgroundColor: 'rgba(254,243,199,0.1)', borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(254,243,199,0.15)' }}>
                    <Text>💰</Text>
                  </View>
                  <Text style={{ fontSize: 13, color: 'rgba(254,243,199,0.8)' }}>Rentabilité en temps réel</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{ width: 36, height: 36, backgroundColor: 'rgba(254,243,199,0.1)', borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(254,243,199,0.15)' }}>
                    <Text>📴</Text>
                  </View>
                  <Text style={{ fontSize: 13, color: 'rgba(254,243,199,0.8)' }}>Disponible hors ligne</Text>
                </View>
              </View>

              {/* Badge */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(254,243,199,0.1)', borderWidth: 1, borderColor: 'rgba(254,243,199,0.2)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 100, alignSelf: 'flex-start' }}>
                <Text style={{ fontSize: 14 }}>🇲🇬</Text>
                <Text style={{ fontSize: 11, fontWeight: '600', color: 'rgba(254,243,199,0.8)' }}>Solution 100% Malagasy</Text>
              </View>
            </View>
          </LinearGradient>

          {/* PANNEAU DROIT - FORMULAIRE */}
          <View style={{ flex: 1, backgroundColor: colors.cream, padding: 40, justifyContent: 'center' }}>
            <View style={{ maxWidth: 440, width: '100%', alignSelf: 'center' }}>
              
              {/* Logo mini */}
              <View style={{ alignItems: 'center', marginBottom: 32 }}>
                <LinearGradient
                  colors={['#78350F', '#A16207']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ width: 60, height: 60, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 18 }}
                >
                  <Text style={{ fontSize: 28 }}>🐔</Text>
                </LinearGradient>
                <Text style={{ fontFamily: 'PlayfairDisplay', fontSize: 28, fontWeight: '700', color: colors.ink, marginBottom: 8 }}>
                  {t('login_title')}
                </Text>
                <Text style={{ fontSize: 13, color: colors.inkMuted, textAlign: 'center' }}>
                  {t('login_subtitle')}
                </Text>
              </View>

              {/* Message d'erreur */}
              {errorMessage !== '' && (
                <View style={{ backgroundColor: colors.terraLight, borderRadius: 16, padding: 12, marginBottom: 22, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#FECACA' }}>
                  <Text style={{ fontSize: 14 }}>⚠️</Text>
                  <Text style={{ fontSize: 12, color: colors.terra, flex: 1 }}>{errorMessage}</Text>
                </View>
              )}

              {/* Formulaire */}
              <View style={{ marginBottom: 20 }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: colors.ink, marginBottom: 8 }}>{t('email')}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: 'rgba(180,120,50,0.22)', borderRadius: 16, backgroundColor: 'white' }}>
                  <Text style={{ paddingLeft: 14, fontSize: 14 }}>✉️</Text>
                  <TextInput
                    placeholder={t('email')}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    style={{ flex: 1, paddingVertical: 12, paddingHorizontal: 12, fontSize: 14, color: colors.ink }}
                  />
                </View>
              </View>

              <View style={{ marginBottom: 20 }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: colors.ink, marginBottom: 8 }}>{t('password')}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: 'rgba(180,120,50,0.22)', borderRadius: 16, backgroundColor: 'white' }}>
                  <Text style={{ paddingLeft: 14, fontSize: 14 }}>🔒</Text>
                  <TextInput
                    placeholder={t('password')}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    style={{ flex: 1, paddingVertical: 12, paddingHorizontal: 12, fontSize: 14, color: colors.ink }}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ paddingHorizontal: 14, paddingVertical: 8 }}>
                    <Text style={{ fontSize: 14 }}>{showPassword ? '🙈' : '👁️'}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                onPress={handleLogin}
                disabled={loading}
                style={{ backgroundColor: colors.amber, paddingVertical: 14, borderRadius: 16, alignItems: 'center', marginTop: 8 }}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={{ color: 'white', fontWeight: '600', fontSize: 15 }}>🔑 {t('login')}</Text>
                )}
              </TouchableOpacity>

              {/* Footer */}
              <View style={{ marginTop: 24, paddingTop: 22, borderTopWidth: 1, borderTopColor: colors.border, alignItems: 'center' }}>
                <Text style={{ fontSize: 12, color: colors.inkSoft }}>
                  {t('no_account')}{' '}
                  <TouchableOpacity onPress={() => router.push('/register')}>
                    <Text style={{ color: colors.amber, fontWeight: '600' }}>{t('create_account')}</Text>
                  </TouchableOpacity>
                </Text>
              </View>

            </View>
          </View>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}