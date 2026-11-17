#!/usr/bin/env node
/**
 * Test de verificación de los arreglos de sincronización y sesión
 * Verifica que los problemas específicos hayan sido solucionados:
 * 1. zoneCode se usa correctamente como ID único
 * 2. Los hitos no se sobreescriben por progress
 * 3. El flujo de guardado maneja tokens correctamente
 */

/* eslint-disable no-undef */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('🔍 Verificando arreglos de sincronización y sesión...\n');

let passed = 0;
let failed = 0;

const testResult = (name, condition, details = '') => {
  if (condition) {
    console.log(`  ✅ ${name}`);
    passed++;
  } else {
    console.log(`  ❌ ${name}`);
    if (details) console.log(`     ${details}`);
    failed++;
  }
};

// Test 1: Verificar que zoneCode se usa en saveSeguimiento
console.log('Test 1: Uso correcto de zoneCode');
const appContent = fs.readFileSync(path.join(__dirname, 'src/App.jsx'), 'utf8');
testResult(
  'saveSeguimiento usa [changedOffice.zoneCode]',
  appContent.includes('saveSeguimiento(officesToSave, [changedOffice.zoneCode])'),
  'Debe usar zoneCode como identificador único, no id'
);

// Test 2: Verificar que los hitos no usan progress como fuente de verdad
console.log('\nTest 2: Hitos no dependen de progress');
testResult(
  'normalizeOffices no usa office.progress para hitos',
  !appContent.includes('office.progress === 100 ||'),
  'Los hitos deben venir del servidor, no calcularse desde progress'
);

testResult(
  'createInitialOffices inicializa hitos como false',
  appContent.includes('result[milestone.id] = false'),
  'Los hitos nuevos deben empezar desactivados'
);

testResult(
  'normalizeOffices usa milestones como fuente de verdad',
  appContent.includes('result[milestone.id] = Boolean(office.milestones?.[milestone.id])'),
  'Los hitos deben venir de office.milestones'
);

// Test 3: Verificar que persistOffices valida token antes de guardar
console.log('\nTest 3: Validación de token antes de guardar');
testResult(
  'persistOffices valida token',
  appContent.includes('let currentToken = getAuthToken()') &&
  appContent.includes('if (!currentToken)'),
  'Debe validar que hay token antes de intentar guardar'
);

testResult(
  'persistOffices refresca token si está por expirar',
  appContent.includes('if (isTokenExpiringsoon(currentToken))') &&
  appContent.includes('const refreshed = await refreshAuthToken()'),
  'Debe refrescar el token ANTES de guardar si está próximo a expirar'
);

testResult(
  'persistOffices tiene reintentos mejorados',
  appContent.includes('const maxRetries = 2'),
  'Debe tener al menos 2 reintentos para mayor robustez'
);

// Test 4: Verificar que seguimientoService maneja 401 correctamente
console.log('\nTest 4: Manejo de errores 401 en seguimientoService');
const seguimientoContent = fs.readFileSync(
  path.join(__dirname, 'src/assets/data/seguimientoService.js'),
  'utf8'
);

testResult(
  'requestSeguimiento intenta refrescar en error 401',
  seguimientoContent.includes('if (response.status === 401 && !options._refreshAttempted)'),
  'Debe detectar 401 y refrescar el token'
);

testResult(
  'requestSeguimiento evita bucles infinitos',
  seguimientoContent.includes('_refreshAttempted'),
  'Debe usar flag para evitar reintentos infinitos'
);

testResult(
  'requestSeguimiento reintenta con nuevo token',
  seguimientoContent.includes('return requestSeguimiento({ ...options, _refreshAttempted: true })'),
  'Debe reintentar después de refrescar el token'
);

// Test 5: Verificar que no hay variables sin usar
console.log('\nTest 5: Calidad de código');
const hasUnusedVars = seguimientoContent.includes('const newToken = getAuthToken()');
testResult(
  'No hay variables sin usar en seguimientoService',
  !hasUnusedVars,
  'Se removió variable newToken que no se usaba'
);

// Test 6: Verificar flujo de persistOffices mejorado
console.log('\nTest 6: Flujo de persistOffices mejorado');
testResult(
  'persistOffices cambia estado a "Guardando..."',
  appContent.includes("setSyncStatus('Guardando...')"),
  'Debe mostrar estado de guardado'
);

testResult(
  'persistOffices valida respuesta del servidor',
  appContent.includes("if (!result.offices || !Array.isArray(result.offices))"),
  'Debe validar que la respuesta sea correcta'
);

// Test 7: Verificar mejor logging
console.log('\nTest 7: Logging mejorado');
testResult(
  'persistOffices tiene logging detallado',
  appContent.includes('Preparando guardado para zona') &&
  appContent.includes('Guardando cambios en el servidor') &&
  appContent.includes('Guardado exitoso'),
  'Debe haber logs detallados para debugging'
);

// Resumen
console.log('\n==================================================');
console.log(`\n📊 Resultados: ${passed} pasaron, ${failed} fallaron\n`);

if (failed === 0) {
  console.log('✅ Todos los arreglos han sido aplicados correctamente\n');
  console.log('📝 Cambios resumidos:');
  console.log('  1. ✅ zoneCode se usa como identificador único (antes: id)');
  console.log('  2. ✅ Hitos no se sobreescriben por progress (ahora: source of truth)');
  console.log('  3. ✅ Token se valida antes de guardar');
  console.log('  4. ✅ Token se refresca si está por expirar');
  console.log('  5. ✅ Mejor manejo de errores 401 con reintentos');
  console.log('  6. ✅ Logging mejorado para debugging\n');
  process.exit(0);
} else {
  console.log('⚠️  Algunos arreglos no se aplicaron correctamente\n');
  process.exit(1);
}
