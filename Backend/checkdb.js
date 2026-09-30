const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./database.sqlite");

db.all(
    "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name",
    (err, rows) => {
        if (err) {
            console.error(err);
        } else {
            console.table(rows);
        }

        db.close();
    }
);