/**
 * Endpoint para crear usuario administrador
 * POST /api/admin/setup
 * 
 * Body: { setupToken: "setup-token-secreto" }
 * 
 * Este endpoint permite crear el usuario admin inicialmente.
 * El token de setup evita que cualquiera cree usuarios admin.
 */

import bcrypt from 'bcryptjs';
import { getCollection } from '../mongodb.js';

export default async function adminSetupHandler(req, res) {
  // Validar que sea POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido.' });
  }

  try {
    const setupToken = process.env.ADMIN_SETUP_TOKEN;
    const receivedToken = req.body?.setupToken;

    // Verificar token de seguridad
    if (!setupToken) {
      console.error('❌ ADMIN_SETUP_TOKEN no está configurado');
      return res.status(500).json({ error: 'Setup no está configurado en el servidor.' });
    }

    if (receivedToken !== setupToken) {
      console.warn('⚠️ Intento de acceso a admin-setup sin token válido');
      return res.status(403).json({ error: 'Token de setup inválido.' });
    }

    const collection = await getCollection('users');

    // Verificar si ya existe un admin
    const existingAdmin = await collection.findOne({ rol: 'ADMIN' });
    if (existingAdmin) {
      console.log('⚠️ El usuario administrador ya existe');
      return res.status(400).json({ 
        error: 'El administrador ya existe en la base de datos',
        adminUser: existingAdmin.username 
      });
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

    return res.status(201).json({
      success: true,
      message: 'Usuario administrador creado correctamente',
      userId: result.insertedId,
      username: adminUsername,
      password: adminPassword,
      warning: '⚠️ IMPORTANTE: Cambia la contraseña después del primer inicio de sesión'
    });

  } catch (error) {
    console.error('❌ Error al crear admin:', error);
    return res.status(500).json({ 
      error: 'No se pudo crear el usuario administrador',
      details: error.message 
    });
  }
}
