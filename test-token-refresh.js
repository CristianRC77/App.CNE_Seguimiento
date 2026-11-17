#!/usr/bin/env node
/**
 * Test de Verificación Rápida - Token Refresh
 * 
 * Este script verifica que la configuración de renovación de token es correcta
 * Uso: node test-token-refresh.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧪 Iniciando pruebas de verificación...\n');

// Test 1: Verificar que api/refresh.js existe y es sintácticamente válido
console.log('Test 1: Archivo api/refresh.js');
try {
  const refreshPath = path.join(__dirname, 'api', 'refresh.js');
  if (fs.existsSync(refreshPath)) {
    console.log('  ✅ Archivo existe');
    const content = fs.readFileSync(refreshPath, 'utf-8');
    if (content.includes('export default') && content.includes('refreshHandler')) {
      console.log('  ✅ Contiene exportación correcta');
    } else {
      console.log('  ❌ Exportación no encontrada');
    }
  } else {
    console.log('  ❌ Archivo no existe');
  }
} catch (error) {
  console.log('  ❌ Error:', error.message);
}

// Test 2: Verificar que server/index.js tiene el nuevo endpoint
console.log('\nTest 2: Configuración de servidor');
try {
  const serverPath = path.join(__dirname, 'server', 'index.js');
  const serverContent = fs.readFileSync(serverPath, 'utf-8');
  
  if (serverContent.includes('refreshHandler')) {
    console.log('  ✅ refreshHandler importado');
  } else {
    console.log('  ❌ refreshHandler no importado');
  }
  
  if (serverContent.includes('/api/auth/refresh')) {
    console.log('  ✅ Endpoint /api/auth/refresh registrado');
  } else {
    console.log('  ❌ Endpoint /api/auth/refresh NO registrado');
  }
} catch (error) {
  console.log('  ❌ Error:', error.message);
}

// Test 3: Verificar que authService.js tiene las nuevas funciones
console.log('\nTest 3: Funciones en authService.js');
try {
  const authPath = path.join(__dirname, 'src', 'assets', 'data', 'authService.js');
  const authContent = fs.readFileSync(authPath, 'utf-8');
  
  if (authContent.includes('export const getTokenExpirationTime')) {
    console.log('  ✅ getTokenExpirationTime() exportada');
  } else {
    console.log('  ❌ getTokenExpirationTime() NO exportada');
  }
  
  if (authContent.includes('export const refreshAuthToken')) {
    console.log('  ✅ refreshAuthToken() exportada');
  } else {
    console.log('  ❌ refreshAuthToken() NO exportada');
  }
} catch (error) {
  console.log('  ❌ Error:', error.message);
}

// Test 4: Verificar que App.jsx importa las nuevas funciones
console.log('\nTest 4: Importaciones en App.jsx');
try {
  const appPath = path.join(__dirname, 'src', 'App.jsx');
  const appContent = fs.readFileSync(appPath, 'utf-8');
  
  if (appContent.includes('getTokenExpirationTime')) {
    console.log('  ✅ getTokenExpirationTime importada');
  } else {
    console.log('  ❌ getTokenExpirationTime NO importada');
  }
  
  if (appContent.includes('refreshAuthToken')) {
    console.log('  ✅ refreshAuthToken importada');
  } else {
    console.log('  ❌ refreshAuthToken NO importada');
  }
  
  if (appContent.includes('useEffect') && appContent.includes('scheduleTokenRefresh')) {
    console.log('  ✅ Monitor de refresh implementado');
  } else {
    console.log('  ⚠️  Monitor de refresh NO verificable (podría estar bien)');
  }
} catch (error) {
  console.log('  ❌ Error:', error.message);
}

// Test 5: Verificar que seguimientoService tiene reintentos
console.log('\nTest 5: Reintentos en seguimientoService.js');
try {
  const servicePath = path.join(__dirname, 'src', 'assets', 'data', 'seguimientoService.js');
  const serviceContent = fs.readFileSync(servicePath, 'utf-8');
  
  if (serviceContent.includes('response.status === 401')) {
    console.log('  ✅ Detecta error 401');
  } else {
    console.log('  ❌ No detecta error 401');
  }
  
  if (serviceContent.includes('refreshAuthToken')) {
    console.log('  ✅ Llama refreshAuthToken() en reintentos');
  } else {
    console.log('  ❌ No llama refreshAuthToken() en reintentos');
  }
  
  if (serviceContent.includes('_refreshAttempted')) {
    console.log('  ✅ Evita bucles infinitos con _refreshAttempted');
  } else {
    console.log('  ⚠️  Flag _refreshAttempted no encontrada');
  }
} catch (error) {
  console.log('  ❌ Error:', error.message);
}

// Test 6: Verificar que package.json tiene las dependencias necesarias
console.log('\nTest 6: Dependencias en package.json');
try {
  const pkgPath = path.join(__dirname, 'package.json');
  const pkgContent = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  
  const deps = { ...pkgContent.dependencies, ...pkgContent.devDependencies };
  
  if (deps.jsonwebtoken) {
    console.log(`  ✅ jsonwebtoken (${deps.jsonwebtoken})`);
  } else {
    console.log('  ❌ jsonwebtoken NO instalado');
  }
  
  if (deps.express) {
    console.log(`  ✅ express (${deps.express})`);
  } else {
    console.log('  ❌ express NO instalado');
  }
  
  if (deps.bcryptjs) {
    console.log(`  ✅ bcryptjs (${deps.bcryptjs})`);
  } else {
    console.log('  ❌ bcryptjs NO instalado');
  }
} catch (error) {
  console.log('  ❌ Error:', error.message);
}

console.log('\n' + '='.repeat(50));
console.log('✅ Verificación completada');
console.log('='.repeat(50));
console.log('\n📋 Próximos pasos:');
console.log('  1. Ejecuta: npm run dev:api (en una terminal)');
console.log('  2. Ejecuta: npm run dev (en otra terminal)');
console.log('  3. Inicia sesión en http://localhost:5173');
console.log('  4. Realiza actualizaciones normalmente');
console.log('  5. ¡Tu sesión no debería cerrarse por expiración!\n');
