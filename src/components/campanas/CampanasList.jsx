import { useState, useEffect } from 'react'
import { obtenerTodasCampanas, eliminarCampana, cambiarEstadoCampana } from '../../lib/supabase'
import CrearCampanaModal from './CrearCampanaModal'
import DetallesCampanaModal from './DetallesCampanaModal'
import './CampanasList.css'

const CampanasList = () => {
  const [campanas, setCampanas] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDetallesOpen, setIsDetallesOpen] = useState(false)
  const [campanaSeleccionada, setCampanaSeleccionada] = useState(null)
  const [modoEdicion, setModoEdicion] = useState(false)
  const [filtroEstado, setFiltroEstado] = useState('todas')

  useEffect(() => {
    cargarCampanas()
  }, [])

  const cargarCampanas = async () => {
    try {
      setLoading(true)
      const data = await obtenerTodasCampanas()
      setCampanas(data)
    } catch (error) {
      console.error('Error al cargar campañas:', error)
    } finally {
      setLoading(false)
    }
  }

  const campanasFiltradas = filtroEstado === 'todas' 
    ? campanas 
    : campanas.filter(c => c.estado === filtroEstado)

  const handleNuevaCampana = () => {
    setCampanaSeleccionada(null)
    setModoEdicion(false)
    setIsModalOpen(true)
  }

  const handleEditarCampana = (campana) => {
    setCampanaSeleccionada(campana)
    setModoEdicion(true)
    setIsModalOpen(true)
  }

  const handleVerDetalles = (campana) => {
    setCampanaSeleccionada(campana)
    setIsDetallesOpen(true)
  }

  const handleEliminarCampana = async (campana) => {
    if (!window.confirm(`¿Estás seguro de eliminar la campaña "${campana.nombre}"?\n\nEsta acción no se puede deshacer.`)) {
      return
    }

    try {
      await eliminarCampana(campana.id)
      alert('✅ Campaña eliminada correctamente')
      cargarCampanas()
    } catch (error) {
      console.error('Error al eliminar:', error)
      alert('❌ Error al eliminar la campaña')
    }
  }

  const handleCambiarEstado = async (campana, nuevoEstado) => {
    try {
      await cambiarEstadoCampana(campana.id, nuevoEstado)
      alert(`✅ Estado actualizado a "${nuevoEstado}"`)
      cargarCampanas()
    } catch (error) {
      console.error('Error al cambiar estado:', error)
      alert('❌ Error al cambiar el estado')
    }
  }

  const formatFecha = (fecha) => {
    if (!fecha) return '-'
    return new Date(fecha).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const getIconoCanal = (canal) => {
    const iconos = {
      'telegram': '📱',
      'whatsapp': '💬',
      'instagram': '📷',
      'facebook': '👥',
      'email': '📧'
    }
    return iconos[canal] || '📢'
  }

  const getEstadoColor = (estado) => {
    const colores = {
      'activa': '#28a745',
      'programada': '#ffc107',
      'finalizada': '#6c757d',
      'pausada': '#dc3545'
    }
    return colores[estado] || '#666'
  }

  if (loading) {
    return (
      <div className="campanas-loading">
        <div className="spinner-large"></div>
        <p>Cargando campañas...</p>
      </div>
    )
  }

  return (
    <div className="campanas-page">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Campañas de Marketing</h1>
          <span className="page-count">{campanasFiltradas.length} campañas</span>
        </div>
        <button className="btn-primary" onClick={handleNuevaCampana}>
          <span className="btn-icon">➕</span>
          Nueva Campaña
        </button>
      </div>

      {/* Filtros */}
      <div className="campanas-filtros">
        <button
          className={`filtro-estado ${filtroEstado === 'todas' ? 'active' : ''}`}
          onClick={() => setFiltroEstado('todas')}
        >
          Todas ({campanas.length})
        </button>
        <button
          className={`filtro-estado ${filtroEstado === 'activa' ? 'active' : ''}`}
          onClick={() => setFiltroEstado('activa')}
        >
          Activas ({campanas.filter(c => c.estado === 'activa').length})
        </button>
        <button
          className={`filtro-estado ${filtroEstado === 'programada' ? 'active' : ''}`}
          onClick={() => setFiltroEstado('programada')}
        >
          Programadas ({campanas.filter(c => c.estado === 'programada').length})
        </button>
        <button
          className={`filtro-estado ${filtroEstado === 'finalizada' ? 'active' : ''}`}
          onClick={() => setFiltroEstado('finalizada')}
        >
          Finalizadas ({campanas.filter(c => c.estado === 'finalizada').length})
        </button>
        <button
          className={`filtro-estado ${filtroEstado === 'pausada' ? 'active' : ''}`}
          onClick={() => setFiltroEstado('pausada')}
        >
          Pausadas ({campanas.filter(c => c.estado === 'pausada').length})
        </button>
      </div>

      {/* Grid de Campañas */}
      {campanasFiltradas.length > 0 ? (
        <div className="campanas-grid">
          {campanasFiltradas.map((campana) => (
            <div key={campana.id} className="campana-card">
              <div className="campana-header">
                <div className="campana-canal-badge">
                  {getIconoCanal(campana.canal)} {campana.canal}
                </div>
                <div 
                  className="campana-estado-badge"
                  style={{ backgroundColor: getEstadoColor(campana.estado) }}
                >
                  {campana.estado}
                </div>
              </div>

              <h3 className="campana-nombre">{campana.nombre}</h3>
              <p className="campana-descripcion">{campana.descripcion}</p>

              {campana.tipo_descuento && (
                <div className="campana-descuento">
                  <span className="descuento-icono">🎁</span>
                  <span className="descuento-texto">
                    {campana.tipo_descuento === 'porcentaje' 
                      ? `${campana.valor_descuento}% de descuento`
                      : `S/ ${campana.valor_descuento} de descuento`
                    }
                  </span>
                </div>
              )}

              <div className="campana-fechas">
                <div className="fecha-item">
                  <span className="fecha-label">Inicio:</span>
                  <span className="fecha-valor">{formatFecha(campana.fecha_inicio)}</span>
                </div>
                <div className="fecha-item">
                  <span className="fecha-label">Fin:</span>
                  <span className="fecha-valor">{formatFecha(campana.fecha_fin)}</span>
                </div>
              </div>

              <div className="campana-acciones">
                <button 
                  className="btn-accion-campana ver"
                  onClick={() => handleVerDetalles(campana)}
                  title="Ver detalles"
                >
                  👁️
                </button>
                <button 
                  className="btn-accion-campana editar"
                  onClick={() => handleEditarCampana(campana)}
                  title="Editar"
                >
                  ✏️
                </button>
                
                {/* Menú de estado */}
                <div className="dropdown-estado">
                  <button className="btn-accion-campana estado" title="Cambiar estado">
                    ⚙️
                  </button>
                  <div className="dropdown-menu">
                    {campana.estado !== 'activa' && (
                      <button onClick={() => handleCambiarEstado(campana, 'activa')}>
                        ✓ Activar
                      </button>
                    )}
                    {campana.estado !== 'pausada' && (
                      <button onClick={() => handleCambiarEstado(campana, 'pausada')}>
                        ⏸ Pausar
                      </button>
                    )}
                    {campana.estado !== 'finalizada' && (
                      <button onClick={() => handleCambiarEstado(campana, 'finalizada')}>
                        🏁 Finalizar
                      </button>
                    )}
                  </div>
                </div>

                <button 
                  className="btn-accion-campana eliminar"
                  onClick={() => handleEliminarCampana(campana)}
                  title="Eliminar"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state-large">
          <div className="empty-icon">📢</div>
          <h3>No hay campañas</h3>
          <p>
            {filtroEstado === 'todas'
              ? 'Aún no has creado ninguna campaña de marketing'
              : `No hay campañas con estado "${filtroEstado}"`
            }
          </p>
          <button className="btn-primary" onClick={handleNuevaCampana}>
            Crear Primera Campaña
          </button>
        </div>
      )}

      {/* Modal Crear/Editar */}
      <CrearCampanaModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setCampanaSeleccionada(null)
          setModoEdicion(false)
        }}
        campana={campanaSeleccionada}
        modoEdicion={modoEdicion}
        onSuccess={cargarCampanas}
      />

      {/* Modal Detalles */}
      <DetallesCampanaModal
        isOpen={isDetallesOpen}
        onClose={() => {
          setIsDetallesOpen(false)
          setCampanaSeleccionada(null)
        }}
        campana={campanaSeleccionada}
      />
    </div>
  )
}

export default CampanasList