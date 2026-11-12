# Fitnessy Backend — API RESTful

API RESTful desarrollada para la plataforma **Fitnessy**, una plataforma web para el registro, consulta y validación de récords de levantamientos de fuerza.

El backend está construido bajo una **Arquitectura Cliente-Servidor Desacoplada** en **4 Capas**, implementando patrones de diseño empresariales y una base de datos relacional normalizada en **Tercera Forma Normal (3NF)** en MySQL.

Puedes acceder a la versión desplegada en: [Fitnessy](https://fitnessy-frontend.vercel.app/)
---

## Tecnologías y Dependencias

- **Entorno de ejecución:** Node.js (v18 o superior recomendado)
- **Framework Web:** Express.js (v5)
- **Base de Datos:** MySQL (v8.0+)
- **Acceso a Datos:** `mysql2/promise` (Connection Pool)
- **Seguridad y Criptografía:** `bcryptjs`, `jsonwebtoken` (JWT), `helmet`, `cors`
- **Validación de Entradas:** `express-validator`
- **Variables de Entorno:** `dotenv`
- **Testing y Calidad:** `jest`, `supertest`

---

## Arquitectura del Sistema

El proyecto sigue una estricta **arquitectura en 4 capas** desacoplada:

1. **Capa de Enrutamiento (`src/routes/`):** Define endpoints HTTP, valida payloads con `express-validator` y delega a controladores.
2. **Capa de Middleware (`src/middlewares/`):** Seguridad perimetral, verificación de tokens JWT, control de acceso basado en roles (**RBAC**: `admin` vs `user`) y captura de errores de validación.
3. **Capa de Controladores (`src/controllers/`):** Orquestación lógica de solicitudes y respuestas HTTP, códigos de estado REST y formateo JSON.
4. **Capa de Acceso a Datos / DAO (`src/models/`):** Abstracción de base de datos con patrón DAO/Repository y consultas SQL 100% parametrizadas (`?`) para evitar inyecciones SQL.

### Patrones de Diseño Implementados
- **Singleton:** Conexión única mediante Connection Pool en [`src/config/db.js`](src/config/db.js).
- **Repository / DAO:** Acceso a datos aislado por entidad en [`src/models/`](src/models/).
- **Role-Based Access Control (RBAC):** Restricciones de privilegios según rol (`admin`, `user` o público).

---

## Requisitos Previos

Antes de configurar el proyecto localmente, asegúrate de contar con:

- [Node.js](https://nodejs.org/) (versión 18.x, 20.x o superior)
- [npm](https://www.npmjs.com/) (incluido con Node.js)
- [MySQL Server](https://dev.mysql.com/downloads/mysql/) (versión 8.0 o superior)
- [Git](https://git-scm.com/)

---

## Instalación y Configuración Local

### 1. Clonar el repositorio

```bash
git clone https://github.com/zaidoskate/fitnessy-backend.git
cd fitnessy-backend
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configuración de Base de Datos (MySQL)

Ejecuta el script SQL incluido en el repositorio para inicializar la base de datos `fitnessy_db` en 3NF, crear el usuario con permisos específicos y cargar los datos semilla (seed data):

```bash
mysql -u root -p < database/script.sql
```

> **Nota:** El script crea las tablas `RolUsuario`, `Usuario`, `Atleta`, `CategoriaEjercicio` y `RecordFitness`, junto con usuarios y récords de prueba.

### 4. Variables de Entorno

Copia el archivo de ejemplo `.env.example` como `.env`:

```bash
cp .env.example .env
```

Configura tus credenciales locales en el archivo `.env`:

```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=fitnessy_db_user
DB_PASSWORD=Password_123
DB_DATABASE=fitnessy_db
JWT_SECRET=fitnessy_secret_jwt_key_2026
```

---

## Comandos de Ejecución

| Comando | Descripción |
| :--- | :--- |
| `npm run dev` | Inicia el servidor en modo desarrollo con recarga automática (`node --watch`). |
| `npm start` | Inicia el servidor en modo producción (`node src/server.js`). |
| `npm test` | Ejecuta la suite completa de pruebas unitarias y de integración (`jest --runInBand`). |
| `npm run seed` | Sincroniza o actualiza contraseñas de prueba en base de datos. |

El servidor estará disponible por defecto en: `http://localhost:5000`

---

## Pruebas Automatizadas

El proyecto cuenta con suites de pruebas unitarias y de integración desarrolladas con **Jest** y **Supertest**, cubriendo:

- Pruebas unitarias puras de modelos DAO con mocks del Connection Pool (`tests/models.unit.test.js`).
- Pruebas de integración de autenticación, JWT y registro con transacciones (`tests/auth.test.js`).
- Pruebas de CRUD de categorías y restricciones de integridad referencial (`tests/categorias.test.js`).
- Pruebas de CRUD de récords, paginación, filtros y control de propiedad/RBAC (`tests/records.test.js`).

Para ejecutar todas las pruebas:

```bash
npm test
```

---

## Resumen de Endpoints de la API

### Autenticación (`/api/auth`)
- `POST /api/auth/register` — Registro de nuevo atleta (Público).
- `POST /api/auth/login` — Autenticación y obtención de token JWT (Público).
- `GET /api/auth/me` — Consulta del perfil del usuario autenticado (Requiere Token).

### Categorías de Ejercicio (`/api/categorias`)
- `GET /api/categorias` — Listar todas las categorías (Público).
- `GET /api/categorias/:id` — Detalle de una categoría por ID (Público).
- `POST /api/categorias` — Crear nueva categoría (Admin).
- `PUT /api/categorias/:id` — Actualizar categoría (Admin).
- `DELETE /api/categorias/:id` — Eliminar categoría (Admin).

### Récords Fitness (`/api/records`)
- `GET /api/records` — Feed de récords con filtros (`id_categoria`, `es_oficial`, `search`) y paginación (`page`, `limit`) (Público).
- `GET /api/records/top` — Top 3 récords oficiales del Salón de la Fama (Público).
- `GET /api/records/stats` — Estadísticas globales de la plataforma (Público).
- `GET /api/records/:id` — Detalle de un récord por ID (Público).
- `POST /api/records` — Registrar nuevo levantamiento (Atleta / Admin).
- `PUT /api/records/:id` — Editar récord (Dueño del récord o Admin).
- `PATCH /api/records/:id/status` — Validar / aprobar récord oficial para Salón de la Fama (Admin).
- `DELETE /api/records/:id` — Eliminar récord (Dueño del récord o Admin).

---

## Colección de Postman

Dentro de la carpeta [`docs/Fitnessy_API.postman_collection.json`](docs/Fitnessy_API.postman_collection.json) se encuentra la colección en formato Postman v2.1 organizada en carpetas, con variables y ejemplos de payloads listos para importar y probar.
