import sqlite3 from 'sqlite3';
import path from 'path';
import { promisify } from 'util';

const dbPath = path.resolve(process.cwd(), 'src/data/followupmate.db');
console.log('Database path:', dbPath);
export const db = new sqlite3.Database(dbPath);

// Promisify the db.run, db.all, and db.get methods so we can use async/await
const runAsync = promisify(db.run.bind(db));
const allAsync = promisify(db.all.bind(db));
const getAsync = promisify(db.get.bind(db));

export const initializeDatabase = async () => {
  try {
    // Create users table
    await runAsync(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        subscription_plan TEXT DEFAULT 'free',
        paystack_customer_id TEXT,
        subscription_status TEXT DEFAULT 'active',
        subscription_end_date TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create follow_ups table without priority initially (we'll add it later if missing)
    await runAsync(`
      CREATE TABLE IF NOT EXISTS follow_ups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        client_name TEXT NOT NULL,
        client_email TEXT NOT NULL,
        subject TEXT NOT NULL,
        message TEXT,
        follow_up_date DATE,
        follow_up_time TIME,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    // Check if the priority column exists
    const columns = await allAsync(`PRAGMA table_info(follow_ups);`);
    const hasPriorityColumn = columns.some(col => col.name === 'priority');

    if (!hasPriorityColumn) {
      console.log('Priority column missing, adding it...');
      await runAsync(`ALTER TABLE follow_ups ADD COLUMN priority TEXT DEFAULT 'medium'`);
      console.log('✅ Added priority column to follow_ups table');
    } else {
      console.log('ℹ️ Priority column already exists');
    }

    // Create templates table
    await runAsync(`
      CREATE TABLE IF NOT EXISTS templates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        subject TEXT NOT NULL,
        body TEXT NOT NULL,
        is_default BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    // Create settings table
    await runAsync(`
      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        email_notifications BOOLEAN DEFAULT 1,
        daily_summary BOOLEAN DEFAULT 1,
        reply_tracking BOOLEAN DEFAULT 1,
        timezone TEXT DEFAULT 'UTC',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    // Create subscriptions table
    await runAsync(`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        paystack_subscription_id TEXT,
        status TEXT DEFAULT 'active',
        plan TEXT DEFAULT 'free',
        current_period_start TEXT,
        current_period_end TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    // Create payments table
    await runAsync(`
      CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        paystack_reference TEXT,
        amount INTEGER,
        currency TEXT DEFAULT 'NGN',
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    // Add Paystack columns to users table if they don't exist — ignore errors for duplicates
    await runAsync(`ALTER TABLE users ADD COLUMN paystack_customer_id TEXT`).catch(() => {});
    await runAsync(`ALTER TABLE users ADD COLUMN subscription_status TEXT DEFAULT 'active'`).catch(() => {});
    await runAsync(`ALTER TABLE users ADD COLUMN subscription_end_date TEXT`).catch(() => {});

    console.log('✅ Database initialized with all tables and columns');

  } catch (err) {
    console.error('Error during database initialization:', err);
    throw err;
  }
};
