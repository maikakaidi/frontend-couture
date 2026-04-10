// src/services/db.js
import { Capacitor } from "@capacitor/core";
import { CapacitorSQLite } from "@capacitor-community/sqlite";

const DB_NAME = "couture_offline.db";
const DB_VERSION = 2;
const WEB_STORAGE_KEY = "couture_offline_data";

let webDB = null;
let dbConn = null;

const loadWebDB = () => {
  if (webDB) return webDB;
  const saved = localStorage.getItem(WEB_STORAGE_KEY);
  webDB = saved ? JSON.parse(saved) : {
    employes: [], clients: [], commandes: [], mesures: [],
    articles: [], depenses: [], galerie: [], pending_changes: [],
    users: []   // ← uniquement pour le login offline
  };
  return webDB;
};

const saveWebDB = () => {
  if (webDB) localStorage.setItem(WEB_STORAGE_KEY, JSON.stringify(webDB));
};

/* ============================================================
   🔹 Initialisation
   ============================================================ */
export const initDB = async () => {
  if (Capacitor.isNativePlatform()) {
    if (dbConn) return;
    const sqlite = CapacitorSQLite;
    try {
      dbConn = await sqlite.createConnection(DB_NAME, false, "no-encryption", DB_VERSION);
      await dbConn.open();

      await dbConn.execute(`
        CREATE TABLE IF NOT EXISTS users (_id TEXT PRIMARY KEY, nom TEXT, telephone TEXT, motDePasse TEXT, role TEXT, statut TEXT, atelierId TEXT, abonnement TEXT, dateInscription TEXT, langue TEXT, trialExpiresAt TEXT, createdAt TEXT, updatedAt TEXT);
        CREATE TABLE IF NOT EXISTS employes (_id TEXT PRIMARY KEY, nom TEXT, telephone TEXT, poste TEXT, salaire REAL, advances TEXT, atelierId TEXT, serverId TEXT, synced INTEGER, createdAt TEXT, updatedAt TEXT);
        CREATE TABLE IF NOT EXISTS clients (_id TEXT PRIMARY KEY, nom TEXT, telephone TEXT, adresse TEXT, atelierId TEXT, serverId TEXT, synced INTEGER, createdAt TEXT, updatedAt TEXT);
        CREATE TABLE IF NOT EXISTS commandes (_id TEXT PRIMARY KEY, description TEXT, montant REAL, acompte REAL, rdv TEXT, produits TEXT, clientId TEXT, atelierId TEXT, serverId TEXT, synced INTEGER, createdAt TEXT, updatedAt TEXT);
        CREATE TABLE IF NOT EXISTS articles (_id TEXT PRIMARY KEY, nom TEXT, prix REAL, categorie TEXT, stock INTEGER, vendu INTEGER, serverId TEXT, synced INTEGER, createdAt TEXT, updatedAt TEXT);
        CREATE TABLE IF NOT EXISTS depenses (_id TEXT PRIMARY KEY, titre TEXT, montant REAL, categorie TEXT, serverId TEXT, synced INTEGER, createdAt TEXT, updatedAt TEXT);
        CREATE TABLE IF NOT EXISTS mesures (_id TEXT PRIMARY KEY, clientId TEXT, type TEXT, valeur TEXT, atelierId TEXT, serverId TEXT, synced INTEGER, createdAt TEXT, updatedAt TEXT);
        CREATE TABLE IF NOT EXISTS galerie (_id TEXT PRIMARY KEY, url TEXT, categorie TEXT, serverId TEXT, synced INTEGER, createdAt TEXT, updatedAt TEXT);
        CREATE TABLE IF NOT EXISTS pending_changes (id TEXT PRIMARY KEY, entity TEXT, method TEXT, url TEXT, payload TEXT, createdAt TEXT);
      `);

      console.log("✅ SQLite natif (mobile) OK");
    } catch (err) {
      console.error("Erreur SQLite mobile:", err);
    }
  } else {
    loadWebDB();
    console.log("✅ Mode web : localStorage activé");
  }
};

