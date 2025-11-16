// ============================================
// AUTENTICACIÓN - MEMIMO CRM
// Sistema completo de login con verificación en Supabase
// ============================================

import { supabase } from './supabase'

const SESSION_DURATION_HOURS = 24

/**
 * Generar token UUID v4
 */
const generarToken = () => {
  return crypto.randomUUID()
}

/**
 * Calcular fecha de expiración (24 horas desde ahora)
 */
const calcularExpiracion = () => {
  const ahora = new Date()
  ahora.setHours(ahora.getHours() + SESSION_DURATION_HOURS)
  return ahora.toISOString()
}

/**
 * LOGIN - Verificar credenciales y crear sesión
 */
export const login = async (email, password) => {
  try {
    // 1. Verificar credenciales usando función RPC de Supabase
    const { data: resultadoLogin, error: errorLogin } = await supabase
      .rpc('verificar_login', {
        p_email: email,
        p_password: password
      })

    if (errorLogin) {
      console.error('Error en verificar_login:', errorLogin)
      return {
        success: false,
        error: 'Error al verificar credenciales',
        code: 'AUTH_VERIFICATION_ERROR'
      }
    }

    // 2. Verificar resultado
    const resultado = resultadoLogin[0]

    if (!resultado.success) {
      // Registrar intento fallido
      await registrarIntentoLogin(email, false, resultado.error_message)
      
      return {
        success: false,
        error: resultado.error_message,
        code: 'AUTH_INVALID_CREDENTIALS'
      }
    }

    // 3. Generar token de sesión
    const token = generarToken()
    const expiraEn = calcularExpiracion()

    // 4. Crear sesión en la base de datos
    const { error: errorSesion } = await supabase
      .from('sesiones')
      .insert([{
        usuario_id: resultado.user_id,
        token: token,
        expira_en: expiraEn,
        ip_address: 'N/A',
        user_agent: navigator.userAgent
      }])

    if (errorSesion) {
      console.error('Error al crear sesión:', errorSesion)
      return {
        success: false,
        error: 'Error al crear sesión',
        code: 'AUTH_SESSION_ERROR'
      }
    }

    // 5. Actualizar último acceso
    await supabase
      .from('usuarios')
      .update({ ultimo_acceso: new Date().toISOString() })
      .eq('id', resultado.user_id)

    // 6. Registrar intento exitoso
    await registrarIntentoLogin(email, true, 'Login exitoso')

    // 7. Retornar datos del usuario y token
    return {
      success: true,
      user: {
        id: resultado.user_id,
        email: resultado.email,
        nombre: resultado.nombre,
        apellido: resultado.apellido,
        rol: resultado.rol_nombre,
        activo: resultado.activo
      },
      token: token,
      expira: expiraEn
    }

  } catch (error) {
    console.error('Error en login:', error)
    return {
      success: false,
      error: 'Error interno del servidor',
      code: 'AUTH_SERVER_ERROR'
    }
  }
}

/**
 * REGISTER - Crear nuevo usuario (solo admin)
 */
