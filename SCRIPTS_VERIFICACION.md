# 🧪 Scripts de Verificación

Este directorio contiene scripts para verificar que los arreglos se aplicaron correctamente.

## Scripts Disponibles

### 1. `test-token-refresh.js`
**Propósito**: Verificar que la infraestructura de refresh de tokens está en su lugar.

```bash
node test-token-refresh.js
```

**Qué verifica**:
- Archivo `api/refresh.js` existe y exporta correctamente
- Endpoint `/api/auth/refresh` está registrado en el servidor
- Funciones de autenticación se exportan correctamente
- Monitoreo de refresh está implementado en App.jsx
- Reintentos en seguimientoService.js funcionan
- Dependencias necesarias están en package.json

---

### 2. `test-sync-fixes.js`
**Propósito**: Verificar que todos los arreglos de sincronización y sesión se aplicaron.

```bash
node test-sync-fixes.js
```

**Qué verifica**:
- zoneCode se usa como identificador único (no id)
- Los hitos no se sobreescriben por progress
- Token se valida antes de guardar
- Token se refresca si está por expirar
- Manejo mejorado de errores 401
- Logging detallado está implementado
- No hay variables sin usar
- Respuestas del servidor se validan

---

## ✅ Ambos Tests Deben Pasar

Para asegurar que todo está bien:

```bash
npm run lint                 # Verificar calidad de código
node test-token-refresh.js  # Verificar infraestructura de tokens
node test-sync-fixes.js     # Verificar arreglos de sincronización
```

Si todos pasan sin errores, los arreglos están completos y listos para usar.

---

## 📋 Checklist de Verificación Manual

Además de los tests automáticos:

- [ ] Iniciar sesión correctamente
- [ ] Cambiar datos en una zona
- [ ] Verificar que se guarda (mensaje "Guardado correctamente")
- [ ] Esperar 5 minutos
- [ ] Cambiar otros datos
- [ ] Verificar que sigue guardando sin cerrar sesión
- [ ] Revisar la consola del navegador (F12) para logs
- [ ] Revisar la consola del servidor para logs

---

## 🔍 Troubleshooting

Si algún test falla:

1. **test-token-refresh.js falla en "Archivo api/refresh.js"**
   - Verificar que `api/refresh.js` existe
   - Verificar que contiene `export default async function refreshHandler`

2. **test-sync-fixes.js falla en "zoneCode"**
   - Verificar línea ~411 de App.jsx
   - Debe decir: `saveSeguimiento(officesToSave, [changedOffice.zoneCode])`

3. **test-sync-fixes.js falla en "hitos"**
   - Verificar que normalizeOffices no usa `office.progress === 100`
   - Verificar que usa `Boolean(office.milestones?.[milestone.id])`

4. **Linting falla**
   - Ejecutar: `npm run lint -- --fix`
   - Revisar los errores restantes

---

## 📚 Referencias

- `RESUMEN_SOLUCION_FINAL.md` - Visión general de las soluciones
- `ARREGLOS_REALIZADOS.md` - Detalles técnicos de cada arreglo
- `DIAGNOSTICO_PROBLEMAS.md` - Análisis de raíces de los problemas
