#!/bin/bash
# ============================================================
# CREAR USUARIO ADMINISTRADOR - OPCIÓN LOCAL
# ============================================================
#
# Ejecuta ESTE archivo para crear el usuario admin localmente
# 
# OPCIÓN 1: Usando Node.js directamente (recomendado)
# ============================================================

cd "C:\Users\CRISTIAN\Documents\Proyectos_REACT\CNE_Seguimiento\App.CNE_Seguimiento"

echo "🚀 Creando usuario administrador..."
echo ""

node create-admin-user.js

echo ""
echo "✅ ¡Listo! Ahora puedes iniciar sesión con:"
echo "   Usuario: admin"
echo "   Contraseña: admin123"