/* ============================================================
   🔹 Helpers (Web + Mobile)
   ============================================================ */
export const query = async (sql, params = []) => {
  await initDB();

  if (!Capacitor.isNativePlatform()) {
    console.log("🔍 Query web :", sql, params);
    const db = loadWebDB();

    if (sql.includes("FROM users WHERE telephone")) {
      return (db.users || []).filter(u => u.telephone === params[0]);
    }
    if (sql.includes("FROM mesures WHERE clientId")) {
      return (db.mesures || []).filter(m => m.clientId === params[0]);
    }
    if (sql.includes("FROM commandes WHERE clientId")) {
      return (db.commandes || []).filter(c => c.clientId === params[0]);
    }
    if (sql.includes("FROM clients")) return db.clients || [];
    if (sql.includes("FROM employes")) return db.employes || [];
    if (sql.includes("FROM pending_changes")) return db.pending_changes || [];

    return [];
  }

  try {
    const res = await dbConn.query(sql, params);
    return res.values || [];
  } catch (err) {
    console.error("Erreur query:", err);
    return [];
  }
};

export const execute = async (sql, params = []) => {
  await initDB();

  if (!Capacitor.isNativePlatform()) {
    console.log("💾 Execute web :", sql);
    const db = loadWebDB();

    // ==================== USERS (pour login offline) ====================
    if (sql.includes("INSERT OR REPLACE INTO users")) {
      const user = {
        _id: params[0],
        nom: params[1],
        telephone: params[2],
        motDePasse: params[3],
        role: params[4],
        statut: params[5],
        atelierId: params[6],
        abonnement: params[7],
        dateInscription: params[8],
        langue: params[9],
        trialExpiresAt: params[10],
        createdAt: params[11],
        updatedAt: params[12]
      };
      const idx = db.users.findIndex(u => u._id === user._id);
      if (idx > -1) db.users[idx] = user;
      else db.users.unshift(user);
    }
    // ================================================================

    else if (sql.includes("INSERT OR REPLACE INTO clients")) {
      const client = {
        _id: params[0], nom: params[1], telephone: params[2], adresse: params[3],
        atelierId: params[4], serverId: params[5], synced: params[6],
        createdAt: params[7], updatedAt: params[8]
      };
      const idx = db.clients.findIndex(c => c._id === client._id);
      if (idx > -1) db.clients[idx] = client;
      else db.clients.unshift(client);
    }

    else if (sql.includes("INSERT OR REPLACE INTO mesures")) {
      const mesure = {
        _id: params[0], clientId: params[1], type: params[2], valeur: params[3],
        atelierId: params[4], serverId: params[5], synced: params[6],
        createdAt: params[7], updatedAt: params[8]
      };
      const idx = db.mesures.findIndex(m => m._id === mesure._id);
      if (idx > -1) db.mesures[idx] = mesure;
      else db.mesures.unshift(mesure);
    }

    else if (sql.includes("INSERT OR REPLACE INTO commandes")) {
      const commande = {
        _id: params[0],
        description: params[1],
        montant: params[2],
        acompte: params[3],
        rdv: params[4],
        produits: typeof params[5] === "string" ? params[5] : JSON.stringify(params[5] || []),
        clientId: params[6],
        atelierId: params[7],
        serverId: params[8],
        synced: params[9],
        createdAt: params[10],
        updatedAt: params[11]
      };
      const idx = db.commandes.findIndex(c => c._id === commande._id);
      if (idx > -1) db.commandes[idx] = commande;
      else db.commandes.unshift(commande);
    }

    else if (sql.includes("INSERT OR REPLACE INTO pending_changes")) {
      db.pending_changes.unshift({
        id: params[0], entity: params[1], method: params[2],
        url: params[3], payload: params[4], createdAt: params[5]
      });
    }

    saveWebDB();
    return true;
  }

  try {
    await dbConn.run(sql, params);
    return true;
  } catch (err) {
    console.error("Erreur execute:", err);
    return false;
  }
};