export const register = async (userData, adminId) => {
  try {
    // 1. Verificar que quien crea es admin
    const esAdmin = await verificarEsAdmin(adminId)
    
    if (!esAdmin) {
      return {
        success: false,
        error: 'Solo los administradores pueden crear usuarios',
        code: 'AUTH_UNAUTHORIZED'
      }
    }

    // 2. Verificar que el email no exista
    const { data: usuarioExistente } = await supabase
      .from('usuarios')
      .select('id')
      .eq('email', userData.email)
      .single()

    if (usuarioExistente) {
      return {
        success: false,
        error: 'El email ya está registrado',
        code: 'AUTH_EMAIL_EXISTS'
      }
    }

    // 3. Encriptar password usando función RPC
    const { data: hashData, error: hashError } = await supabase
      .rpc('encriptar_password', {
        p_password: userData.password
      })

    if (hashError || !hashData) {
      console.error('Error al encriptar password:', hashError)
      return {
        success: false,
        error: 'Error al procesar contraseña',
        code: 'AUTH_HASH_ERROR'
      }
    }

    const passwordHash = hashData[0].hash

    // 4. Crear usuario
    const { data: nuevoUsuario, error: errorCrear } = await supabase
      .from('usuarios')
      .insert([{
        email: userData.email,
        password_hash: passwordHash,
        nombre: userData.nombre,
        apellido: userData.apellido,
        rol_id: userData.rol_id,
        created_by: adminId,
        activo: true
      }])
      .select(`
        id,
        email,
        nombre,
        apellido,
        activo,
        rol:roles(nombre)
      `)
      .single()

    if (errorCrear) {
      console.error('Error al crear usuario:', errorCrear)
      return {
        success: false,
        error: 'Error al crear usuario',
        code: 'AUTH_CREATE_ERROR'
      }
    }

    return {
      success: true,
      user: {
        id: nuevoUsuario.id,
        email: nuevoUsuario.email,
        nombre: nuevoUsuario.nombre,
        apellido: nuevoUsuario.apellido,
        rol: nuevoUsuario.rol.nombre,
        activo: nuevoUsuario.activo
      }
    }

  } catch (error) {
    console.error('Error en register:', error)
    return {
      success: false,
      error: 'Error interno del servidor',
      code: 'AUTH_SERVER_ERROR'
    }
  }
}

/**
 * LOGOUT - Cerrar sesión
 */
export const logout = async (token) => {
  try {
    const { error } = await supabase
      .from('sesiones')
      .delete()
      .eq('token', token)

    if (error) {
      console.error('Error al cerrar sesión:', error)
      return {
        success: false,
        error: 'Error al cerrar sesión'
      }
    }

    return {
      success: true
    }
  } catch (error) {
    console.error('Error en logout:', error)
    return {
      success: false,
      error: 'Error interno del servidor'
    }
  }
}

/**
 * VERIFICAR SESIÓN - Comprobar si el token es válido
 */
export const verificarSesion = async (token) => {
  try {
    if (!token) {
      return null
    }

    // 1. Buscar sesión
    const { data: sesion, error: errorSesion } = await supabase
      .from('sesiones')
      .select(`
        *,
        usuario:usuarios(
          id,
          email,
          nombre,
          apellido,
          activo,
          rol:roles(nombre)
        )
      `)
      .eq('token', token)
      .single()

    if (errorSesion || !sesion) {
      return null
    }

    // 2. Verificar que no haya expirado
    const ahora = new Date()
    const expiracion = new Date(sesion.expira_en)

    if (ahora > expiracion) {
      // Sesión expirada, eliminarla
      await supabase
        .from('sesiones')
        .delete()
        .eq('token', token)
      
      return null
    }

    // 3. Verificar que el usuario siga activo
    if (!sesion.usuario.activo) {
      // Usuario desactivado, eliminar sesión
      await supabase
        .from('sesiones')
        .delete()
        .eq('token', token)
      
      return null
    }

    // 4. Retornar datos del usuario
    return {
      user: {
        id: sesion.usuario.id,
        email: sesion.usuario.email,
        nombre: sesion.usuario.nombre,
        apellido: sesion.usuario.apellido,
        rol: sesion.usuario.rol.nombre,
        activo: sesion.usuario.activo
      },
      token: token,
      expira: sesion.expira_en
    }

  } catch (error) {
    console.error('Error al verificar sesión:', error)
    return null
  }
}

/**
 * OBTENER USUARIOS - Solo admin
 */
export const obtenerUsuarios = async (adminId) => {
  try {
    // Verificar que sea admin
    const esAdmin = await verificarEsAdmin(adminId)
    
    if (!esAdmin) {
      return {
        success: false,
        error: 'No autorizado',
        code: 'AUTH_UNAUTHORIZED'
      }
    }

    // Obtener todos los usuarios con información completa
    const { data: usuarios, error } = await supabase
      .from('v_usuarios_completo')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error al obtener usuarios:', error)
      return {
        success: false,
        error: 'Error al obtener usuarios'
      }
    }

    return {
      success: true,
      usuarios: usuarios
    }

  } catch (error) {
    console.error('Error en obtenerUsuarios:', error)
    return {
      success: false,
      error: 'Error interno del servidor'
    }
  }
}

