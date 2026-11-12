const pool = require('../config/db');

const categoriaModel = {
  async findAll() {
    const query = `
      SELECT id_categoria, nombre, grupo_muscular, descripcion
      FROM CategoriaEjercicio
      ORDER BY id_categoria ASC
    `;
    const [rows] = await pool.execute(query);
    return rows;
  },

  async findById(id_categoria) {
    const query = `
      SELECT id_categoria, nombre, grupo_muscular, descripcion
      FROM CategoriaEjercicio
      WHERE id_categoria = ?
      LIMIT 1
    `;
    const [rows] = await pool.execute(query, [id_categoria]);
    return rows.length > 0 ? rows[0] : null;
  },

  async create({ nombre, grupo_muscular, descripcion }) {
    const query = `
      INSERT INTO CategoriaEjercicio (nombre, grupo_muscular, descripcion)
      VALUES (?, ?, ?)
    `;
    const [result] = await pool.execute(query, [
      nombre,
      grupo_muscular,
      descripcion
    ]);
    return {
      id_categoria: result.insertId,
      nombre,
      grupo_muscular,
      descripcion
    };
  },

  async update(id_categoria, { nombre, grupo_muscular, descripcion }) {
    const query = `
      UPDATE CategoriaEjercicio
      SET nombre = ?, grupo_muscular = ?, descripcion = ?
      WHERE id_categoria = ?
    `;
    const [result] = await pool.execute(query, [
      nombre,
      grupo_muscular,
      descripcion,
      id_categoria
    ]);
    return result.affectedRows > 0;
  },

  async remove(id_categoria) {
    const query = `
      DELETE FROM CategoriaEjercicio
      WHERE id_categoria = ?
    `;
    const [result] = await pool.execute(query, [id_categoria]);
    return result.affectedRows > 0;
  }
};

module.exports = categoriaModel;

