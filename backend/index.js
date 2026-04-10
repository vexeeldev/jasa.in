const express = require('express');
const { initDB, getConnection } = require('./db');

const app = express();
app.use(express.json());

// init DB sekali saat start
initDB();

// test route
app.get('/', async (req, res) => {
  let conn;

  try {
    conn = await getConnection();

    const result = await conn.execute(
      `SELECT 'Hello from Oracle 🚀' AS MESSAGE FROM dual`
    );

    res.json({
      success: true,
      data: result.rows
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  } finally {
    if (conn) {
      try {
        await conn.close();
      } catch (e) {
        console.error(e);
      }
    }
  }
});

// start server
app.listen(3000, () => {
  console.log('🚀 Server jalan di http://localhost:3000');
});