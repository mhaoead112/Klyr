import pool from './db.js';

async function testConnection() {
  console.log('Attempting to connect to the database...');
  let connection;
  try {
    connection = await pool.getConnection();
    console.log('Database connection successful!');
    const [rows] = await connection.execute('SELECT 1 + 1 AS solution');
    console.log('Test query successful. The solution is: ', (rows as any)[0].solution);
  } catch (error) {
    console.error('Database connection failed:', error);
  } finally {
    if (connection) {
      connection.release();
      console.log('Connection released.');
    }
    await pool.end();
    console.log('Pool ended.');
  }
}

testConnection();
