import { useState, useEffect } from 'react'
import { obtenerClientes, obtenerProductos, obtenerEstadisticasDashboard } from '../lib/supabase'
import './TestConexion.css'

/**
 * Componente para probar la conexión con Supabase
 * Este componente se debe eliminar una vez que confirmemos que la conexión funciona
 */
const TestConexion = () => {
  const [estado, setEstado] = useState('inicial') // inicial, cargando, exitoso, error
  const [datos, setDatos] = useState(null)
  const [error, setError] = useState(null)

  const probarConexion = async () => {
    setEstado('cargando')
    setError(null)

    try {
      console.log('🔍 Probando conexión con Supabase...')

      // Prueba 1: Obtener clientes
      const clientes = await obtenerClientes()
      console.log('✅ Clientes obtenidos:', clientes.length)

      // Prueba 2: Obtener productos
      const productos = await obtenerProductos()
      console.log('✅ Productos obtenidos:', productos.length)

      // Prueba 3: Obtener estadísticas
      const estadisticas = await obtenerEstadisticasDashboard()
      console.log('✅ Estadísticas obtenidas:', estadisticas)

      setDatos({
        clientes: clientes.slice(0, 5), // Primeros 5 clientes
        productos: productos.slice(0, 5), // Primeros 5 productos
        estadisticas,
        totales: {
          totalClientes: clientes.length,
          totalProductos: productos.length,
        }
      })

      setEstado('exitoso')
      console.log('🎉 ¡Conexión exitosa con Supabase!')

    } catch (err) {
      console.error('❌ Error al conectar con Supabase:', err)
      setError(err.message)
      setEstado('error')
    }
  }

  return (
    <div className="test-conexion">
      <div className="test-header">
        <h1>🔌 Test de Conexión - Memimo CRM</h1>
        <p>Verifica que la conexión con Supabase funcione correctamente</p>
      </div>

      <div className="test-content">
        {estado === 'inicial' && (
          <div className="test-inicial">
            <button onClick={probarConexion} className="btn-probar">
              Probar Conexión con Supabase
            </button>
            <p className="test-info">
              Este test verificará:
            </p>
            <ul>
              <li>✓ Conexión a la base de datos</li>
              <li>✓ Lectura de clientes</li>
              <li>✓ Lectura de productos</li>
              <li>✓ Obtención de estadísticas</li>
            </ul>
          </div>
        )}

        {estado === 'cargando' && (
          <div className="test-cargando">
            <div className="spinner"></div>
            <p>Conectando con Supabase...</p>
          </div>
        )}

        {estado === 'exitoso' && datos && (
          <div className="test-exitoso">
            <div className="success-icon">✅</div>
            <h2>¡Conexión Exitosa!</h2>

            <div className="resultados">
              <div className="resultado-card">
                <h3>📊 Totales</h3>
                <div className="stats">
                  <div className="stat-item">
                    <span className="stat-label">Clientes:</span>
                    <span className="stat-value">{datos.totales.totalClientes}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Productos:</span>
                    <span className="stat-value">{datos.totales.totalProductos}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Ventas del mes:</span>
                    <span className="stat-value">S/ {datos.estadisticas.totalVentasMes}</span>
                  </div>
                </div>
              </div>

              <div className="resultado-card">
                <h3>👥 Primeros 5 Clientes</h3>
                <div className="lista">
                  {datos.clientes.map((cliente, index) => (
                    <div key={cliente.id} className="lista-item">
                      <span className="numero">{index + 1}.</span>
                      <span className="nombre">{cliente.nombres} {cliente.apellidos}</span>
                      <span className="celular">{cliente.celular}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="resultado-card">
                <h3>🍦 Primeros 5 Productos</h3>
                <div className="lista">
                  {datos.productos.map((producto, index) => (
                    <div key={producto.id} className="lista-item">
                      <span className="numero">{index + 1}.</span>
                      <span className="nombre">{producto.nombre}</span>
                      <span className="precio">S/ {producto.precio}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <button onClick={probarConexion} className="btn-probar-de-nuevo">
              Probar de nuevo
            </button>
          </div>
        )}

        {estado === 'error' && (
          <div className="test-error">
            <div className="error-icon">❌</div>
            <h2>Error de Conexión</h2>
            <div className="error-mensaje">
              <p><strong>Mensaje de error:</strong></p>
              <code>{error}</code>
            </div>
            <div className="error-ayuda">
              <h3>💡 Posibles soluciones:</h3>
              <ol>
                <li>Verifica que el archivo <code>.env</code> existe en la raíz del proyecto</li>
                <li>Confirma que las variables <code>VITE_SUPABASE_URL</code> y <code>VITE_SUPABASE_ANON_KEY</code> están correctas</li>
                <li>Asegúrate de haber ejecutado el script SQL para crear las tablas</li>
                <li>Verifica que desactivaste RLS (Row Level Security) en las tablas</li>
                <li>Reinicia el servidor de desarrollo (<code>npm run dev</code>)</li>
              </ol>
            </div>
            <button onClick={probarConexion} className="btn-probar-de-nuevo">
              Reintentar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default TestConexion
