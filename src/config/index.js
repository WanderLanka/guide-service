module.exports = {
  // Prefer service-specific connection string, then generic, then a safe default
  mongoUri: process.env.GUIDE_MONGO_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/wanderlanka_guide',
  dbName: process.env.GUIDE_DB_NAME || undefined,
  corsOrigins: (process.env.CORS_ORIGINS || '').split(',').filter(Boolean),
};
