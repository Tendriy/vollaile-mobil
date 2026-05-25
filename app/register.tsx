import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { colors } from '../constants/colors';
import { useAuth } from '../hooks/useAuth';

export default function RegisterScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  
  const [form, setForm] = useState({
    nom_complet: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false
  });

  const checkPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++;
    if (password.match(/[0-9]/)) strength++;
    if (password.match(/[^a-zA-Z0-9]/)) strength++;
    setPasswordStrength(strength);
  };

  const getStrengthClass = () => {
    if (passwordStrength <= 1) return 'weak';
    if (passwordStrength <= 2) return 'medium';
    return 'strong';
  };

  const getStrengthText = () => {
    if (passwordStrength <= 1) return t('password_weak');
    if (passwordStrength <= 2) return t('password_medium');
    return t('password_strong');
  };

  const getStrengthColor = () => {
    if (passwordStrength <= 1) return colors.terra;
    if (passwordStrength <= 2) return colors.amber;
    return colors.green;
  };

  const getStrengthWidth = () => {
    if (passwordStrength <= 1) return '33%';
    if (passwordStrength <= 2) return '66%';
    return '100%';
  };

  const handleRegister = async () => {
    setErrorMessage('');
    
    if (!form.nom_complet || !form.username || !form.email || !form.password) {
      setErrorMessage(t('error') || 'Veuillez remplir tous les champs');
      return;
    }
    
    if (form.password !== form.confirmPassword) {
      setErrorMessage(t('password_mismatch'));
      return;
    }
    
    if (form.password.length < 6) {
      setErrorMessage(t('password_min_error'));
      return;
    }
    
    if (!form.acceptTerms) {
      setErrorMessage(t('accept_terms_error'));
      return;
    }
    
    setLoading(true);
    
    try {
      const result = await register({
        nom_complet: form.nom_complet,
        username: form.username,
        email: form.email,
        password: form.password
      });
      
      if (result.success) {
        Alert.alert(
          t('success') || 'Succès',
          t('register_success'),
          [{ text: 'OK', onPress: () => router.push('/login') }]
        );
      } else {
        setErrorMessage(result.error || t('error'));
      }
    } catch (error) {
      console.error('Register error:', error);
      setErrorMessage(t('server_error') || 'Erreur de connexion au serveur');
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
          
          {/* PARTIE GAUCHE - INFORMATIONS */}
          <LinearGradient
            colors={['#78350F', '#92400E', '#A16207']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ flex: 1, padding: 40, justifyContent: 'center' }}
          >
            <View>
              {/* Retour accueil */}
              <TouchableOpacity onPress={() => router.push('/')} style={{ marginBottom: 30 }}>
                <Text style={{ color: 'rgba(254,243,199,0.8)', fontSize: 13 }}>← {t('home')}</Text>
              </TouchableOpacity>

              {/* Logo */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 30 }}>
                <Text style={{ fontSize: 32 }}>🐔</Text>
                <Text style={{ fontFamily: 'PlayfairDisplay', fontSize: 20, color: '#FEF3C7', fontStyle: 'italic' }}>
                  {t('app_name')}
                </Text>
              </View>

              <Text style={{ fontFamily: 'PlayfairDisplay', fontSize: 36, fontWeight: 'bold', color: '#FEF3C7', marginBottom: 16 }}>
                {t('create_account')}
              </Text>
              <Text style={{ fontSize: 14, color: 'rgba(254,243,199,0.85)', marginBottom: 30, lineHeight: 22 }}>
                {t('register_subtitle')}
              </Text>

              {/* Features list */}
              <View style={{ gap: 12, marginBottom: 30 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{ width: 20, height: 20, backgroundColor: 'rgba(254,243,199,0.2)', borderRadius: 10, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ fontSize: 11, color: '#FEF3C7' }}>✓</Text>
                  </View>
                  <Text style={{ fontSize: 14, color: 'rgba(254,243,199,0.9)' }}>{t('lot_management')}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{ width: 20, height: 20, backgroundColor: 'rgba(254,243,199,0.2)', borderRadius: 10, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ fontSize: 11, color: '#FEF3C7' }}>✓</Text>
                  </View>
                  <Text style={{ fontSize: 14, color: 'rgba(254,243,199,0.9)' }}>{t('daily_monitoring')}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{ width: 20, height: 20, backgroundColor: 'rgba(254,243,199,0.2)', borderRadius: 10, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ fontSize: 11, color: '#FEF3C7' }}>✓</Text>
                  </View>
                  <Text style={{ fontSize: 14, color: 'rgba(254,243,199,0.9)' }}>{t('vaccine_program')}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{ width: 20, height: 20, backgroundColor: 'rgba(254,243,199,0.2)', borderRadius: 10, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ fontSize: 11, color: '#FEF3C7' }}>✓</Text>
                  </View>
                  <Text style={{ fontSize: 14, color: 'rgba(254,243,199,0.9)' }}>{t('dashboard_title')}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{ width: 20, height: 20, backgroundColor: 'rgba(254,243,199,0.2)', borderRadius: 10, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ fontSize: 11, color: '#FEF3C7' }}>✓</Text>
                  </View>
                  <Text style={{ fontSize: 14, color: 'rgba(254,243,199,0.9)' }}>100% maimaim-poana</Text>
                </View>
              </View>
            </View>
          </LinearGradient>

          {/* PARTIE DROITE - FORMULAIRE */}
          <View style={{ flex: 1, backgroundColor: colors.cream, padding: 24, justifyContent: 'center' }}>
            <View style={{ maxWidth: 500, width: '100%', alignSelf: 'center', backgroundColor: 'white', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: colors.border }}>
              
              {/* Header du formulaire */}
              <LinearGradient
                colors={['#78350F', '#92400E', '#A16207']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ padding: 20, flexDirection: 'row', alignItems: 'center', gap: 12 }}
              >
                <View style={{ width: 44, height: 44, backgroundColor: 'rgba(254,243,199,0.15)', borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(254,243,199,0.25)' }}>
                  <Text style={{ fontSize: 22 }}>📝</Text>
                </View>
                <View>
                  <Text style={{ fontFamily: 'PlayfairDisplay', fontSize: 16, fontWeight: 'bold', color: '#FEF3C7' }}>Créer un compte</Text>
                  <Text style={{ fontSize: 11, color: 'rgba(254,243,199,0.6)' }}>{t('register_subtitle')}</Text>
                </View>
              </LinearGradient>

              {/* Message d'erreur */}
              {errorMessage !== '' && (
                <View style={{ backgroundColor: '#FFF1EE', borderLeftWidth: 4, borderLeftColor: colors.terra, padding: 12, margin: 16, borderRadius: 10 }}>
                  <Text style={{ color: colors.terra, fontSize: 12 }}>⚠️ {errorMessage}</Text>
                </View>
              )}

              {/* Formulaire */}
              <View style={{ padding: 20 }}>
                {/* Nom complet */}
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', marginBottom: 6 }}>{t('full_name')}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: 'rgba(180,120,50,0.22)', borderRadius: 10, backgroundColor: 'white' }}>
                    <Text style={{ paddingLeft: 12, fontSize: 14 }}>👤</Text>
                    <TextInput
                      placeholder={t('full_name')}
                      value={form.nom_complet}
                      onChangeText={text => setForm({...form, nom_complet: text})}
                      style={{ flex: 1, paddingVertical: 12, paddingHorizontal: 10, fontSize: 14 }}
                    />
                  </View>
                </View>

                {/* Nom d'utilisateur */}
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', marginBottom: 6 }}>{t('username')}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: 'rgba(180,120,50,0.22)', borderRadius: 10, backgroundColor: 'white' }}>
                    <Text style={{ paddingLeft: 12, fontSize: 14 }}>@</Text>
                    <TextInput
                      placeholder={t('username')}
                      value={form.username}
                      onChangeText={text => setForm({...form, username: text})}
                      autoCapitalize="none"
                      style={{ flex: 1, paddingVertical: 12, paddingHorizontal: 10, fontSize: 14 }}
                    />
                  </View>
                </View>

                {/* Email */}
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', marginBottom: 6 }}>{t('email')}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: 'rgba(180,120,50,0.22)', borderRadius: 10, backgroundColor: 'white' }}>
                    <Text style={{ paddingLeft: 12, fontSize: 14 }}>📧</Text>
                    <TextInput
                      placeholder={t('email')}
                      value={form.email}
                      onChangeText={text => setForm({...form, email: text})}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      style={{ flex: 1, paddingVertical: 12, paddingHorizontal: 10, fontSize: 14 }}
                    />
                  </View>
                </View>

                {/* Mot de passe */}
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', marginBottom: 6 }}>{t('password')}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: 'rgba(180,120,50,0.22)', borderRadius: 10, backgroundColor: 'white' }}>
                    <Text style={{ paddingLeft: 12, fontSize: 14 }}>🔒</Text>
                    <TextInput
                      placeholder={t('password_min')}
                      value={form.password}
                      onChangeText={text => {
                        setForm({...form, password: text});
                        checkPasswordStrength(text);
                      }}
                      secureTextEntry={!showPassword}
                      style={{ flex: 1, paddingVertical: 12, paddingHorizontal: 10, fontSize: 14 }}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ paddingHorizontal: 12 }}>
                      <Text style={{ fontSize: 14 }}>{showPassword ? '🙈' : '👁️'}</Text>
                    </TouchableOpacity>
                  </View>
                  
                  {/* Force du mot de passe */}
                  {form.password.length > 0 && (
                    <View style={{ marginTop: 8 }}>
                      <View style={{ height: 3, backgroundColor: '#e0e0e0', borderRadius: 2, marginBottom: 4 }}>
                        <View style={{ width: getStrengthWidth(), height: 3, backgroundColor: getStrengthColor(), borderRadius: 2 }} />
                      </View>
                      <Text style={{ fontSize: 10, color: colors.inkMuted }}>{getStrengthText()}</Text>
                    </View>
                  )}
                </View>

                {/* Confirmer mot de passe */}
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', marginBottom: 6 }}>{t('confirm_password')}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: 'rgba(180,120,50,0.22)', borderRadius: 10, backgroundColor: 'white' }}>
                    <Text style={{ paddingLeft: 12, fontSize: 14 }}>🔒</Text>
                    <TextInput
                      placeholder={t('confirm_password')}
                      value={form.confirmPassword}
                      onChangeText={text => setForm({...form, confirmPassword: text})}
                      secureTextEntry={!showConfirmPassword}
                      style={{ flex: 1, paddingVertical: 12, paddingHorizontal: 10, fontSize: 14 }}
                    />
                    <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={{ paddingHorizontal: 12 }}>
                      <Text style={{ fontSize: 14 }}>{showConfirmPassword ? '🙈' : '👁️'}</Text>
                    </TouchableOpacity>
                  </View>
                  {form.confirmPassword.length > 0 && form.password !== form.confirmPassword && (
                    <Text style={{ color: colors.terra, fontSize: 11, marginTop: 4 }}>⚠️ {t('password_mismatch')}</Text>
                  )}
                </View>

                {/* Acceptation des conditions */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                  <TouchableOpacity 
                    onPress={() => setForm({...form, acceptTerms: !form.acceptTerms})}
                    style={{ width: 18, height: 18, borderWidth: 1.5, borderColor: colors.border, borderRadius: 4, backgroundColor: form.acceptTerms ? colors.amber : 'white', justifyContent: 'center', alignItems: 'center' }}
                  >
                    {form.acceptTerms && <Text style={{ color: 'white', fontSize: 12 }}>✓</Text>}
                  </TouchableOpacity>
                  <Text style={{ fontSize: 12, color: colors.inkSoft }}>{t('accept_terms')}</Text>
                </View>

                {/* Bouton d'inscription */}
                <TouchableOpacity
                  onPress={handleRegister}
                  disabled={loading}
                  style={{ backgroundColor: colors.amber, paddingVertical: 14, borderRadius: 100, alignItems: 'center', marginBottom: 16 }}
                >
                  {loading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={{ color: 'white', fontWeight: '600', fontSize: 14 }}>🚀 {t('register')}</Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* Footer */}
              <View style={{ borderTopWidth: 1, borderTopColor: colors.border, padding: 16, alignItems: 'center', backgroundColor: '#fafafa' }}>
                <Text style={{ fontSize: 12, color: colors.inkSoft }}>
                  {t('already_account')}{' '}
                  <TouchableOpacity onPress={() => router.push('/login')}>
                    <Text style={{ color: colors.amber, fontWeight: '600' }}>{t('login')}</Text>
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