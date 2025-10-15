require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { connectDB } = require('./src/config/database');
const logger = require('./src/utils/logger');
const { errorConverter, errorHandler, notFound } = require('./src/middleware/errorHandler');

// Routers
const tourPackagesRoutes = require('./src/tourpackages/routes');
const guideCrudRoutes = require('./src/guide/routes');
const featuredGuidesRouter = require('./src/featuredguides');

const app = express();

const PORT = process.env.PORT || 3005;
const CORS_ORIGINS = (process.env.CORS_ORIGINS || '').split(',').filter(Boolean);

app.use(cors({ origin: CORS_ORIGINS.length ? CORS_ORIGINS : true, credentials: true }));
app.use(express.json());
app.use(morgan('combined', { stream: logger.stream }));

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'guide-service', timestamp: new Date().toISOString() });
});

// Mount routes
app.use('/tourpackages', tourPackagesRoutes);
// New guide CRUD endpoints
app.use('/guide', guideCrudRoutes);
// (Legacy by-user and sync routes removed; use CRUD with userId instead)

// Expose featured guides at service root
app.use('/featuredguides', featuredGuidesRouter);

app.use(notFound);
app.use(errorConverter);
app.use(errorHandler);

connectDB().then(() => {
  app.listen(PORT, () => logger.info(`🚀 Guide service listening on port ${PORT}`));
});
