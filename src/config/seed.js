const bcrypt = require('bcryptjs');
const pool = require('./db');

async function seedPasswords() {
  try {
    const passwordHash = bcrypt.hashSync('Password_123', 10);
    await pool.execute('UPDATE Usuario SET password = ?', [passwordHash]);
    console.log('Contraseñas de usuarios de prueba sincronizadas con éxito (Password_123).');
  } catch (error) {
    console.error('Error al ejecutar seed:', error.message || error.code || error);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  seedPasswords();
}

module.exports = seedPasswords;
