import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import './Sidebar.css'

const Sidebar = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, isAdmin, logout } = useAuth()
  const [collapsed, setCollapsed] = useState(false)

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: '📊',
      path: '/',
    },
    {
      id: 'clientes',
      label: 'Clientes',
      icon: '👥',
      path: '/clientes',
    },
    {
      id: 'productos',
      label: 'Productos',
      icon: '🍦',
      path: '/productos',
    },
    {
      id: 'compras',
      label: 'Compras',
      icon: '🛒',
      path: '/compras',
    },
    {
      id: 'campanas',
      label: 'Campañas',
      icon: '📢',
      path: '/campanas',
    },
    {
      id: 'reportes',
      label: 'Reportes',
      icon: '📈',
      path: '/reportes',
    },
    {
      id: 'usuarios',
      label: 'Usuarios',
      icon: '👤',
      path: '/usuarios',
      adminOnly: true // Solo visible para admin
    },
  ]

  // Filtrar menú según rol
  const menuItemsFiltrados = menuItems.filter(item => {
    if (item.adminOnly) {
      return isAdmin
    }
    return true
  })

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(path)
  }

  const handleLogout = async () => {
    if (window.confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      await logout()
      navigate('/login')
    }
  }

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Logo y Header */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="logo-icon">🎯</div>
          {!collapsed && (
            <div className="logo-text">
              <span className="logo-memimo">MEMIMO</span>
              <span className="logo-subtitle">CRM</span>
            </div>
          )}
        </div>
        <button
          className="sidebar-toggle"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
        >
          {collapsed ? '→' : '←'}
        </button>
      </div>

      {/* Navegación */}
      <nav className="sidebar-nav">
        <ul className="sidebar-menu">
          {menuItemsFiltrados.map((item) => (
            <li key={item.id}>
              <Link
                to={item.path}
                className={`sidebar-link ${isActive(item.path) ? 'active' : ''}`}
                title={collapsed ? item.label : ''}
              >
                <span className="sidebar-icon">{item.icon}</span>
                {!collapsed && <span className="sidebar-label">{item.label}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        {!collapsed ? (
          <>
            <div className="sidebar-user">
              <div className="user-avatar">
                {user?.nombre?.charAt(0)}{user?.apellido?.charAt(0)}
              </div>
              <div className="user-info">
                <div className="user-name">{user?.nombre} {user?.apellido}</div>
                <div className="user-role">
                  {isAdmin && <span className="admin-badge">👑 </span>}
                  {user?.rol}
                </div>
              </div>
            </div>
            <button 
              className="btn-logout"
              onClick={handleLogout}
              title="Cerrar sesión"
            >
              <span>🚪</span>
              <span>Cerrar Sesión</span>
            </button>
          </>
        ) : (
          <button 
            className="btn-logout-collapsed"
            onClick={handleLogout}
            title="Cerrar sesión"
          >
            🚪
          </button>
        )}
      </div>
    </aside>
  )
}

export default Sidebar