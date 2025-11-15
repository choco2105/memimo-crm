import { useState, useEffect } from 'react'
import { obtenerEstadisticasCampana } from '../../lib/supabase'
import './CrearCampanaModal.css'

const DetallesCampanaModal = ({ isOpen, onClose, campana }) => {
  const [estadisticas, setEstadisticas] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && campana) {
      cargarEstadisticas()
    }
  }, [isOpen, campana])

  const cargarEstadisticas = async () => {
    setLoading(true)
    try {
      const stats = await obtenerEstadisticasCampana(campana.id)
      setEstadisticas(stats)
    } catch (error) {
      console.error('Error al cargar estadísticas:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatFecha = (fecha) => {
    if (!fecha) return '-'
    return new Date(fecha).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'long',
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

  if (!isOpen || !campana) return null

  return (
    <div className="campana-modal-overlay" onClick={onClose}>
      <div className="campana-modal-content" style={{ maxWidth: '700px' }} onClick={(e) => e.stopPropagation()}>
        <div className="campana-modal-header">
          <h2 className="step-title">👁️ Detalles de la Campaña</h2>
          <button className="campana-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="campana-modal-body">
          <div className="campana-step">
            {/* Información básica */}
            <div className="preview-card" style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem' }}>{campana.nombre}</h3>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{ 
                      padding: '0.25rem 0.75rem', 
                      background: '#f0f0f0', 
                      borderRadius: '20px', 
                      fontSize: '0.85rem',
                      fontWeight: '600'
                    }}>
                      {getIconoCanal(campana.canal)} {campana.canal}
                    </span>
                    <span style={{ 
                      padding: '0.25rem 0.75rem', 
                      background: campana.estado === 'activa' ? '#28a745' : '#6c757d', 
                      color: 'white',
                      borderRadius: '20px', 
                      fontSize: '0.85rem',
                      fontWeight: '700',
                      textTransform: 'uppercase'
                    }}>
                      {campana.estado}
                    </span>
                  </div>
                </div>
              </div>

              <p style={{ color: '#666', lineHeight: '1.6', margin: '1rem 0' }}>
                {campana.descripcion}
              </p>

              {campana.tipo_descuento && (
                <div style={{ 
                  background: '#fff0f0', 
                  border: '2px solid #f22121', 
                  borderRadius: '8px', 
                  padding: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}>
                  <span style={{ fontSize: '2rem' }}>🎁</span>
                  <div>
                    <strong style={{ color: '#f22121', fontSize: '1.1rem' }}>
                      {campana.tipo_descuento === 'porcentaje' 
                        ? `${campana.valor_descuento}% de descuento`
                        : `S/ ${campana.valor_descuento} de descuento`
                      }
                    </strong>
                  </div>
                </div>
              )}
            </div>

            {/* Fechas */}
            <div className="preview-card" style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ margin: '0 0 1rem 0' }}>📅 Período</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <span style={{ fontSize: '0.8rem', color: '#999', display: 'block', marginBottom: '0.25rem' }}>
                    Fecha de inicio
                  </span>
                  <strong style={{ fontSize: '1rem' }}>{formatFecha(campana.fecha_inicio)}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.8rem', color: '#999', display: 'block', marginBottom: '0.25rem' }}>
                    Fecha de fin
                  </span>
                  <strong style={{ fontSize: '1rem' }}>{formatFecha(campana.fecha_fin)}</strong>
                </div>
              </div>
            </div>

            {/* Estadísticas */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <div className="spinner-large"></div>
                <p>Cargando estadísticas...</p>
              </div>
            ) : estadisticas && (
              <div className="preview-card">
                <h4 style={{ margin: '0 0 1rem 0' }}>📊 Estadísticas</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                  <div style={{ 
                    background: 'white', 
                    padding: '1rem', 
                    borderRadius: '8px',
                    border: '2px solid #e0e0e0',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '2rem', fontWeight: '700', color: '#f22121' }}>
                      {estadisticas.total_enviados}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem' }}>
                      Mensajes enviados
                    </div>
                  </div>
                  <div style={{ 
                    background: 'white', 
                    padding: '1rem', 
                    borderRadius: '8px',
                    border: '2px solid #e0e0e0',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '2rem', fontWeight: '700', color: '#28a745' }}>
                      {estadisticas.total_respondieron}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem' }}>
                      Respuestas
                    </div>
                  </div>
                </div>

                {estadisticas.total_enviados > 0 && (
                  <div style={{ marginTop: '1rem', textAlign: 'center', color: '#666' }}>
                    Tasa de respuesta: <strong>
                      {((estadisticas.total_respondieron / estadisticas.total_enviados) * 100).toFixed(1)}%
                    </strong>
                  </div>
                )}
              </div>
            )}

            {/* Fecha de creación */}
            <div style={{ 
              marginTop: '1.5rem', 
              paddingTop: '1rem', 
              borderTop: '2px solid #e0e0e0',
              fontSize: '0.85rem',
              color: '#999',
              textAlign: 'center'
            }}>
              Creada el {formatFecha(campana.created_at)}
            </div>
          </div>
        </div>

        <div className="campana-modal-footer">
          <button className="btn-campana-secondary" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

export default DetallesCampanaModal