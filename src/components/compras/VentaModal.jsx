import { useState, useEffect } from 'react'
import { obtenerClientes, obtenerProductos, obtenerCategorias, crearCompraCompleta } from '../../lib/supabase'
import './VentaModal.css'

const VentaModal = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState(1) // 1: Cliente, 2: Productos, 3: Confirmar
  const [loading, setLoading] = useState(false)
  
  // Datos
  const [clientes, setClientes] = useState([])
  const [productos, setProductos] = useState([])
  const [categorias, setCategorias] = useState([])
  
  // Selecciones
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null)
  const [carrito, setCarrito] = useState([])
  const [metodoPago, setMetodoPago] = useState('efectivo')
  const [notas, setNotas] = useState('')
  
  // Filtros
  const [buscarCliente, setBuscarCliente] = useState('')
  const [categoriaFiltro, setCategoriaFiltro] = useState('todas')
  const [buscarProducto, setBuscarProducto] = useState('')

  useEffect(() => {
    if (isOpen) {
      cargarDatos()
    }
  }, [isOpen])

  const cargarDatos = async () => {
    try {
      const [clientesData, productosData, categoriasData] = await Promise.all([
        obtenerClientes(),
        obtenerProductos(),
        obtenerCategorias()
      ])
      setClientes(clientesData)
      setProductos(productosData)
      setCategorias(categoriasData)
    } catch (error) {
      console.error('Error al cargar datos:', error)
    }
  }

  const clientesFiltrados = clientes.filter(c => 
    c.nombres.toLowerCase().includes(buscarCliente.toLowerCase()) ||
    c.apellidos.toLowerCase().includes(buscarCliente.toLowerCase()) ||
    c.dni?.includes(buscarCliente) ||
    c.celular?.includes(buscarCliente)
  )

  const productosFiltrados = productos.filter(p => {
    const matchCategoria = categoriaFiltro === 'todas' || p.categoria_id === categoriaFiltro
    const matchBusqueda = p.nombre.toLowerCase().includes(buscarProducto.toLowerCase())
    return matchCategoria && matchBusqueda && p.disponible
  })

  const agregarAlCarrito = (producto) => {
    const existe = carrito.find(item => item.id === producto.id)
    if (existe) {
      setCarrito(carrito.map(item =>
        item.id === producto.id
          ? { ...item, cantidad: item.cantidad + 1 }
          : item
      ))
    } else {
      setCarrito([...carrito, { ...producto, cantidad: 1 }])
    }
  }

  const modificarCantidad = (productoId, cambio) => {
    setCarrito(carrito.map(item => {
      if (item.id === productoId) {
        const nuevaCantidad = item.cantidad + cambio
        return nuevaCantidad > 0 ? { ...item, cantidad: nuevaCantidad } : item
      }
      return item
    }).filter(item => item.cantidad > 0))
  }

  const eliminarDelCarrito = (productoId) => {
    setCarrito(carrito.filter(item => item.id !== productoId))
  }

  const calcularTotal = () => {
    return carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0)
  }

  const handleFinalizarVenta = async () => {
    if (!clienteSeleccionado || carrito.length === 0) {
      alert('Debes seleccionar un cliente y agregar productos')
      return
    }

    setLoading(true)
    try {
      await crearCompraCompleta(
        clienteSeleccionado.id,
        carrito,
        metodoPago,
        notas
      )

      alert('✅ ¡Venta registrada exitosamente!')
      onSuccess && onSuccess()
      handleCerrar()
    } catch (error) {
      console.error('Error al crear venta:', error)
      alert('❌ Error al registrar la venta')
    } finally {
      setLoading(false)
    }
  }

  const handleCerrar = () => {
    setStep(1)
    setClienteSeleccionado(null)
    setCarrito([])
    setMetodoPago('efectivo')
    setNotas('')
    setBuscarCliente('')
    setCategoriaFiltro('todas')
    setBuscarProducto('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="venta-modal-overlay" onClick={handleCerrar}>
      <div className="venta-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="venta-modal-header">
          <div className="venta-steps">
            <div className={`step ${step >= 1 ? 'active' : ''}`}>
              <span className="step-number">1</span>
              <span className="step-label">Cliente</span>
            </div>
            <div className="step-divider"></div>
            <div className={`step ${step >= 2 ? 'active' : ''}`}>
              <span className="step-number">2</span>
              <span className="step-label">Productos</span>
            </div>
            <div className="step-divider"></div>
            <div className={`step ${step >= 3 ? 'active' : ''}`}>
              <span className="step-number">3</span>
              <span className="step-label">Confirmar</span>
            </div>
          </div>
          <button className="venta-modal-close" onClick={handleCerrar}>✕</button>
        </div>

        {/* Body */}
        <div className="venta-modal-body">
          {/* STEP 1: Seleccionar Cliente */}
          {step === 1 && (
            <div className="venta-step">
              <h3 className="step-title">👤 Seleccionar Cliente</h3>
              <input
                type="text"
                placeholder="🔍 Buscar por nombre, DNI o celular..."
                value={buscarCliente}
                onChange={(e) => setBuscarCliente(e.target.value)}
                className="venta-search-input"
              />
              <div className="clientes-grid">
                {clientesFiltrados.slice(0, 12).map(cliente => (
                  <div
                    key={cliente.id}
                    className={`cliente-card ${clienteSeleccionado?.id === cliente.id ? 'selected' : ''}`}
                    onClick={() => setClienteSeleccionado(cliente)}
                  >
                    <div className="cliente-avatar-small">
                      {cliente.nombres.charAt(0)}{cliente.apellidos.charAt(0)}
                    </div>
                    <div className="cliente-info-small">
                      <div className="cliente-nombre-small">
                        {cliente.nombres} {cliente.apellidos}
                      </div>
                      <div className="cliente-contacto-small">{cliente.celular}</div>
                    </div>
                    {clienteSeleccionado?.id === cliente.id && (
                      <div className="cliente-check">✓</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: Seleccionar Productos */}
          {step === 2 && (
            <div className="venta-step">
              <div className="productos-header">
                <h3 className="step-title">🍦 Seleccionar Productos</h3>
                <div className="carrito-badge">
                  🛒 {carrito.reduce((sum, item) => sum + item.cantidad, 0)} items
                </div>
              </div>

              {/* Filtros */}
              <div className="productos-filtros">
                <input
                  type="text"
                  placeholder="🔍 Buscar producto..."
                  value={buscarProducto}
                  onChange={(e) => setBuscarProducto(e.target.value)}
                  className="venta-search-input"
                />
                <select
                  value={categoriaFiltro}
                  onChange={(e) => setCategoriaFiltro(e.target.value)}
                  className="categoria-select"
                >
                  <option value="todas">Todas las categorías</option>
                  {categorias.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                  ))}
                </select>
              </div>

              {/* Grid de Productos */}
              <div className="productos-grid-venta">
                {productosFiltrados.map(producto => (
                  <div
                    key={producto.id}
                    className="producto-card-venta"
                    onClick={() => agregarAlCarrito(producto)}
                  >
                    <div className="producto-nombre-venta">{producto.nombre}</div>
                    <div className="producto-precio-venta">S/ {parseFloat(producto.precio).toFixed(2)}</div>
                    {carrito.find(item => item.id === producto.id) && (
                      <div className="producto-en-carrito">
                        En carrito: {carrito.find(item => item.id === producto.id).cantidad}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Carrito */}
              {carrito.length > 0 && (
                <div className="carrito-resumen">
                  <h4>📋 Carrito de Compra</h4>
                  {carrito.map(item => (
                    <div key={item.id} className="carrito-item">
                      <div className="carrito-item-info">
                        <span className="carrito-item-nombre">{item.nombre}</span>
                        <span className="carrito-item-precio">S/ {parseFloat(item.precio).toFixed(2)}</span>
                      </div>
                      <div className="carrito-item-acciones">
                        <button onClick={() => modificarCantidad(item.id, -1)}>−</button>
                        <span>{item.cantidad}</span>
                        <button onClick={() => modificarCantidad(item.id, 1)}>+</button>
                        <button 
                          className="btn-eliminar-item"
                          onClick={() => eliminarDelCarrito(item.id)}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="carrito-total">
                    <strong>Total:</strong>
                    <strong>S/ {calcularTotal().toFixed(2)}</strong>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Confirmar */}
          {step === 3 && (
            <div className="venta-step">
              <h3 className="step-title">✅ Confirmar Venta</h3>
              
              <div className="confirmacion-grid">
                {/* Cliente */}
                <div className="confirmacion-card">
                  <h4>👤 Cliente</h4>
                  <p><strong>{clienteSeleccionado?.nombres} {clienteSeleccionado?.apellidos}</strong></p>
                  <p>{clienteSeleccionado?.celular}</p>
                </div>

                {/* Productos */}
                <div className="confirmacion-card">
                  <h4>🛒 Productos ({carrito.length})</h4>
                  {carrito.map(item => (
                    <div key={item.id} className="confirmacion-item">
                      <span>{item.cantidad}x {item.nombre}</span>
                      <span>S/ {(item.precio * item.cantidad).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="confirmacion-total">
                    <strong>TOTAL:</strong>
                    <strong>S/ {calcularTotal().toFixed(2)}</strong>
                  </div>
                </div>

                {/* Método de Pago */}
                <div className="confirmacion-card full-width">
                  <h4>💳 Método de Pago</h4>
                  <div className="metodos-pago">
                    <button
                      className={`metodo-btn ${metodoPago === 'efectivo' ? 'active' : ''}`}
                      onClick={() => setMetodoPago('efectivo')}
                    >
                      💵 Efectivo
                    </button>
                    <button
                      className={`metodo-btn ${metodoPago === 'tarjeta' ? 'active' : ''}`}
                      onClick={() => setMetodoPago('tarjeta')}
                    >
                      💳 Tarjeta
                    </button>
                    <button
                      className={`metodo-btn ${metodoPago === 'transferencia' ? 'active' : ''}`}
                      onClick={() => setMetodoPago('transferencia')}
                    >
                      📱 Transferencia
                    </button>
                    <button
                      className={`metodo-btn ${metodoPago === 'yape' ? 'active' : ''}`}
                      onClick={() => setMetodoPago('yape')}
                    >
                      🟣 Yape/Plin
                    </button>
                  </div>
                </div>

                {/* Notas */}
                <div className="confirmacion-card full-width">
                  <h4>📝 Notas (Opcional)</h4>
                  <textarea
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                    placeholder="Información adicional de la venta..."
                    className="notas-textarea"
                    rows="3"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="venta-modal-footer">
          {step > 1 && (
            <button 
              className="btn-venta-secondary"
              onClick={() => setStep(step - 1)}
            >
              ← Atrás
            </button>
          )}
          <div style={{ flex: 1 }}></div>
          {step < 3 ? (
            <button
              className="btn-venta-primary"
              onClick={() => setStep(step + 1)}
              disabled={
                (step === 1 && !clienteSeleccionado) ||
                (step === 2 && carrito.length === 0)
              }
            >
              Siguiente →
            </button>
          ) : (
            <button
              className="btn-venta-primary"
              onClick={handleFinalizarVenta}
              disabled={loading}
            >
              {loading ? 'Procesando...' : '✓ Finalizar Venta'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default VentaModal