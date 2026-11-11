const mysql = require('mysql2/promise');
require('dotenv').config({ quiet: true });

class Database {
  constructor() {
    if (!Database.instance) {
      this.pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'fitnessy_db_user',
        password: process.env.DB_PASSWORD || 'Password_123',
        database: process.env.DB_DATABASE || 'fitnessy_db',
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
