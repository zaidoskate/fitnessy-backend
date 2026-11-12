const mysql = require('mysql2/promise');
require('dotenv').config({ quiet: true });

class Database {
  constructor() {
    if (!Database.instance) {
      const pool = mysql.createPool({
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
      });
      Database.instance = this;
    }
    return Database.instance;
  }

  getPool() {
    return this.pool;
  }
}

const dbInstance = new Database();
Object.freeze(dbInstance);

module.exports = dbInstance.getPool();
