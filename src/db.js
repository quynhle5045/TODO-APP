const path = require("path");
const fs = require("fs");
const Database = require("better-sqlite3");

const dataDir = path.join(__dirname, "..", "data");
fs.mkdirSync(dataDir, { recursive: true });
const db = new Database(path.join(dataDir, "tasks.db"));
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
db.exec(`
CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  category TEXT NOT NULL DEFAULT 'Cá nhân',
  priority TEXT NOT NULL DEFAULT 'Trung bình' CHECK(priority IN ('Thấp','Trung bình','Cao')),
  status TEXT NOT NULL DEFAULT 'Cần làm' CHECK(status IN ('Cần làm','Đang làm','Hoàn thành')),
  due_date TEXT NOT NULL,
  start_time TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT
)`);
module.exports = db;
