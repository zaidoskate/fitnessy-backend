const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
require('dotenv').config({ quiet: true });

const authRoutes = require('./routes/authRoutes');
const categoriaRoutes = require('./routes/categoriaRoutes');
const recordRoutes = require('./routes/recordRoutes');

const app = express();

// Middlewares globales de seguridad y parseo
app.use(helmet());
app.use(cors());
app.use(express.json());

// Ruta raíz de verificación (Health Check)
app.get('/', (req, res) => {
  res.status(200).send('Servidor de Fitnessy API corriendo en el puerto 5000');
});

// Montaje de módulos de la API RESTful
app.use('/api/auth', authRoutes);
app.use('/api/categorias', categoriaRoutes);
app.use('/api/records', recordRoutes);

// Middleware para rutas no encontradas (404 Not Found)
app.use((req, res) => {
  res.status(404).json({
    message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`
  });
});

// Middleware global centralizado de manejo de errores (500 Internal Server Error)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('Error global no controlado:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Error interno del servidor.'
  });
});

module.exports = app;
