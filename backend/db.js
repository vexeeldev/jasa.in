const oracledb = require('oracledb');

const dbConfig = {
  user: 'C##jasa',
  password: 'jasa123',
  connectString: 'localhost:1521/orcl',
  poolMin: 1,
  poolMax: 5,
  poolIncrement: 1
};

// init pool
async function initDB() {
  try {
    await oracledb.createPool(dbConfig);
    console.log('✅ Oracle Pool Connected');
  } catch (err) {
    console.error('❌ DB Error:', err);
    process.exit(1); // stop kalau gagal
  }
}

// ambil koneksi dari pool
async function getConnection() {
  try {
    return await oracledb.getConnection();
  } catch (err) {
    console.error('❌ Connection Error:', err);
    throw err;
  }
}

module.exports = {
  initDB,
  getConnection
};