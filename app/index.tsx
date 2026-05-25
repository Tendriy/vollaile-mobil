import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Dimensions, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { colors } from '../constants/colors';

const { width: screenWidth } = Dimensions.get('window');

export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  const problems = [
    { icon: '📓', title: 'data_loss', desc: 'data_loss_desc' },
    { icon: '🧮', title: 'wrong_calculations', desc: 'wrong_calculations_desc' },
    { icon: '🔍', title: 'search_difficulty', desc: 'search_difficulty_desc' },
    { icon: '💊', title: 'no_reminders', desc: 'no_reminders_desc' },
    { icon: '📦', title: 'stock_management', desc: 'stock_management_desc' },
    { icon: '📊', title: 'no_overview', desc: 'no_overview_desc' },
  ];

  const solutions = [
    { icon: '📝', title: 'lot_management', desc: 'lot_management_desc', items: ['lot_name', 'initial_number', 'arrival_date'] },
    { icon: '📈', title: 'daily_monitoring', desc: 'daily_monitoring_desc', items: ['temperature', 'consumption', 'mortality'] },
    { icon: '💉', title: 'vaccine_program', desc: 'vaccine_program_desc', items: ['vaccine_planning', 'automatic_reminders', 'vaccine_history'] },
    { icon: '📦', title: 'stock_management_title', desc: 'stock_management_title_desc', items: ['stock_in_out', 'low_stock_alerts', 'custom_thresholds'] },
    { icon: '💰', title: 'sales_profitability', desc: 'sales_profitability_desc', items: ['sales_recording', 'auto_calculation', 'monthly_stats'] },
    { icon: '📊', title: 'dashboard_title', desc: 'dashboard_desc', items: ['key_indicators', 'dynamic_charts', 'real_time_alerts'] },
  ];

  const algos = [
    { icon: '📊', title: 'mortality_rate_title', desc: 'mortality_rate_desc' },
    { icon: '⚠️', title: 'stock_alert_title', desc: 'stock_alert_desc' },
    { icon: '🔍', title: 'smart_search_title', desc: 'smart_search_desc' },
    { icon: '📅', title: 'age_calculation_title', desc: 'age_calculation_desc' },
    { icon: '💉', title: 'vaccine_reminder_title', desc: 'vaccine_reminder_desc' },
    { icon: '📈', title: 'consumption_index_title', desc: 'consumption_index_desc' },
  ];

  const whys = [
    { icon: '🌍', title: 'malagasy_100', desc: 'malagasy_100_desc' },
    { icon: '📴', title: 'offline_mode', desc: 'offline_mode_desc' },
    { icon: '🔒', title: 'secure_data', desc: 'secure_data_desc' },
    { icon: '🎯', title: 'simple_intuitive', desc: 'simple_intuitive_desc' },
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.cream }} showsVerticalScrollIndicator={false}>
      
      {/* HEADER */}
      <LinearGradient
        colors={['#7C2D12', '#B45309', '#92400E']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ paddingTop: 48, paddingBottom: 16, paddingHorizontal: 20 }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <View>
            <Text style={{ fontFamily: 'PlayfairDisplay', fontSize: 18, color: '#FEF3C7' }}>
              🐔 Fiompiana vorona <Text style={{ color: colors.amberLight, fontStyle: 'italic' }}>Nohatraraina</Text>
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <LanguageSwitcher />
            <TouchableOpacity 
              onPress={() => router.push('/login')}
              style={{ backgroundColor: 'rgba(254,243,199,0.15)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 100, borderWidth: 1, borderColor: 'rgba(254,243,199,0.3)' }}
            >
              <Text style={{ color: '#FEF3C7', fontSize: 13, fontWeight: '500' }}>🔑 Connexion</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => router.push('/register')}
              style={{ backgroundColor: colors.amberLight, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 100 }}
            >
              <Text style={{ color: '#3B1A00', fontSize: 13, fontWeight: '700' }}>🚀 Inscription</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* HERO */}
      <LinearGradient
        colors={['#FFFBEB', '#FEF3C7', '#FDE68A', '#FEF9EE']}
        style={{ paddingVertical: 40, paddingHorizontal: 20 }}
      >
        <View style={{ marginBottom: 32 }}>
          <Text style={{ fontFamily: 'PlayfairDisplay', fontSize: 44, fontWeight: '900', color: '#3B1A00', lineHeight: 48 }}>
            Fiompiana vorona{"\n"}
            <Text style={{ color: colors.amber }}>Nohatraraina</Text>
          </Text>
          <Text style={{ fontSize: 16, color: '#6B3A00', marginTop: 12, marginBottom: 8 }}>{t('slogan')}</Text>
          <Text style={{ fontSize: 14, color: colors.inkSoft, marginBottom: 28 }}>{t('description')}</Text>
          
          <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
            <TouchableOpacity 
              onPress={() => router.push('/register')}
              style={{ backgroundColor: colors.amber, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 100 }}
            >
              <Text style={{ color: 'white', fontWeight: '600' }}>🚀 {t('start_free')}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => router.push('/login')}
              style={{ backgroundColor: 'white', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 100, borderWidth: 2, borderColor: 'rgba(217,119,6,0.3)' }}
            >
              <Text style={{ color: '#92400E', fontWeight: '500' }}>🔑 {t('login')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Row */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
          <View style={{ flex: 1, backgroundColor: 'white', borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(217,119,6,0.15)' }}>
            <Text style={{ fontSize: 26, fontWeight: 'bold', color: colors.amber }}>100%</Text>
            <Text style={{ fontSize: 11, color: colors.inkSoft }}>{t('malagasy')}</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: 'white', borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(217,119,6,0.15)' }}>
            <Text style={{ fontSize: 26, fontWeight: 'bold', color: colors.amber }}>24/7</Text>
            <Text style={{ fontSize: 11, color: colors.inkSoft }}>{t('available')}</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: 'white', borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(217,119,6,0.15)' }}>
            <Text style={{ fontSize: 26, fontWeight: 'bold', color: colors.amber }}>📱</Text>
            <Text style={{ fontSize: 11, color: colors.inkSoft }}>{t('offline')}</Text>
          </View>
        </View>

        {/* Feature Pills */}
        <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 10 }}>
          <View style={{ width: 44, height: 44, backgroundColor: colors.wheat, borderRadius: 12, justifyContent: 'center', alignItems: 'center' }}>
            <Text>📈</Text>
          </View>
          <View>
            <Text style={{ fontWeight: '600', color: colors.ink }}>Suivi journalier automatisé</Text>
            <Text style={{ fontSize: 11, color: colors.inkMuted }}>Mortalité · Consommation · Température</Text>
          </View>
        </View>

        <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 10 }}>
          <View style={{ width: 44, height: 44, backgroundColor: colors.wheat, borderRadius: 12, justifyContent: 'center', alignItems: 'center' }}>
            <Text>💉</Text>
          </View>
          <View>
            <Text style={{ fontWeight: '600', color: colors.ink }}>Programme vaccinal intelligent</Text>
            <Text style={{ fontSize: 11, color: colors.inkMuted }}>Rappels · Historique · Planification</Text>
          </View>
        </View>

        <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <View style={{ width: 44, height: 44, backgroundColor: colors.wheat, borderRadius: 12, justifyContent: 'center', alignItems: 'center' }}>
            <Text>💰</Text>
          </View>
          <View>
            <Text style={{ fontWeight: '600', color: colors.ink }}>Rentabilité en temps réel</Text>
            <Text style={{ fontSize: 11, color: colors.inkMuted }}>Ventes · Marges · Stats mensuelles</Text>
          </View>
        </View>
      </LinearGradient>

      {/* PROBLÈMES */}
      <View style={{ backgroundColor: 'white', paddingVertical: 48, paddingHorizontal: 20 }}>
        <Text style={{ fontFamily: 'PlayfairDisplay', fontSize: 32, fontWeight: '700', color: colors.ink, textAlign: 'center', marginBottom: 12 }}>{t('challenges')}</Text>
        <Text style={{ fontSize: 14, color: colors.inkSoft, textAlign: 'center', marginBottom: 32 }}>{t('problems_subtitle')}</Text>
        
        <View style={{ gap: 16 }}>
          {problems.map((p, idx) => (
            <View key={idx} style={{ backgroundColor: '#FFFAF7', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#FED7AA' }}>
              <View style={{ width: 44, height: 44, backgroundColor: '#FFF1EE', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
                <Text style={{ fontSize: 22 }}>{p.icon}</Text>
              </View>
              <Text style={{ fontWeight: '600', color: '#C2410C', marginBottom: 6 }}>{t(p.title)}</Text>
              <Text style={{ fontSize: 13, color: colors.inkSoft }}>{t(p.desc)}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* SOLUTIONS */}
      <View style={{ backgroundColor: colors.parchment, paddingVertical: 48, paddingHorizontal: 20 }}>
        <Text style={{ fontFamily: 'PlayfairDisplay', fontSize: 32, fontWeight: '700', color: colors.ink, textAlign: 'center', marginBottom: 12 }}>{t('solutions')}</Text>
        <Text style={{ fontSize: 14, color: colors.inkSoft, textAlign: 'center', marginBottom: 32 }}>{t('solutions_subtitle')}</Text>
        
        <View style={{ gap: 16 }}>
          {solutions.map((s, idx) => (
            <View key={idx} style={{ backgroundColor: 'white', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: colors.border }}>
              <View style={{ width: 44, height: 44, backgroundColor: colors.greenLight, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
                <Text style={{ fontSize: 22 }}>{s.icon}</Text>
              </View>
              <Text style={{ fontWeight: '600', color: colors.green, marginBottom: 6 }}>{t(s.title)}</Text>
              <Text style={{ fontSize: 13, color: colors.inkSoft, marginBottom: 12 }}>{t(s.desc)}</Text>
              <View style={{ gap: 6 }}>
                {s.items.map((item, i) => (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={{ width: 18, height: 18, backgroundColor: colors.greenPale, borderRadius: 10, justifyContent: 'center', alignItems: 'center' }}>
                      <Text style={{ fontSize: 10, color: colors.green }}>✓</Text>
                    </View>
                    <Text style={{ fontSize: 12, color: colors.inkSoft }}>{t(item)}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* ALGORITHMES */}
      <LinearGradient
        colors={['#78350F', '#92400E', '#A16207']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingVertical: 48, paddingHorizontal: 20 }}
      >
        <Text style={{ fontFamily: 'PlayfairDisplay', fontSize: 32, fontWeight: '700', color: '#FEF3C7', textAlign: 'center', marginBottom: 12 }}>{t('smart_algorithms')}</Text>
        <Text style={{ fontSize: 14, color: 'rgba(254,243,199,0.65)', textAlign: 'center', marginBottom: 32 }}>{t('auto_calculations')}</Text>
        
        <View style={{ gap: 16 }}>
          {algos.map((a, idx) => (
            <View key={idx} style={{ backgroundColor: 'rgba(255,251,235,0.07)', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: 'rgba(254,243,199,0.15)' }}>
              <Text style={{ fontSize: 26, marginBottom: 8 }}>{a.icon}</Text>
              <Text style={{ fontWeight: '600', color: '#FDE68A', marginBottom: 6 }}>{t(a.title)}</Text>
              <Text style={{ fontSize: 12, color: 'rgba(254,243,199,0.55)' }}>{t(a.desc)}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      {/* POURQUOI NOUS */}
      <View style={{ backgroundColor: 'white', paddingVertical: 48, paddingHorizontal: 20 }}>
        <Text style={{ fontFamily: 'PlayfairDisplay', fontSize: 32, fontWeight: '700', color: colors.ink, textAlign: 'center', marginBottom: 32 }}>{t('why_choose')}</Text>
        
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
          {whys.map((w, idx) => (
            <View key={idx} style={{ flex: 1, minWidth: '45%', backgroundColor: colors.amberPale, borderRadius: 16, padding: 24, alignItems: 'center', borderWidth: 1.5, borderColor: 'rgba(217,119,6,0.12)' }}>
              <View style={{ width: 56, height: 56, backgroundColor: colors.wheat, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
                <Text style={{ fontSize: 26 }}>{w.icon}</Text>
              </View>
              <Text style={{ fontWeight: '600', color: '#3B1A00', marginBottom: 6, textAlign: 'center' }}>{t(w.title)}</Text>
              <Text style={{ fontSize: 12, color: colors.inkSoft, textAlign: 'center' }}>{t(w.desc)}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* CTA */}
      <LinearGradient
        colors={['#15803D', '#166534', '#14532D']}
        style={{ paddingVertical: 60, paddingHorizontal: 20, alignItems: 'center' }}
      >
        <Text style={{ fontFamily: 'PlayfairDisplay', fontSize: 34, fontWeight: '700', color: 'white', textAlign: 'center', marginBottom: 16 }}>{t('ready_title')}</Text>
        <Text style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginBottom: 32 }}>{t('ready_desc')}</Text>
        <TouchableOpacity 
          onPress={() => router.push('/register')}
          style={{ backgroundColor: colors.amberLight, paddingHorizontal: 40, paddingVertical: 16, borderRadius: 100, flexDirection: 'row', alignItems: 'center', gap: 8 }}
        >
          <Text style={{ color: '#3B1A00', fontSize: 16, fontWeight: '700' }}>{t('create_free_account')}</Text>
          <Text style={{ color: '#3B1A00', fontSize: 16 }}>→</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* FOOTER */}
      <View style={{ backgroundColor: '#2D1810', paddingVertical: 40, paddingHorizontal: 20 }}>
        <View style={{ marginBottom: 32 }}>
          <Text style={{ fontFamily: 'PlayfairDisplay', fontSize: 20, color: colors.amberMid, marginBottom: 8, fontStyle: 'italic' }}>🐔 {t('app_name')}</Text>
          <Text style={{ fontSize: 13, color: 'rgba(254,243,199,0.45)' }}>{t('footer_subtitle')}</Text>
        </View>
        
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 32, marginBottom: 32 }}>
          <View>
            <Text style={{ fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: 'rgba(254,243,199,0.35)', marginBottom: 16 }}>{t('quick_links')}</Text>
            <TouchableOpacity onPress={() => router.push('/')} style={{ marginBottom: 8 }}><Text style={{ color: 'rgba(254,243,199,0.6)', fontSize: 13 }}>{t('home')}</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/login')} style={{ marginBottom: 8 }}><Text style={{ color: 'rgba(254,243,199,0.6)', fontSize: 13 }}>{t('login')}</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/register')}><Text style={{ color: 'rgba(254,243,199,0.6)', fontSize: 13 }}>{t('register')}</Text></TouchableOpacity>
          </View>
          
          <View>
            <Text style={{ fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: 'rgba(254,243,199,0.35)', marginBottom: 16 }}>{t('contact')}</Text>
            <Text style={{ color: 'rgba(254,243,199,0.6)', fontSize: 13, marginBottom: 8 }}>📧 tantsaha-mahomby@gmail.com</Text>
            <Text style={{ color: 'rgba(254,243,199,0.6)', fontSize: 13 }}>📞 +261 34 08 657 98</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}