// ============================================
// CONFIGURACIÓN DE SUPABASE - MEMIMO CRM
// ============================================

import { createClient } from '@supabase/supabase-js'

// Variables de entorno
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validar que las variables existan
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '⚠️ Faltan las credenciales de Supabase. ' +
    'Por favor, configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en el archivo .env'
  )
}

// Crear cliente de Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

// ============================================
// FUNCIONES HELPER PARA LA BASE DE DATOS
// ============================================

/**
 * Obtener todos los clientes
 */
export const obtenerClientes = async () => {
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .order('fecha_registro', { ascending: false })
  
  if (error) {
    console.error('Error al obtener clientes:', error)
    throw error
  }
  
  return data
}

/**
 * Obtener un cliente por ID
 */
export const obtenerClientePorId = async (id) => {
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) {
    console.error('Error al obtener cliente:', error)
    throw error
  }
  
  return data
}

/**
 * Crear un nuevo cliente
 */
export const crearCliente = async (clienteData) => {
  const { data, error } = await supabase
    .from('clientes')
    .insert([clienteData])
    .select()
    .single()
  
  if (error) {
    console.error('Error al crear cliente:', error)
    throw error
  }
  
  return data
}

/**
 * Actualizar un cliente
 */
export const actualizarCliente = async (id, clienteData) => {
  const { data, error } = await supabase
    .from('clientes')
    .update(clienteData)
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    console.error('Error al actualizar cliente:', error)
    throw error
  }
  
  return data
}

/**
 * Obtener todos los productos
 */
export const obtenerProductos = async () => {
  const { data, error } = await supabase
    .from('productos')
    .select(`
      *,
      categoria:categorias_producto(nombre)
    `)
    .order('nombre')
  
  if (error) {
    console.error('Error al obtener productos:', error)
    throw error
  }
  
  return data
}

/**
 * Obtener productos por categoría
 */
export const obtenerProductosPorCategoria = async (categoriaId) => {
  const { data, error } = await supabase
    .from('productos')
    .select('*')
    .eq('categoria_id', categoriaId)
    .eq('disponible', true)
    .order('nombre')
  
  if (error) {
    console.error('Error al obtener productos por categoría:', error)
    throw error
  }
  
  return data
}

/**
 * Obtener todas las categorías
 */
export const obtenerCategorias = async () => {
  const { data, error } = await supabase
    .from('categorias_producto')
    .select('*')
    .eq('activo', true)
    .order('nombre')
  
  if (error) {
    console.error('Error al obtener categorías:', error)
    throw error
  }
  
  return data
}

/**
 * Obtener historial de compras de un cliente
 */
export const obtenerComprasCliente = async (clienteId) => {
  const { data, error } = await supabase
    .from('compras')
    .select(`
      *,
      detalle_compra(
        *,
        producto:productos(nombre, precio)
      )
    `)
    .eq('cliente_id', clienteId)
    .order('fecha', { ascending: false })
  
  if (error) {
    console.error('Error al obtener compras del cliente:', error)
    throw error
  }
  
  return data
}

/**
 * Crear una nueva compra
 */
export const crearCompra = async (compraData, detalles) => {
  // Iniciar transacción
  const { data: compra, error: errorCompra } = await supabase
    .from('compras')
    .insert([compraData])
    .select()
    .single()
  
  if (errorCompra) {
    console.error('Error al crear compra:', errorCompra)
    throw errorCompra
  }
  
  // Insertar detalles de la compra
  const detallesConCompraId = detalles.map(detalle => ({
    ...detalle,
    compra_id: compra.id
  }))
  
  const { error: errorDetalles } = await supabase
    .from('detalle_compra')
    .insert(detallesConCompraId)
  
  if (errorDetalles) {
    console.error('Error al crear detalles de compra:', errorDetalles)
    throw errorDetalles
  }
  
  return compra
}

/**
 * Obtener estadísticas del dashboard
 */
