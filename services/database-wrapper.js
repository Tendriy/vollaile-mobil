import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

let db = null;
let isInitializing = false;
let initPromise = null;

// Attendre que la base de données soit initialisée
export const waitForDatabase = async () => {
  if (db) return db;
  if (initPromise) return initPromise;
  return initDatabase();
};

export const initDatabase = async () => {
  if (db) return db;
  if (isInitializing) return initPromise;
  
  isInitializing = true;
  
  try {
    if (Platform.OS === 'web') {
      console.log('SQLite not supported on web');
      return null;
    }
    
    console.log('Opening database...');
    db = SQLite.openDatabaseSync('volaille.db');
    
    console.log('Creating tables...');
    db.execSync(`
      PRAGMA journal_mode = WAL;
      
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        email TEXT UNIQUE,
        password TEXT,
        nom_complet TEXT,
        synced INTEGER DEFAULT 0
      );
      
      CREATE TABLE IF NOT EXISTS lots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        nom_lot TEXT,
        race TEXT,
        fournisseur TEXT,
        nombre_initial INTEGER,
        nombre_restant INTEGER,
        total_morts INTEGER DEFAULT 0,
        total_vendus INTEGER DEFAULT 0,
        date_arrivee TEXT,
        statut TEXT DEFAULT 'actif',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        synced INTEGER DEFAULT 0,
        deleted INTEGER DEFAULT 0
      );
      
      CREATE TABLE IF NOT EXISTS stock_aliment (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        type_aliment TEXT,
        quantite REAL,
        unite TEXT DEFAULT 'kg',
        seuil_alerte REAL DEFAULT 50,
        date_achat TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        synced INTEGER DEFAULT 0,
        deleted INTEGER DEFAULT 0
      );
      
      CREATE TABLE IF NOT EXISTS suivi_quotidien (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lot_id INTEGER,
        date_suivi TEXT,
        temperature REAL,
        consommation_aliment REAL,
        consommations TEXT,
        mortalite_jour INTEGER DEFAULT 0,
        observations TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        synced INTEGER DEFAULT 0,
        deleted INTEGER DEFAULT 0
      );
      
      CREATE TABLE IF NOT EXISTS vaccinations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lot_id INTEGER,
        date_programmee TEXT,
        date_effectuee TEXT,
        type_vaccin TEXT,
        statut TEXT DEFAULT 'programme',
        rappel_envoye INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        synced INTEGER DEFAULT 0,
        deleted INTEGER DEFAULT 0
      );
      
      CREATE TABLE IF NOT EXISTS ventes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lot_id INTEGER,
        nombre_vendu INTEGER,
        prix_unitaire REAL,
        date_vente TEXT,
        acheteur TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        synced INTEGER DEFAULT 0,
        deleted INTEGER DEFAULT 0
      );
    `);
    
    // Migrer l'ancienne table si nécessaire
    try {
      const tableInfo = db.getAllSync('PRAGMA table_info(users)');
      const hasPassword = tableInfo.some(col => col.name === 'password');
      if (!hasPassword) {
        console.log('Adding password column...');
        db.runSync('ALTER TABLE users ADD COLUMN password TEXT');
      }
    } catch (err) {
      console.log('Migration error:', err);
    }
    
    // Créer un utilisateur de test
    await ensureTestUser();
    await createDefaultUser();
    
    console.log('Database initialized successfully');
    return db;
  } catch (error) {
    console.error('Database initialization error:', error);
    db = null;
    return null;
  } finally {
    isInitializing = false;
    initPromise = null;
  }
};

export const getDatabase = () => db;

