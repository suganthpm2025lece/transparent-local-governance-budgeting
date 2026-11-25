const mongoose = require('mongoose');

let memoryServer = null;

/**
 * Connect to MongoDB Atlas / local MongoDB, or fall back to an in-memory
 * MongoDB instance when USE_IN_MEMORY_DB=true (used for offline dev & tests).
 */
async function connectDB() {
  const useInMemory = process.env.USE_IN_MEMORY_DB === 'true' || !process.env.MONGODB_URI;

  let uri = process.env.MONGODB_URI;

  if (useInMemory) {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    if (!memoryServer) {
      memoryServer = await MongoMemoryServer.create({
        instance: {
          launchTimeout: 60000,
        },
      });
    }
    uri = memoryServer.getUri();
  }

  mongoose.set('strictQuery', true);

  const conn = await mongoose.connect(uri, {
    autoIndex: true,
  });

  return {
    connection: conn.connection,
    isInMemory: useInMemory,
  };
}

async function disconnectDB() {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
}

module.exports = { connectDB, disconnectDB };
