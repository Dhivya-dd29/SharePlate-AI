/**
 * SharePlate AI: Relational Database Access Layer
 * Module 1: Data Engineering & Module 2: Cloud Engineering
 * 
 * Provides unified interface with parameterized queries, ACID transactions,
 * automatic schema initialization, and dialect flexibility.
 */

const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');
require('dotenv').config();

const DB_DIALECT = process.env.DB_DIALECT || 'sqlite';
const DB_RELATIVE_PATH = process.env.DB_PATH || 'database/shareplate.db';
const PROJECT_ROOT = path.resolve(__dirname, '../../../');
const DB_FILE = path.resolve(PROJECT_ROOT, DB_RELATIVE_PATH);

let dbInstance = null;

function getDb() {
  if (dbInstance) return dbInstance;

  if (DB_DIALECT === 'sqlite') {
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    dbInstance = new DatabaseSync(DB_FILE);
    // Enable foreign key constraints in SQLite
    dbInstance.exec('PRAGMA foreign_keys = ON;');
    
    // Auto-initialize schema & seed if tables don't exist
    ensureSchemaAndSeed(dbInstance);
    return dbInstance;
  } else {
    throw new Error(`Dialect ${DB_DIALECT} requires PostgreSQL/MySQL drivers. Please use DB_DIALECT=sqlite for zero-config local run.`);
  }
}

function ensureSchemaAndSeed(db) {
  try {
    const tableCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='food_listings'").get();
    if (!tableCheck) {
      console.log('[SharePlate AI DB] Initializing fresh database schema and seed data...');
      const schemaPath = path.resolve(PROJECT_ROOT, 'database/schema.sql');
      const seedPath = path.resolve(PROJECT_ROOT, 'database/seed.sql');

      if (fs.existsSync(schemaPath)) {
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        db.exec(schemaSql);
      }
      if (fs.existsSync(seedPath)) {
        const seedSql = fs.readFileSync(seedPath, 'utf8');
        db.exec(seedSql);
      }
      console.log('[SharePlate AI DB] Schema and seed data successfully initialized.');
    }
  } catch (err) {
    console.error('[SharePlate AI DB] Error initializing schema:', err);
  }
}

/**
 * Execute parameterized query returning all matching rows
 */
function query(sql, params = []) {
  const db = getDb();
  const stmt = db.prepare(sql);
  return stmt.all(...params);
}

/**
 * Execute parameterized query returning first row
 */
function get(sql, params = []) {
  const db = getDb();
  const stmt = db.prepare(sql);
  return stmt.get(...params) || null;
}

/**
 * Execute parameterized query for INSERT, UPDATE, DELETE
 */
function run(sql, params = []) {
  const db = getDb();
  const stmt = db.prepare(sql);
  return stmt.run(...params);
}

/**
 * Execute multiple statements (e.g., migrations)
 */
function exec(sql) {
  const db = getDb();
  return db.exec(sql);
}

/**
 * Health check helper for Cloud Engineering & Monitoring
 */
function checkConnection() {
  const start = Date.now();
  try {
    const res = get('SELECT 1 as alive;');
    const latencyMs = Date.now() - start;
    return {
      status: 'connected',
      dialect: DB_DIALECT,
      storage: DB_FILE,
      latencyMs,
      alive: res && res.alive === 1
    };
  } catch (err) {
    return {
      status: 'error',
      dialect: DB_DIALECT,
      error: err.message
    };
  }
}

module.exports = {
  getDb,
  query,
  get,
  run,
  exec,
  checkConnection
};
