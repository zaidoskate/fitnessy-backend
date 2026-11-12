const pool = require('../config/db');

const normalizeRecord = (row) => {
  if (!row) return null;
  return {
    ...row,
    peso_levantado: Number(row.peso_levantado),
    repeticiones: Number(row.repeticiones),
    peso_corporal: row.peso_corporal !== undefined ? Number(row.peso_corporal) : undefined,
    es_oficial: Boolean(row.es_oficial)
  };
};

const BASE_SELECT = `
  SELECT 
    rf.id_record,
    rf.peso_levantado,
    rf.repeticiones,
    DATE_FORMAT(rf.fecha, '%Y-%m-%d') AS fecha,
    rf.es_oficial,
    rf.id_categoria,
    ce.nombre AS nombre_categoria,
    ce.grupo_muscular,
    rf.id_atleta,
    u.id_usuario,
    TRIM(CONCAT_WS(' ', u.nombre, u.apellido_paterno, u.apellido_materno)) AS nombre_atleta,
    a.pais,
    a.peso_corporal
  FROM RecordFitness rf
  INNER JOIN CategoriaEjercicio ce ON rf.id_categoria = ce.id_categoria
  INNER JOIN Atleta a ON rf.id_atleta = a.id_atleta
  INNER JOIN Usuario u ON a.id_usuario = u.id_usuario
`;

const recordModel = {
  async findAll({ id_categoria, es_oficial, search, limit = 6, offset = 0 } = {}) {
    const conditions = [];
    const params = [];

    if (id_categoria !== undefined && id_categoria !== '') {
      conditions.push('rf.id_categoria = ?');
      params.push(Number(id_categoria));
    }

    if (es_oficial !== undefined && es_oficial !== '') {
      const boolValue =
        es_oficial === true ||
          es_oficial === 'true' ||
          es_oficial === '1' ||
          es_oficial === 1
          ? 1
          : 0;
      conditions.push('rf.es_oficial = ?');
      params.push(boolValue);
    }

    if (search !== undefined && String(search).trim() !== '') {
      const searchPattern = `%${String(search).trim()}%`;
      conditions.push(
        `(TRIM(CONCAT_WS(' ', u.nombre, u.apellido_paterno, u.apellido_materno)) LIKE ? OR ce.nombre LIKE ? OR a.pais LIKE ?)`
      );
      params.push(searchPattern, searchPattern, searchPattern);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countQuery = `
      SELECT COUNT(*) AS total
      FROM RecordFitness rf
      INNER JOIN CategoriaEjercicio ce ON rf.id_categoria = ce.id_categoria
      INNER JOIN Atleta a ON rf.id_atleta = a.id_atleta
      INNER JOIN Usuario u ON a.id_usuario = u.id_usuario
      ${whereClause}
    `;

    const [countRows] = await pool.execute(countQuery, params);
    const total = countRows[0] ? Number(countRows[0].total) : 0;

    const safeLimit = Math.max(1, Number(limit) || 6);
    const safeOffset = Math.max(0, Number(offset) || 0);

    const dataQuery = `
      ${BASE_SELECT}
      ${whereClause}
      ORDER BY rf.peso_levantado DESC, rf.id_record DESC
      LIMIT ? OFFSET ?
    `;

    const [rows] = await pool.query(dataQuery, [...params, safeLimit, safeOffset]);
    return {
      records: rows.map(normalizeRecord),
      total
    };
  },

  async findTop3() {
    const query = `
      ${BASE_SELECT}
      WHERE rf.es_oficial = TRUE
      ORDER BY rf.peso_levantado DESC, rf.id_record DESC
      LIMIT 3
    `;
    const [rows] = await pool.execute(query);
    return rows.map(normalizeRecord);
  },

  async getStats() {
    const query = `
      SELECT
        (SELECT COUNT(*) FROM RecordFitness WHERE es_oficial = TRUE) AS total_records_oficiales,
        (SELECT COUNT(*) FROM Atleta) AS total_atletas,
        (SELECT COUNT(*) FROM CategoriaEjercicio) AS total_categorias
    `;
    const [rows] = await pool.execute(query);
    const stats = rows[0] || {};
    return {
      total_records_oficiales: Number(stats.total_records_oficiales || 0),
      total_atletas: Number(stats.total_atletas || 0),
      total_categorias: Number(stats.total_categorias || 0)
    };
  },

  async findById(id_record) {
    const query = `
      ${BASE_SELECT}
      WHERE rf.id_record = ?
      LIMIT 1
    `;
    const [rows] = await pool.execute(query, [id_record]);
    return rows.length > 0 ? normalizeRecord(rows[0]) : null;
  },

  async create({
    id_categoria,
    id_atleta,
    peso_levantado,
    repeticiones,
    fecha,
    es_oficial = false
  }) {
    const query = `
      INSERT INTO RecordFitness (id_categoria, id_atleta, peso_levantado, repeticiones, fecha, es_oficial)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const [result] = await pool.execute(query, [
      Number(id_categoria),
      Number(id_atleta),
      Number(peso_levantado),
      Number(repeticiones),
      fecha,
      es_oficial ? 1 : 0
    ]);

    return this.findById(result.insertId);
  },

  async update(
    id_record,
    { id_categoria, peso_levantado, repeticiones, fecha, es_oficial }
  ) {
    const query = `
      UPDATE RecordFitness
      SET id_categoria = ?, peso_levantado = ?, repeticiones = ?, fecha = ?, es_oficial = ?
      WHERE id_record = ?
    `;
    await pool.execute(query, [
      Number(id_categoria),
      Number(peso_levantado),
      Number(repeticiones),
      fecha,
      es_oficial ? 1 : 0,
      Number(id_record)
    ]);

    return this.findById(id_record);
  },

  async updateStatus(id_record, es_oficial) {
    const query = `
      UPDATE RecordFitness
      SET es_oficial = ?
      WHERE id_record = ?
    `;
    await pool.execute(query, [es_oficial ? 1 : 0, Number(id_record)]);
    return this.findById(id_record);
  },

  async remove(id_record) {
    const query = `
      DELETE FROM RecordFitness
      WHERE id_record = ?
    `;
    const [result] = await pool.execute(query, [Number(id_record)]);
    return result.affectedRows > 0;
  }
};

module.exports = recordModel;

