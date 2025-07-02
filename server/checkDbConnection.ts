import pool from './db.js';

export async function checkDbConnection() {
  let connection;
  try {
    console.log('Checking database connection...');
    connection = await pool.getConnection();
    console.log('Database connection successful.');
  } catch (error) {
    console.error('FATAL: Could not connect to the database. Please check your .env file and database server.');
    console.error(error);
    process.exit(1); // Exit the process with an error code
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
