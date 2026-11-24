/**
 * Script para crear un usuario administrador
 * Uso: node create-admin-user.js
 * 
 * Este script crea un usuario con rol ADMIN en la base de datos
 */

import bcrypt from 'bcryptjs';
import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const mongoUri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DATABASE;
const usersCollection = process.env.MONGODB_USERS_COLLECTION || 'users';

if (!mongoUri || !dbName) {
  console.error('❌ Error: MONGODB_URI y MONGODB_DATABASE no están configurados en .env.local');
  process.exit(1);
}

async function createAdminUser() {
  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    console.log('✓ Conectado a MongoDB');

    const db = client.db(dbName);
    const collection = db.collection(usersCollection);

    // Datos del usuario admin
    const adminUsername = 'admin';
    const adminPassword = 'admin123'; // ⚠️ CAMBIAR ESTO EN PRODUCCIÓN
    const passwordHash = await bcrypt.hash(adminPassword, 12);

    // Verificar si el usuario ya existe
    const existingUser = await collection.findOne({ username: adminUsername });
    if (existingUser) {
      console.log(`⚠️  El usuario '${adminUsername}' ya existe`);
      console.log(`   ID: ${existingUser._id}`);
      return;
    }

    // Crear el usuario admin
    const result = await collection.insertOne({
      username: adminUsername,
      password_hash: passwordHash,
      rol: 'ADMIN',
      circunscripcion: null,
      nombreCompleto: 'Administrador del Sistema',
      activo: true,
      createdAt: new Date(),
    });

    console.log('✓ Usuario administrador creado exitosamente');
    console.log('');
    console.log('📌 Credenciales de Admin:');
    console.log('   Usuario: ' + adminUsername);
    console.log('   Contraseña: ' + adminPassword);
    console.log('');
    console.log('⚠️  IMPORTANTE:');
    console.log('   1. Cambia la contraseña después del primer inicio de sesión');
    console.log('   2. No compartas estas credenciales');
    console.log('   3. Este usuario tiene acceso a funciones administrativas');
    console.log('');
    console.log('ID del usuario: ' + result.insertedId);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

// Ejecutar
createAdminUser();
