const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, 'canteen.db');
const db = new Database(dbPath);

function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'student',
      food_pref TEXT DEFAULT 'normal',
      canteen_pref TEXT DEFAULT 'ground',
      loyalty_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS food_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      category TEXT NOT NULL,
      canteen_id TEXT NOT NULL,
      is_available BOOLEAN DEFAULT 1,
      is_jain BOOLEAN DEFAULT 0,
      cuisine_tag TEXT,
      image_url TEXT,
      rating REAL DEFAULT 4.5,
      customizations TEXT
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_code TEXT UNIQUE,
      user_id INTEGER,
      canteen_id TEXT,
      status TEXT DEFAULT 'Placed',
      total REAL,
      coupon_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER,
      food_id INTEGER,
      qty INTEGER,
      unit_price REAL,
      customizations TEXT,
      FOREIGN KEY(order_id) REFERENCES orders(id),
      FOREIGN KEY(food_id) REFERENCES food_items(id)
    );

    CREATE TABLE IF NOT EXISTS coupons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      code TEXT,
      discount_type TEXT,
      discount_value REAL,
      is_used BOOLEAN DEFAULT 0,
      expires_at DATETIME,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
  `);
  console.log('Database schema initialized.');
}

module.exports = { db, initDb };
