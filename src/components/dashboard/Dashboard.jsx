import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  obtenerClientes, 
  obtenerProductos, 
  obtenerEstadisticasDashboard 
} from '../../lib/supabase'
import StatsCard from './StatsCard'
import './Dashboard.css'

const Dashboard = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalClientes: 0,
    totalVentasMes: 0,
    totalComprasMes: 0,
    promedioTicket: 0,
  })
  const [clientesRecientes, setClientesRecientes] = useState([])
  const [productosTop, setProductosTop] = useState([])

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      setLoading(true)

      // Obtener estadísticas
      const estadisticas = await obtenerEstadisticasDashboard()
      
      // Obtener clientes recientes
      const clientes = await obtenerClientes()
      setClientesRecientes(clientes.slice(0, 5))

      // Obtener productos
      const productos = await obtenerProductos()
      
      // Simular productos más vendidos (ordenar por nombre por ahora)
      const topProductos = productos
        .sort((a, b) => b.precio - a.precio)
        .slice(0, 5)
        .map((p, index) => ({
          ...p,
          ventas: Math.floor(Math.random() * 50) + 10 // Simulado
        }))
      
      setProductosTop(topProductos)

      // Actualizar stats
      setStats({
        totalClientes: estadisticas.totalClientes,
        totalVentasMes: parseFloat(estadisticas.totalVentasMes) || 0,
        totalComprasMes: Math.floor(Math.random() * 150) + 50, // Simulado
        promedioTicket: (parseFloat(estadisticas.totalVentasMes) / 30).toFixed(2) || 0,
      })

      setLoading(false)
    } catch (error) {
      console.error('Error al cargar datos del dashboard:', error)
      setLoading(false)
    }
  }

  // ACCIONES RÁPIDAS - Ahora funcionales
  const handleNuevaVenta = () => {
    // Por ahora navega a clientes (puedes crear una página de ventas después)
    navigate('/clientes')
    alert('Módulo de Ventas próximamente. Por ahora puedes gestionar clientes.')
  }

  const handleNuevoCliente = () => {
    navigate('/clientes')
  }

  const handleNuevoProducto = () => {
    navigate('/productos')
  }

  const handleNuevaCampana = () => {
    alert('Módulo de Campañas próximamente.')
  }

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner-large"></div>
        <p>Cargando dashboard...</p>
      </div>
    )
  }

  return (
    <div className="dashboard">
      {/* Tarjetas de Métricas */}
      <div className="dashboard-stats">
        <StatsCard
          title="Total Clientes"
          value={stats.totalClientes}
          icon="👥"
          color="primary"
          trend="up"
          trendValue="+12%"
        />
        <StatsCard
          title="Ventas del Mes"
          value={`S/ ${stats.totalVentasMes.toLocaleString()}`}
          icon="💰"
          color="success"
          trend="up"
          trendValue="+8%"
        />
        <StatsCard
          title="Compras del Mes"
          value={stats.totalComprasMes}
          icon="🛒"
          color="info"
          trend="up"
          trendValue="+5%"
        />
        <StatsCard
          title="Ticket Promedio"
          value={`S/ ${stats.promedioTicket}`}
          icon="📊"
          color="warning"
          trend="down"
          trendValue="-3%"
        />
      </div>

      {/* Gráfico de Ventas */}
      <div className="dashboard-section">
        <div className="section-card">
          <div className="section-header">
            <h2 className="section-title">📈 Ventas de los Últimos 7 Días</h2>
            <button className="btn-outline">Ver más</button>
          </div>
          <div className="chart-container">
            <div className="chart-placeholder">
              <div className="chart-bars">
                {[65, 45, 80, 55, 90, 70, 85].map((height, index) => (
                  <div key={index} className="chart-bar-wrapper">
                    <div 
                      className="chart-bar" 
                      style={{ height: `${height}%` }}
                    >
                      <span className="chart-value">S/ {(height * 10).toFixed(0)}</span>
                    </div>
                    <span className="chart-label">
                      {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'][index]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid de 2 columnas */}
      <div className="dashboard-grid">
        {/* Productos Más Vendidos */}
        <div className="section-card">
          <div className="section-header">
            <h2 className="section-title">🍦 Productos Más Vendidos</h2>
            <button className="btn-outline" onClick={() => navigate('/productos')}>
              Ver todos
            </button>
          </div>
          <div className="products-list">
            {productosTop.length > 0 ? (
              productosTop.map((producto, index) => (
                <div key={producto.id} className="product-item">
                  <div className="product-rank">{index + 1}</div>
                  <div className="product-info">
                    <div className="product-name">{producto.nombre}</div>
                    <div className="product-price">S/ {producto.precio}</div>
                  </div>
                  <div className="product-sales">
                    <span className="sales-value">{producto.ventas}</span>
                    <span className="sales-label">ventas</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <p>No hay datos de ventas aún</p>
              </div>
            )}
          </div>
        </div>

        {/* Clientes Recientes */}
        <div className="section-card">
          <div className="section-header">
            <h2 className="section-title">👥 Clientes Recientes</h2>
            <button className="btn-outline" onClick={() => navigate('/clientes')}>
              Ver todos
            </button>
          </div>
          <div className="clients-list">
            {clientesRecientes.length > 0 ? (
              clientesRecientes.map((cliente) => (
                <div key={cliente.id} className="client-item">
                  <div className="client-avatar">
                    {cliente.nombres.charAt(0)}{cliente.apellidos.charAt(0)}
                  </div>
                  <div className="client-info">
                    <div className="client-name">
                      {cliente.nombres} {cliente.apellidos}
                    </div>
                    <div className="client-contact">{cliente.celular}</div>
                  </div>
                  <button 
                    className="btn-icon" 
                    title="Ver perfil"
                    onClick={() => navigate('/clientes')}
                  >
                    →
                  </button>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <p>No hay clientes registrados</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Acciones Rápidas - AHORA FUNCIONALES */}
      <div className="dashboard-actions">
        <h2 className="section-title">⚡ Acciones Rápidas</h2>
        <div className="actions-grid">
          <button className="action-button primary" onClick={handleNuevaVenta}>
            <span className="action-icon">➕</span>
            <span className="action-label">Nueva Venta</span>
          </button>
          <button className="action-button success" onClick={handleNuevoCliente}>
            <span className="action-icon">👤</span>
            <span className="action-label">Nuevo Cliente</span>
          </button>
          <button className="action-button info" onClick={handleNuevoProducto}>
            <span className="action-icon">🍦</span>
            <span className="action-label">Nuevo Producto</span>
          </button>
          <button className="action-button warning" onClick={handleNuevaCampana}>
            <span className="action-icon">📢</span>
            <span className="action-label">Nueva Campaña</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default Dashboard