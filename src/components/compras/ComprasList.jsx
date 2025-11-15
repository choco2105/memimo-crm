import { useState, useEffect } from 'react'
import { obtenerComprasCompletas } from '../../lib/supabase'
import VentaModal from './VentaModal'
import './ComprasList.css'

const ComprasList = () => {
  const [compras, setCompras] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('todas') // todas, hoy, semana, mes
  const [isVentaModalOpen, setIsVentaModalOpen] = useState(false)

  useEffect(() => {
    cargarCompras()
  }, [])

  const cargarCompras = async () => {
    try {
      setLoading(true)
      const data = await obtenerComprasCompletas()
      setCompras(data)
    } catch (error) {
      console.error('Error al cargar compras:', error)
    } finally {
      setLoading(false)
    }
  }

  const filtrarCompras = () => {
    const ahora = new Date()
    
    switch (filtro) {
      case 'hoy':
        return compras.filter(c => {
          const fecha = new Date(c.fecha)
          return fecha.toDateString() === ahora.toDateString()
        })
      case 'semana':
        const semanaAtras = new Date()
        semanaAtras.setDate(semanaAtras.getDate() - 7)
        return compras.filter(c => new Date(c.fecha) >= semanaAtras)
      case 'mes':
        const mesAtras = new Date()
        mesAtras.setMonth(mesAtras.getMonth() - 1)
        return compras.filter(c => new Date(c.fecha) >= mesAtras)
      default:
        return compras
    }
  }

  const comprasFiltradas = filtrarCompras()

  const formatFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const calcularTotalPeriodo = () => {
    return comprasFiltradas.reduce((sum, c) => sum + parseFloat(c.total), 0)
  }

  if (loading) {
    return (
      <div className="compras-loading">
        <div className="spinner-large"></div>
        <p>Cargando ventas...</p>
      </div>
    )
  }

  return (
    <div className="compras-page">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Ventas</h1>
          <span className="page-count">{comprasFiltradas.length} ventas</span>
        </div>
        <button className="btn-primary" onClick={() => setIsVentaModalOpen(true)}>
          <span className="btn-icon">➕</span>
          Nueva Venta
        </button>
      </div>

      {/* Filtros y Resumen */}
      <div className="compras-toolbar">
        <div className="filtros-ventas">
          <button
            className={`filtro-btn ${filtro === 'todas' ? 'active' : ''}`}
            onClick={() => setFiltro('todas')}
          >
            Todas
          </button>
          <button
            className={`filtro-btn ${filtro === 'hoy' ? 'active' : ''}`}
            onClick={() => setFiltro('hoy')}
          >
            Hoy
          </button>
          <button
            className={`filtro-btn ${filtro === 'semana' ? 'active' : ''}`}
            onClick={() => setFiltro('semana')}
          >
            Esta Semana
          </button>
          <button
            className={`filtro-btn ${filtro === 'mes' ? 'active' : ''}`}
            onClick={() => setFiltro('mes')}
          >
            Este Mes
          </button>
        </div>
        <div className="total-periodo">
          <span>Total:</span>
          <strong>S/ {calcularTotalPeriodo().toFixed(2)}</strong>
        </div>
      </div>

      {/* Lista de Compras */}
      {comprasFiltradas.length > 0 ? (
        <div className="compras-list">
          {comprasFiltradas.map((compra) => (
            <div key={compra.id} className="compra-card">
              <div className="compra-header">
                <div className="compra-info">
                  <h3 className="compra-cliente">
                    {compra.cliente?.nombres} {compra.cliente?.apellidos}
                  </h3>
                  <span className="compra-fecha">{formatFecha(compra.fecha)}</span>
                </div>
                <div className="compra-total">
                  <span className="total-label">Total</span>
                  <span className="total-value">S/ {parseFloat(compra.total).toFixed(2)}</span>
                </div>
              </div>

              <div className="compra-detalles">
                <h4>Productos:</h4>
                <div className="productos-compra">
                  {compra.detalle_compra?.map((detalle, index) => (
                    <div key={index} className="producto-detalle">
                      <span className="producto-cantidad">{detalle.cantidad}x</span>
                      <span className="producto-nombre-detalle">
                        {detalle.producto?.nombre}
                      </span>
                      <span className="producto-subtotal">
                        S/ {parseFloat(detalle.subtotal).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="compra-footer">
                <span className="metodo-pago">
                  💳 {compra.metodo_pago || 'Efectivo'}
                </span>
                <span className={`estado-badge ${compra.estado}`}>
                  {compra.estado}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state-large">
          <div className="empty-icon">🛒</div>
          <h3>No hay ventas</h3>
          <p>
            {filtro === 'todas' 
              ? 'Aún no se han registrado ventas'
              : `No hay ventas para el período seleccionado`
            }
          </p>
          <button className="btn-primary" onClick={() => setIsVentaModalOpen(true)}>
            Registrar Primera Venta
          </button>
        </div>
      )}

      {/* Modal de Nueva Venta */}
      <VentaModal
        isOpen={isVentaModalOpen}
        onClose={() => setIsVentaModalOpen(false)}
        onSuccess={cargarCompras}
      />
    </div>
  )
}

export default ComprasList