// ============================================
// AUTENTICACIÓN - MEMIMO CRM
// Sistema completo de login con bcrypt y sesiones
// ============================================

import { supabase } from './supabase'
import bcrypt from 'bcryptjs'

const SALT_ROUNDS = 10
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
    // 1. Buscar usuario por email
    const { data: usuario, error: errorUsuario } = await supabase
      .from('usuarios')
      .select(`
        *,
        rol:roles(nombre)
      `)
      .eq('email', email)
      .single()

    if (errorUsuario || !usuario) {
      return {
        success: false,
        error: 'Usuario no encontrado',
        code: 'AUTH_USER_NOT_FOUND'
      }
    }

    // 2. Verificar que el usuario esté activo
    if (!usuario.activo) {
      // Registrar intento fallido
      await registrarIntentoLogin(email, false, 'Usuario inactivo')
      
      return {
        success: false,
        error: 'Usuario inactivo. Contacta al administrador.',
        code: 'AUTH_USER_INACTIVE'
      }
    }

    // 3. Verificar password con bcrypt
    const passwordValida = await bcrypt.compare(password, usuario.password_hash)

    if (!passwordValida) {
      // Registrar intento fallido
      await registrarIntentoLogin(email, false, 'Contraseña incorrecta')
      
      return {
        success: false,
        error: 'Contraseña incorrecta',
        code: 'AUTH_INVALID_PASSWORD'
      }
    }

    // 4. Generar token de sesión
    const token = generarToken()
    const expiraEn = calcularExpiracion()

    // 5. Crear sesión en la base de datos
    const { error: errorSesion } = await supabase
      .from('sesiones')
      .insert([{
        usuario_id: usuario.id,
        token: token,
        expira_en: expiraEn,
        ip_address: 'N/A', // Frontend no tiene acceso a IP
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

    // 6. Actualizar último acceso
    await supabase
      .from('usuarios')
      .update({ ultimo_acceso: new Date().toISOString() })
      .eq('id', usuario.id)

    // 7. Registrar intento exitoso
    await registrarIntentoLogin(email, true, 'Login exitoso')

    // 8. Retornar datos del usuario y token
    return {
      success: true,
      user: {
        id: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        rol: usuario.rol.nombre,
        activo: usuario.activo
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

    // 3. Encriptar password
    const passwordHash = await bcrypt.hash(userData.password, SALT_ROUNDS)

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