export const obtenerEstadisticasDashboard = async () => {
  // Total de clientes
  const { count: totalClientes } = await supabase
    .from('clientes')
    .select('*', { count: 'exact', head: true })
  
  // Total de compras este mes
  const inicioMes = new Date()
  inicioMes.setDate(1)
  inicioMes.setHours(0, 0, 0, 0)
  
  const { data: comprasMes, error: errorComprasMes } = await supabase
    .from('compras')
    .select('total')
    .gte('fecha', inicioMes.toISOString())
  
  const totalVentasMes = comprasMes?.reduce((sum, compra) => sum + parseFloat(compra.total), 0) || 0
  
  // Productos más vendidos
  const { data: topProductos, error: errorTopProductos } = await supabase
    .from('detalle_compra')
    .select(`
      cantidad,
      producto:productos(nombre)
    `)
    .limit(10)
  
  return {
    totalClientes: totalClientes || 0,
    totalVentasMes: totalVentasMes.toFixed(2),
    topProductos: topProductos || []
  }
}

/**
 * Buscar clientes
 */
export const buscarClientes = async (termino) => {
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .or(`nombres.ilike.%${termino}%,apellidos.ilike.%${termino}%,dni.ilike.%${termino}%,celular.ilike.%${termino}%`)
    .limit(20)
  
  if (error) {
    console.error('Error al buscar clientes:', error)
    throw error
  }
  
  return data
}

/**
 * Obtener campañas activas
 */
export const obtenerCampanasActivas = async () => {
  const { data, error } = await supabase
    .from('campanas')
    .select('*')
    .eq('estado', 'activa')
    .order('fecha_inicio', { ascending: false })
  
  if (error) {
    console.error('Error al obtener campañas:', error)
    throw error
  }
  
  return data
}

/**
 * Crear una nueva campaña
 */
export const crearCampana = async (campanaData) => {
  const { data, error } = await supabase
    .from('campanas')
    .insert([campanaData])
    .select()
    .single()
  
  if (error) {
    console.error('Error al crear campaña:', error)
    throw error
  }
  
  return data
}

/**
 * Asignar clientes a una campaña
 */
export const asignarClientesCampana = async (campanaId, clienteIds) => {
  const registros = clienteIds.map(clienteId => ({
    campana_id: campanaId,
    cliente_id: clienteId
  }))
  
  const { data, error } = await supabase
    .from('campana_clientes')
    .insert(registros)
  
  if (error) {
    console.error('Error al asignar clientes a campaña:', error)
    throw error
  }
  
  return data
}
/**
 * Crear una nueva compra con sus detalles
 */
export const crearCompraCompleta = async (clienteId, productos, metodoPago, notas = '') => {
  try {
    // Calcular el total
    const total = productos.reduce((sum, p) => sum + (p.precio * p.cantidad), 0)

    // Crear la compra
    const { data: compra, error: errorCompra } = await supabase
      .from('compras')
      .insert([{
        cliente_id: clienteId,
        total: total,
        metodo_pago: metodoPago,
        estado: 'completada',
        notas: notas || null
      }])
      .select()
      .single()

    if (errorCompra) throw errorCompra

    // Crear los detalles
    const detalles = productos.map(p => ({
      compra_id: compra.id,
      producto_id: p.id,
      cantidad: p.cantidad,
      precio_unitario: p.precio,
      subtotal: p.precio * p.cantidad
    }))

    const { error: errorDetalles } = await supabase
      .from('detalle_compra')
      .insert(detalles)

    if (errorDetalles) throw errorDetalles

    return compra
  } catch (error) {
    console.error('Error al crear compra:', error)
    throw error
  }
}

/**
 * Obtener todas las compras con detalles
 */
export const obtenerComprasCompletas = async () => {
  const { data, error } = await supabase
    .from('compras')
    .select(`
      *,
      cliente:clientes(nombres, apellidos, celular),
      detalle_compra(
        *,
        producto:productos(nombre, precio)
      )
    `)
    .order('fecha', { ascending: false })

  if (error) {
    console.error('Error al obtener compras:', error)
    throw error
  }

  return data
}

