// ============================================
// PÁGINA DE LOGIN - MEMIMO CRM
// ============================================

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Login.css'

const Login = () => {
  const navigate = useNavigate()
  const { login, isAuthenticated, loading: authLoading } = useAuth()
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [recordar, setRecordar] = useState(false)

  // Si ya está autenticado, redirigir al dashboard
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      navigate('/')
    }
  }, [isAuthenticated, authLoading, navigate])

  // Cargar credenciales recordadas
  useEffect(() => {
    const emailRecordado = localStorage.getItem('memimo_email_recordado')
    if (emailRecordado) {
      setFormData(prev => ({ ...prev, email: emailRecordado }))
      setRecordar(true)
    }
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Limpiar error al escribir
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validaciones
    if (!formData.email || !formData.password) {
      setError('Por favor, completa todos los campos')
      return
    }

    if (!formData.email.includes('@')) {
      setError('Email inválido')
      return
    }

    try {
      setLoading(true)
      setError('')

      const resultado = await login(formData.email, formData.password)

      if (resultado.success) {
        // Guardar email si marcó "Recordar"
        if (recordar) {
          localStorage.setItem('memimo_email_recordado', formData.email)
        } else {
          localStorage.removeItem('memimo_email_recordado')
        }

        // Redirigir al dashboard
        navigate('/')
      } else {
        setError(resultado.error || 'Error al iniciar sesión')
      }
    } catch (err) {
      console.error('Error en login:', err)
      setError('Error al conectar con el servidor')
    } finally {
      setLoading(false)
    }
  }

  // Mostrar loader mientras verifica sesión
  if (authLoading) {
    return (
      <div className="login-loading">
        <div className="spinner-large"></div>
        <p>Verificando sesión...</p>
      </div>
    )
  }

  return (
    <div className="login-page">
      <div className="login-container">
        {/* Logo */}
        <div className="login-logo">
          <div className="logo-icon-login">🎯</div>
          <h1 className="logo-title-login">MEMIMO</h1>
          <p className="logo-subtitle-login">CRM HELADERÍA</p>
        </div>

        {/* Formulario */}
        <div className="login-card">
          <h2 className="login-title">Iniciar Sesión</h2>
          <p className="login-subtitle">Ingresa tus credenciales para acceder</p>

          {error && (
            <div className="login-error">
              <span className="error-icon">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label className="form-label-login">Email</label>
              <div className="input-wrapper">
                <span className="input-icon">📧</span>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="usuario@memimo.com"
                  className="form-input-login"
                  disabled={loading}
                  autoFocus
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label-login">Contraseña</label>
              <div className="input-wrapper">
                <span className="input-icon">🔒</span>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="form-input-login"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-options">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={recordar}
                  onChange={(e) => setRecordar(e.target.checked)}
                  disabled={loading}
                />
                <span>Recordar mi email</span>
              </label>
            </div>

            <button
              type="submit"
              className="btn-login"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-small"></span>
                  Iniciando sesión...
                </>
              ) : (
                <>
                  <span>Iniciar Sesión</span>
                  <span>→</span>
                </>
              )}
            </button>
          </form>

          <div className="login-footer">
            <p>¿Problemas para acceder?</p>
            <p>Contacta al administrador del sistema</p>
          </div>
        </div>

        {/* Info */}
        <div className="login-info">
          <p>🍦 Sistema de Gestión Memimo</p>
          <p>Huancayo, Perú</p>
        </div>
      </div>
    </div>
  )
}

export default Login