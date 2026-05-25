// Simple EventEmitter implementation for React Native
class SimpleEventEmitter {
  constructor() {
    this.events = {};
  }

  on(eventName, callback) {
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }
    this.events[eventName].push(callback);
  }

  off(eventName, callback) {
    if (!this.events[eventName]) return;
    if (!callback) {
      delete this.events[eventName];
      return;
    }
    this.events[eventName] = this.events[eventName].filter(cb => cb !== callback);
  }

  emit(eventName, ...args) {
    if (!this.events[eventName]) return;
    this.events[eventName].forEach(callback => {
      try {
        callback(...args);
      } catch (error) {
        console.error(`Error in event ${eventName}:`, error);
      }
    });
  }

  removeAllListeners(eventName) {
    if (eventName) {
      delete this.events[eventName];
    } else {
      this.events = {};
    }
  }
}

// Création d'un émetteur d'événements global
export const appEvents = new SimpleEventEmitter();

// Définition des noms d'événements
export const EVENTS = {
  DATA_CHANGED: 'data_changed',
  LOT_ADDED: 'lot_added',
  VENTE_ADDED: 'vente_added',
  VACCIN_ADDED: 'vaccin_added',
  STOCK_UPDATED: 'stock_updated',
  SUIVI_ADDED: 'suivi_added'
};