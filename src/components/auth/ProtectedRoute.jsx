// ============================================
// PROTECTED ROUTE - MEMIMO CRM
// Proteger rutas según autenticación y rol
// ============================================

import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth()

  // Mostrar loader mientras verifica la sesión
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: '1rem'
      }}>
        <div className="spinner-large"></div>
        <p style={{ color: '#666' }}>Verificando acceso...</p>
      </div>
    )
  }

  // Si no está autenticado, redirigir al login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Si requiere rol de admin y no es admin, redirigir al dashboard
  if (requiredRole === 'admin' && !isAdmin) {
    return <Navigate to="/" replace />
  }

  // Si todo está bien, mostrar el componente
  return children
}

export default ProtectedRoute