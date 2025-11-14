import { useState, useEffect } from 'react'
import { obtenerEstadisticasDashboard, obtenerProductos, supabase } from '../../lib/supabase'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import './Reportes.css'

const Reportes = () => {
  const [loading, setLoading] = useState(true)
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [metricas, setMetricas] = useState({
    totalVentas: 0,
    totalClientes: 0,
    ticketPromedio: 0,
    productosVendidos: 0
  })
  const [ventasPorDia, setVentasPorDia] = useState([])
  const [topProductos, setTopProductos] = useState([])
  const [ventasPorCategoria, setVentasPorCategoria] = useState([])

  useEffect(() => {
    // Establecer fechas por defecto (último mes)
    const hoy = new Date()
    const haceUnMes = new Date()
    haceUnMes.setMonth(haceUnMes.getMonth() - 1)
    
    setFechaFin(hoy.toISOString().split('T')[0])
    setFechaInicio(haceUnMes.toISOString().split('T')[0])
    
    cargarReportes(haceUnMes, hoy)
  }, [])

  const cargarReportes = async (inicio, fin) => {
    try {
      setLoading(true)

      // Obtener estadísticas generales
      const stats = await obtenerEstadisticasDashboard()
      
      // Obtener ventas del período
      const { data: compras } = await supabase
        .from('compras')
        .select('*, detalle_compra(cantidad, producto_id)')
        .gte('fecha', inicio.toISOString())
        .lte('fecha', fin.toISOString())

      // Calcular métricas
      const totalVentas = compras?.reduce((sum, c) => sum + parseFloat(c.total), 0) || 0
      const totalCompras = compras?.length || 0
      const ticketPromedio = totalCompras > 0 ? totalVentas / totalCompras : 0
      
      // Contar productos vendidos
      let productosVendidos = 0
      compras?.forEach(compra => {
        compra.detalle_compra?.forEach(detalle => {
          productosVendidos += detalle.cantidad
        })
      })

      setMetricas({
        totalVentas: totalVentas.toFixed(2),
        totalClientes: stats.totalClientes,
        ticketPromedio: ticketPromedio.toFixed(2),
        productosVendidos
      })

      // Procesar ventas por día
      const ventasPorDiaMap = {}
      compras?.forEach(compra => {
        const fecha = new Date(compra.fecha).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })
        ventasPorDiaMap[fecha] = (ventasPorDiaMap[fecha] || 0) + parseFloat(compra.total)
      })

      const ventasArray = Object.entries(ventasPorDiaMap).map(([fecha, ventas]) => ({
        fecha,
        ventas: parseFloat(ventas.toFixed(2))
      }))
      setVentasPorDia(ventasArray)

      // Top productos
      const productosMap = {}
      compras?.forEach(compra => {
        compra.detalle_compra?.forEach(detalle => {
          if (!productosMap[detalle.producto_id]) {
            productosMap[detalle.producto_id] = {
              cantidad: 0,
              total: 0
            }
          }
          productosMap[detalle.producto_id].cantidad += detalle.cantidad
          productosMap[detalle.producto_id].total += parseFloat(detalle.subtotal)
        })
      })

      // Obtener nombres de productos
      const productos = await obtenerProductos()
      const topArray = Object.entries(productosMap)
        .map(([id, data]) => {
          const producto = productos.find(p => p.id === id)
          return {
            id,
            nombre: producto?.nombre || 'Desconocido',
            categoria: producto?.categoria?.nombre || 'Sin categoría',
            cantidad: data.cantidad,
            total: data.total.toFixed(2)
          }
        })
        .sort((a, b) => b.cantidad - a.cantidad)
        .slice(0, 10)

      setTopProductos(topArray)

      // Ventas por categoría (simulado para el gráfico)
      const categoriasMap = {}
      topArray.forEach(p => {
        categoriasMap[p.categoria] = (categoriasMap[p.categoria] || 0) + parseFloat(p.total)
      })

      const categoriasArray = Object.entries(categoriasMap).map(([name, value]) => ({
        name,
        value: parseFloat(value.toFixed(2))
      }))
      setVentasPorCategoria(categoriasArray)

    } catch (error) {
      console.error('Error al cargar reportes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAplicarFiltros = () => {
    if (fechaInicio && fechaFin) {
      cargarReportes(new Date(fechaInicio), new Date(fechaFin))
    }
  }

  const handleExportar = (tipo) => {
    alert(`Exportando reporte en formato ${tipo}...`)
    // Aquí implementarías la lógica real de exportación
  }

  const COLORS = ['#f22121', '#ff4444', '#ff6666', '#ff8888', '#ffaaaa', '#ffcccc']

  if (loading) {
    return (
      <div className="reportes-loading">
        <div className="spinner-large"></div>
        <p>Generando reportes...</p>
      </div>
    )
  }

  return (
    <div className="reportes-page">
      {/* Filtros */}
      <div className="reportes-filtros">
        <h2 className="section-title">📅 Período de Reporte</h2>
        <div className="filtros-grid">
          <div className="filtro-field">
            <label className="filtro-label">Fecha Inicio</label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="filtro-input"
            />
          </div>
          <div className="filtro-field">
            <label className="filtro-label">Fecha Fin</label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="filtro-input"
            />
          </div>
        </div>
        <button className="btn-aplicar-filtros" onClick={handleAplicarFiltros}>
          Aplicar Filtros
        </button>
      </div>

      {/* Métricas Principales */}
      <div className="reportes-metricas">
        <div className="metrica-card">
          <div className="metrica-header">
            <span className="metrica-titulo">Total Ventas</span>
            <span className="metrica-icono">💰</span>
          </div>
          <div className="metrica-valor">S/ {metricas.totalVentas}</div>
          <div className="metrica-comparacion comparacion-positiva">
            ↑ 12% vs período anterior
          </div>
        </div>

        <div className="metrica-card">
          <div className="metrica-header">
            <span className="metrica-titulo">Ticket Promedio</span>
            <span className="metrica-icono">📊</span>
          </div>
          <div className="metrica-valor">S/ {metricas.ticketPromedio}</div>
          <div className="metrica-comparacion comparacion-positiva">
            ↑ 5% vs período anterior
          </div>
        </div>

        <div className="metrica-card">
          <div className="metrica-header">
            <span className="metrica-titulo">Productos Vendidos</span>
            <span className="metrica-icono">🍦</span>
          </div>
          <div className="metrica-valor">{metricas.productosVendidos}</div>
          <div className="metrica-comparacion comparacion-positiva">
            ↑ 8% vs período anterior
          </div>
        </div>

        <div className="metrica-card">
          <div className="metrica-header">
            <span className="metrica-titulo">Total Clientes</span>
            <span className="metrica-icono">👥</span>
          </div>
          <div className="metrica-valor">{metricas.totalClientes}</div>
          <div className="metrica-comparacion comparacion-positiva">
            ↑ 15% vs período anterior
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="reportes-graficos">
        {/* Ventas por Día */}
        <div className="grafico-card" style={{ gridColumn: '1 / -1' }}>
          <div className="grafico-header">
            <h3 className="grafico-titulo">📈 Ventas por Día</h3>
            <button className="btn-exportar" onClick={() => handleExportar('ventas-dia')}>
              💾 Exportar
            </button>
          </div>
          <div className="grafico-contenedor">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ventasPorDia}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="fecha" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="ventas" stroke="#f22121" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Ventas por Categoría */}
        <div className="grafico-card">
          <div className="grafico-header">
            <h3 className="grafico-titulo">🍰 Ventas por Categoría</h3>
            <button className="btn-exportar" onClick={() => handleExportar('categoria')}>
              💾 Exportar
            </button>
          </div>
          <div className="grafico-contenedor">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={ventasPorCategoria}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {ventasPorCategoria.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top 10 Productos */}
        <div className="grafico-card">
          <div className="grafico-header">
            <h3 className="grafico-titulo">🏆 Top 10 Productos</h3>
            <button className="btn-exportar" onClick={() => handleExportar('top-productos')}>
              💾 Exportar
            </button>
          </div>
          <div className="grafico-contenedor">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProductos.slice(0, 5)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nombre" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="cantidad" fill="#f22121" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tabla Top Productos */}
      <div className="section-card">
        <div className="section-header">
          <h2 className="section-title">🍦 Detalle de Productos Más Vendidos</h2>
        </div>
        <table className="top-productos-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Producto</th>
              <th>Cantidad</th>
              <th>Total Ventas</th>
            </tr>
          </thead>
          <tbody>
            {topProductos.map((producto, index) => (
              <tr key={producto.id}>
                <td>
                  <div className="producto-rank">{index + 1}</div>
                </td>
                <td>
                  <div className="producto-info-col">
                    <span className="producto-nombre-table">{producto.nombre}</span>
                    <span className="producto-categoria-table">{producto.categoria}</span>
                  </div>
                </td>
                <td>
                  <span className="ventas-cantidad">{producto.cantidad}</span> unidades
                </td>
                <td>
                  <div className="producto-info-col">
                    <span className="ventas-monto">S/ {producto.total}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Exportar */}
      <div className="exportar-section">
        <h2 className="section-title">💾 Exportar Reporte Completo</h2>
        <p>Descarga el reporte en tu formato preferido</p>
        <div className="exportar-opciones">
          <button className="btn-exportar-tipo" onClick={() => handleExportar('Excel')}>
            <span className="exportar-icono">📊</span>
            <span className="exportar-texto">Excel</span>
          </button>
          <button className="btn-exportar-tipo" onClick={() => handleExportar('PDF')}>
            <span className="exportar-icono">📄</span>
            <span className="exportar-texto">PDF</span>
          </button>
          <button className="btn-exportar-tipo" onClick={() => handleExportar('CSV')}>
            <span className="exportar-icono">📋</span>
            <span className="exportar-texto">CSV</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default Reportes