# Diagnóstico de Problemas - Cierre de Sesión y Pérdida de Datos

## Problemas Identificados

### 1. **Cierre de Sesión Durante Actualizaciones** ❌
**Síntoma**: Se actualiza, se cierra la sesión
**Causa**: 
- El token expira justo durante la actualización
- El refresh se intenta pero el flujo no está completamente sincronizado
- En `persistOffices`, se llama `loadSeguimiento()` que hace una GET, pero si el token está a punto de expirar, la siguiente PUT puede fallar con 401

**Solución**: 
- Asegurar que el refresh ocurra ANTES de cualquier operación de guardado
- Mejorar la sincronización del flujo de guardado

### 2. **Datos No Se Cruzan Bien con la Base de Datos General** ⚠️
**Síntoma**: Se actualiza y los datos no quedan sincronizados correctamente
**Causa**:
- En `persistOffices()` se cargan datos actuales del servidor con `loadSeguimiento()`
- Luego se busca el office con `changedOffice.zoneCode`
- Pero si hay diferencias en los IDs o zoneCode, el mapeo puede fallar
- El servidor devuelve índices (id: index + 1) que pueden cambiar entre cargas

**Solución**:
- Usar siempre `zoneCode` como identificador único (es la clave estable en MongoDB)
- Garantizar consistencia en cómo se mapean los datos

### 3. **Progreso Se Reinicia a 100%** 🔄
**Síntoma**: Después de actualizar, el progreso salta a 100%
**Causa**:
- Probablemente el `progress` se guarda pero luego se recalcula incorrectamente
- El cálculo de `getGeneralProgress()` puede estar considerando valores por defecto

**Solución**:
- Mantener el progreso calculado en el cliente
- No depender de un campo `progress` del servidor que puede no estar actualizado

## Plan de Corrección

1. **Mejorar el flujo de refresh + guardado**
   - Garantizar que el token sea válido ANTES de intentar guardar
   - Agregar validación del token después del refresh

2. **Usar zoneCode consistentemente como ID**
   - Cambiar toda la lógica de búsqueda a usar `zoneCode`
   - Evitar depender del `id` que se recalcula

3. **Mejorar la sincronización de datos**
   - Asegurar que los datos guardados se devuelvan correctamente
   - Validar que los datos recibidos después de guardar sean correctos

4. **Mejorar el monitoreo de la sesión**
   - Agregar logs para ver exactamente qué está pasando
   - Mejorar los mensajes de error
