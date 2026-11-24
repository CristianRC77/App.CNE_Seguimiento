/**
 * Endpoint para crear usuario administrador
 * POST /api/admin-setup
 * 
 * Body: { setupToken: "setup-token-secreto" }
 * 
 * Este endpoint permite crear el usuario admin inicialmente.
 * El token de setup evita que cualquiera cree usuarios admin.
 */

import bcrypt from 'bcryptjs';
import { getCollection } from './mongodb.js';

export default async function adminSetupHandler(request, response) {
  // Validar que sea POST
  if (request.method !== 'POST') {
    response.status(405).json({ error: 'Método no permitido.' });
    return;
  }

  try {
    const setupToken = process.env.ADMIN_SETUP_TOKEN;
    const receivedToken = request.body?.setupToken;

    // Verificar token de seguridad
    if (!setupToken || receivedToken !== setupToken) {
      console.warn('⚠️ Intento de acceso a admin-setup sin token válido');
      response.status(403).json({ error: 'Token de setup inválido.' });
      return;
    }

    const collection = await getCollection('users');

    // Verificar si ya existe un admin
    const existingAdmin = await collection.findOne({ rol: 'ADMIN' });
    if (existingAdmin) {
      console.log('⚠️ El usuario administrador ya existe');
      response.status(400).json({ 
        error: 'El administrador ya existe en la base de datos',
        adminUser: existingAdmin.username 
      });
      return;
    }

    // Crear el usuario admin
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

    console.log('✅ Usuario administrador creado exitosamente');
    console.log(`   ID: ${result.insertedId}`);
    console.log(`   Usuario: ${adminUsername}`);

    response.status(201).json({
      success: true,
      message: 'Usuario administrador creado correctamente',
      userId: result.insertedId,
      username: adminUsername,
      password: adminPassword,
      warning: '⚠️ IMPORTANTE: Cambia la contraseña después del primer inicio de sesión'
    });

  } catch (error) {
    console.error('❌ Error al crear admin:', error);
    response.status(500).json({ 
      error: 'No se pudo crear el usuario administrador',
      details: error.message 
    });
  }
}
