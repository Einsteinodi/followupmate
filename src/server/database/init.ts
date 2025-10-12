import sqlite3 from 'sqlite3';
import path from 'path';


// Use absolute path
const dbPath = path.resolve(process.cwd(), 'src/data/followupmate.db');

console.log('Database path:', dbPath); // This will show us the exact path

const db = new sqlite3.Database(dbPath);

export { db };



export const initializeDatabase = async (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Create users table
    db.run(`
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
    `, (err) => {
      if (err) {
        console.error('Error creating users table:', err);
        reject(err);
        return;
      }
    });

    // Create follow_ups table
    db.run(`
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
    `, (err) => {
      if (err) {
        console.error('Error creating follow_ups table:', err);
        reject(err);
        return;
      }
    });

    // Create templates table
    db.run(`
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
    `, (err) => {
      if (err) {
        console.error('Error creating templates table:', err);
        reject(err);
        return;
      }
    });

    // Create settings table
    db.run(`
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
    `, (err) => {
      if (err) {
        console.error('Error creating settings table:', err);
        reject(err);
        return;
      }
    });

    // Create subscriptions table for Paystack
    db.run(`
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
    `, (err) => {
      if (err) {
        console.error('Error creating subscriptions table:', err);
        reject(err);
        return;
      }
    });

    // Create payments table for Paystack
    db.run(`
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
    `, (err) => {
      if (err) {
        console.error('Error creating payments table:', err);
        reject(err);
        return;
      }
    });

    // Add Paystack columns to existing users table (if they don't exist)
    db.run(`ALTER TABLE users ADD COLUMN paystack_customer_id TEXT`, (err) => {
      // Ignore error if column already exists
    });

    db.run(`ALTER TABLE users ADD COLUMN subscription_status TEXT DEFAULT 'active'`, (err) => {
      // Ignore error if column already exists
    });

    db.run(`ALTER TABLE users ADD COLUMN subscription_end_date TEXT`, (err) => {
      // Ignore error if column already exists
    });

    console.log('✅ Database initialized with Paystack support');
    resolve();
  });
};