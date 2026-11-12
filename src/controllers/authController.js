const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const usuarioModel = require('../models/usuarioModel');

const JWT_SECRET = process.env.JWT_SECRET || 'fitnessy_secret_jwt_key_2026';

const formatNombreCompleto = (usuario) =>
  [usuario.nombre, usuario.apellido_paterno, usuario.apellido_materno]
    .filter(Boolean)
    .join(' ');

const authController = {
  async login(req, res) {
    try {
      const { correo, password } = req.body;

      if (!correo || !password) {
        return res.status(400).json({
          message: 'El correo y la contraseña son obligatorios.'
        });
      }

      const usuario = await usuarioModel.findByCorreo(correo);
      if (!usuario) {
        return res.status(401).json({
          message: 'Credenciales inválidas.'
        });
      }

      const passwordValido = await bcrypt.compare(password, usuario.password);
      if (!passwordValido) {
        return res.status(401).json({
          message: 'Credenciales inválidas.'
        });
      }

      const payload = {
        id: usuario.id_usuario,
        rol: usuario.rol,
        id_atleta: usuario.id_atleta
      };

      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });

      return res.status(200).json({
        message: '¡Login exitoso!',
        token,
        user: {
          id: usuario.id_usuario,
          id_atleta: usuario.id_atleta,
          nombre: formatNombreCompleto(usuario),
          correo: usuario.correo,
          rol: usuario.rol,
          pais: usuario.pais || null,
          peso_corporal: usuario.peso_corporal ? Number(usuario.peso_corporal) : null,
          edad: usuario.edad || null
        }
      });
    } catch (error) {
      console.error('Error en authController.login:', error);
      return res.status(500).json({
        message: 'Error interno del servidor al procesar el inicio de sesión.'
      });
    }
  },

  async register(req, res) {
    try {
      const {
        nombre,
        apellido_paterno,
        apellido_materno,
        correo,
        password,
        edad,
        peso_corporal,
        pais
      } = req.body;

      const existente = await usuarioModel.findByCorreo(correo);
      if (existente) {
        return res.status(409).json({
          message: 'El correo electrónico ya se encuentra registrado.'
        });
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const { id_usuario, id_atleta } = await usuarioModel.registerAtleta({
        nombre,
        apellido_paterno,
        apellido_materno: apellido_materno || null,
        correo,
        passwordHash,
        edad: Number(edad),
        peso_corporal: Number(peso_corporal),
        pais
      });

      const payload = {
        id: id_usuario,
        rol: 'user',
        id_atleta
      };

      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });

      const nombreCompleto = formatNombreCompleto({
        nombre,
        apellido_paterno,
        apellido_materno
      });

      return res.status(201).json({
        message: '¡Registro exitoso!',
        token,
        user: {
          id: id_usuario,
          id_atleta,
          nombre: nombreCompleto,
          correo,
          rol: 'user',
          edad: Number(edad),
          peso_corporal: Number(peso_corporal),
          pais
        }
      });
    } catch (error) {
      console.error('Error en authController.register:', error);
      return res.status(500).json({
        message: 'Error interno del servidor al registrar el usuario.'
      });
    }
  },

  async getMe(req, res) {
    try {
      const usuario = await usuarioModel.findById(req.user.id);
      if (!usuario) {
        return res.status(404).json({
          message: 'Usuario no encontrado.'
        });
      }

      return res.status(200).json({
        user: {
          id: usuario.id_usuario,
          id_atleta: usuario.id_atleta,
          nombre: formatNombreCompleto(usuario),
          nombre_pila: usuario.nombre,
          apellido_paterno: usuario.apellido_paterno,
          apellido_materno: usuario.apellido_materno,
          correo: usuario.correo,
          rol: usuario.rol,
          edad: usuario.edad,
          peso_corporal: usuario.peso_corporal ? Number(usuario.peso_corporal) : null,
          pais: usuario.pais
        }
      });
    } catch (error) {
      console.error('Error en authController.getMe:', error);
      return res.status(500).json({
        message: 'Error interno del servidor al obtener el perfil.'
      });
    }
  }
};

module.exports = authController;
