// ============================================
// GESTIÓN DE USUARIOS - MEMIMO CRM
// Panel completo de administración (SOLO ADMIN)
// ============================================

import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { obtenerUsuarios, desactivarUsuario } from '../../lib/auth'
import { supabase } from '../../lib/supabase'
import UsuarioModal from './UsuarioModal'
import './GestionUsuarios.css'

const GestionUsuarios = () => {
  const { user, isAdmin } = useAuth()
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroRol, setFiltroRol] = useState('todos')
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null)

  useEffect(() => {
    if (isAdmin) {
      cargarUsuarios()
    }
  }, [isAdmin])

  const cargarUsuarios = async () => {
    try {
      setLoading(true)
      const resultado = await obtenerUsuarios(user.id)
      
      if (resultado.success) {
        setUsuarios(resultado.usuarios)
      } else {
        console.error('Error al cargar usuarios:', resultado.error)
      }
    } catch (error) {
      console.error('Error al cargar usuarios:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filtrar usuarios
  const usuariosFiltrados = usuarios.filter(u => {
    const matchBusqueda = searchTerm === '' || 
      u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())

    const matchRol = filtroRol === 'todos' || u.rol_nombre.toLowerCase() === filtroRol

    const matchEstado = filtroEstado === 'todos' ||
      (filtroEstado === 'activos' && u.activo) ||
      (filtroEstado === 'inactivos' && !u.activo)

    return matchBusqueda && matchRol && matchEstado
  })

  const handleNuevoUsuario = () => {
    setUsuarioSeleccionado(null)
    setIsModalOpen(true)
  }

  const handleEditarUsuario = (usuario) => {
    setUsuarioSeleccionado(usuario)
    setIsModalOpen(true)
  }

  const handleToggleEstado = async (usuario) => {
    const accion = usuario.activo ? 'desactivar' : 'activar'
    const mensaje = usuario.activo 
      ? `¿Desactivar a ${usuario.nombre} ${usuario.apellido}?\n\nEsto cerrará todas sus sesiones activas.`
      : `¿Activar a ${usuario.nombre} ${usuario.apellido}?`

    if (!window.confirm(mensaje)) {
      return
    }

    try {
      if (usuario.activo) {
        // Desactivar
        const resultado = await desactivarUsuario(usuario.usuario_id, user.id)
        if (resultado.success) {
          alert('✅ Usuario desactivado correctamente')
          cargarUsuarios()
        } else {
          alert('❌ ' + resultado.error)
        }
      } else {
        // Activar
        const { error } = await supabase
          .from('usuarios')
          .update({ activo: true })
          .eq('id', usuario.usuario_id)

        if (error) {
          alert('❌ Error al activar usuario')
        } else {
          alert('✅ Usuario activado correctamente')
          cargarUsuarios()
        }
      }
    } catch (error) {
      console.error('Error al cambiar estado:', error)
      alert('❌ Error al cambiar estado del usuario')
    }
  }

  const formatFecha = (fecha) => {
    if (!fecha) return 'Nunca'
    
    const fechaObj = new Date(fecha)
    const ahora = new Date()
    const diffMs = ahora - fechaObj
    const diffMins = Math.floor(diffMs / 60000)
    const diffHoras = Math.floor(diffMs / 3600000)
    const diffDias = Math.floor(diffMs / 86400000)

    let relativa = ''
    if (diffMins < 1) {
      relativa = 'Hace un momento'
    } else if (diffMins < 60) {
      relativa = `Hace ${diffMins} min`
    } else if (diffHoras < 24) {
      relativa = `Hace ${diffHoras} h`
    } else if (diffDias < 7) {
      relativa = `Hace ${diffDias} días`
    } else {
      relativa = fechaObj.toLocaleDateString('es-PE')
    }

    return {
      fecha: fechaObj.toLocaleDateString('es-PE', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }),
      relativa
    }
  }

  if (!isAdmin) {
    return (
      <div className="usuarios-loading">
        <div className="empty-icon">🔒</div>
        <h3>Acceso Denegado</h3>
        <p>Esta sección es solo para administradores</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="usuarios-loading">
        <div className="spinner-large"></div>
        <p>Cargando usuarios...</p>
      </div>
    )
  }

  return (
    <div className="usuarios-page">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Gestión de Usuarios</h1>
          <span className="page-count">{usuariosFiltrados.length} usuarios</span>
        </div>
        <button className="btn-primary" onClick={handleNuevoUsuario}>
          <span className="btn-icon">➕</span>
          Nuevo Usuario
        </button>
      </div>

      {/* Toolbar */}
      <div className="usuarios-toolbar">
        {/* Búsqueda */}
        <div className="usuarios-search">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Buscar por nombre o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input-large"
            />
            {searchTerm && (
              <button
                className="search-clear"
                onClick={() => setSearchTerm('')}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Filtros */}
        <div className="usuarios-filtros">
          <button
            className={`filtro-usuarios ${filtroRol === 'todos' ? 'active' : ''}`}
            onClick={() => setFiltroRol('todos')}
          >
            Todos
          </button>
          <button
            className={`filtro-usuarios ${filtroRol === 'admin' ? 'active' : ''}`}
            onClick={() => setFiltroRol('admin')}
          >
            Admins
          </button>
          <button
            className={`filtro-usuarios ${filtroRol === 'usuario' ? 'active' : ''}`}
            onClick={() => setFiltroRol('usuario')}
          >
            Usuarios
          </button>
          <button
            className={`filtro-usuarios ${filtroEstado === 'activos' ? 'active' : ''}`}
            onClick={() => setFiltroEstado('activos')}
          >
            Activos
          </button>
          <button
            className={`filtro-usuarios ${filtroEstado === 'inactivos' ? 'active' : ''}`}
            onClick={() => setFiltroEstado('inactivos')}
          >
            Inactivos
          </button>
        </div>
      </div>

      {/* Tabla */}
      {usuariosFiltrados.length > 0 ? (
        <div className="usuarios-table-container">
          <table className="usuarios-table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Último Acceso</th>
                <th>Creado Por</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuariosFiltrados.map((usuario) => {
                const fechaAcceso = formatFecha(usuario.ultimo_acceso)
                
                return (
                  <tr key={usuario.usuario_id}>
                    <td>
                      <div className="usuario-cell">
                        <div className="usuario-avatar-table">
                          {usuario.nombre.charAt(0)}{usuario.apellido.charAt(0)}
                        </div>
                        <div className="usuario-info-cell">
                          <div className="usuario-nombre-table">
                            {usuario.nombre} {usuario.apellido}
                            {usuario.usuario_id === user.id && (
                              <span style={{ 
                                marginLeft: '0.5rem', 
                                color: '#f22121',
                                fontSize: '0.85rem',
                                fontWeight: '700'
                              }}>
                                (Tú)
                              </span>
                            )}
                          </div>
                          <div className="usuario-email-table">{usuario.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`rol-badge ${usuario.rol_nombre.toLowerCase()}`}>
                        {usuario.rol_nombre === 'admin' && '👑 '}
                        {usuario.rol_nombre}
                      </span>
                    </td>
                    <td>
                      <span className={`estado-badge-usuario ${usuario.activo ? 'activo' : 'inactivo'}`}>
                        {usuario.activo ? '✓ Activo' : '✗ Inactivo'}
                      </span>
                    </td>
                    <td>
                      <div className="fecha-acceso">
                        <span className="fecha-valor">{fechaAcceso.fecha}</span>
                        <span className="fecha-relativa">{fechaAcceso.relativa}</span>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.9rem', color: '#666' }}>
                        {usuario.creador_nombre || 'Sistema'}
                      </span>
                    </td>
                    <td>
                      <div className="usuarios-acciones">
                        <button
                          className="btn-accion-usuario"
                          title="Editar"
                          onClick={() => handleEditarUsuario(usuario)}
                        >
                          ✏️
                        </button>
                        {usuario.usuario_id !== user.id && (
                          <button
                            className={`btn-accion-usuario ${usuario.activo ? 'danger' : 'success'}`}
                            title={usuario.activo ? 'Desactivar' : 'Activar'}
                            onClick={() => handleToggleEstado(usuario)}
                          >
                            {usuario.activo ? '🚫' : '✓'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state-large">
          <div className="empty-icon">👥</div>
          <h3>No se encontraron usuarios</h3>
          <p>
            {searchTerm
              ? `No hay resultados para "${searchTerm}"`
              : 'No hay usuarios que coincidan con los filtros'}
          </p>
        </div>
      )}

      {/* Modal */}
      <UsuarioModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setUsuarioSeleccionado(null)
        }}
        usuario={usuarioSeleccionado}
        onSuccess={cargarUsuarios}
        adminId={user.id}
      />
    </div>
  )
}

export default GestionUsuarios