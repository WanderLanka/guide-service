const mongoose = require('mongoose');
const logger = require('../utils/logger');
const config = require('./index');

async function connectDB() {
  const uri = config.mongoUri;
  const dbName = config.dbName;
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, {
    autoIndex: true,
    maxPoolSize: 10,
    ...(dbName ? { dbName } : {}),
  });
  logger.info(`MongoDB connected (guide-service) uri=${uri}${dbName ? ` db=${dbName}` : ''}`);
}

module.exports = { connectDB };
