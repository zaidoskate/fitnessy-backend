const app = require('./app');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Fitnessy API corriendo en el puerto ${PORT}`);
});

