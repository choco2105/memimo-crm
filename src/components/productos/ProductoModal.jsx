import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import '../clientes/ClienteModal.css'

const ProductoModal = ({ isOpen, onClose, producto = null, categorias = [], onSuccess }) => {
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    categoria_id: '',
    disponible: true,
    es_topping: false,
  })

  useEffect(() => {
    if (producto) {
      setFormData({
        nombre: producto.nombre || '',
        descripcion: producto.descripcion || '',
        precio: producto.precio || '',
        categoria_id: producto.categoria_id || '',
        disponible: producto.disponible ?? true,
        es_topping: producto.es_topping || false,
      })
    } else {
      setFormData({
        nombre: '',
        descripcion: '',
        precio: '',
        categoria_id: categorias[0]?.id || '',
        disponible: true,
        es_topping: false,
      })
    }
    setErrors({})
  }, [producto, isOpen, categorias])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es obligatorio'
    }

    if (!formData.precio || parseFloat(formData.precio) <= 0) {
      newErrors.precio = 'El precio debe ser mayor a 0'
    }

    if (!formData.categoria_id) {
      newErrors.categoria_id = 'Debes seleccionar una categoría'
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
      const dataToSend = {
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim() || null,
        precio: parseFloat(formData.precio),
        categoria_id: formData.categoria_id,
        disponible: formData.disponible,
        es_topping: formData.es_topping,
      }

      if (producto) {
        const { error } = await supabase
          .from('productos')
          .update(dataToSend)
          .eq('id', producto.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('productos')
          .insert([dataToSend])

        if (error) throw error
      }

      onSuccess && onSuccess()
      onClose()
    } catch (error) {
      console.error('Error al guardar producto:', error)
      setErrors({ general: 'Error al guardar el producto.' })
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
            {producto ? '✏️ Editar Producto' : '➕ Nuevo Producto'}
          </h2>
          <button className="modal-close" onClick={onClose} type="button">
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
              <div className="form-field full-width">
                <label className="form-label required">Nombre del Producto</label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Ej: Crepe Suprema"
                  required
                />
                {errors.nombre && <span className="form-error">{errors.nombre}</span>}
              </div>

              <div className="form-field">
                <label className="form-label required">Categoría</label>
                <select
                  name="categoria_id"
                  value={formData.categoria_id}
                  onChange={handleChange}
                  className="form-input"
                  required
                >
                  <option value="">Seleccionar categoría</option>
                  {categorias.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.nombre}
                    </option>
                  ))}
                </select>
                {errors.categoria_id && <span className="form-error">{errors.categoria_id}</span>}
              </div>

              <div className="form-field">
                <label className="form-label required">Precio (S/)</label>
                <input
                  type="number"
                  name="precio"
                  value={formData.precio}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  required
                />
                {errors.precio && <span className="form-error">{errors.precio}</span>}
              </div>

              <div className="form-field full-width">
                <label className="form-label">Descripción</label>
                <textarea
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleChange}
                  className="form-textarea"
                  placeholder="Describe el producto..."
                  rows="3"
                />
              </div>

              <div className="form-field">
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    name="disponible"
                    checked={formData.disponible}
                    onChange={handleChange}
                  />
                  <span className="form-label" style={{ margin: 0 }}>Disponible</span>
                </label>
              </div>

              <div className="form-field">
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    name="es_topping"
                    checked={formData.es_topping}
                    onChange={handleChange}
                  />
                  <span className="form-label" style={{ margin: 0 }}>Es un topping</span>
                </label>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? (
                <>
                  <span className="loading-spinner"></span>
                  Guardando...
                </>
              ) : (
                <>{producto ? 'Actualizar' : 'Crear Producto'}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ProductoModal