import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Traductions complètes
const resources = {
  fr: {
    translation: {
      // Navigation
      app_name: 'Fiompiana Vorona Nohatraraina',
      dashboard: 'Tableau de bord',
      lots: 'Lots',
      stock: 'Stock',
      vaccins: 'Vaccins',
      ventes: 'Ventes',
      login: 'Connexion',
      register: 'Inscription',
      logout: 'Déconnexion',
      
      // Actions
      save: 'Enregistrer',
      cancel: 'Annuler',
      edit: 'Modifier',
      delete: 'Supprimer',
      back: 'Retour',
      loading: 'Chargement...',
      error: 'Une erreur est survenue',
      success: 'Opération réussie',
      confirm: 'Confirmer',
      yes: 'Oui',
      no: 'Non',
      ok: 'OK',
      
      // Lots
      lot_name: 'Nom du lot',
      breed: 'Race',
      supplier: 'Fournisseur',
      initial_number: 'Nombre initial',
      remaining: 'Restants',
      sold: 'Vendus',
      dead: 'Morts',
      age: 'Âge',
      days: 'jours',
      active: 'Actif',
      closed: 'Clôturé',
      new_lot: 'Nouveau lot',
      edit_lot: 'Modifier le lot',
      arrival_date: "Date d'arrivée",
      search_lot: 'Rechercher un lot...',
      active_lots: 'Lots actifs',
      total_poultry: 'Total volailles',
      lot_details: 'Détail du lot',
      general_info: 'Informations générales',
      close_lot: 'Clôturer le lot',
      
      // Stock
      add_stock: 'Ajouter stock',
      edit_stock: 'Modifier stock',
      feed_type: "Type d'aliment",
      quantity: 'Quantité',
      unit: 'Unité',
      alert_threshold: 'Seuil alerte',
      purchase_date: "Date d'achat",
      low_stock: 'Stock faible',
      normal: 'Normal',
      stock_alerts: 'Alertes stock',
      stock_status: 'État du stock',
      add_feed: 'Ajouter un aliment',
      select_feed: 'Sélectionner un aliment',
      consumptions: 'Consommations',
      consumption_details: 'Détails conso',
      
      // Suivi
      daily_followup: 'Suivi quotidien',
      add_followup: 'Ajouter suivi',
      temperature: 'Température',
      consumption: 'Consommation',
      mortality: 'Mortalité',
      observations: 'Observations',
      date: 'Date',
      
      // Vaccins
      program_vaccine: 'Programmer vaccin',
      vaccine_type: 'Type de vaccin',
      scheduled_date: 'Date programmée',
      performed_date: 'Date effectuée',
      vaccine_reminder: 'Rappel vaccin',
      upcoming_vaccines_count: 'Vaccins à venir',
      mark_done: 'Marquer effectué',
      select_lot: 'Sélectionner un lot',
      
      // Ventes
      new_sale: 'Nouvelle vente',
      number_sold: 'Nombre vendu',
      unit_price: 'Prix unitaire',
      total_amount: 'Montant total',
      buyer: 'Acheteur',
      monthly_sales: 'Ventes mensuelles',
      
      // Dashboard
      lots_distribution: 'Répartition des lots',
      recent_lots: 'Lots récents',
      stock_alerts_count: 'Alertes stock',
      
      // Authentification
      no_account: 'Pas encore de compte ?',
      create_account: 'Créer un compte',
      already_account: 'Déjà un compte ?',
      password_mismatch: 'Les mots de passe ne correspondent pas',
      password_min: 'Mot de passe (min 6 caractères)',
      password_min_error: 'Le mot de passe doit contenir au moins 6 caractères',
      confirm_password: 'Confirmer mot de passe',
      full_name: 'Nom complet',
      username: "Nom d'utilisateur",
      email: 'Email',
      password: 'Mot de passe',
      accept_terms: "J'accepte les conditions d'utilisation",
      accept_terms_error: "Vous devez accepter les conditions d'utilisation",
      register_success: 'Inscription réussie ! Vous pouvez maintenant vous connecter.',
      server_error: 'Impossible de contacter le serveur',
      
      // Force du mot de passe
      password_weak: 'Mot de passe faible',
      password_medium: 'Mot de passe moyen',
      password_strong: 'Mot de passe fort',
      
      // Home page
      welcome: 'Bienvenue',
      login_title: 'Connexion',
      login_subtitle: 'Accédez à votre tableau de bord',
      register_subtitle: 'Créez votre compte en quelques secondes',
      slogan: 'Simplifiez la gestion de votre ferme avicole',
      description: "L'application web qui remplace votre cahier papier par un outil numérique simple, accessible et hors-ligne.",
      start_free: 'Commencer gratuitement',
      
      // Problèmes
      challenges: 'Les défis des éleveurs',
      problems_subtitle: 'Nous résolvons vos problèmes quotidiens',
      data_loss: 'Perte de données',
      data_loss_desc: 'Cahiers perdus, mouillés ou détruits',
      wrong_calculations: 'Calculs erronés',
      wrong_calculations_desc: 'Erreurs dans les calculs manuels',
      search_difficulty: 'Difficulté de recherche',
      search_difficulty_desc: 'Retrouver une information prend du temps',
      no_reminders: 'Absence de rappels',
      no_reminders_desc: 'Dates de vaccination souvent oubliées',
      stock_management: 'Mauvaise gestion des stocks',
      stock_management_desc: "Ruptures fréquentes d'aliments",
      no_overview: 'Manque de vision globale',
      no_overview_desc: 'Difficulté à évaluer la rentabilité',
      
      // Solutions
      solutions: 'Ce que nous vous offrons',
      solutions_subtitle: 'Des fonctionnalités puissantes et simples',
      lot_management: 'Gestion des lots',
      lot_management_desc: 'Enregistrez et suivez tous vos lots de volailles',
      daily_monitoring: 'Suivi quotidien',
      daily_monitoring_desc: 'Enregistrez les données importantes chaque jour',
      vaccine_program: 'Programme vaccinal',
      vaccine_program_desc: 'Ne manquez plus jamais un vaccin',
      stock_management_title: 'Gestion des stocks',
      stock_management_title_desc: 'Maîtrisez vos stocks d\'aliments',
      sales_profitability: 'Ventes et rentabilité',
      sales_profitability_desc: 'Suivez vos performances financières',
      dashboard_title: 'Tableau de bord',
      dashboard_desc: 'Une vision globale de votre ferme',
      
      // Footer
      quick_links: 'Liens rapides',
      contact: 'Contact',
      footer_subtitle: 'Système de Gestion de Ferme Avicole',
      home: 'Accueil',
      about: 'À propos',
      support: 'Support',
      malagasy: '100% Malagasy',
      available: 'Disponible 24/7',
      offline: 'Mode hors ligne',
      
      // Algorithmes
      smart_algorithms: 'Des algorithmes intelligents',
      auto_calculations: 'Des calculs automatiques pour vous simplifier la vie',
      mortality_rate_title: 'Taux de mortalité',
      mortality_rate_desc: 'Détectez rapidement les problèmes sanitaires',
      stock_alert_title: 'Alertes stock',
      stock_alert_desc: 'Évitez les ruptures d\'aliments',
      smart_search_title: 'Recherche intelligente',
      smart_search_desc: 'Trouvez vos lots en un clin d\'œil',
      age_calculation_title: 'Calcul de l\'âge',
      age_calculation_desc: 'Connaissez l\'âge exact de vos volailles',
      vaccine_reminder_title: 'Rappels vaccins',
      vaccine_reminder_desc: 'Ne manquez plus aucun vaccin',
      consumption_index_title: 'Indice de consommation',
      consumption_index_desc: 'Évaluez l\'efficacité alimentaire',
      
      // Pourquoi nous
      why_choose: 'Pourquoi choisir VOLAILLE CONNECT ?',
      malagasy_100: '100% Malgache',
      malagasy_100_desc: 'Application entièrement adaptée aux éleveurs locaux',
      offline_mode: 'Fonctionne hors-ligne',
      offline_mode_desc: 'Accédez à vos données même sans connexion internet',
      secure_data: 'Données sécurisées',
      secure_data_desc: 'Vos données sont stockées localement',
      simple_intuitive: 'Simple et intuitif',
      simple_intuitive_desc: 'Une interface conçue pour être utilisée par tous',
      
      // CTA
      ready_title: 'Prêt à digitaliser votre ferme ?',
      ready_desc: 'Rejoignez des centaines d\'éleveurs qui ont déjà adopté VOLAILLE CONNECT',
      create_free_account: 'Créer un compte gratuitement',
    }
  },
  mg: {
    translation: {
      // Navigation
      app_name: 'Fiompiana Vorona Nohatraraina',
      dashboard: 'Takelaka fiombonana',
      lots: 'Antony',
      stock: 'Entana',
      vaccins: 'Vaksiny',
      ventes: 'Fivarotana',
      login: 'Hiditra',
      register: 'Hisoratra anarana',
      logout: 'Hivoaka',
      
      // Actions
      save: 'Tehirizina',
      cancel: 'Aoka ihany',
      edit: 'Hanova',
      delete: 'Hamafa',
      back: 'Hiverina',
      loading: 'Entana...',
      error: 'Nisy hadisoana',
      success: 'Vita soa aman-tsara',
      confirm: 'Hamarina',
      yes: 'Eny',
      no: 'Tsia',
      ok: 'OK',
      
      // Lots
      lot_name: 'Anaran\'ny antony',
      breed: 'Karazana',
      supplier: 'Mpamatsy',
      initial_number: 'Isan\'ny voalohany',
      remaining: 'Sisa',
      sold: 'Namidy',
      dead: 'Maty',
      age: 'Taona',
      days: 'andro',
      active: 'Miasa',
      closed: 'Tapitra',
      new_lot: 'Antony vaovao',
      edit_lot: 'Hanova antony',
      arrival_date: 'Daty nahatongavana',
      search_lot: 'Hitady antony...',
      active_lots: 'Antony miasa',
      total_poultry: 'Akoho rehetra',
      lot_details: 'Antsipirihan\'ny antony',
      general_info: 'Fampahalalana ankapobeny',
      close_lot: 'Hamarana ny antony',
      
      // Stock
      add_stock: 'Hanampy entana',
      edit_stock: 'Hanova entana',
      feed_type: 'Karazam-pisakafoana',
      quantity: 'Habetsahana',
      unit: 'Fepetra',
      alert_threshold: 'Fepetra fampitandremana',
      purchase_date: 'Daty nividianana',
      low_stock: 'Entana kely',
      normal: 'Ara-dalàna',
      stock_alerts: 'Fampitandremana entana',
      stock_status: "Toetran'ny entana",
      add_feed: 'Hanampy sakafo',
      select_feed: 'Mifidy sakafo',
      consumptions: 'Fihinanana',
      consumption_details: 'Antsipirihan\'ny fihinanana',
      
      // Suivi
      daily_followup: 'Fanaraha-maso isan\'andro',
      add_followup: 'Hanampy fanaraha-maso',
      temperature: 'Hafanana',
      consumption: 'Fihinanana',
      mortality: 'Fahafatesana',
      observations: 'Fandinihana',
      date: 'Daty',
      
      // Vaccins
      program_vaccine: 'Handamina vaksiny',
      vaccine_type: 'Karazan-draharaha',
      scheduled_date: 'Daty voalamina',
      performed_date: 'Daty vita',
      vaccine_reminder: 'Fampahatsiahivana vaksiny',
      upcoming_vaccines_count: 'Vaksiny ho avy',
      mark_done: 'Vita',
      select_lot: 'Mifidy antony',
      
      // Ventes
      new_sale: 'Fivarotana vaovao',
      number_sold: 'Isany namidy',
      unit_price: 'Vidiny isany',
      total_amount: 'Volany rehetra',
      buyer: 'Mpividy',
      monthly_sales: 'Fivarotana isam-bolana',
      
      // Dashboard
      lots_distribution: 'Fizarana antony',
      recent_lots: 'Antony vao haingana',
      stock_alerts_count: 'Fampitandremana entana',
      
      // Authentification
      no_account: 'Mbola tsy manana kaonty ?',
      create_account: 'Mamorona kaonty',
      already_account: 'Efa manana kaonty ?',
      password_mismatch: 'Tsy mitovy ny tenimiafina',
      password_min: 'Tenimiafina (6 caractères fara-fahakeliny)',
      password_min_error: 'Ny tenimiafina dia tsy maintsy 6 caractères farafahakeliny',
      confirm_password: 'Hamarino ny tenimiafina',
      full_name: 'Anarana feno',
      username: 'Anaran\'ny mpampiasa',
      email: 'Adiresy mailaka',
      password: 'Tenimiafina',
      accept_terms: 'Ekena ny fepetra fampiasana',
      accept_terms_error: 'Tsy maintsy ekena ny fepetra fampiasana',
      register_success: 'Vita ny fisoratana anarana ! Azonao atao ny miditra izao.',
      server_error: 'Tsy afaka mifandray amin\'ny serveur',
      
      // Force du mot de passe
      password_weak: 'Tenimiafina malemy',
      password_medium: 'Tenimiafina antonony',
      password_strong: 'Tenimiafina matanjaka',
      
      // Home page
      welcome: 'Tonga soa',
      login_title: 'Hiditra',
      login_subtitle: 'Midira ao amin\'ny takelakao',
      register_subtitle: 'Mamorona kaonty ao anatin\'ny segondra vitsivitsy',
      slogan: 'Hanamora ny fitantanana ny toeram-piompiana akoho amam-borona',
      description: "Rindranasa izay manolo ny kahie natao an-taratasy amin'ny fitaovana nomerika mora ampiasaina sy azo idirana na dia tsy misy aterineto aza.",
      start_free: 'Manomboka maimaim-poana',
      
      // Problèmes
      challenges: 'Olana atrehin\'ny mpamboly',
      problems_subtitle: 'Mamaha ny olanao isan\'andro izahay',
      data_loss: 'Fahaverezan-kevitra',
      data_loss_desc: 'Very na simba ny kahie',
      wrong_calculations: 'Hadisoana kajy',
      wrong_calculations_desc: 'Misy diso ny kajy natao an-tanana',
      search_difficulty: 'Sahana hitady',
      search_difficulty_desc: 'Mandan-javatra ny fitadiavana vaovao',
      no_reminders: 'Tsy misy fampahatsiahivana',
      no_reminders_desc: 'Matetika adino ny daty vaksiny',
      stock_management: 'Fitantanana fitehirizana ratsy',
      stock_management_desc: 'Matetika ny sakafo no lany',
      no_overview: 'Tsy fahitana ny zava-drehetra',
      no_overview_desc: 'Sahana manombana ny tombom-barotra',
      
      // Solutions
      solutions: 'Inona no atolotray anao',
      solutions_subtitle: 'Fiasa mahery sy mora ampiasaina',
      lot_management: 'Fitantanana andiany',
      lot_management_desc: 'Raketo sy arahino ny andiany rehetra',
      daily_monitoring: 'Fanaraha-maso isan\'andro',
      daily_monitoring_desc: 'Raketo ny angona manan-danja isan\'andro',
      vaccine_program: 'Fandaharana vaksiny',
      vaccine_program_desc: 'Aza adino intsony ny vaksiny',
      stock_management_title: 'Fitantanana fitehirizana',
      stock_management_title_desc: 'Fehezo ny fitehirizana sakafo',
      sales_profitability: 'Varotra sy tombombarotra',
      sales_profitability_desc: 'Araho ny fahombiazanao ara-bola',
      dashboard_title: 'Takelaka fiombonana',
      dashboard_desc: 'Fijerena ny toeram-piompinao manontolo',
      
      // Footer
      quick_links: 'Rohy haingana',
      contact: 'Fifandraisana',
      footer_subtitle: 'Rafitra fitantanana toeram-piompiana akoho amam-borona',
      home: 'Fandraisana',
      about: 'Mikasiantsika',
      support: 'Fanampiana',
      malagasy: '100% Malagasy',
      available: 'Misy 24/7',
      offline: 'Tsy mila Internet',
      
      // Algorithmes
      smart_algorithms: 'Fandrindrana hendry',
      auto_calculations: 'Kajy mandeha ho azy mba hanamorana ny fiainana',
      mortality_rate_title: 'Tahan\'ny fahafatesana',
      mortality_rate_desc: 'Fantaro haingana ny isan\'ny akoho maty raha oharina amin\'ny isany',
      stock_alert_title: 'Fampitandremana fitehirizana',
      stock_alert_desc: 'Mampitandrina rehefa manakaiky ny lany ny sakafo',
      smart_search_title: 'Fikarohana mandeha ho azy',
      smart_search_desc: 'Hitady haingana ny andiany amin\'ny anarana na karazana',
      age_calculation_title: 'Kajy taona',
      age_calculation_desc: 'Hahafantatra ny taonan\'ny akoho isaky ny andiany',
      vaccine_reminder_title: 'Fampahatsiahivana vaksiny',
      vaccine_reminder_desc: 'Mampahatsiahy ny daty hanaovana vaksiny aloha',
      consumption_index_title: 'Fahombiazan\'ny sakafo',
      consumption_index_desc: 'Maneho ny fahombiazan\'ny fampiasana sakafo',
      
      // Pourquoi nous
      why_choose: 'Nahoana no VOLAILLE CONNECT ?',
      malagasy_100: '100% Malagasy',
      malagasy_100_desc: 'Rindranasa natao manokana ho an\'ny mpamboly eto Madagasikara',
      offline_mode: 'Miasa na dia tsy misy Internet',
      offline_mode_desc: 'Azonao ampiasaina na dia tsy misy tambajotra aza',
      secure_data: 'Voatahiry tsara ny angona',
      secure_data_desc: 'Ny angonareo dia voatahiry ao amin\'ny fitaovana',
      simple_intuitive: 'Tsotra sy mora ampiasaina',
      simple_intuitive_desc: 'Namboarina ho an\'ny rehetra ny endrik\'izy io',
      
      // CTA
      ready_title: 'Vonona ny hanova ny toeram-piompinao ?',
      ready_desc: 'Manatevin-daharana ny mpamboly an\'arivony efa nampiasa VOLAILLE CONNECT',
      create_free_account: 'Mamorona kaonty maimaim-poana',
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'fr',
    fallbackLng: 'fr',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;