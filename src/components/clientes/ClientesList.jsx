import { useState, useEffect } from 'react'
import { obtenerClientes, buscarClientes } from '../../lib/supabase'
import './ClientesList.css'

const ClientesList = () => {
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredClientes, setFilteredClientes] = useState([])

  useEffect(() => {
    cargarClientes()
  }, [])

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredClientes(clientes)
    } else {
      buscarClientesLocal(searchTerm)
    }
  }, [searchTerm, clientes])

  const cargarClientes = async () => {
    try {
      setLoading(true)
      const data = await obtenerClientes()
      setClientes(data)
      setFilteredClientes(data)
    } catch (error) {
      console.error('Error al cargar clientes:', error)
    } finally {
      setLoading(false)
    }
  }

  const buscarClientesLocal = (termino) => {
    const term = termino.toLowerCase()
    const resultados = clientes.filter(cliente =>
      cliente.nombres.toLowerCase().includes(term) ||
      cliente.apellidos.toLowerCase().includes(term) ||
      cliente.dni?.includes(term) ||
      cliente.celular?.includes(term)
    )
    setFilteredClientes(resultados)
  }

  const formatFecha = (fecha) => {
    if (!fecha) return 'Sin fecha'
    return new Date(fecha).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="clientes-loading">
        <div className="spinner-large"></div>
        <p>Cargando clientes...</p>
      </div>
    )
  }

  return (
    <div className="clientes-page">
      {/* Header con acciones */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Clientes</h1>
          <span className="page-count">{filteredClientes.length} clientes</span>
        </div>
        <button className="btn-primary">
          <span className="btn-icon">➕</span>
          Nuevo Cliente
        </button>
      </div>

      {/* Barra de búsqueda y filtros */}
      <div className="clientes-toolbar">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Buscar por nombre, DNI o celular..."
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
        <div className="toolbar-actions">
          <button className="btn-outline">
            <span>📊</span>
            Exportar
          </button>
          <button className="btn-outline">
            <span>🔄</span>
            Actualizar
          </button>
        </div>
      </div>

      {/* Tabla de clientes */}
      {filteredClientes.length > 0 ? (
        <div className="clientes-table-container">
          <table className="clientes-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>DNI</th>
                <th>Celular</th>
                <th>Fecha Registro</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredClientes.map((cliente) => (
                <tr key={cliente.id}>
                  <td>
                    <div className="cliente-cell">
                      <div className="cliente-avatar">
                        {cliente.nombres.charAt(0)}{cliente.apellidos.charAt(0)}
                      </div>
                      <div className="cliente-info-cell">
                        <div className="cliente-name">
                          {cliente.nombres} {cliente.apellidos}
                        </div>
                        {cliente.email && (
                          <div className="cliente-email">{cliente.email}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="text-mono">{cliente.dni || '—'}</td>
                  <td className="text-mono">{cliente.celular || '—'}</td>
                  <td>{formatFecha(cliente.fecha_registro)}</td>
                  <td>
                    <div className="table-actions">
                      <button className="btn-icon-table" title="Ver perfil">
                        👁️
                      </button>
                      <button className="btn-icon-table" title="Editar">
                        ✏️
                      </button>
                      <button className="btn-icon-table danger" title="Eliminar">
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state-large">
          <div className="empty-icon">🔍</div>
          <h3>No se encontraron clientes</h3>
          <p>
            {searchTerm
              ? `No hay resultados para "${searchTerm}"`
              : 'Aún no hay clientes registrados'}
          </p>
          {!searchTerm && (
            <button className="btn-primary">
              Agregar Primer Cliente
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default ClientesList
