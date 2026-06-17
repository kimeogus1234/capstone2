const { Sequelize } = require('sequelize');
require('dotenv').config({ path: __dirname + '/../.env' });

const sequelize = new Sequelize(
  process.env.DB_NAME || 'capstone_db',
  process.env.DB_USER || 'root',
  process.env.DB_PASS || '1234',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    logging: false
  }
);

async function cleanIndexes() {
  try {
    await sequelize.authenticate();
    console.log('Connected to DB');
    
    const [results] = await sequelize.query("SHOW INDEX FROM users WHERE Key_name != 'PRIMARY'");
    const indexNames = [...new Set(results.map(row => row.Key_name))];
    
    console.log(`Found ${indexNames.length} indexes to drop.`);
    
    for (const indexName of indexNames) {
      console.log(`Dropping index ${indexName}...`);
      await sequelize.query(`ALTER TABLE users DROP INDEX \`${indexName}\``);
    }
    
    console.log('Successfully dropped duplicate indexes. You can start the server now.');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
  }
}

cleanIndexes();
