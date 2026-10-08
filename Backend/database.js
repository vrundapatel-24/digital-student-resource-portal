const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// SQLite database file
const dbPath = path.join(__dirname, "database.sqlite");

// Create or open database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Database connection failed:", err.message);
    return;
  }

  console.log("SQLite database connected successfully.");
});

// Enable foreign keys
db.run("PRAGMA foreign_keys = ON");

// ==========================================
// USERS TABLE
// ==========================================

db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`, (err) => {
  if (err) {
    console.error("Users table creation failed:", err.message);
  } else {
    console.log("Users table ready.");
  }
});

// ==========================================
// STUDY TASKS TABLE
// ==========================================

db.run(`
  CREATE TABLE IF NOT EXISTS study_tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    date TEXT,
    time TEXT,
    completed INTEGER DEFAULT 0,
    completed_at TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`, (err) => {
  if (err) {
    console.error("Error creating study_tasks table:", err.message);
  } else {
    console.log("Study tasks table is ready.");

    // Add user_id after table exists
    db.run(`
      ALTER TABLE study_tasks
      ADD COLUMN user_id INTEGER
    `, (migrationErr) => {
      if (migrationErr) {
        if (migrationErr.message.includes("duplicate column name")) {
          console.log("Study tasks user_id already exists.");
        } else {
          console.error(
            "Study tasks user_id migration error:",
            migrationErr.message
          );
        }
      } else {
        console.log("Study tasks user_id added.");
      }
    });
  }
});

// ==========================================
// EXAMS TABLE
// ==========================================

db.run(`
  CREATE TABLE IF NOT EXISTS exams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    subject TEXT DEFAULT '',
    exam_date TEXT NOT NULL,
    reminder_enabled INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`, (err) => {
  if (err) {
    console.error("Error creating exams table:", err.message);
  } else {
    console.log("Exams table is ready.");

    // Add user_id after table exists
    db.run(`
      ALTER TABLE exams
      ADD COLUMN user_id INTEGER
    `, (migrationErr) => {
      if (migrationErr) {
        if (migrationErr.message.includes("duplicate column name")) {
          console.log("Exams user_id already exists.");
        } else {
          console.error(
            "Exams user_id migration error:",
            migrationErr.message
          );
        }
      } else {
        console.log("Exams user_id added.");
      }
    });
  }
});

// ==========================================
// EXPORT DATABASE
// ==========================================

module.exports = db;