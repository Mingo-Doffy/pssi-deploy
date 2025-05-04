require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const apiRouter = require('./routes/api');

const app = express();

// Configuration CORS dynamique
const corsOptions = {
  origin: process.env.CORS_ALLOWED_ORIGINS.split(','),
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

// Middlewares de sécurité
app.use(helmet());
app.use(express.json());
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: process.env.RATE_LIMIT_WINDOW * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX),
  message: {
    error: 'TOO_MANY_REQUESTS',
    message: 'Trop de requêtes depuis cette IP'
  }
});
app.use('/auth', limiter);

// Routes
app.use('/api', apiRouter);

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// Gestion des erreurs
app.use((err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] Erreur:`, err.stack);
  
  res.status(500).json({
    error: 'SERVER_ERROR',
    message: process.env.NODE_ENV === 'development' 
      ? err.message 
      : 'Une erreur est survenue'
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`[${new Date().toISOString()}] Serveur démarré sur le port ${PORT}`);
  console.log(`Environnement: ${process.env.NODE_ENV}`);
  console.log(`Origines CORS autorisées: ${process.env.CORS_ALLOWED_ORIGINS}`);
});