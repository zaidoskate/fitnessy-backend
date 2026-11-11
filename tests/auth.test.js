const request = require('supertest');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const usuarioModel = require('../src/models/usuarioModel');
const pool = require('../src/config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'fitnessy_secret_jwt_key_2026';

describe('Suite Completa de Autenticación y Seguridad (/api/auth)', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(async () => {
    if (pool && pool.end) {
      await pool.end();
    }
  });

  describe('Health Check y Rutas Globales', () => {
    test('GET / debe responder 200 OK con el mensaje del servidor', async () => {
      const response = await request(app).get('/');
      expect(response.statusCode).toBe(200);
      expect(response.text).toContain('Fitnessy API corriendo en el puerto 5000');
    });

    test('Ruta inexistente debe responder 404 Not Found', async () => {
      const response = await request(app).get('/api/ruta-inexistente');
      expect(response.statusCode).toBe(404);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('POST /api/auth/login', () => {
    test('Debe iniciar sesión exitosamente con credenciales válidas (200 OK)', async () => {
      const passwordHash = await bcrypt.hash('Password_123', 10);
      jest.spyOn(usuarioModel, 'findByCorreo').mockResolvedValue({
        id_usuario: 2,
        nombre: 'Carlos',
        apellido_paterno: 'Mendoza',
        apellido_materno: 'López',
        correo: 'carlos.mendoza@gmail.com',
        password: passwordHash,
        rol: 'user',
        id_atleta: 2,
        edad: 25,
        peso_corporal: 88.0,
        pais: 'México'
      });

      const response = await request(app).post('/api/auth/login').send({
        correo: 'carlos.mendoza@gmail.com',
        password: 'Password_123'
      });

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('message', '¡Login exitoso!');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toMatchObject({
        id: 2,
        nombre: 'Carlos Mendoza López',
        correo: 'carlos.mendoza@gmail.com',
        rol: 'user'
      });
    });

    test('Debe rechazar credenciales vacías o correo inválido (400 Bad Request)', async () => {
      const response = await request(app).post('/api/auth/login').send({
        correo: 'correo-invalido',
        password: ''
      });

      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty('errors');
    });

    test('Debe rechazar cuando el usuario no existe (401 Unauthorized)', async () => {
      jest.spyOn(usuarioModel, 'findByCorreo').mockResolvedValue(null);

      const response = await request(app).post('/api/auth/login').send({
        correo: 'noexiste@fitnessy.com',
        password: 'Password_123'
      });

      expect(response.statusCode).toBe(401);
      expect(response.body).toHaveProperty('message', 'Credenciales inválidas.');
    });

    test('Debe rechazar cuando la contraseña es incorrecta (401 Unauthorized)', async () => {
      const passwordHash = await bcrypt.hash('Password_123', 10);
      jest.spyOn(usuarioModel, 'findByCorreo').mockResolvedValue({
        id_usuario: 2,
        nombre: 'Carlos',
        apellido_paterno: 'Mendoza',
        correo: 'carlos.mendoza@gmail.com',
        password: passwordHash,
        rol: 'user',
        id_atleta: 2
      });

      const response = await request(app).post('/api/auth/login').send({
        correo: 'carlos.mendoza@gmail.com',
        password: 'Password_Incorrecto'
      });

      expect(response.statusCode).toBe(401);
      expect(response.body).toHaveProperty('message', 'Credenciales inválidas.');
    });

    test('Debe manejar errores internos de base de datos (500 Internal Server Error)', async () => {
      jest
        .spyOn(usuarioModel, 'findByCorreo')
        .mockRejectedValue(new Error('DB error'));

      const response = await request(app).post('/api/auth/login').send({
        correo: 'carlos.mendoza@gmail.com',
        password: 'Password_123'
      });

      expect(response.statusCode).toBe(500);
    });
  });

  describe('POST /api/auth/register', () => {
    const validRegisterPayload = {
      nombre: 'Alejandro',
      apellido_paterno: 'Gómez',
      apellido_materno: 'Silva',
      correo: 'alejandro.gomez@gmail.com',
      password: 'Password_123',
      edad: 26,
      peso_corporal: 82.5,
      pais: 'México'
    };

    test('Debe registrar un nuevo atleta exitosamente (201 Created)', async () => {
      jest.spyOn(usuarioModel, 'findByCorreo').mockResolvedValue(null);
      jest
        .spyOn(usuarioModel, 'registerAtleta')
        .mockResolvedValue({ id_usuario: 5, id_atleta: 5 });

      const response = await request(app)
        .post('/api/auth/register')
        .send(validRegisterPayload);

      expect(response.statusCode).toBe(201);
      expect(response.body).toHaveProperty('message', '¡Registro exitoso!');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toMatchObject({
        id: 5,
        id_atleta: 5,
        nombre: 'Alejandro Gómez Silva',
        correo: 'alejandro.gomez@gmail.com',
        rol: 'user',
        edad: 26,
        peso_corporal: 82.5,
        pais: 'México'
      });
    });

    test('Debe devolver 409 Conflict si el correo ya está registrado', async () => {
      jest.spyOn(usuarioModel, 'findByCorreo').mockResolvedValue({
        id_usuario: 2,
        correo: 'alejandro.gomez@gmail.com'
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send(validRegisterPayload);

      expect(response.statusCode).toBe(409);
      expect(response.body).toHaveProperty(
        'message',
        'El correo electrónico ya se encuentra registrado.'
      );
    });

    test('Debe validar campos obligatorios y rangos de edad/peso (400 Bad Request)', async () => {
      const response = await request(app).post('/api/auth/register').send({
        nombre: '',
        apellido_paterno: '',
        correo: 'no-es-correo',
        password: '123',
        edad: 8,
        peso_corporal: -5,
        pais: ''
      });

      expect(response.statusCode).toBe(400);
      expect(response.body.errors.length).toBeGreaterThanOrEqual(5);
    });

    test('Debe manejar error de transacción en el registro (500 Internal Server Error)', async () => {
      jest.spyOn(usuarioModel, 'findByCorreo').mockResolvedValue(null);
      jest
        .spyOn(usuarioModel, 'registerAtleta')
        .mockRejectedValue(new Error('Transaction rollback'));

      const response = await request(app)
        .post('/api/auth/register')
        .send(validRegisterPayload);

      expect(response.statusCode).toBe(500);
    });
  });

  describe('GET /api/auth/me', () => {
    test('Debe retornar el perfil del usuario autenticado con token válido (200 OK)', async () => {
      const token = jwt.sign(
        { id: 2, rol: 'user', id_atleta: 2 },
        JWT_SECRET,
        { expiresIn: '1h' }
      );

      jest.spyOn(usuarioModel, 'findById').mockResolvedValue({
        id_usuario: 2,
        nombre: 'Carlos',
        apellido_paterno: 'Mendoza',
        apellido_materno: 'López',
        correo: 'carlos.mendoza@gmail.com',
        rol: 'user',
        id_atleta: 2,
        edad: 25,
        peso_corporal: '88.00',
        pais: 'México'
      });

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.user).toMatchObject({
        id: 2,
        id_atleta: 2,
        nombre: 'Carlos Mendoza López',
        correo: 'carlos.mendoza@gmail.com',
        rol: 'user',
        edad: 25,
        peso_corporal: 88,
        pais: 'México'
      });
    });

    test('Debe responder 401 si no se envía cabecera Authorization', async () => {
      const response = await request(app).get('/api/auth/me');
      expect(response.statusCode).toBe(401);
    });

    test('Debe responder 401 si el token es inválido o malformado', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer token.falso.invalido');
      expect(response.statusCode).toBe(401);
    });

    test('Debe responder 404 si el usuario del token ya no existe en BD', async () => {
      const token = jwt.sign(
        { id: 999, rol: 'user', id_atleta: 999 },
        JWT_SECRET,
        { expiresIn: '1h' }
      );
      jest.spyOn(usuarioModel, 'findById').mockResolvedValue(null);

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.statusCode).toBe(404);
    });
  });
});
