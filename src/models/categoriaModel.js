const pool = require('../config/db');

const categoriaModel = {
  /**
   * Devuelve todas las categorías de ejercicio ordenadas por id_categoria ASC.
   * @returns {Promise<Array>}
   */
  async findAll() {
    const query = `
      SELECT id_categoria, nombre, grupo_muscular, descripcion
      FROM CategoriaEjercicio
      ORDER BY id_categoria ASC
    `;
    const [rows] = await pool.execute(query);
    return rows;
  },

  /**
   * Obtiene una categoría de ejercicio por su ID.
   * @param {number} id_categoria
   * @returns {Promise<Object|null>}
   */
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

  /**
   * Crea una nueva categoría en CategoriaEjercicio.
   * @param {Object} data
   * @returns {Promise<Object>}
   */
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

  /**
   * Actualiza una categoría existente por su ID.
   * @param {number} id_categoria
   * @param {Object} data
   * @returns {Promise<boolean>}
   */
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

  /**
   * Elimina una categoría por su ID.
   * @param {number} id_categoria
   * @returns {Promise<boolean>}
   */
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