/**
 * Obtener compras recientes (últimas 10)
 */
export const obtenerComprasRecientes = async (limite = 10) => {
  const { data, error } = await supabase
    .from('compras')
    .select(`
      *,
      cliente:clientes(nombres, apellidos)
    `)
    .order('fecha', { ascending: false })
    .limit(limite)

  if (error) {
    console.error('Error al obtener compras recientes:', error)
    throw error
  }

  return data
}
/**
 * Crear una campaña
 */
export const crearCampanaCompleta = async (campanaData) => {
  const { data, error } = await supabase
    .from('campanas')
    .insert([{
      nombre: campanaData.nombre,
      descripcion: campanaData.descripcion,
      tipo_descuento: campanaData.tipo_descuento || null,
      valor_descuento: campanaData.valor_descuento || null,
      fecha_inicio: campanaData.fecha_inicio,
      fecha_fin: campanaData.fecha_fin,
      canal: campanaData.canal,
      estado: 'activa'
    }])
    .select()
    .single()

  if (error) {
    console.error('Error al crear campaña:', error)
    throw error
  }

  return data
}

/**
 * Obtener todas las campañas
 */
export const obtenerTodasCampanas = async () => {
  const { data, error } = await supabase
    .from('campanas')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error al obtener campañas:', error)
    throw error
  }

  return data
}

/**
 * Asignar clientes a una campaña y marcar como enviado
 */
export const asignarYEnviarCampana = async (campanaId, clienteIds) => {
  const registros = clienteIds.map(clienteId => ({
    campana_id: campanaId,
    cliente_id: clienteId,
    enviado: true,
    fecha_envio: new Date().toISOString()
  }))

  const { data, error } = await supabase
    .from('campana_clientes')
    .insert(registros)
    .select()

  if (error) {
    console.error('Error al asignar clientes a campaña:', error)
    throw error
  }

  return data
}

/**
 * Obtener estadísticas de una campaña
 */
export const obtenerEstadisticasCampana = async (campanaId) => {
  const { data, error } = await supabase
    .from('campana_clientes')
    .select('*')
    .eq('campana_id', campanaId)

  if (error) {
    console.error('Error al obtener estadísticas:', error)
    throw error
  }

  return {
    total_enviados: data.length,
    total_respondieron: data.filter(d => d.respondio).length
  }
}
/**
 * Actualizar una campaña
 */
export const actualizarCampana = async (campanaId, campanaData) => {
  const { data, error } = await supabase
    .from('campanas')
    .update({
      nombre: campanaData.nombre,
      descripcion: campanaData.descripcion,
      tipo_descuento: campanaData.tipo_descuento || null,
      valor_descuento: campanaData.valor_descuento || null,
      fecha_inicio: campanaData.fecha_inicio,
      fecha_fin: campanaData.fecha_fin,
      canal: campanaData.canal,
      estado: campanaData.estado
    })
    .eq('id', campanaId)
    .select()
    .single()

  if (error) {
    console.error('Error al actualizar campaña:', error)
    throw error
  }

  return data
}

/**
 * Eliminar una campaña
 */
export const eliminarCampana = async (campanaId) => {
  const { error } = await supabase
    .from('campanas')
    .delete()
    .eq('id', campanaId)

  if (error) {
    console.error('Error al eliminar campaña:', error)
    throw error
  }

  return true
}

/**
 * Cambiar estado de una campaña
 */
export const cambiarEstadoCampana = async (campanaId, nuevoEstado) => {
  const { data, error } = await supabase
    .from('campanas')
    .update({ estado: nuevoEstado })
    .eq('id', campanaId)
    .select()
    .single()

  if (error) {
    console.error('Error al cambiar estado:', error)
    throw error
  }

  return data
}
// Exportar el cliente para uso directo si es necesario
export default supabase
