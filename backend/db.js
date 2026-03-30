const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("data.sqlite3");

db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        type TEXT,
        title TEXT,
        message TEXT,
        is_read INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(event_id, user_id)
        )
    `);
});

module.exports = db;