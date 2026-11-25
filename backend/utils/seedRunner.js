require('dotenv').config();
const { connectDB, disconnectDB } = require('../config/db');
const { seedDemoData } = require('./seedData');

async function run() {
  try {
    await connectDB();
    const force = process.argv.includes('--force');
    const result = await seedDemoData({ force });
    console.log(result);
    await disconnectDB();
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

run();
