const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { validateRequest, verifyToken } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post(
  '/login',
  [
    body('correo')
      .trim()
      .notEmpty()
      .withMessage('El correo electrónico es obligatorio.')
      .isEmail()
      .withMessage('Debe proporcionar un correo electrónico válido.'),
    body('password')
      .notEmpty()
      .withMessage('La contraseña es obligatoria.')
  ],
  validateRequest,
  authController.login
);

router.post(
  '/register',
  [
    body('nombre')
      .trim()
      .notEmpty()
      .withMessage('El nombre es obligatorio.')
      .isLength({ max: 60 })
      .withMessage('El nombre no debe exceder 60 caracteres.'),
    body('apellido_paterno')
      .trim()
      .notEmpty()
      .withMessage('El apellido paterno es obligatorio.')
      .isLength({ max: 60 })
      .withMessage('El apellido paterno no debe exceder 60 caracteres.'),
    body('apellido_materno')
      .optional({ values: 'falsy' })
      .trim()
      .isLength({ max: 60 })
      .withMessage('El apellido materno no debe exceder 60 caracteres.'),
    body('correo')
      .trim()
      .notEmpty()
      .withMessage('El correo electrónico es obligatorio.')
      .isEmail()
      .withMessage('Debe proporcionar un correo electrónico válido.'),
    body('password')
      .notEmpty()
      .withMessage('La contraseña es obligatoria.')
      .isLength({ min: 6 })
      .withMessage('La contraseña debe tener al menos 6 caracteres.'),
    body('edad')
      .notEmpty()
      .withMessage('La edad es obligatoria.')
      .isInt({ min: 12, max: 100 })
      .withMessage('La edad debe ser un número entero entre 12 y 100 años.'),
    body('peso_corporal')
      .notEmpty()
      .withMessage('El peso corporal es obligatorio.')
      .isFloat({ gt: 0, max: 400 })
      .withMessage('El peso corporal debe ser un número mayor a 0.'),
    body('pais')
      .trim()
      .notEmpty()
      .withMessage('El país es obligatorio.')
      .isLength({ max: 60 })
      .withMessage('El país no debe exceder 60 caracteres.')
  ],
  validateRequest,
  authController.register
);

router.get('/me', verifyToken, authController.getMe);

module.exports = router;