// ============= FONCTIONS D'AUTHENTIFICATION =============
export const getUserByEmail = async (email) => {
  try {
    const database = await waitForDatabase();
    if (!database) return null;
    
    const result = database.getAllSync(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    return result && result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error('Error getting user by email:', error);
    return null;
  }
};

export const registerUser = async (userData) => {
  try {
    const database = await waitForDatabase();
    if (!database) return { success: false, error: 'Database not initialized' };
    
    // Vérifier si l'utilisateur existe déjà
    const existing = database.getAllSync(
      'SELECT * FROM users WHERE email = ? OR username = ?',
      [userData.email, userData.username]
    );
    
    if (existing && existing.length > 0) {
      return { success: false, error: 'Email ou nom d\'utilisateur déjà utilisé' };
    }
    
    const result = database.runSync(
      `INSERT INTO users (username, email, password, nom_complet, synced)
       VALUES (?, ?, ?, ?, 1)`,
      [userData.username, userData.email, userData.password || 'password', userData.nom_complet]
    );
    
    return { success: true, userId: result.lastInsertRowId };
  } catch (error) {
    console.error('Error registering user:', error);
    return { success: false, error: error.message };
  }
};

// Créer un utilisateur de test par défaut si la table est vide
export const ensureTestUser = async () => {
  try {
    const database = await waitForDatabase();
    if (!database) return;
    
    const users = database.getAllSync('SELECT * FROM users LIMIT 1');
    if (!users || users.length === 0) {
      database.runSync(
        `INSERT INTO users (username, email, password, nom_complet, synced)
         VALUES ('testuser', 'test@example.com', 'password', 'Utilisateur Test', 1)`
      );
      console.log('Test user created');
    }
  } catch (error) {
    console.error('Error ensuring test user:', error);
  }
};

// Créer un utilisateur par défaut si la table est vide
export const createDefaultUser = async () => {
  try {
    const database = await waitForDatabase();
    if (!database) return;
    
    const users = database.getAllSync('SELECT * FROM users LIMIT 1');
    if (!users || users.length === 0) {
      database.runSync(
        `INSERT INTO users (username, email, password, nom_complet, synced)
         VALUES ('testuser', 'test@example.com', '123456', 'Utilisateur Test', 1)`
      );
      console.log('Default user created: test@example.com / 123456');
    }
  } catch (error) {
    console.error('Error creating default user:', error);
  }
};

// ============= LOTS =============
export const getLots = async (userId) => {
  try {
    const database = await waitForDatabase();
    if (!database) return [];
    
    const result = database.getAllSync(
      `SELECT 
        id, 
        user_id, 
        nom_lot, 
        race, 
        fournisseur, 
        nombre_initial, 
        COALESCE(nombre_restant, nombre_initial) as nombre_restant,
        COALESCE(total_morts, 0) as total_morts,
        COALESCE(total_vendus, 0) as total_vendus,
        date_arrivee, 
        statut,
        created_at,
        updated_at,
        (julianday('now') - julianday(date_arrivee)) as age
       FROM lots 
       WHERE user_id = ? AND deleted = 0 
       ORDER BY created_at DESC`,
      [userId]
    );
    
    return result.map(lot => ({
      id: lot.id,
      user_id: lot.user_id,
      nom_lot: lot.nom_lot || '',
      race: lot.race || '',
      fournisseur: lot.fournisseur || '',
      nombre_initial: lot.nombre_initial || 0,
      nombre_restant: lot.nombre_restant || lot.nombre_initial || 0,
      total_morts: lot.total_morts || 0,
      total_vendus: lot.total_vendus || 0,
      date_arrivee: lot.date_arrivee || '',
      statut: lot.statut || 'actif',
      created_at: lot.created_at,
      updated_at: lot.updated_at,
      age: Math.floor(lot.age || 0)
    }));
  } catch (error) {
    console.error('Error getting lots:', error);
    return [];
  }
};

export const addLot = async (lot) => {
  try {
    const database = await waitForDatabase();
    if (!database) throw new Error('Database not initialized');
    
    const result = database.runSync(
      `INSERT INTO lots (user_id, nom_lot, race, fournisseur, nombre_initial, nombre_restant, date_arrivee, statut, synced)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [lot.user_id, lot.nom_lot, lot.race, lot.fournisseur, lot.nombre_initial, lot.nombre_initial, lot.date_arrivee, lot.statut || 'actif']
    );
    return result.lastInsertRowId;
  } catch (error) {
    console.error('Error adding lot:', error);
    throw error;
  }
};

export const updateLot = async (id, lot) => {
  try {
    const database = await waitForDatabase();
    if (!database) throw new Error('Database not initialized');
    
    database.runSync(
      `UPDATE lots SET nom_lot = ?, race = ?, fournisseur = ?, nombre_initial = ?, date_arrivee = ?, statut = ?, updated_at = CURRENT_TIMESTAMP, synced = 0
       WHERE id = ?`,
      [lot.nom_lot, lot.race, lot.fournisseur, lot.nombre_initial, lot.date_arrivee, lot.statut, id]
    );
  } catch (error) {
    console.error('Error updating lot:', error);
    throw error;
  }
};

export const deleteLot = async (id) => {
  try {
    const database = await waitForDatabase();
    if (!database) throw new Error('Database not initialized');
    
    database.runSync('UPDATE lots SET deleted = 1, synced = 0 WHERE id = ?', [id]);
  } catch (error) {
    console.error('Error deleting lot:', error);
    throw error;
  }
};

// ============= STOCK =============
export const getStock = async (userId) => {
  try {
    const database = await waitForDatabase();
    if (!database) return [];
    
    const result = database.getAllSync(
      'SELECT * FROM stock_aliment WHERE user_id = ? AND deleted = 0 ORDER BY type_aliment',
      [userId]
    );
    return result || [];
  } catch (error) {
    console.error('Error getting stock:', error);
    return [];
  }
};

export const addStock = async (stock) => {
  try {
    const database = await waitForDatabase();
    if (!database) throw new Error('Database not initialized');
    
    const result = database.runSync(
      `INSERT INTO stock_aliment (user_id, type_aliment, quantite, unite, seuil_alerte, date_achat, synced)
       VALUES (?, ?, ?, ?, ?, ?, 0)`,
      [stock.user_id, stock.type_aliment, stock.quantite, stock.unite, stock.seuil_alerte, stock.date_achat]
    );
    return result.lastInsertRowId;
  } catch (error) {
    console.error('Error adding stock:', error);
    throw error;
  }
};

export const updateStock = async (id, stock) => {
  try {
    const database = await waitForDatabase();
    if (!database) throw new Error('Database not initialized');
    
    database.runSync(
      `UPDATE stock_aliment SET type_aliment = ?, quantite = ?, unite = ?, seuil_alerte = ?, date_achat = ?, synced = 0
       WHERE id = ?`,
      [stock.type_aliment, stock.quantite, stock.unite, stock.seuil_alerte, stock.date_achat, id]
    );
  } catch (error) {
    console.error('Error updating stock:', error);
    throw error;
  }
};

export const deleteStock = async (id) => {
  try {
    const database = await waitForDatabase();
    if (!database) throw new Error('Database not initialized');
    
    database.runSync('UPDATE stock_aliment SET deleted = 1, synced = 0 WHERE id = ?', [id]);
  } catch (error) {
    console.error('Error deleting stock:', error);
    throw error;
  }
};

// ============= SUIVI =============
export const getSuivis = async (lotId) => {
  try {
    const database = await waitForDatabase();
    if (!database) return [];
    
    const result = database.getAllSync(
      `SELECT 
        id, 
        lot_id, 
        date_suivi, 
        temperature, 
        consommation_aliment, 
        consommations, 
        mortalite_jour, 
        observations, 
        created_at 
       FROM suivi_quotidien 
       WHERE lot_id = ? AND deleted = 0 
       ORDER BY date_suivi DESC`,
      [lotId]
    );
    
    if (!result || !Array.isArray(result)) {
      return [];
    }
    
    return result.map(item => ({
      id: item.id || 0,
      lot_id: item.lot_id || 0,
      date_suivi: item.date_suivi || '',
      temperature: item.temperature !== undefined && item.temperature !== null ? item.temperature : null,
      consommation_aliment: item.consommation_aliment || 0,
      consommations: item.consommations || '',
      mortalite_jour: item.mortalite_jour || 0,
      observations: item.observations || '',
      created_at: item.created_at || ''
    }));
  } catch (error) {
    console.error('Error getting suivis:', error);
    return [];
  }
};

export const addSuivi = async (suivi) => {
  try {
    const database = await waitForDatabase();
    if (!database) throw new Error('Database not initialized');
    
    const result = database.runSync(
      `INSERT INTO suivi_quotidien (lot_id, date_suivi, temperature, consommation_aliment, consommations, mortalite_jour, observations, synced)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
      [
        suivi.lot_id, 
        suivi.date_suivi, 
        suivi.temperature !== undefined ? suivi.temperature : null, 
        suivi.consommation_aliment || 0, 
        suivi.consommations || '', 
        suivi.mortalite_jour || 0, 
        suivi.observations || ''
      ]
    );
    
    if (suivi.mortalite_jour && suivi.mortalite_jour > 0) {
      try {
        database.runSync(
          `UPDATE lots SET total_morts = COALESCE(total_morts, 0) + ?, updated_at = CURRENT_TIMESTAMP, synced = 0 WHERE id = ?`,
          [suivi.mortalite_jour, suivi.lot_id]
        );
      } catch (err) {
        console.error('Error updating total_morts:', err);
      }
    }
    
    return result.lastInsertRowId;
  } catch (error) {
    console.error('Error adding suivi:', error);
    throw error;
  }
};

// ============= VACCINS =============
export const getVaccins = async (userId) => {
  try {
    const database = await waitForDatabase();
    if (!database) return [];
    
    const result = database.getAllSync(
      `SELECT v.*, l.nom_lot 
       FROM vaccinations v 
       JOIN lots l ON v.lot_id = l.id 
       WHERE l.user_id = ? AND v.deleted = 0 
       ORDER BY v.date_programmee DESC`,
      [userId]
    );
    return result || [];
  } catch (error) {
    console.error('Error getting vaccins:', error);
    return [];
  }
};

export const addVaccin = async (vaccin) => {
  try {
    const database = await waitForDatabase();
    if (!database) throw new Error('Database not initialized');
    
    const result = database.runSync(
      `INSERT INTO vaccinations (lot_id, date_programmee, type_vaccin, statut, rappel_envoye, synced)
       VALUES (?, ?, ?, 'programme', 0, 0)`,
      [vaccin.lot_id, vaccin.date_programmee, vaccin.type_vaccin]
    );
    return result.lastInsertRowId;
  } catch (error) {
    console.error('Error adding vaccin:', error);
    throw error;
  }
};

export const markVaccinDone = async (id) => {
  try {
    const database = await waitForDatabase();
    if (!database) throw new Error('Database not initialized');
    
    database.runSync(
      `UPDATE vaccinations SET statut = 'effectue', date_effectuee = date('now'), synced = 0 WHERE id = ?`,
      [id]
    );
  } catch (error) {
    console.error('Error marking vaccin done:', error);
    throw error;
  }
};

export const deleteVaccin = async (id) => {
  try {
    const database = await waitForDatabase();
    if (!database) throw new Error('Database not initialized');
    
    database.runSync('UPDATE vaccinations SET deleted = 1, synced = 0 WHERE id = ?', [id]);
  } catch (error) {
    console.error('Error deleting vaccin:', error);
    throw error;
  }
};

// ============= VENTES =============
export const getVentes = async (userId) => {
  try {
    const database = await waitForDatabase();
    if (!database) return [];
    
    const result = database.getAllSync(
      `SELECT v.*, l.nom_lot 
       FROM ventes v 
       JOIN lots l ON v.lot_id = l.id 
       WHERE l.user_id = ? AND v.deleted = 0 
       ORDER BY v.date_vente DESC`,
      [userId]
    );
    return result || [];
  } catch (error) {
    console.error('Error getting ventes:', error);
    return [];
  }
};

export const addVente = async (vente) => {
  try {
    const database = await waitForDatabase();
    if (!database) throw new Error('Database not initialized');
    
    const result = database.runSync(
      `INSERT INTO ventes (lot_id, nombre_vendu, prix_unitaire, date_vente, acheteur, synced)
       VALUES (?, ?, ?, ?, ?, 0)`,
      [vente.lot_id, vente.nombre_vendu, vente.prix_unitaire, vente.date_vente, vente.acheteur || '']
    );
    
    try {
      database.runSync(
        `UPDATE lots 
         SET nombre_restant = COALESCE(nombre_restant, nombre_initial) - ?,
             total_vendus = COALESCE(total_vendus, 0) + ?,
             updated_at = CURRENT_TIMESTAMP,
             synced = 0
         WHERE id = ?`,
        [vente.nombre_vendu, vente.nombre_vendu, vente.lot_id]
      );
    } catch (err) {
      console.error('Error updating lot quantities:', err);
    }
    
    return result.lastInsertRowId;
  } catch (error) {
    console.error('Error adding vente:', error);
    throw error;
  }
};

// ============= CLÔTURER LOT =============
export const cloturerLot = async (lotId) => {
  try {
    const database = await waitForDatabase();
    if (!database) throw new Error('Database not initialized');
    
    database.runSync(
      `UPDATE lots SET statut = 'cloture', updated_at = CURRENT_TIMESTAMP, synced = 0 WHERE id = ?`,
      [lotId]
    );
  } catch (error) {
    console.error('Error closing lot:', error);
    throw error;
  }
};

// ============= STATS DASHBOARD =============
export const getDashboardStats = async (userId) => {
  try {
    const database = await waitForDatabase();
    if (!database) {
      return { 
        lots_actifs: 0, 
        total_volailles: 0, 
        alertes_stock: 0, 
        vaccins_programmes: 0, 
        alertesStock: [], 
        alertesVaccins: [] 
      };
    }
    
    const lotsActifsResult = database.getAllSync(
      'SELECT COUNT(*) as count FROM lots WHERE user_id = ? AND statut = "actif" AND deleted = 0',
      [userId]
    );
    const lotsActifs = (lotsActifsResult && lotsActifsResult.length > 0 && lotsActifsResult[0]?.count) ? lotsActifsResult[0].count : 0;
    
    const totalVolaillesResult = database.getAllSync(
      `SELECT SUM(COALESCE(nombre_restant, nombre_initial)) as total 
       FROM lots WHERE user_id = ? AND statut = "actif" AND deleted = 0`,
      [userId]
    );
    const totalVolailles = (totalVolaillesResult && totalVolaillesResult.length > 0 && totalVolaillesResult[0]?.total) ? totalVolaillesResult[0].total : 0;
    
    let alertesStock = [];
    try {
      alertesStock = database.getAllSync(
        `SELECT id, type_aliment, quantite, unite, seuil_alerte 
         FROM stock_aliment 
         WHERE user_id = ? AND quantite <= seuil_alerte AND deleted = 0`,
        [userId]
      );
    } catch (err) {
      console.error('Error getting stock alerts:', err);
      alertesStock = [];
    }
    
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const threeDaysLater = new Date(today);
    threeDaysLater.setDate(today.getDate() + 3);
    const threeDaysLaterStr = threeDaysLater.toISOString().split('T')[0];
    
    let vaccinsProgrammes = [];
    try {
      vaccinsProgrammes = database.getAllSync(
        `SELECT v.id, v.date_programmee, v.type_vaccin, v.statut, l.nom_lot 
         FROM vaccinations v 
         JOIN lots l ON v.lot_id = l.id 
         WHERE l.user_id = ? AND v.statut = "programme" AND v.deleted = 0 
         AND v.date_programmee >= ? AND v.date_programmee <= ?`,
        [userId, todayStr, threeDaysLaterStr]
      );
    } catch (err) {
      console.error('Error getting vaccine alerts:', err);
      vaccinsProgrammes = [];
    }
    
    return {
      lots_actifs: lotsActifs || 0,
      total_volailles: totalVolailles || 0,
      alertes_stock: (alertesStock && alertesStock.length) || 0,
      vaccins_programmes: (vaccinsProgrammes && vaccinsProgrammes.length) || 0,
      alertesStock: alertesStock || [],
      alertesVaccins: vaccinsProgrammes || []
    };
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    return {
      lots_actifs: 0,
      total_volailles: 0,
      alertes_stock: 0,
      vaccins_programmes: 0,
      alertesStock: [],
      alertesVaccins: []
    };
  }
};