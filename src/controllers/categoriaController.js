const categoriaModel = require('../models/categoriaModel');

const categoriaController = {
  /**
   * GET /api/categorias (Público)
   */
  async getAll(req, res) {
    try {
      const categorias = await categoriaModel.findAll();
      return res.status(200).json(categorias);
    } catch (error) {
      console.error('Error en categoriaController.getAll:', error);
      return res.status(500).json({
        message: 'Error interno al obtener las categorías de ejercicio.'
      });
    }
  },

  /**
   * GET /api/categorias/:id (Público)
   */
  async getById(req, res) {
    try {
      const id = Number(req.params.id);
      const categoria = await categoriaModel.findById(id);
      if (!categoria) {
        return res.status(404).json({
          message: 'Categoría de ejercicio no encontrada.'
        });
      }
      return res.status(200).json(categoria);
    } catch (error) {
      console.error('Error en categoriaController.getById:', error);
      return res.status(500).json({
        message: 'Error interno al obtener la categoría.'
      });
    }
  },

  /**
   * POST /api/categorias (Protegido: admin)
   */
  async create(req, res) {
    try {
      const { nombre, grupo_muscular, descripcion } = req.body;
      const nuevaCategoria = await categoriaModel.create({
        nombre,
        grupo_muscular,
        descripcion
      });

      return res.status(201).json({
        message: 'Categoría creada exitosamente.',
        categoria: nuevaCategoria
      });
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({
          message: 'Ya existe una categoría con ese nombre.'
        });
      }
      console.error('Error en categoriaController.create:', error);
      return res.status(500).json({
        message: 'Error interno al crear la categoría de ejercicio.'
      });
    }
  },

  /**
   * PUT /api/categorias/:id (Protegido: admin)
   */
  async update(req, res) {
    try {
      const id = Number(req.params.id);
      const existente = await categoriaModel.findById(id);
      if (!existente) {
        return res.status(404).json({
          message: 'Categoría de ejercicio no encontrada.'
        });
      }

      const { nombre, grupo_muscular, descripcion } = req.body;
      await categoriaModel.update(id, {
        nombre,
        grupo_muscular,
        descripcion
      });

      const categoriaActualizada = await categoriaModel.findById(id);
      return res.status(200).json({
        message: 'Categoría actualizada exitosamente.',
        categoria: categoriaActualizada
      });
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({
          message: 'Ya existe otra categoría con ese nombre.'
        });
      }
      console.error('Error en categoriaController.update:', error);
      return res.status(500).json({
        message: 'Error interno al actualizar la categoría de ejercicio.'
      });
    }
  },

  /**
   * DELETE /api/categorias/:id (Protegido: admin)
   */
  async remove(req, res) {
    try {
      const id = Number(req.params.id);
      const existente = await categoriaModel.findById(id);
      if (!existente) {
        return res.status(404).json({
          message: 'Categoría de ejercicio no encontrada.'
        });
      }

      await categoriaModel.remove(id);
      return res.status(200).json({
        message: 'Categoría eliminada exitosamente.'
      });
    } catch (error) {
      if (
        error.code === 'ER_ROW_IS_REFERENCED_2' ||
        error.code === 'ER_ROW_IS_REFERENCED' ||
        error.errno === 1451
      ) {
        return res.status(400).json({
          message:
            'No se puede eliminar esta categoría porque tiene récords fitness asociados.'
        });
      }
      console.error('Error en categoriaController.remove:', error);
      return res.status(500).json({
        message: 'Error interno al eliminar la categoría de ejercicio.'
      });
    }
  }
};

module.exports = categoriaController;

