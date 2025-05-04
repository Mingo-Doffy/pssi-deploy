const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

console.log("DB_HOST:", process.env.DB_HOST);
console.log("DB_PORT:", process.env.DB_PORT);
console.log("DB_USER:", process.env.DB_USER);
console.log("DB_PASSWORD:", process.env.DB_PASSWORD);
console.log("DB_DATABASE:", process.env.DB_DATABASE);
console.log("MYSQL_HOST:", process.env.MYSQL_HOST);
console.log("MYSQL_PORT:", process.env.MYSQL_PORT);
console.log("MYSQL_USER:", process.env.MYSQL_USER);
console.log("MYSQL_PASSWORD:", process.env.MYSQL_PASSWORD);
console.log("MYSQL_DATABASE:", process.env.MYSQL_DATABASE);



const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  port: process.env.MYSQL_PORT,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10, // Valeur par défaut si non définie
  queueLimit: 0,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: true } : false
});

// Tentative de connexion initiale pour vérifier la base de données
pool.getConnection()
  .then(connection => {
    console.log('Connexion à la base de données MySQL réussie !');
    connection.release(); // Libérer la connexion après la vérification
  })
  .catch(err => {
    console.error('Erreur lors de la connexion à la base de données MySQL :', err);
    // Il serait judicieux d'arrêter l'application ici en cas d'échec critique de la connexion
    // process.exit(1);
  });

module.exports = {
  pool,
  bcrypt,
  jwt,

  // Méthode query optimisée
  query: async (sql, params, transaction = false) => {
    let conn;
    try {
      conn = transaction ? await pool.getConnection() : pool;
      const [rows] = await conn.execute(sql, params);
      return rows;
    } finally {
      if (transaction && conn) conn.release();
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