const express = require('express');
const { body, param } = require('express-validator');
const recordController = require('../controllers/recordController');
const {
  verifyToken,
  requireRole,
  validateRequest
} = require('../middlewares/authMiddleware');

const router = express.Router();

const recordValidation = [
  body('id_categoria')
    .notEmpty()
    .withMessage('La categoría de ejercicio es obligatoria.')
    .isInt({ gt: 0 })
    .withMessage('El ID de categoría debe ser un entero positivo.'),
  body('peso_levantado')
    .notEmpty()
    .withMessage('El peso levantado es obligatorio.')
    .isFloat({ gt: 0, max: 1500 })
    .withMessage('El peso levantado debe ser un número mayor a 0.'),
  body('repeticiones')
    .notEmpty()
    .withMessage('El número de repeticiones es obligatorio.')
    .isInt({ min: 1, max: 500 })
    .withMessage('Las repeticiones deben ser un número entero mayor o igual a 1.'),
  body('fecha')
    .notEmpty()
    .withMessage('La fecha del levantamiento es obligatoria.')
    .isISO8601()
    .withMessage('La fecha debe tener un formato válido (YYYY-MM-DD).')
];

// Endpoints públicos de consulta
router.get('/', recordController.getAll);
router.get('/top', recordController.getTop3);
router.get('/stats', recordController.getStats);

router.get(
  '/:id',
  [param('id').isInt({ gt: 0 }).withMessage('ID de récord inválido.')],
  validateRequest,
  recordController.getById
);

// Endpoints protegidos de escritura (CRUD + RBAC)
router.post(
  '/',
  verifyToken,
  recordValidation,
  validateRequest,
  recordController.create
);

router.put(
  '/:id',
  verifyToken,
  [
    param('id').isInt({ gt: 0 }).withMessage('ID de récord inválido.'),
    ...recordValidation
  ],
  validateRequest,
  recordController.update
);

router.patch(
  '/:id/status',
  verifyToken,
  requireRole('admin'),
  [
    param('id').isInt({ gt: 0 }).withMessage('ID de récord inválido.'),
    body('es_oficial')
      .isBoolean()
      .withMessage('El campo es_oficial debe ser un valor booleano (true o false).')
  ],
  validateRequest,
  recordController.updateStatus
);

router.delete(
  '/:id',
  verifyToken,
  [param('id').isInt({ gt: 0 }).withMessage('ID de récord inválido.')],
  validateRequest,
  recordController.remove
);

module.exports = router;

