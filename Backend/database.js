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
  }
});

// Export database
// ==========================================
// COURSES TABLE
// ==========================================

db.run(`
  CREATE TABLE IF NOT EXISTS courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`, (err) => {
  if (err) {
    console.error("Error creating courses table:", err.message);
  } else {
    console.log("Courses table is ready.");
  }
});
module.exports = db;