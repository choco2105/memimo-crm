import { useState, useEffect } from 'react'
import { obtenerProductos, obtenerCategorias } from '../../lib/supabase'
import { supabase } from '../../lib/supabase'
import ProductoModal from './ProductoModal'
import './ProductosList.css'

const ProductosList = () => {
  const [productos, setProductos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [loading, setLoading] = useState(true)
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('todas')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [productoSeleccionado, setProductoSeleccionado] = useState(null)

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      setLoading(true)
      const [productosData, categoriasData] = await Promise.all([
        obtenerProductos(),
        obtenerCategorias()
      ])
      setProductos(productosData)
      setCategorias(categoriasData)
    } catch (error) {
      console.error('Error al cargar productos:', error)
    } finally {
      setLoading(false)
    }
  }

  const productosFiltrados = categoriaSeleccionada === 'todas'
    ? productos
    : productos.filter(p => p.categoria_id === categoriaSeleccionada)

  const handleNuevoProducto = () => {
    setProductoSeleccionado(null)
    setIsModalOpen(true)
  }

  const handleEditarProducto = (producto) => {
    setProductoSeleccionado(producto)
    setIsModalOpen(true)
  }

  const handleEliminarProducto = async (producto) => {
    if (!window.confirm(`¿Estás seguro de eliminar "${producto.nombre}"?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('productos')
        .delete()
        .eq('id', producto.id)

      if (error) throw error

      cargarDatos()
    } catch (error) {
      console.error('Error al eliminar producto:', error)
      alert('Error al eliminar el producto.')
    }
  }

  const getIconoCategoria = (nombreCategoria) => {
    const iconos = {
      'Crepes': '🥞',
      'Rolls': '🍥',
      'Helados Gourmet': '🍨',
      'Malteadas': '🥤',
      'Cremoladas': '🧊',
      'Bebidas Calientes': '☕',
      'Jugos': '🧃',
      'Toppings': '🍓'
    }
    return iconos[nombreCategoria] || '🍦'
  }

  if (loading) {
    return (
      <div className="productos-loading">
        <div className="spinner-large"></div>
        <p>Cargando productos...</p>
      </div>
    )
  }

  return (
    <div className="productos-page">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Productos</h1>
          <span className="page-count">{productosFiltrados.length} productos</span>
        </div>
        <button className="btn-primary" onClick={handleNuevoProducto}>
          <span className="btn-icon">➕</span>
          Nuevo Producto
        </button>
      </div>

      {/* Tabs de Categorías */}
      <div className="categorias-tabs">
        <div className="tabs-list">
          <button
            className={`tab-button ${categoriaSeleccionada === 'todas' ? 'active' : ''}`}
            onClick={() => setCategoriaSeleccionada('todas')}
          >
            <span className="tab-icon">🍽️</span>
            Todas ({productos.length})
          </button>
          {categorias.map(categoria => (
            <button
              key={categoria.id}
              className={`tab-button ${categoriaSeleccionada === categoria.id ? 'active' : ''}`}
              onClick={() => setCategoriaSeleccionada(categoria.id)}
            >
              <span className="tab-icon">{getIconoCategoria(categoria.nombre)}</span>
              {categoria.nombre} ({productos.filter(p => p.categoria_id === categoria.id).length})
            </button>
          ))}
        </div>
      </div>

      {/* Grid de Productos */}
      {productosFiltrados.length > 0 ? (
        <div className="productos-grid">
          {productosFiltrados.map(producto => (
            <div
              key={producto.id}
              className={`producto-card ${!producto.disponible ? 'no-disponible' : ''}`}
            >
              <div className="producto-image">
                {getIconoCategoria(producto.categoria?.nombre)}
                {producto.es_topping && (
                  <div className="producto-badge">TOPPING</div>
                )}
              </div>
              <div className="producto-content">
                <div className="producto-header">
                  <h3 className="producto-name">{producto.nombre}</h3>
                  {producto.descripcion && (
                    <p className="producto-description">{producto.descripcion}</p>
                  )}
                </div>
                <div className="producto-footer">
                  <div className="producto-precio">
                    S/ {parseFloat(producto.precio).toFixed(2)}
                  </div>
                  <div className="producto-actions">
                    <button
                      className="btn-icon-card"
                      title="Editar"
                      onClick={() => handleEditarProducto(producto)}
                    >
                      ✏️
                    </button>
                    <button
                      className="btn-icon-card danger"
                      title="Eliminar"
                      onClick={() => handleEliminarProducto(producto)}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state-large">
          <div className="empty-icon">🍦</div>
          <h3>No hay productos</h3>
          <p>No se encontraron productos en esta categoría</p>
          <button className="btn-primary" onClick={handleNuevoProducto}>
            Agregar Producto
          </button>
        </div>
      )}

      {/* Modal */}
      <ProductoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        producto={productoSeleccionado}
        categorias={categorias}
        onSuccess={cargarDatos}
      />
    </div>
  )
}

export default ProductosList