# Seguimiento CNE con MongoDB Atlas

La aplicación usa una función API de Vercel para consultar y actualizar la
colección `zona_electoral` de MongoDB Atlas. El navegador nunca recibe la
contraseña de MongoDB ni usa los archivos JSON como fuente de datos.

## Variables en Vercel

En **Project Settings > Environment Variables** agrega:

```env
MONGODB_URI=mongodb+srv://Vercel-Admin-elecciones_exterior_db:TU_PASSWORD@elecciones-exterior-db.bs5pvnx.mongodb.net/
MONGODB_DATABASE=elecciones_exterior_db
MONGODB_COLLECTION=zona_electoral
```

Reemplaza `TU_PASSWORD` por la contraseña real. No la guardes en archivos del
frontend ni la publiques en Git.

Opcionalmente, si React y la API están en dominios distintos:

```env
VITE_API_URL=https://tu-proyecto.vercel.app/api
```

Si están en el mismo proyecto Vercel, no necesitas `VITE_API_URL`; se usará
`/api` automáticamente.

## MongoDB Atlas

En **Network Access** agrega la IP de Vercel o `0.0.0.0/0` para permitir
conexiones desde funciones serverless. Usa un usuario de base de datos con
permisos únicamente sobre `elecciones_exterior_db`.

La función [api/seguimiento.js](./api/seguimiento.js) expone:

- `GET /api/seguimiento`: carga todas las zonas.
- `PUT /api/seguimiento`: actualiza `progress`, `milestones`, `estado_Avance`
  y `updated`.

La colección debe contener los campos del JSON importado, especialmente
`zona_codigo`. Las computadoras consultan la API cada cinco segundos para
mostrar cambios realizados desde otra computadora. La función actualiza
directamente esos documentos; no crea una colección nueva ni usa el JSON
después de desplegar.

Después de agregar las variables, vuelve a desplegar el proyecto en Vercel.

## Probar localmente con MongoDB

Agrega las variables `MONGODB_URI`, `MONGODB_DATABASE`,
`MONGODB_COLLECTION` y `API_PORT=3001` en `.env.local`. No uses una
contraseña real en Git.

Ejecuta:

```bash
npm run dev:all
```

Esto inicia la API local en el puerto `3001` y React en Vite. El proxy de Vite
envía `/api/seguimiento` a la API local, así que todos los navegadores abiertos
en la misma computadora consultan la misma colección de MongoDB. En producción,
Vercel usa automáticamente `api/seguimiento.js`.
