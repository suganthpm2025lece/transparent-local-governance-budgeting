require('dotenv').config();
const app = require('./app');
const { connectDB } = require('./config/db');
const { seedDemoData } = require('./utils/seedData');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    const { isInMemory } = await connectDB();
    console.log(`MongoDB connected (${isInMemory ? 'In-Memory Development Instance' : 'External MongoDB'})`);

    if (process.env.AUTO_SEED_DEMO === 'true' || isInMemory) {
      const seedResult = await seedDemoData({ force: false });
      if (seedResult.seeded) {
        console.log('Sample/demo municipal dataset seeded into database.');
      }
    }

    app.listen(PORT, () => {
      console.log(`CivicLedger API server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
