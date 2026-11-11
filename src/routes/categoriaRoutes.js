const express = require('express');
const { body, param } = require('express-validator');
const categoriaController = require('../controllers/categoriaController');
const {
  verifyToken,
  requireRole,
  validateRequest
} = require('../middlewares/authMiddleware');

const router = express.Router();

const categoriaValidation = [
  body('nombre')
    .trim()
    .notEmpty()
    .withMessage('El nombre de la categoría es obligatorio.')
    .isLength({ max: 80 })
    .withMessage('El nombre no debe exceder 80 caracteres.'),
  body('grupo_muscular')
    .trim()
    .notEmpty()
    .withMessage('El grupo muscular es obligatorio.')
    .isLength({ max: 60 })
    .withMessage('El grupo muscular no debe exceder 60 caracteres.'),
  body('descripcion')
    .trim()
    .notEmpty()
    .withMessage('La descripción es obligatoria.')
    .isLength({ max: 255 })
    .withMessage('La descripción no debe exceder 255 caracteres.')
];

router.get('/', categoriaController.getAll);

router.get(
  '/:id',
  [param('id').isInt({ gt: 0 }).withMessage('ID de categoría inválido.')],
  validateRequest,
  categoriaController.getById
);

router.post(
  '/',
  verifyToken,
  requireRole('admin'),
  categoriaValidation,
  validateRequest,
  categoriaController.create
);

router.put(
  '/:id',
  verifyToken,
  requireRole('admin'),
  [
    param('id').isInt({ gt: 0 }).withMessage('ID de categoría inválido.'),
    ...categoriaValidation
  ],
  validateRequest,
  categoriaController.update
);

router.delete(
  '/:id',
  verifyToken,
  requireRole('admin'),
  [param('id').isInt({ gt: 0 }).withMessage('ID de categoría inválido.')],
  validateRequest,
  categoriaController.remove
);

module.exports = router;

