// ============================================
// CONTEXT DE AUTENTICACIÓN - MEMIMO CRM
// Manejo global de sesión y usuario
// ============================================

import { createContext, useContext, useState, useEffect } from 'react'
import { login as loginAPI, logout as logoutAPI, verificarSesion } from '../lib/auth'

const AuthContext = createContext()

// Hook personalizado para usar el contexto
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  // Al montar el componente, verificar si hay sesión guardada
  useEffect(() => {
    verificarSesionActual()
  }, [])

  /**
   * Verificar sesión guardada en localStorage
   */
  const verificarSesionActual = async () => {
    try {
      setLoading(true)
      
      // Obtener token guardado
      const tokenGuardado = localStorage.getItem('memimo_token')
      
      if (!tokenGuardado) {
        setLoading(false)
        return
      }

      // Verificar que el token siga siendo válido
      const resultado = await verificarSesion(tokenGuardado)
      
      if (resultado && resultado.user) {
        // Sesión válida
        setUser(resultado.user)
        setToken(resultado.token)
        setIsAuthenticated(true)
        setIsAdmin(resultado.user.rol === 'admin')
        
        // Actualizar localStorage con nueva fecha de expiración si viene
        if (resultado.expira) {
          localStorage.setItem('memimo_expira', resultado.expira)
        }
      } else {
        // Sesión inválida o expirada
        limpiarSesion()
      }
    } catch (error) {
      console.error('Error al verificar sesión:', error)
      limpiarSesion()
    } finally {
      setLoading(false)
    }
  }

  /**
   * Login
   */
  const login = async (email, password) => {
    try {
      setLoading(true)
      
      const resultado = await loginAPI(email, password)
      
      if (resultado.success) {
        // Guardar en estado
        setUser(resultado.user)
        setToken(resultado.token)
        setIsAuthenticated(true)
        setIsAdmin(resultado.user.rol === 'admin')
        
        // Guardar en localStorage
        localStorage.setItem('memimo_token', resultado.token)
        localStorage.setItem('memimo_user', JSON.stringify(resultado.user))
        localStorage.setItem('memimo_expira', resultado.expira)
        
        return { success: true }
      } else {
        return {
          success: false,
          error: resultado.error
        }
      }
    } catch (error) {
      console.error('Error en login:', error)
      return {
        success: false,
        error: 'Error al iniciar sesión'
      }
    } finally {
      setLoading(false)
    }
  }

  /**
   * Logout
   */
  const logout = async () => {
    try {
      setLoading(true)
      
      if (token) {
        await logoutAPI(token)
      }
      
      limpiarSesion()
      
      return { success: true }
    } catch (error) {
      console.error('Error en logout:', error)
      limpiarSesion()
      return { success: false, error: 'Error al cerrar sesión' }
    } finally {
      setLoading(false)
    }
  }

  /**
   * Limpiar sesión
   */
  const limpiarSesion = () => {
    setUser(null)
    setToken(null)
    setIsAuthenticated(false)
    setIsAdmin(false)
    
    localStorage.removeItem('memimo_token')
    localStorage.removeItem('memimo_user')
    localStorage.removeItem('memimo_expira')
  }

  /**
   * Verificar si el token ha expirado
   */
  const verificarExpiracion = () => {
    const expira = localStorage.getItem('memimo_expira')
    
    if (!expira) {
      return true // Considerarlo expirado si no hay fecha
    }
    
    const fechaExpiracion = new Date(expira)
    const ahora = new Date()
    
    return ahora > fechaExpiracion
  }

  /**
   * Auto-logout si el token ha expirado
   */
  useEffect(() => {
    if (!isAuthenticated) return

    // Verificar cada minuto si el token ha expirado
    const intervalo = setInterval(() => {
      if (verificarExpiracion()) {
        console.log('Sesión expirada. Cerrando sesión automáticamente...')
        logout()
      }
    }, 60000) // Cada 60 segundos

    return () => clearInterval(intervalo)
  }, [isAuthenticated])

  const value = {
    user,
    token,
    loading,
    isAuthenticated,
    isAdmin,
    login,
    logout,
    verificarSesionActual
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthContext