// ============================================
// MODAL DE USUARIO - MEMIMO CRM
// Crear/Editar usuarios (SOLO ADMIN)
// ============================================

import { useState, useEffect } from 'react'
import { register, actualizarUsuario } from '../../lib/auth'
import { supabase } from '../../lib/supabase'
import '../clientes/ClienteModal.css'

const UsuarioModal = ({ isOpen, onClose, usuario = null, onSuccess, adminId }) => {
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [roles, setRoles] = useState([])
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    nombre: '',
    apellido: '',
    rol_id: '',
    activo: true
  })

  useEffect(() => {
    if (isOpen) {
      cargarRoles()
    }
  }, [isOpen])

  useEffect(() => {
    if (usuario) {
      // Modo edición
      setFormData({
        email: usuario.email || '',
        password: '',
        confirmPassword: '',
        nombre: usuario.nombre || '',
        apellido: usuario.apellido || '',
        rol_id: usuario.rol_id || '',
        activo: usuario.activo ?? true
      })
    } else {
      // Modo creación
      setFormData({
        email: '',
        password: '',
        confirmPassword: '',
        nombre: '',
        apellido: '',
        rol_id: roles[0]?.id || '',
        activo: true
      })
    }
    setErrors({})
  }, [usuario, isOpen, roles])

  const cargarRoles = async () => {
    try {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .order('nombre')

      if (error) throw error
      setRoles(data)
      
      if (!usuario && data.length > 0) {
        setFormData(prev => ({ ...prev, rol_id: data[0].id }))
      }
    } catch (error) {
      console.error('Error al cargar roles:', error)
    }
  }

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

    // Email
    if (!formData.email.trim()) {
      newErrors.email = 'El email es obligatorio'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido'
    }

    // Password (solo en creación o si se está cambiando)
    if (!usuario) {
      // Modo creación - password obligatorio
      if (!formData.password) {
        newErrors.password = 'La contraseña es obligatoria'
      } else if (formData.password.length < 6) {
        newErrors.password = 'La contraseña debe tener al menos 6 caracteres'
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Las contraseñas no coinciden'
      }
    }

    // Nombre y apellido
    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es obligatorio'
    }

    if (!formData.apellido.trim()) {
      newErrors.apellido = 'El apellido es obligatorio'
    }

    // Rol
    if (!formData.rol_id) {
      newErrors.rol_id = 'Debes seleccionar un rol'
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
      if (usuario) {
        // MODO EDICIÓN
        const resultado = await actualizarUsuario(
          usuario.usuario_id,
          {
            nombre: formData.nombre.trim(),
            apellido: formData.apellido.trim(),
            rol_id: formData.rol_id,
            activo: formData.activo
          },
          adminId
        )

        if (resultado.success) {
          alert('✅ Usuario actualizado correctamente')
          onSuccess && onSuccess()
          onClose()
        } else {
          setErrors({ general: resultado.error })
        }
      } else {
        // MODO CREACIÓN
        const resultado = await register(
          {
            email: formData.email.trim(),
            password: formData.password,
            nombre: formData.nombre.trim(),
            apellido: formData.apellido.trim(),
            rol_id: formData.rol_id
          },
          adminId
        )

        if (resultado.success) {
          alert('✅ Usuario creado correctamente')
          onSuccess && onSuccess()
          onClose()
        } else {
          setErrors({ general: resultado.error })
        }
      }
    } catch (error) {
      console.error('Error al guardar usuario:', error)
      setErrors({ general: 'Error al guardar el usuario' })
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
            {usuario ? '✏️ Editar Usuario' : '➕ Nuevo Usuario'}
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
              {/* Email */}
              <div className="form-field full-width">
                <label className="form-label required">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="usuario@memimo.com"
                  disabled={!!usuario} // No editable en modo edición
                  required
                />
                {errors.email && <span className="form-error">{errors.email}</span>}
              </div>

              {/* Password - Solo en modo creación */}
              {!usuario && (
                <>
                  <div className="form-field">
                    <label className="form-label required">Contraseña</label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="Mínimo 6 caracteres"
                      required
                    />
                    {errors.password && <span className="form-error">{errors.password}</span>}
                  </div>

                  <div className="form-field">
                    <label className="form-label required">Confirmar Contraseña</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="Repite la contraseña"
                      required
                    />
                    {errors.confirmPassword && (
                      <span className="form-error">{errors.confirmPassword}</span>
                    )}
                  </div>
                </>
              )}

              {/* Nombre */}
              <div className="form-field">
                <label className="form-label required">Nombre</label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Ej: Juan"
                  required
                />
                {errors.nombre && <span className="form-error">{errors.nombre}</span>}
              </div>

              {/* Apellido */}
              <div className="form-field">
                <label className="form-label required">Apellido</label>
                <input
                  type="text"
                  name="apellido"
                  value={formData.apellido}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Ej: Pérez"
                  required
                />
                {errors.apellido && <span className="form-error">{errors.apellido}</span>}
              </div>

              {/* Rol */}
              <div className="form-field">
                <label className="form-label required">Rol</label>
                <select
                  name="rol_id"
                  value={formData.rol_id}
                  onChange={handleChange}
                  className="form-input"
                  required
                >
                  <option value="">Seleccionar rol</option>
                  {roles.map(rol => (
                    <option key={rol.id} value={rol.id}>
                      {rol.nombre === 'admin' && '👑 '}
                      {rol.nombre.charAt(0).toUpperCase() + rol.nombre.slice(1)}
                    </option>
                  ))}
                </select>
                {errors.rol_id && <span className="form-error">{errors.rol_id}</span>}
              </div>

              {/* Estado - Solo en modo edición */}
              {usuario && (
                <div className="form-field">
                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem', 
                    cursor: 'pointer' 
                  }}>
                    <input
                      type="checkbox"
                      name="activo"
                      checked={formData.activo}
                      onChange={handleChange}
                    />
                    <span className="form-label" style={{ margin: 0 }}>
                      Usuario Activo
                    </span>
                  </label>
                </div>
              )}
            </div>

            {usuario && (
              <div style={{ 
                marginTop: '1rem', 
                padding: '1rem', 
                background: '#fff3cd', 
                border: '2px solid #ffc107',
                borderRadius: '8px',
                fontSize: '0.85rem',
                color: '#856404'
              }}>
                <strong>Nota:</strong> No es posible cambiar el email o la contraseña desde aquí.
                Si necesitas modificarlos, contacta al desarrollador del sistema.
              </div>
            )}
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
                <>{usuario ? 'Actualizar Usuario' : 'Crear Usuario'}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default UsuarioModal