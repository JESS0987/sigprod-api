# SIGPROD API 🚀

**Sistema Integral de Gestión de Producción de Software**  
TechSoft Solutions S.A.S. — Bucaramanga, Santander, Colombia

---

## 📋 Descripción

API REST construida con **NestJS + MongoDB Atlas**, lista para desplegar en **Railway** en menos de 5 minutos.

### Módulos disponibles (9 roles del SDLC):
| Módulo | Rol | Endpoints |
|--------|-----|-----------|
| Auth | Todos | `POST /api/auth/login`, `POST /api/auth/register` |
| Users | Admin | `CRUD /api/users` |
| Projects | Todos | `CRUD /api/projects` |
| Sprints | Scrum Master | `CRUD /api/sprints` + riesgos + standups |
| Backlog | Product Owner | `CRUD /api/backlog` |
| Requirements | Business Analyst | `CRUD /api/requirements` |
| Architecture | Arquitecto | `CRUD /api/architecture` |
| Design | UI/UX Designer | `CRUD /api/design` |
| QA | QA Engineer | `CRUD /api/qa/test-cases` + `/api/qa/defects` + reporte |
| DevOps | DevOps Engineer | `CRUD /api/devops/pipelines` + `/api/devops/deployments` |

---

## 🚀 Despliegue en Railway (< 5 minutos)

### Paso 1 – Subir a GitHub
```bash
git init
git add .
git commit -m "feat: SIGPROD API inicial"
git remote add origin https://github.com/TU_USUARIO/sigprod-api.git
git push -u origin main
```

### Paso 2 – Crear proyecto en Railway
1. Ir a [railway.app](https://railway.app) → **New Project**
2. Seleccionar **Deploy from GitHub repo**
3. Elegir el repositorio `sigprod-api`
4. Railway detecta automáticamente el `Dockerfile`

### Paso 3 – Variables de entorno en Railway
En el panel de tu servicio → **Variables** → agregar:

```
MONGODB_URI=mongodb+srv://USER:PASS@cluster.mongodb.net/sigprod?retryWrites=true&w=majority
JWT_SECRET=tu_clave_secreta_super_segura_aqui_min_32_chars
JWT_EXPIRES_IN=7d
NODE_ENV=production
PORT=3000
```

> 💡 **MongoDB Atlas gratis**: [mongodb.com/atlas](https://www.mongodb.com/atlas) → Free Tier M0

### Paso 4 – Verificar despliegue
```
GET https://TU-APP.railway.app/api/health
```

---

## 📚 Documentación Swagger

```
https://TU-APP.railway.app/api/docs
```

---

## 🛠️ Desarrollo local

```bash
# Instalar dependencias
npm install

# Crear archivo .env (copiar de .env.example)
cp .env.example .env
# Editar .env con tus credenciales

# Ejecutar en modo desarrollo
npm run start:dev

# Swagger local
http://localhost:3000/api/docs
```

---

## 🔐 Autenticación

1. `POST /api/auth/register` — crear primer usuario admin
2. `POST /api/auth/login` — obtener JWT
3. Usar el token en el header: `Authorization: Bearer <token>`
4. En Swagger: click en **Authorize** 🔒 → pegar el token

---

## 🏗️ Arquitectura técnica

```
Frontend (React/Angular) ──► API REST (NestJS) ──► MongoDB Atlas
                               /api/docs (Swagger)
                               Railway (Docker)
```

**Stack:**
- Runtime: Node.js 20
- Framework: NestJS 10
- ORM: Mongoose 8
- Auth: JWT (Passport)
- Docs: Swagger/OpenAPI 3.0
- DB: MongoDB Atlas
- Deploy: Railway + Docker

---

*TechSoft Solutions S.A.S. © 2024*
