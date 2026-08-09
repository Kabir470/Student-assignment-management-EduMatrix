const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = process.env.DATABASE_URL || process.env.ConnectionStrings__DefaultConnection;
if (!connectionString) {
  console.error("DATABASE_URL or ConnectionStrings__DefaultConnection environment variable is required.");
  process.exit(1);
}

const client = new Client({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

async function runSql() {
  try {
    await client.connect();
    console.log('Connected to database.');
    
    const sqlPath = path.join(__dirname, 'database-info', 'add_assignment_discussions.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('Executing SQL...');
    await client.query(sql);
    console.log('SQL executed successfully!');
    
  } catch (err) {
    console.error('Error executing SQL:', err);
  } finally {
    await client.end();
  }
}

runSql();
