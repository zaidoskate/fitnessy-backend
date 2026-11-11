const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

/**
 * Middleware para capturar y formatear errores de express-validator
 */
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Errores de validación en la petición',
      errors: errors.array()
    });
  }
  next();
};

/**
 * Middleware para verificar el token JWT en el header Authorization: Bearer <token>
 */
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      message: 'Acceso denegado. Token no proporcionado o formato inválido.'
    });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'fitnessy_secret_jwt_key_2026'
    );
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      message: 'Token inválido o expirado.'
    });
  }
};

/**
 * Middleware RBAC para autorizar según roles permitidos ('admin', 'user')
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.rol)) {
      return res.status(403).json({
        message: 'No tienes permisos suficientes para realizar esta acción.'
      });
    }
    next();
  };
};

module.exports = {
  validateRequest,
  verifyToken,
  requireRole
};

