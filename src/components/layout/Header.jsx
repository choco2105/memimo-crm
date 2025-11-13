import { useState } from 'react'
import './Header.css'

const Header = ({ title, subtitle }) => {
  const [showNotifications, setShowNotifications] = useState(false)

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

        {/* Usuario */}
        <div className="header-user">
          <div className="user-avatar">👤</div>
          <div className="user-info">
            <div className="user-name">Admin</div>
            <div className="user-role">Administrador</div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
