const pool = require('../src/config/db');
const usuarioModel = require('../src/models/usuarioModel');
const categoriaModel = require('../src/models/categoriaModel');
const recordModel = require('../src/models/recordModel');

describe('Pruebas Unitarias Puras de la Capa de Acceso a Datos (Models / DAO)', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  describe('usuarioModel (DAO)', () => {
    test('findByCorreo debe ejecutar consulta parametrizada y retornar el usuario', async () => {
      const mockRow = { id_usuario: 1, correo: 'zaid.admin@fitnessy.com', rol: 'admin' };
      const spy = jest.spyOn(pool, 'execute').mockResolvedValue([[mockRow]]);

      const result = await usuarioModel.findByCorreo('zaid.admin@fitnessy.com');
      expect(spy).toHaveBeenCalledWith(expect.any(String), ['zaid.admin@fitnessy.com']);
      expect(result).toEqual(mockRow);
    });

    test('findById debe retornar null cuando no hay coincidencias', async () => {
      jest.spyOn(pool, 'execute').mockResolvedValue([[]]);

      const result = await usuarioModel.findById(999);
      expect(result).toBeNull();
    });

    test('registerAtleta debe ejecutar beginTransaction, insertar en Usuario y Atleta, y hacer commit', async () => {
      const mockConnection = {
        beginTransaction: jest.fn().mockResolvedValue(),
        execute: jest
          .fn()
          .mockResolvedValueOnce([{ insertId: 10 }])
          .mockResolvedValueOnce([{ insertId: 15 }]),
        commit: jest.fn().mockResolvedValue(),
        rollback: jest.fn().mockResolvedValue(),
        release: jest.fn()
      };
      jest.spyOn(pool, 'getConnection').mockResolvedValue(mockConnection);

      const result = await usuarioModel.registerAtleta({
        nombre: 'Luis',
        apellido_paterno: 'Pérez',
        apellido_materno: 'Gómez',
        correo: 'luis@fitnessy.com',
        passwordHash: 'hashed_pw',
        edad: 24,
        peso_corporal: 75,
        pais: 'México'
      });

      expect(mockConnection.beginTransaction).toHaveBeenCalledTimes(1);
      expect(mockConnection.execute).toHaveBeenCalledTimes(2);
      expect(mockConnection.commit).toHaveBeenCalledTimes(1);
      expect(mockConnection.release).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ id_usuario: 10, id_atleta: 15 });
    });

    test('registerAtleta debe ejecutar rollback y liberar conexión si ocurre un error SQL', async () => {
      const mockConnection = {
        beginTransaction: jest.fn().mockResolvedValue(),
        execute: jest.fn().mockRejectedValue(new Error('SQL Failure')),
        commit: jest.fn(),
        rollback: jest.fn().mockResolvedValue(),
        release: jest.fn()
      };
      jest.spyOn(pool, 'getConnection').mockResolvedValue(mockConnection);

      await expect(
        usuarioModel.registerAtleta({
          nombre: 'Luis',
          apellido_paterno: 'Pérez',
          correo: 'luis@fitnessy.com',
          passwordHash: 'hashed_pw',
          edad: 24,
          peso_corporal: 75,
          pais: 'México'
        })
      ).rejects.toThrow('SQL Failure');

      expect(mockConnection.rollback).toHaveBeenCalledTimes(1);
      expect(mockConnection.release).toHaveBeenCalledTimes(1);
    });
  });

  describe('categoriaModel (DAO)', () => {
    test('findAll, findById, create, update y remove deben ejecutar sus consultas parametrizadas', async () => {
      const executeSpy = jest.spyOn(pool, 'execute');

      executeSpy.mockResolvedValueOnce([[{ id_categoria: 1, nombre: 'Sentadilla' }]]);
      const all = await categoriaModel.findAll();
      expect(all).toHaveLength(1);

      executeSpy.mockResolvedValueOnce([[{ id_categoria: 1, nombre: 'Sentadilla' }]]);
      const one = await categoriaModel.findById(1);
      expect(one.id_categoria).toBe(1);

      executeSpy.mockResolvedValueOnce([{ insertId: 7 }]);
      const created = await categoriaModel.create({
        nombre: 'Remo con Barra',
        grupo_muscular: 'Espalda',
        descripcion: 'Tracción horizontal'
      });
      expect(created.id_categoria).toBe(7);

      executeSpy.mockResolvedValueOnce([{ affectedRows: 1 }]);
      const updated = await categoriaModel.update(7, {
        nombre: 'Remo Pendlay',
        grupo_muscular: 'Espalda',
        descripcion: 'Remo estricto desde el suelo'
      });
      expect(updated).toBe(true);

      executeSpy.mockResolvedValueOnce([{ affectedRows: 1 }]);
      const removed = await categoriaModel.remove(7);
      expect(removed).toBe(true);
    });
  });

  describe('recordModel (DAO)', () => {
    test('findAll debe construir filtros dinámicos parametrizados y normalizar tipos numéricos/booleanos', async () => {
      jest.spyOn(pool, 'execute').mockResolvedValueOnce([[{ total: 1 }]]);
      jest.spyOn(pool, 'query').mockResolvedValueOnce([
        [
          {
            id_record: 1,
            peso_levantado: '195.00',
            repeticiones: '1',
            peso_corporal: '88.00',
            es_oficial: 1
          }
        ]
      ]);

      const result = await recordModel.findAll({
        id_categoria: 1,
        es_oficial: 'true',
        search: 'Carlos',
        limit: 6,
        offset: 0
      });

      expect(result.total).toBe(1);
      expect(result.records[0].peso_levantado).toBe(195);
      expect(result.records[0].es_oficial).toBe(true);
    });

    test('findTop3, getStats, create, update, updateStatus y remove deben operar correctamente', async () => {
      const executeSpy = jest.spyOn(pool, 'execute');

      // findTop3
      executeSpy.mockResolvedValueOnce([
        [{ id_record: 1, peso_levantado: '195.00', repeticiones: 1, es_oficial: 1 }]
      ]);
      const top = await recordModel.findTop3();
      expect(top[0].peso_levantado).toBe(195);

      // getStats
      executeSpy.mockResolvedValueOnce([
        [{ total_records_oficiales: '5', total_atletas: '4', total_categorias: '5' }]
      ]);
      const stats = await recordModel.getStats();
      expect(stats).toEqual({
        total_records_oficiales: 5,
        total_atletas: 4,
        total_categorias: 5
      });

      // create (insert + findById)
      executeSpy
        .mockResolvedValueOnce([{ insertId: 10 }])
        .mockResolvedValueOnce([
          [{ id_record: 10, peso_levantado: '150.00', repeticiones: 3, es_oficial: 0 }]
        ]);
      const created = await recordModel.create({
        id_categoria: 2,
        id_atleta: 2,
        peso_levantado: 150,
        repeticiones: 3,
        fecha: '2026-11-11',
        es_oficial: false
      });
      expect(created.id_record).toBe(10);
      expect(created.es_oficial).toBe(false);

      // update (update + findById)
      executeSpy
        .mockResolvedValueOnce([{ affectedRows: 1 }])
        .mockResolvedValueOnce([
          [{ id_record: 10, peso_levantado: '155.00', repeticiones: 3, es_oficial: 1 }]
        ]);
      const updated = await recordModel.update(10, {
        id_categoria: 2,
        peso_levantado: 155,
        repeticiones: 3,
        fecha: '2026-11-11',
        es_oficial: true
      });
      expect(updated.peso_levantado).toBe(155);

      // updateStatus (update + findById)
      executeSpy
        .mockResolvedValueOnce([{ affectedRows: 1 }])
        .mockResolvedValueOnce([
          [{ id_record: 10, peso_levantado: '155.00', repeticiones: 3, es_oficial: 1 }]
        ]);
      const statusUpdated = await recordModel.updateStatus(10, true);
      expect(statusUpdated.es_oficial).toBe(true);

      // remove
      executeSpy.mockResolvedValueOnce([{ affectedRows: 1 }]);
      const removed = await recordModel.remove(10);
      expect(removed).toBe(true);
    });
  });
});

