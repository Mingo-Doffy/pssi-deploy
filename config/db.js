const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT),
  queueLimit: 0,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: true } : false
});

module.exports = {
  pool,
  bcrypt,
  jwt,
  
  // Méthode query optimisée
  query: async (sql, params, transaction = false) => {
    const conn = transaction ? await pool.getConnection() : null;
    try {
      const [rows] = conn 
        ? await conn.execute(sql, params)
        : await pool.execute(sql, params);
      return rows;
    } finally {
      if (conn) conn.release();
    }
  },

  // Méthode queryOne optimisée
  queryOne: async (sql, params) => {
    const [rows] = await pool.execute(sql, params);
    return rows[0] || null;
  },

  // Gestion des transactions
  transaction: async (callback) => {
    const conn = await pool.getConnection();
    await conn.beginTransaction();
    try {
      const result = await callback(conn);
      await conn.commit();
      return result;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }
};