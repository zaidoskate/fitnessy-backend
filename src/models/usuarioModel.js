const pool = require('../config/db');

const usuarioModel = {
  async findByCorreo(correo) {
    const query = `
      SELECT 
        u.id_usuario,
        u.nombre,
        u.apellido_paterno,
        u.apellido_materno,
        u.correo,
        u.password,
        r.nombre_rol AS rol,
        a.id_atleta,
        a.edad,
        a.peso_corporal,
        a.pais
      FROM Usuario u
      INNER JOIN RolUsuario r ON u.id_rol = r.id_rol
      LEFT JOIN Atleta a ON u.id_usuario = a.id_usuario
      WHERE u.correo = ?
      LIMIT 1
    `;
    const [rows] = await pool.execute(query, [correo]);
    return rows.length > 0 ? rows[0] : null;
  },

  async findById(id_usuario) {
    const query = `
      SELECT 
        u.id_usuario,
        u.nombre,
        u.apellido_paterno,
        u.apellido_materno,
        u.correo,
        r.nombre_rol AS rol,
        a.id_atleta,
        a.edad,
        a.peso_corporal,
        a.pais
      FROM Usuario u
      INNER JOIN RolUsuario r ON u.id_rol = r.id_rol
      LEFT JOIN Atleta a ON u.id_usuario = a.id_usuario
      WHERE u.id_usuario = ?
      LIMIT 1
    `;
    const [rows] = await pool.execute(query, [id_usuario]);
    return rows.length > 0 ? rows[0] : null;
  },

  async registerAtleta({
    nombre,
    apellido_paterno,
    apellido_materno = null,
    correo,
    passwordHash,
    edad,
    peso_corporal,
    pais
  }) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const insertUsuarioQuery = `
        INSERT INTO Usuario (id_rol, nombre, apellido_paterno, apellido_materno, correo, password)
        VALUES (2, ?, ?, ?, ?, ?)
      `;
      const [usuarioResult] = await connection.execute(insertUsuarioQuery, [
        nombre,
        apellido_paterno,
        apellido_materno || null,
        correo,
        passwordHash
      ]);

      const id_usuario = usuarioResult.insertId;

      const insertAtletaQuery = `
        INSERT INTO Atleta (id_usuario, edad, peso_corporal, pais)
        VALUES (?, ?, ?, ?)
      `;
      const [atletaResult] = await connection.execute(insertAtletaQuery, [
        id_usuario,
        edad,
        peso_corporal,
        pais
      ]);

      const id_atleta = atletaResult.insertId;

      await connection.commit();
      return { id_usuario, id_atleta };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
};

module.exports = usuarioModel;
