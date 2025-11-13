import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import './Sidebar.css'

const Sidebar = () => {
  const location = useLocation()
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
  ]

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(path)
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
          {menuItems.map((item) => (
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
        {!collapsed && (
          <div className="sidebar-user">
            <div className="user-avatar">👤</div>
            <div className="user-info">
              <div className="user-name">Administrador</div>
              <div className="user-role">Admin</div>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}

export default Sidebar
