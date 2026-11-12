DROP DATABASE IF EXISTS fitnessy_db;
CREATE DATABASE fitnessy_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE fitnessy_db;

CREATE TABLE RolUsuario (
    id_rol INT AUTO_INCREMENT PRIMARY KEY,
    nombre_rol VARCHAR(30) NOT NULL UNIQUE,
    descripcion_rol VARCHAR(150) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE Usuario (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    id_rol INT NOT NULL,
    nombre VARCHAR(60) NOT NULL,
    apellido_paterno VARCHAR(60) NOT NULL,
    apellido_materno VARCHAR(60) DEFAULT NULL,
    correo VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    CONSTRAINT fk_usuario_rol FOREIGN KEY (id_rol)
        REFERENCES RolUsuario(id_rol)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE Atleta (
    id_atleta INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL UNIQUE,
    edad INT NOT NULL CHECK (edad >= 12 AND edad <= 100),
    peso_corporal DECIMAL(5,2) NOT NULL,
    pais VARCHAR(60) NOT NULL,
    CONSTRAINT fk_atleta_usuario FOREIGN KEY (id_usuario)
        REFERENCES Usuario(id_usuario)
        ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE CategoriaEjercicio (
    id_categoria INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(80) NOT NULL UNIQUE,
    grupo_muscular VARCHAR(60) NOT NULL,
    descripcion VARCHAR(255) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE RecordFitness (
    id_record INT AUTO_INCREMENT PRIMARY KEY,
    id_categoria INT NOT NULL,
    id_atleta INT NOT NULL,
    peso_levantado DECIMAL(6,2) NOT NULL,
    repeticiones INT NOT NULL DEFAULT 1,
    fecha DATE NOT NULL,
    es_oficial BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_record_categoria FOREIGN KEY (id_categoria)
        REFERENCES CategoriaEjercicio(id_categoria)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_record_atleta FOREIGN KEY (id_atleta)
        REFERENCES Atleta(id_atleta)
        ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE USER IF NOT EXISTS 'fitnessy_db_user'@'localhost' IDENTIFIED BY 'Password_123';
GRANT SELECT, INSERT, UPDATE, DELETE ON fitnessy_db.* TO 'fitnessy_db_user'@'localhost';
FLUSH PRIVILEGES;

-- Contraseña en texto plano para todas las cuentas de prueba: Password_123
INSERT INTO RolUsuario (nombre_rol, descripcion_rol) VALUES
('admin', 'Valida y aprueba récords de usuarios para el salón de la fama y gestiona categorías'),
('user', 'Atleta que registra, edita y elimina sus propios récords de levantamiento');

INSERT INTO Usuario (id_rol, nombre, apellido_paterno, apellido_materno, correo, password) VALUES
(1, 'Zaid Alexis', 'Vázquez', 'Ramírez', 'zaid.admin@fitnessy.com', '$2b$10$7VZqkiCdCJy6WVWg3pusEOReoNl6JJNouL2ukoQHg8zwu80Ue.7Ja'),
(2, 'Carlos', 'Mendoza', 'López', 'carlos.mendoza@gmail.com', '$2b$10$7VZqkiCdCJy6WVWg3pusEOReoNl6JJNouL2ukoQHg8zwu80Ue.7Ja'),
(2, 'Sofía', 'Villarreal', 'Torres', 'sofia.fit@gmail.com', '$2b$10$7VZqkiCdCJy6WVWg3pusEOReoNl6JJNouL2ukoQHg8zwu80Ue.7Ja'),
(2, 'Diego', 'Hernández', 'Ruiz', 'diego.power@gmail.com', '$2b$10$7VZqkiCdCJy6WVWg3pusEOReoNl6JJNouL2ukoQHg8zwu80Ue.7Ja');

INSERT INTO Atleta (id_usuario, edad, peso_corporal, pais) VALUES
(1, 23, 76.50, 'México'),
(2, 25, 88.00, 'México'),
(3, 24, 62.50, 'Colombia'),
(4, 22, 74.00, 'España');

INSERT INTO CategoriaEjercicio (nombre, grupo_muscular, descripcion) VALUES
('Sentadilla Libre', 'Cuádriceps y Glúteo', 'Sentadilla profunda con barra olímpica rompiendo el paralelo.'),
('Press de Banca', 'Pectoral y Tríceps', 'Empuje horizontal en banco plano con pausa reglamentaria en el pecho.'),
('Peso Muerto', 'Cadena Posterior', 'Levantamiento de barra desde el piso hasta bloqueo completo de cadera.'),
('Dominadas en Barra', 'Espalda y Bíceps', 'Tracción vertical en barra fija superando la barbilla con lastre.'),
('Fondos en Barras', 'Pectoral Inferior y Tríceps', 'Empuje vertical en barras paralelas con rango completo de movimiento.');

INSERT INTO RecordFitness (id_categoria, id_atleta, peso_levantado, repeticiones, fecha, es_oficial) VALUES
(1, 2, 195.00, 1, '2026-10-18', TRUE),
(2, 2, 142.50, 1, '2026-10-22', TRUE),
(3, 3, 165.00, 1, '2026-10-28', TRUE),
(4, 4, 45.00, 5, '2026-11-03', TRUE),
(5, 1, 50.00, 6, '2026-11-08', TRUE),
(2, 3, 85.00, 3, '2026-11-09', FALSE);

