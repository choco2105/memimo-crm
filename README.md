# 🚀 GUÍA COMPLETA DE INSTALACIÓN - MEMIMO CRM

## 📋 REQUISITOS PREVIOS

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** (versión 18 o superior) - [Descargar aquí](https://nodejs.org/)
- **Git** (opcional, pero recomendado) - [Descargar aquí](https://git-scm.com/)
- Un editor de código como **VS Code** - [Descargar aquí](https://code.visualstudio.com/)

---

## 📦 PASO 1: INSTALAR DEPENDENCIAS

Abre una terminal en la carpeta del proyecto y ejecuta:

```bash
npm install
```

Este comando instalará todas las librerías necesarias:
- React 18
- Supabase Client
- React Router
- Recharts (para gráficos)
- Vite (bundler)

**Tiempo estimado:** 1-2 minutos

---

## 🔑 PASO 2: CONFIGURAR CREDENCIALES DE SUPABASE

### 2.1 Obtener las credenciales

1. Ve a tu proyecto en Supabase: https://supabase.com
2. Selecciona tu proyecto **memimo-crm**
3. Ve a **Settings** ⚙️ → **API**
4. Copia estos dos valores:
   - **Project URL**: `https://xxxxxxxxx.supabase.co`
   - **anon public key**: `eyJhbGc...` (una clave larga)

### 2.2 Crear el archivo .env

1. En la raíz del proyecto, **copia** el archivo `.env.example`
2. **Renómbralo** a `.env` (sin el .example)
3. Abre el archivo `.env` y reemplaza los valores:

```env
VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**⚠️ IMPORTANTE:**
- El archivo `.env` NO debe compartirse con nadie
- NO subas este archivo a Git (ya está en .gitignore)
- Sin este archivo, la aplicación NO funcionará

---

## ▶️ PASO 3: EJECUTAR LA APLICACIÓN

En la terminal, ejecuta:

```bash
npm run dev
```

Esto iniciará el servidor de desarrollo.

**Deberías ver algo como:**
```
  VITE v5.0.12  ready in 500 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

**La aplicación se abrirá automáticamente en tu navegador** en `http://localhost:3000`

---

## ✅ PASO 4: PROBAR LA CONEXIÓN

Una vez que la aplicación se abra:

1. Verás la pantalla de **"Test de Conexión"**
2. Haz clic en **"Probar Conexión con Supabase"**
3. Si todo está bien configurado, deberías ver:
   - ✅ Un mensaje de "¡Conexión Exitosa!"
   - Los primeros 5 clientes de la base de datos
   - Los primeros 5 productos
   - Estadísticas generales

### Si ves errores:

**Error: "Faltan las credenciales de Supabase"**
- ✓ Verifica que el archivo `.env` existe
- ✓ Confirma que las variables están bien escritas (VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY)
- ✓ Reinicia el servidor (`Ctrl + C` y luego `npm run dev` de nuevo)

**Error: "No se pueden obtener los datos"**
- ✓ Asegúrate de haber ejecutado el script SQL en Supabase
- ✓ Verifica que las tablas tengan datos (clientes y productos)
- ✓ Confirma que desactivaste RLS en todas las tablas

**Error: "Network error"**
- ✓ Verifica que tu URL de Supabase sea correcta
- ✓ Confirma que tienes conexión a internet

---

## 📁 ESTRUCTURA DEL PROYECTO

```
memimo-crm/
├── src/
│   ├── components/          # Componentes de React
│   │   ├── TestConexion.jsx  # Prueba de conexión
│   │   └── TestConexion.css
│   ├── lib/
│   │   └── supabase.js      # Configuración y funciones de Supabase
│   ├── App.jsx              # Componente principal
│   ├── App.css
│   ├── main.jsx             # Punto de entrada
│   └── index.css
├── .env                     # ⚠️ Credenciales (NO compartir)
├── .env.example             # Plantilla de credenciales
├── .gitignore               # Archivos ignorados por Git
├── index.html               # HTML principal
├── package.json             # Dependencias
├── vite.config.js           # Configuración de Vite
└── README.md                # Este archivo
```

---

## 🔧 COMANDOS DISPONIBLES

```bash
# Iniciar servidor de desarrollo
npm run dev

# Compilar para producción
npm run build

# Previsualizar build de producción
npm run preview
```

---

## 🎯 FUNCIONES DISPONIBLES EN SUPABASE

El archivo `src/lib/supabase.js` incluye las siguientes funciones:

### Clientes
- `obtenerClientes()` - Obtiene todos los clientes
- `obtenerClientePorId(id)` - Obtiene un cliente específico
- `crearCliente(datos)` - Crea un nuevo cliente
- `actualizarCliente(id, datos)` - Actualiza un cliente
- `buscarClientes(termino)` - Busca clientes por nombre/dni/celular

### Productos
- `obtenerProductos()` - Obtiene todos los productos
- `obtenerProductosPorCategoria(categoriaId)` - Productos de una categoría
- `obtenerCategorias()` - Obtiene todas las categorías

### Compras
- `obtenerComprasCliente(clienteId)` - Historial de compras
- `crearCompra(datos, detalles)` - Registra una nueva compra

### Campañas
- `obtenerCampanasActivas()` - Campañas activas
- `crearCampana(datos)` - Crea una nueva campaña
- `asignarClientesCampana(campanaId, clienteIds)` - Asigna clientes

### Estadísticas
- `obtenerEstadisticasDashboard()` - Métricas generales del dashboard

**Ejemplo de uso:**

```javascript
import { obtenerClientes } from './lib/supabase'

// En tu componente
const clientes = await obtenerClientes()
console.log(clientes)
```

---

## 🎨 COLORES DE MARCA MEMIMO

Las variables CSS están disponibles en `src/App.css`:

```css
--memimo-rojo: #f22121    /* Color principal */
--memimo-negro: #000000   /* Texto y elementos oscuros */
--memimo-blanco: #ffffff  /* Fondos y elementos claros */
```

---

## 🔐 SEGURIDAD

**Actualmente, RLS (Row Level Security) está desactivado** para facilitar el desarrollo.

**IMPORTANTE:** Antes de poner la aplicación en producción, deberás:
1. Activar RLS en todas las tablas
2. Crear políticas de seguridad apropiadas
3. Implementar autenticación de usuarios
4. Restringir accesos según roles

---

## 📝 PRÓXIMOS PASOS

Una vez que confirmes que la conexión funciona:

1. ✅ Crear el Dashboard principal
2. ✅ Implementar módulo de Clientes
3. ✅ Implementar módulo de Productos
4. ✅ Implementar módulo de Compras
5. ✅ Implementar módulo de Campañas
6. ✅ Agregar gráficos y reportes

---

## 🆘 SOPORTE

Si encuentras problemas:

1. Verifica que seguiste todos los pasos en orden
2. Revisa la consola del navegador (F12) para ver errores detallados
3. Confirma que tu base de datos en Supabase tiene datos
4. Reinicia el servidor de desarrollo

---

## ✨ ¡LISTO PARA DESARROLLAR!

Si el test de conexión fue exitoso, tu ambiente está completamente configurado y listo para comenzar a construir el CRM completo de Memimo.

**🎉 ¡Felicidades!**
