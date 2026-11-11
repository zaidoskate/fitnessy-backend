const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const recordModel = require('../src/models/recordModel');
const categoriaModel = require('../src/models/categoriaModel');

const JWT_SECRET = process.env.JWT_SECRET || 'fitnessy_secret_jwt_key_2026';

const adminToken = jwt.sign(
  { id: 1, rol: 'admin', id_atleta: 1 },
  JWT_SECRET,
  { expiresIn: '1h' }
);

const user2Token = jwt.sign(
  { id: 2, rol: 'user', id_atleta: 2 },
  JWT_SECRET,
  { expiresIn: '1h' }
);

const user3Token = jwt.sign(
  { id: 3, rol: 'user', id_atleta: 3 },
  JWT_SECRET,
  { expiresIn: '1h' }
);

const sampleRecord = {
  id_record: 1,
  peso_levantado: 195,
  repeticiones: 1,
  fecha: '2026-10-18',
  es_oficial: true,
  id_categoria: 1,
  nombre_categoria: 'Sentadilla Libre',
  grupo_muscular: 'Cuádriceps y Glúteo',
  id_atleta: 2,
  id_usuario: 2,
  nombre_atleta: 'Carlos Mendoza López',
  pais: 'México',
  peso_corporal: 88
};

describe('Suite Completa de Récords Fitness (/api/records)', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('Endpoints Públicos de Consulta (GET)', () => {
    test('GET /api/records debe devolver lista paginada y aplicar filtros (200 OK)', async () => {
      const spy = jest.spyOn(recordModel, 'findAll').mockResolvedValue({
        records: [sampleRecord],
        total: 1
      });

      const response = await request(app).get(
        '/api/records?id_categoria=1&es_oficial=true&search=Carlos&page=1&limit=6'
      );

      expect(response.statusCode).toBe(200);
      expect(spy).toHaveBeenCalledWith({
        id_categoria: '1',
        es_oficial: 'true',
        search: 'Carlos',
        limit: 6,
        offset: 0
      });
      expect(response.body.records).toHaveLength(1);
      expect(response.body.pagination).toMatchObject({
        total: 1,
        page: 1,
        limit: 6,
        totalPages: 1
      });
    });

    test('GET /api/records/top debe retornar el Top 3 de récords oficiales (200 OK)', async () => {
      jest.spyOn(recordModel, 'findTop3').mockResolvedValue([sampleRecord]);

      const response = await request(app).get('/api/records/top');
      expect(response.statusCode).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body[0]).toMatchObject({ id_record: 1, es_oficial: true });
    });

    test('GET /api/records/stats debe retornar estadísticas globales (200 OK)', async () => {
      jest.spyOn(recordModel, 'getStats').mockResolvedValue({
        total_records_oficiales: 5,
        total_atletas: 4,
        total_categorias: 5
      });

      const response = await request(app).get('/api/records/stats');
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        total_records_oficiales: 5,
        total_atletas: 4,
        total_categorias: 5
      });
    });

    test('GET /api/records/:id debe retornar el detalle del récord si existe (200 OK)', async () => {
      jest.spyOn(recordModel, 'findById').mockResolvedValue(sampleRecord);

      const response = await request(app).get('/api/records/1');
      expect(response.statusCode).toBe(200);
      expect(response.body).toMatchObject({ id_record: 1 });
    });

    test('GET /api/records/:id debe retornar 404 si el récord no existe', async () => {
      jest.spyOn(recordModel, 'findById').mockResolvedValue(null);

      const response = await request(app).get('/api/records/999');
      expect(response.statusCode).toBe(404);
    });
  });

  describe('POST /api/records (Creación de Récords)', () => {
    const validRecordBody = {
      id_categoria: 1,
      peso_levantado: 200,
      repeticiones: 1,
      fecha: '2026-11-10',
      es_oficial: true // Incluso si un user envía true, debe forzarse a false
    };

    test('Rol user: debe crear el récord forzando es_oficial = false y su propio id_atleta (201 Created)', async () => {
      jest
        .spyOn(categoriaModel, 'findById')
        .mockResolvedValue({ id_categoria: 1, nombre: 'Sentadilla Libre' });
      const createSpy = jest.spyOn(recordModel, 'create').mockResolvedValue({
        ...sampleRecord,
        id_record: 7,
        peso_levantado: 200,
        es_oficial: false
      });

      const response = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${user2Token}`)
        .send(validRecordBody);

      expect(response.statusCode).toBe(201);
      expect(createSpy).toHaveBeenCalledWith({
        id_categoria: 1,
        id_atleta: 2,
        peso_levantado: 200,
        repeticiones: 1,
        fecha: '2026-11-10',
        es_oficial: false
      });
      expect(response.body.record.es_oficial).toBe(false);
    });

    test('Rol admin: debe permitir crear un récord directamente como oficial (201 Created)', async () => {
      jest
        .spyOn(categoriaModel, 'findById')
        .mockResolvedValue({ id_categoria: 1, nombre: 'Sentadilla Libre' });
      const createSpy = jest.spyOn(recordModel, 'create').mockResolvedValue({
        ...sampleRecord,
        id_record: 8,
        peso_levantado: 200,
        es_oficial: true
      });

      const response = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validRecordBody);

      expect(response.statusCode).toBe(201);
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({ es_oficial: true })
      );
    });

    test('Debe retornar 400 si la categoría especificada no existe en BD', async () => {
      jest.spyOn(categoriaModel, 'findById').mockResolvedValue(null);

      const response = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${user2Token}`)
        .send(validRecordBody);

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toContain('categoría de ejercicio especificada no existe');
    });

    test('Debe retornar 400 si los datos de entrada son inválidos', async () => {
      const response = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          id_categoria: 0,
          peso_levantado: -50,
          repeticiones: 0,
          fecha: 'no-es-fecha'
        });

      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('PUT /api/records/:id (Edición y Propiedad de Récords)', () => {
    const updateBody = {
      id_categoria: 1,
      peso_levantado: 205,
      repeticiones: 2,
      fecha: '2026-11-11'
    };

    test('Atleta dueño: debe permitir editar su propio récord (200 OK)', async () => {
      jest.spyOn(recordModel, 'findById').mockResolvedValue(sampleRecord); // id_atleta = 2
      jest
        .spyOn(categoriaModel, 'findById')
        .mockResolvedValue({ id_categoria: 1, nombre: 'Sentadilla Libre' });
      jest.spyOn(recordModel, 'update').mockResolvedValue({
        ...sampleRecord,
        peso_levantado: 205,
        repeticiones: 2,
        es_oficial: false
      });

      const response = await request(app)
        .put('/api/records/1')
        .set('Authorization', `Bearer ${user2Token}`)
        .send(updateBody);

      expect(response.statusCode).toBe(200);
      expect(response.body.record.peso_levantado).toBe(205);
    });

    test('Atleta NO dueño: debe rechazar con 403 Forbidden al intentar editar récord ajeno', async () => {
      jest.spyOn(recordModel, 'findById').mockResolvedValue(sampleRecord); // id_atleta = 2

      const response = await request(app)
        .put('/api/records/1')
        .set('Authorization', `Bearer ${user3Token}`) // id_atleta = 3
        .send(updateBody);

      expect(response.statusCode).toBe(403);
    });

    test('Rol admin: debe permitir editar el récord de cualquier atleta (200 OK)', async () => {
      jest.spyOn(recordModel, 'findById').mockResolvedValue(sampleRecord);
      jest
        .spyOn(categoriaModel, 'findById')
        .mockResolvedValue({ id_categoria: 1, nombre: 'Sentadilla Libre' });
      jest.spyOn(recordModel, 'update').mockResolvedValue({
        ...sampleRecord,
        peso_levantado: 205,
        es_oficial: true
      });

      const response = await request(app)
        .put('/api/records/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...updateBody, es_oficial: true });

      expect(response.statusCode).toBe(200);
    });

    test('Debe retornar 404 si el récord a editar no existe', async () => {
      jest.spyOn(recordModel, 'findById').mockResolvedValue(null);

      const response = await request(app)
        .put('/api/records/999')
        .set('Authorization', `Bearer ${user2Token}`)
        .send(updateBody);

      expect(response.statusCode).toBe(404);
    });
  });

  describe('PATCH /api/records/:id/status (Validación Oficial por Admin)', () => {
    test('Rol admin: debe aprobar o revocar el estatus oficial de un récord (200 OK)', async () => {
      jest.spyOn(recordModel, 'findById').mockResolvedValue({
        ...sampleRecord,
        es_oficial: false
      });
      jest.spyOn(recordModel, 'updateStatus').mockResolvedValue({
        ...sampleRecord,
        es_oficial: true
      });

      const response = await request(app)
        .patch('/api/records/1/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ es_oficial: true });

      expect(response.statusCode).toBe(200);
      expect(response.body.record.es_oficial).toBe(true);
    });

    test('Rol user: debe recibir 403 Forbidden al intentar aprobar un récord', async () => {
      const response = await request(app)
        .patch('/api/records/1/status')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ es_oficial: true });

      expect(response.statusCode).toBe(403);
    });

    test('Debe retornar 404 si el récord a cambiar de estatus no existe', async () => {
      jest.spyOn(recordModel, 'findById').mockResolvedValue(null);

      const response = await request(app)
        .patch('/api/records/999/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ es_oficial: true });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('DELETE /api/records/:id (Eliminación y Propiedad de Récords)', () => {
    test('Atleta dueño: debe poder eliminar su propio récord (200 OK)', async () => {
      jest.spyOn(recordModel, 'findById').mockResolvedValue(sampleRecord); // id_atleta = 2
      jest.spyOn(recordModel, 'remove').mockResolvedValue(true);

      const response = await request(app)
        .delete('/api/records/1')
        .set('Authorization', `Bearer ${user2Token}`);

      expect(response.statusCode).toBe(200);
    });

    test('Atleta NO dueño: debe recibir 403 Forbidden al intentar eliminar récord ajeno', async () => {
      jest.spyOn(recordModel, 'findById').mockResolvedValue(sampleRecord); // id_atleta = 2

      const response = await request(app)
        .delete('/api/records/1')
        .set('Authorization', `Bearer ${user3Token}`); // id_atleta = 3

      expect(response.statusCode).toBe(403);
    });

    test('Rol admin: debe poder eliminar cualquier récord (200 OK)', async () => {
      jest.spyOn(recordModel, 'findById').mockResolvedValue(sampleRecord);
      jest.spyOn(recordModel, 'remove').mockResolvedValue(true);

      const response = await request(app)
        .delete('/api/records/1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(200);
    });

    test('Debe retornar 404 si el récord a eliminar no existe', async () => {
      jest.spyOn(recordModel, 'findById').mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/records/999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(404);
    });
  });
});

