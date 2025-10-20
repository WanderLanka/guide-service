module.exports = {
  // Prefer service-specific connection string, then generic, then a safe default
  mongoUri: process.env.GUIDE_MONGO_URI || process.env.MONGO_URI || 'mongodb+srv://abdulraheempsn:0769634145aB@cluster0.xuwqh3p.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0',
  dbName: process.env.GUIDE_DB_NAME || undefined,
  corsOrigins: (process.env.CORS_ORIGINS || '').split(',').filter(Boolean),
};
