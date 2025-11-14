import { useState, useEffect } from 'react'
import { crearCliente, actualizarCliente } from '../../lib/supabase'
import './ClienteModal.css'

const ClienteModal = ({ isOpen, onClose, cliente = null, onSuccess }) => {
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [formData, setFormData] = useState({
    dni: '',
    celular: '',
    apellidos: '',
    nombres: '',
    email: '',
    fecha_nacimiento: '',
    direccion: '',
    notas: ''
  })

  useEffect(() => {
    if (cliente) {
      setFormData({
        dni: cliente.dni || '',
        celular: cliente.celular || '',
        apellidos: cliente.apellidos || '',
        nombres: cliente.nombres || '',
        email: cliente.email || '',
        fecha_nacimiento: cliente.fecha_nacimiento || '',
        direccion: cliente.direccion || '',
        notas: cliente.notas || ''
      })
    } else {
      setFormData({
        dni: '',
        celular: '',
        apellidos: '',
        nombres: '',
        email: '',
        fecha_nacimiento: '',
        direccion: '',
        notas: ''
      })
    }
    setErrors({})
  }, [cliente, isOpen])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Limpiar error del campo
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.nombres.trim()) {
      newErrors.nombres = 'El nombre es obligatorio'
    }

    if (!formData.apellidos.trim()) {
      newErrors.apellidos = 'Los apellidos son obligatorios'
    }

    if (formData.dni && formData.dni.length !== 8) {
      newErrors.dni = 'El DNI debe tener 8 dígitos'
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido'
    }

    if (formData.celular && formData.celular.length < 9) {
      newErrors.celular = 'El celular debe tener al menos 9 dígitos'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      // Limpiar campos vacíos
      const dataToSend = {}
      Object.keys(formData).forEach(key => {
        if (formData[key] && formData[key].trim() !== '') {
          dataToSend[key] = formData[key].trim()
        }
      })

      if (cliente) {
        // Actualizar cliente existente
        await actualizarCliente(cliente.id, dataToSend)
      } else {
        // Crear nuevo cliente
        await crearCliente(dataToSend)
      }

      onSuccess && onSuccess()
      onClose()
    } catch (error) {
      console.error('Error al guardar cliente:', error)
      setErrors({ general: 'Error al guardar el cliente. Por favor, intenta de nuevo.' })
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {cliente ? '✏️ Editar Cliente' : '➕ Nuevo Cliente'}
          </h2>
          <button
            className="modal-close"
            onClick={onClose}
            type="button"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {errors.general && (
              <div className="form-error" style={{ marginBottom: '1rem' }}>
                {errors.general}
              </div>
            )}

            <div className="form-grid">
              <div className="form-field">
                <label className="form-label required">Nombres</label>
                <input
                  type="text"
                  name="nombres"
                  value={formData.nombres}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Ej: Juan Carlos"
                  required
                />
                {errors.nombres && (
                  <span className="form-error">{errors.nombres}</span>
                )}
              </div>

              <div className="form-field">
                <label className="form-label required">Apellidos</label>
                <input
                  type="text"
                  name="apellidos"
                  value={formData.apellidos}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Ej: Pérez García"
                  required
                />
                {errors.apellidos && (
                  <span className="form-error">{errors.apellidos}</span>
                )}
              </div>

              <div className="form-field">
                <label className="form-label">DNI</label>
                <input
                  type="text"
                  name="dni"
                  value={formData.dni}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="12345678"
                  maxLength="8"
                />
                {errors.dni && (
                  <span className="form-error">{errors.dni}</span>
                )}
              </div>

              <div className="form-field">
                <label className="form-label">Celular</label>
                <input
                  type="tel"
                  name="celular"
                  value={formData.celular}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="987654321"
                />
                {errors.celular && (
                  <span className="form-error">{errors.celular}</span>
                )}
              </div>

              <div className="form-field">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="ejemplo@email.com"
                />
                {errors.email && (
                  <span className="form-error">{errors.email}</span>
                )}
              </div>

              <div className="form-field">
                <label className="form-label">Fecha de Nacimiento</label>
                <input
                  type="date"
                  name="fecha_nacimiento"
                  value={formData.fecha_nacimiento}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>

              <div className="form-field full-width">
                <label className="form-label">Dirección</label>
                <input
                  type="text"
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Av. Principal 123, Huancayo"
                />
              </div>

              <div className="form-field full-width">
                <label className="form-label">Notas</label>
                <textarea
                  name="notas"
                  value={formData.notas}
                  onChange={handleChange}
                  className="form-textarea"
                  placeholder="Información adicional sobre el cliente..."
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn-cancel"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="loading-spinner"></span>
                  Guardando...
                </>
              ) : (
                <>
                  {cliente ? 'Actualizar' : 'Crear Cliente'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ClienteModal