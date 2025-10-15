const mongoose = require('mongoose');
const logger = require('../utils/logger');
const config = require('./index');

async function connectDB() {
  const uri = config.mongoUri;
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, {
    autoIndex: true,
    maxPoolSize: 10,
  });
  logger.info('MongoDB connected (guide-service)');
}

module.exports = { connectDB };