/**
 * ACTUALIZAR USUARIO - Solo admin
 */
export const actualizarUsuario = async (userId, userData, adminId) => {
  try {
    // Verificar que sea admin
    const esAdmin = await verificarEsAdmin(adminId)
    
    if (!esAdmin) {
      return {
        success: false,
        error: 'No autorizado',
        code: 'AUTH_UNAUTHORIZED'
      }
    }

    // Actualizar usuario (sin incluir password)
    const updateData = {
      nombre: userData.nombre,
      apellido: userData.apellido,
      rol_id: userData.rol_id,
      activo: userData.activo
    }

    const { data: usuarioActualizado, error } = await supabase
      .from('usuarios')
      .update(updateData)
      .eq('id', userId)
      .select(`
        id,
        email,
        nombre,
        apellido,
        activo,
        rol:roles(nombre)
      `)
      .single()

    if (error) {
      console.error('Error al actualizar usuario:', error)
      return {
        success: false,
        error: 'Error al actualizar usuario'
      }
    }

    return {
      success: true,
      user: {
        id: usuarioActualizado.id,
        email: usuarioActualizado.email,
        nombre: usuarioActualizado.nombre,
        apellido: usuarioActualizado.apellido,
        rol: usuarioActualizado.rol.nombre,
        activo: usuarioActualizado.activo
      }
    }

  } catch (error) {
    console.error('Error en actualizarUsuario:', error)
    return {
      success: false,
      error: 'Error interno del servidor'
    }
  }
}

/**
 * DESACTIVAR USUARIO - Solo admin
 */
export const desactivarUsuario = async (userId, adminId) => {
  try {
    // Verificar que sea admin
    const esAdmin = await verificarEsAdmin(adminId)
    
    if (!esAdmin) {
      return {
        success: false,
        error: 'No autorizado',
        code: 'AUTH_UNAUTHORIZED'
      }
    }

    // No permitir desactivarse a sí mismo
    if (userId === adminId) {
      return {
        success: false,
        error: 'No puedes desactivarte a ti mismo',
        code: 'AUTH_CANNOT_DEACTIVATE_SELF'
      }
    }

    // Desactivar usuario
    const { error } = await supabase
      .from('usuarios')
      .update({ activo: false })
      .eq('id', userId)

    if (error) {
      console.error('Error al desactivar usuario:', error)
      return {
        success: false,
        error: 'Error al desactivar usuario'
      }
    }

    // Cerrar todas las sesiones del usuario
    await supabase
      .from('sesiones')
      .delete()
      .eq('usuario_id', userId)

    return {
      success: true
    }

  } catch (error) {
    console.error('Error en desactivarUsuario:', error)
    return {
      success: false,
      error: 'Error interno del servidor'
    }
  }
}

/**
 * HELPER: Verificar si un usuario es admin
 */
const verificarEsAdmin = async (userId) => {
  try {
    const { data } = await supabase
      .rpc('es_admin', { usuario_id: userId })

    return data === true
  } catch (error) {
    console.error('Error al verificar admin:', error)
    return false
  }
}

/**
 * HELPER: Registrar intento de login
 */
const registrarIntentoLogin = async (email, exitoso, mensaje = '') => {
  try {
    await supabase
      .from('logs_autenticacion')
      .insert([{
        email: email,
        exitoso: exitoso,
        mensaje: mensaje,
        ip_address: 'N/A',
        user_agent: navigator.userAgent
      }])
  } catch (error) {
    console.error('Error al registrar intento de login:', error)
  }
}

/**
 * LIMPIAR SESIONES EXPIRADAS - Mantenimiento
 */
export const limpiarSesionesExpiradas = async () => {
  try {
    const ahora = new Date().toISOString()
    
    const { error } = await supabase
      .from('sesiones')
      .delete()
      .lt('expira_en', ahora)

    if (error) {
      console.error('Error al limpiar sesiones:', error)
    }
  } catch (error) {
    console.error('Error en limpiarSesionesExpiradas:', error)
  }
}