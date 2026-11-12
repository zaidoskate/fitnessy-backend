const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
require('dotenv').config({ quiet: true });

const authRoutes = require('./routes/authRoutes');
const categoriaRoutes = require('./routes/categoriaRoutes');
const recordRoutes = require('./routes/recordRoutes');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.status(200).send('Servidor de Fitnessy API corriendo en el puerto 5000');
});

app.use('/api/auth', authRoutes);
app.use('/api/categorias', categoriaRoutes);
app.use('/api/records', recordRoutes);
app.use((req, res) => {
  res.status(404).json({
    message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`
  });
});

app.use((err, req, res, next) => {
  console.error('Error global no controlado:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Error interno del servidor.'
  });
});

module.exports = app;
