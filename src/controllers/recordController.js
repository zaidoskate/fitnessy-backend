const recordModel = require('../models/recordModel');
const categoriaModel = require('../models/categoriaModel');

const recordController = {
  /**
   * GET /api/records (Público)
   * Soporta query params: ?id_categoria=&es_oficial=&search=&page=1&limit=6
   */
  async getAll(req, res) {
    try {
      const { id_categoria, es_oficial, search } = req.query;
      const page = Math.max(1, parseInt(req.query.page, 10) || 1);
      const limit = Math.max(1, parseInt(req.query.limit, 10) || 6);
      const offset = (page - 1) * limit;

      const { records, total } = await recordModel.findAll({
        id_categoria,
        es_oficial,
        search,
        limit,
        offset
      });

      const totalPages = Math.ceil(total / limit) || 1;

      return res.status(200).json({
        data: records,
        records,
        total,
        page,
        limit,
        totalPages,
        pagination: {
          total,
          page,
          limit,
          totalPages
        }
      });
    } catch (error) {
      console.error('Error en recordController.getAll:', error);
      return res.status(500).json({
        message: 'Error interno al obtener los récords.'
      });
    }
  },

  /**
   * GET /api/records/top (Público)
   * Devuelve el Top 3 de récords oficiales
   */
  async getTop3(req, res) {
    try {
      const topRecords = await recordModel.findTop3();
      return res.status(200).json(topRecords);
    } catch (error) {
      console.error('Error en recordController.getTop3:', error);
      return res.status(500).json({
        message: 'Error interno al obtener el Top 3 de récords.'
      });
    }
  },

  /**
   * GET /api/records/stats (Público)
   * Devuelve métricas generales de la plataforma
   */
  async getStats(req, res) {
    try {
      const stats = await recordModel.getStats();
      return res.status(200).json(stats);
    } catch (error) {
      console.error('Error en recordController.getStats:', error);
      return res.status(500).json({
        message: 'Error interno al obtener las estadísticas.'
      });
    }
  },

  /**
   * GET /api/records/:id (Público)
   */
  async getById(req, res) {
    try {
      const id = Number(req.params.id);
      const record = await recordModel.findById(id);

      if (!record) {
        return res.status(404).json({
          message: 'Récord no encontrado.'
        });
      }

      return res.status(200).json(record);
    } catch (error) {
      console.error('Error en recordController.getById:', error);
      return res.status(500).json({
        message: 'Error interno al obtener el detalle del récord.'
      });
    }
  },

  /**
   * POST /api/records (Protegido: user y admin)
   */
  async create(req, res) {
    try {
      const {
        id_categoria,
        peso_levantado,
        repeticiones,
        fecha,
        es_oficial,
        id_atleta: bodyIdAtleta
      } = req.body;

      const categoria = await categoriaModel.findById(Number(id_categoria));
      if (!categoria) {
        return res.status(400).json({
          message: 'La categoría de ejercicio especificada no existe.'
        });
      }

      const isAdmin = req.user.rol === 'admin';
      const id_atleta =
        isAdmin && bodyIdAtleta ? Number(bodyIdAtleta) : req.user.id_atleta;

      if (!id_atleta) {
        return res.status(400).json({
          message: 'El usuario no cuenta con un perfil de atleta asociado.'
        });
      }

      const estadoOficial = isAdmin
        ? es_oficial !== undefined
          ? Boolean(es_oficial)
          : true
        : false;

      const nuevoRecord = await recordModel.create({
        id_categoria: Number(id_categoria),
        id_atleta,
        peso_levantado: Number(peso_levantado),
        repeticiones: Number(repeticiones || 1),
        fecha,
        es_oficial: estadoOficial
      });

      return res.status(201).json({
        message: 'Récord registrado exitosamente.',
        record: nuevoRecord
      });
    } catch (error) {
      console.error('Error en recordController.create:', error);
      return res.status(500).json({
        message: 'Error interno al registrar el récord.'
      });
    }
  },

  /**
   * PUT /api/records/:id (Protegido: dueño del récord o admin)
   */
  async update(req, res) {
    try {
      const id = Number(req.params.id);
      const recordActual = await recordModel.findById(id);

      if (!recordActual) {
        return res.status(404).json({
          message: 'Récord no encontrado.'
        });
      }

      const isAdmin = req.user.rol === 'admin';
      if (!isAdmin && Number(recordActual.id_atleta) !== Number(req.user.id_atleta)) {
        return res.status(403).json({
          message: 'No tienes permiso para editar un récord que pertenece a otro atleta.'
        });
      }

      const {
        id_categoria,
        peso_levantado,
        repeticiones,
        fecha,
        es_oficial
      } = req.body;

      const categoria = await categoriaModel.findById(Number(id_categoria));
      if (!categoria) {
        return res.status(400).json({
          message: 'La categoría de ejercicio especificada no existe.'
        });
      }

      // Si es admin puede cambiar es_oficial; si es user se mantiene o reinicia a false para re-validación
      const nuevoEstadoOficial = isAdmin
        ? es_oficial !== undefined
          ? Boolean(es_oficial)
          : recordActual.es_oficial
        : false;

      const recordActualizado = await recordModel.update(id, {
        id_categoria: Number(id_categoria),
        peso_levantado: Number(peso_levantado),
        repeticiones: Number(repeticiones),
        fecha,
        es_oficial: nuevoEstadoOficial
      });

      return res.status(200).json({
        message: 'Récord actualizado exitosamente.',
        record: recordActualizado
      });
    } catch (error) {
      console.error('Error en recordController.update:', error);
      return res.status(500).json({
        message: 'Error interno al actualizar el récord.'
      });
    }
  },

  /**
   * PATCH /api/records/:id/status (Protegido: admin)
   */
  async updateStatus(req, res) {
    try {
      const id = Number(req.params.id);
      const recordActual = await recordModel.findById(id);

      if (!recordActual) {
        return res.status(404).json({
          message: 'Récord no encontrado.'
        });
      }

      const { es_oficial } = req.body;
      const recordActualizado = await recordModel.updateStatus(
        id,
        Boolean(es_oficial)
      );

      return res.status(200).json({
        message: `Estatus del récord actualizado a ${
          recordActualizado.es_oficial ? 'oficial' : 'pendiente'
        }.`,
        record: recordActualizado
      });
    } catch (error) {
      console.error('Error en recordController.updateStatus:', error);
      return res.status(500).json({
        message: 'Error interno al actualizar el estatus del récord.'
      });
    }
  },

  /**
   * DELETE /api/records/:id (Protegido: dueño del récord o admin)
   */
  async remove(req, res) {
    try {
      const id = Number(req.params.id);
      const recordActual = await recordModel.findById(id);

      if (!recordActual) {
        return res.status(404).json({
          message: 'Récord no encontrado.'
        });
      }

      const isAdmin = req.user.rol === 'admin';
      if (!isAdmin && Number(recordActual.id_atleta) !== Number(req.user.id_atleta)) {
        return res.status(403).json({
          message: 'No tienes permiso para eliminar un récord que pertenece a otro atleta.'
        });
      }

      await recordModel.remove(id);

      return res.status(200).json({
        message: 'Récord eliminado exitosamente.'
      });
    } catch (error) {
      console.error('Error en recordController.remove:', error);
      return res.status(500).json({
        message: 'Error interno al eliminar el récord.'
      });
    }
  }
};

module.exports = recordController;

