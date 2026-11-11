const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const categoriaModel = require('../src/models/categoriaModel');

const JWT_SECRET = process.env.JWT_SECRET || 'fitnessy_secret_jwt_key_2026';

const adminToken = jwt.sign(
  { id: 1, rol: 'admin', id_atleta: 1 },
  JWT_SECRET,
  { expiresIn: '1h' }
);

const userToken = jwt.sign(
  { id: 2, rol: 'user', id_atleta: 2 },
  JWT_SECRET,
  { expiresIn: '1h' }
);

describe('Suite Completa de Categorías de Ejercicio (/api/categorias)', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('GET /api/categorias y GET /api/categorias/:id', () => {
    test('GET /api/categorias debe retornar la lista de categorías (200 OK)', async () => {
      const mockCategorias = [
        {
          id_categoria: 1,
          nombre: 'Sentadilla Libre',
          grupo_muscular: 'Cuádriceps y Glúteo',
          descripcion: 'Sentadilla profunda con barra olímpica.'
        }
      ];
      jest.spyOn(categoriaModel, 'findAll').mockResolvedValue(mockCategorias);

      const response = await request(app).get('/api/categorias');
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual(mockCategorias);
    });

    test('GET /api/categorias/:id debe retornar una categoría existente (200 OK)', async () => {
      const mockCategoria = {
        id_categoria: 1,
        nombre: 'Sentadilla Libre',
        grupo_muscular: 'Cuádriceps y Glúteo',
        descripcion: 'Sentadilla profunda con barra olímpica.'
      };
      jest.spyOn(categoriaModel, 'findById').mockResolvedValue(mockCategoria);

      const response = await request(app).get('/api/categorias/1');
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual(mockCategoria);
    });

    test('GET /api/categorias/:id debe retornar 404 si la categoría no existe', async () => {
      jest.spyOn(categoriaModel, 'findById').mockResolvedValue(null);

      const response = await request(app).get('/api/categorias/99');
      expect(response.statusCode).toBe(404);
    });

    test('GET /api/categorias/:id con parámetro no numérico debe retornar 400', async () => {
      const response = await request(app).get('/api/categorias/abc');
      expect(response.statusCode).toBe(400);
    });
  });

  describe('POST /api/categorias', () => {
    const validPayload = {
      nombre: 'Press Militar',
      grupo_muscular: 'Hombros y Tríceps',
      descripcion: 'Empuje vertical estricto con barra olímpica.'
    };

    test('Debe permitir al admin crear una categoría nueva (201 Created)', async () => {
      jest.spyOn(categoriaModel, 'create').mockResolvedValue({
        id_categoria: 6,
        ...validPayload
      });

      const response = await request(app)
        .post('/api/categorias')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validPayload);

      expect(response.statusCode).toBe(201);
      expect(response.body.categoria).toMatchObject({
        id_categoria: 6,
        nombre: 'Press Militar'
      });
    });

    test('Debe rechazar la creación si el usuario tiene rol user (403 Forbidden)', async () => {
      const response = await request(app)
        .post('/api/categorias')
        .set('Authorization', `Bearer ${userToken}`)
        .send(validPayload);

      expect(response.statusCode).toBe(403);
    });

    test('Debe retornar 409 Conflict si el nombre de la categoría está duplicado', async () => {
      const dupError = new Error('Duplicate entry');
      dupError.code = 'ER_DUP_ENTRY';
      jest.spyOn(categoriaModel, 'create').mockRejectedValue(dupError);

      const response = await request(app)
        .post('/api/categorias')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validPayload);

      expect(response.statusCode).toBe(409);
    });

    test('Debe retornar 400 si faltan campos requeridos', async () => {
      const response = await request(app)
        .post('/api/categorias')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nombre: '' });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('PUT /api/categorias/:id', () => {
    const updatePayload = {
      nombre: 'Press Militar Estricto',
      grupo_muscular: 'Deltoides',
      descripcion: 'Empuje vertical de pie sin impulso.'
    };

    test('Debe permitir al admin actualizar una categoría existente (200 OK)', async () => {
      jest
        .spyOn(categoriaModel, 'findById')
        .mockResolvedValueOnce({ id_categoria: 6, ...updatePayload })
        .mockResolvedValueOnce({ id_categoria: 6, ...updatePayload });
      jest.spyOn(categoriaModel, 'update').mockResolvedValue(true);

      const response = await request(app)
        .put('/api/categorias/6')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updatePayload);

      expect(response.statusCode).toBe(200);
      expect(response.body.categoria).toMatchObject(updatePayload);
    });

    test('Debe retornar 404 si se intenta actualizar una categoría inexistente', async () => {
      jest.spyOn(categoriaModel, 'findById').mockResolvedValue(null);

      const response = await request(app)
        .put('/api/categorias/99')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updatePayload);

      expect(response.statusCode).toBe(404);
    });
  });

  describe('DELETE /api/categorias/:id', () => {
    test('Debe permitir al admin eliminar una categoría sin récords asociados (200 OK)', async () => {
      jest
        .spyOn(categoriaModel, 'findById')
        .mockResolvedValue({ id_categoria: 6, nombre: 'Temporal' });
      jest.spyOn(categoriaModel, 'remove').mockResolvedValue(true);

      const response = await request(app)
        .delete('/api/categorias/6')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty(
        'message',
        'Categoría eliminada exitosamente.'
      );
    });

    test('Debe retornar 400 Bad Request si la categoría tiene récords asociados por Foreign Key', async () => {
      jest
        .spyOn(categoriaModel, 'findById')
        .mockResolvedValue({ id_categoria: 1, nombre: 'Sentadilla Libre' });

      const fkError = new Error('Cannot delete or update a parent row');
      fkError.code = 'ER_ROW_IS_REFERENCED_2';
      fkError.errno = 1451;
      jest.spyOn(categoriaModel, 'remove').mockRejectedValue(fkError);

      const response = await request(app)
        .delete('/api/categorias/1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toContain('tiene récords fitness asociados');
    });

    test('Debe retornar 404 si la categoría a eliminar no existe', async () => {
      jest.spyOn(categoriaModel, 'findById').mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/categorias/99')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(404);
    });
  });
});

