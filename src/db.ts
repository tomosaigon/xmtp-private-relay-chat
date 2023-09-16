import sqlite3 from 'sqlite3';

const dbLocation = process.env.SQLITE_DB_LOCATION || 'default.db';

export const db = new sqlite3.Database(dbLocation);

db.run(`
    CREATE TABLE IF NOT EXISTS registry (
        name TEXT,
        address TEXT
    );
`);
