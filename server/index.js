import express from 'express';
import bcrypt from 'bcryptjs';
import authHandler from '../api/auth.js';
import refreshHandler from '../api/refresh.js';
import resetDbHandler from '../api/admin/reset-db.js';
import { authenticateRequest, authorizeZoneUpdates } from '../api/authMiddleware.js';
import handler from '../api/seguimiento.js';
import { getCollection } from '../api/mongodb.js';

// Crea el servidor HTTP que expone la API durante el desarrollo local.
const app = express();
const port = Number(process.env.API_PORT || 3001);

// Permite recibir actualizaciones de actas y hitos en formato JSON.
app.use(express.json({ limit: '2mb' }));
app.use((request, response, next) => {
  response.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, OPTIONS');
  next();
});

// ENDPOINT DE DEBUG: Ver estado de usuarios (solo desarrollo)
app.get('/api/debug/users', async (request, response) => {
  try {
    const users = await getCollection('users');
    const allUsers = await users.find({}).toArray();
    console.log(`📊 Total usuarios en BD: ${allUsers.length}`);
    allUsers.forEach((u) => {
      console.log(`  - ${u._id}: ${u.username} (activo: ${u.activo})`);
    });
    response.json({ total: allUsers.length, users: allUsers });
  } catch (error) {
    console.error('Error al listar usuarios:', error);
    response.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/login', (request, response) => authHandler(request, response));
app.options('/api/auth/login', (request, response) => response.status(204).end());

// Admin setup endpoint
app.post('/api/admin/setup', async (request, response) => {
  try {
    const setupToken = process.env.ADMIN_SETUP_TOKEN;
    const receivedToken = request.body?.setupToken;

    if (!setupToken) {
      console.error('❌ ADMIN_SETUP_TOKEN no está configurado');
      return response.status(500).json({ error: 'Setup no está configurado' });
    }

    if (receivedToken !== setupToken) {
      console.warn('⚠️ Token de setup inválido');
      return response.status(403).json({ error: 'Token de setup inválido' });
    }

    const collection = await getCollection('users');
    const existingAdmin = await collection.findOne({ rol: 'ADMIN' });
    
    if (existingAdmin) {
      return response.status(400).json({ 
        error: 'Admin ya existe',
        adminUser: existingAdmin.username 
      });
    }

    const adminUsername = 'admin';
    const adminPassword = 'admin123';
    const passwordHash = await bcrypt.hash(adminPassword, 12);

    const result = await collection.insertOne({
      username: adminUsername,
      password_hash: passwordHash,
      rol: 'ADMIN',
      circunscripcion: null,
      nombreCompleto: 'Administrador del Sistema',
      activo: true,
      createdAt: new Date(),
    });

    console.log('✅ Usuario admin creado:', adminUsername);
    return response.status(201).json({
      success: true,
      message: 'Admin creado correctamente',
      userId: result.insertedId,
      username: adminUsername,
      password: adminPassword
    });

  } catch (error) {
    console.error('❌ Error al crear admin:', error);
    return response.status(500).json({ error: 'Error interno' });
  }
});

app.options('/api/admin/setup', (request, response) => response.status(204).end());

// Admin reset database endpoint (requiere autenticación)
app.post('/api/admin/reset-database', authenticateRequest, (request, response) => 
  resetDbHandler(request, response)
);
app.options('/api/admin/reset-database', (request, response) => response.status(204).end());

app.post('/api/auth/refresh', (request, response) => refreshHandler(request, response));
app.options('/api/auth/refresh', (request, response) => response.status(204).end());
app.get('/api/seguimiento', (request, response) => handler(request, response));
app.options('/api/seguimiento', (request, response) => handler(request, response));
// Solo las escrituras requieren JWT y autorización de circunscripción.
app.put(
  '/api/seguimiento',
  authenticateRequest,
  authorizeZoneUpdates,
  (request, response) => handler(request, response)
);
app.patch(
  '/api/seguimiento',
  authenticateRequest,
  authorizeZoneUpdates,
  (request, response) => handler(request, response)
);

app.listen(port, () => {
  console.log(`API MongoDB local disponible en http://localhost:${port}/api/seguimiento`);
});
