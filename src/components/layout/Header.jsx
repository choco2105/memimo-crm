import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import './Header.css'

const Header = ({ title, subtitle }) => {
  const navigate = useNavigate()
  const { user, isAdmin, logout } = useAuth()
  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  const notifications = [
    { id: 1, type: 'success', message: 'Nueva compra registrada', time: 'Hace 5 min' },
    { id: 2, type: 'info', message: 'Cliente nuevo registrado', time: 'Hace 15 min' },
    { id: 3, type: 'warning', message: 'Stock bajo en Crepe Suprema', time: 'Hace 1 hora' },
  ]

  const currentDate = new Date().toLocaleDateString('es-PE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  const handleLogout = async () => {
    if (window.confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      await logout()
      navigate('/login')
    }
  }

  return (
    <header className="header">
      <div className="header-left">
        <div className="header-title-group">
          <h1 className="header-title">{title}</h1>
          {subtitle && <p className="header-subtitle">{subtitle}</p>}
        </div>
        <div className="header-date">{currentDate}</div>
      </div>

      <div className="header-right">
        {/* Buscador rápido */}
        <div className="header-search">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Buscar clientes, productos..."
            className="search-input"
          />
        </div>

        {/* Notificaciones */}
        <div className="header-notifications">
          <button
            className="notification-button"
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Notificaciones"
          >
            🔔
            {notifications.length > 0 && (
              <span className="notification-badge">{notifications.length}</span>
            )}
          </button>

          {showNotifications && (
            <div className="notification-dropdown">
              <div className="notification-header">
                <h3>Notificaciones</h3>
                <button className="notification-close" onClick={() => setShowNotifications(false)}>
                  ✕
                </button>
              </div>
              <div className="notification-list">
                {notifications.length > 0 ? (
                  notifications.map((notif) => (
                    <div key={notif.id} className={`notification-item ${notif.type}`}>
                      <div className="notification-content">
                        <p className="notification-message">{notif.message}</p>
                        <span className="notification-time">{notif.time}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="notification-empty">
                    <p>No hay notificaciones nuevas</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Usuario con Dropdown */}
        <div className="header-user-container">
          <div 
            className="header-user"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <div className="user-avatar">
              {user?.nombre?.charAt(0)}{user?.apellido?.charAt(0)}
            </div>
            <div className="user-info">
              <div className="user-name">
                {user?.nombre} {user?.apellido}
                {isAdmin && <span className="admin-badge-header">👑</span>}
              </div>
              <div className="user-role">{user?.rol}</div>
            </div>
            <span className="dropdown-arrow">{showUserMenu ? '▲' : '▼'}</span>
          </div>

          {/* Dropdown Menu */}
          {showUserMenu && (
            <div className="user-dropdown">
              <div className="user-dropdown-header">
                <div className="user-avatar-large">
                  {user?.nombre?.charAt(0)}{user?.apellido?.charAt(0)}
                </div>
                <div className="user-dropdown-info">
                  <div className="user-dropdown-name">
                    {user?.nombre} {user?.apellido}
                  </div>
                  <div className="user-dropdown-email">{user?.email}</div>
                  <div className="user-dropdown-role">
                    {isAdmin && '👑 '}
                    {user?.rol}
                  </div>
                </div>
              </div>

              <div className="user-dropdown-divider"></div>

              <div className="user-dropdown-menu">
                {isAdmin && (
                  <button
                    className="user-dropdown-item"
                    onClick={() => {
                      setShowUserMenu(false)
                      navigate('/usuarios')
                    }}
                  >
                    <span className="dropdown-item-icon">👥</span>
                    <span>Gestión de Usuarios</span>
                  </button>
                )}
                <button
                  className="user-dropdown-item danger"
                  onClick={() => {
                    setShowUserMenu(false)
                    handleLogout()
                  }}
                >
                  <span className="dropdown-item-icon">🚪</span>
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header