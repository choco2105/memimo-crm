/**
 * INTEGRACIÓN CON TELEGRAM - MEMIMO CRM
 * Envío real de mensajes a través de Telegram Bot API
 */

/**
 * Enviar mensaje a un chat de Telegram
 */
export const enviarMensajeTelegram = async (mensaje, chatId = null) => {
  const token = import.meta.env.VITE_TELEGRAM_BOT_TOKEN
  const defaultChatId = import.meta.env.VITE_TELEGRAM_CHAT_ID
  
  const targetChatId = chatId || defaultChatId

  if (!token) {
    throw new Error('Token de Telegram no configurado en .env')
  }

  if (!targetChatId) {
    throw new Error('Chat ID no proporcionado')
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: targetChatId,
          text: mensaje,
          parse_mode: 'HTML'
        })
      }
    )

    const data = await response.json()
    
    if (!data.ok) {
      throw new Error(data.description || 'Error al enviar mensaje')
    }

    return data
  } catch (error) {
    console.error('Error enviando mensaje a Telegram:', error)
    throw error
  }
}

/**
 * Enviar campaña a múltiples clientes por Telegram
 */
export const enviarCampanaTelegram = async (clientes, mensaje, nombreCampana) => {
  const resultados = {
    exitosos: 0,
    fallidos: 0,
    detalles: []
  }

  for (const cliente of clientes) {
    try {
      // Personalizar mensaje
      const mensajePersonalizado = `
<b>¡Hola ${cliente.nombres}! 🍦</b>

${mensaje}

<i>- Heladería Memimo Huancayo</i>
      `.trim()

      // Enviar a chat ID del cliente (si tiene Telegram configurado)
      // Por ahora enviamos al chat por defecto como demostración
      await enviarMensajeTelegram(mensajePersonalizado)
      
      resultados.exitosos++
      resultados.detalles.push({
        cliente: `${cliente.nombres} ${cliente.apellidos}`,
        estado: 'exitoso'
      })

      // Delay para no saturar la API
      await new Promise(resolve => setTimeout(resolve, 1000))
      
    } catch (error) {
      resultados.fallidos++
      resultados.detalles.push({
        cliente: `${cliente.nombres} ${cliente.apellidos}`,
        estado: 'fallido',
        error: error.message
      })
    }
  }

  return resultados
}

/**
 * Verificar conexión con el bot de Telegram
 */
export const verificarBotTelegram = async () => {
  const token = import.meta.env.VITE_TELEGRAM_BOT_TOKEN

  if (!token) {
    return {
      conectado: false,
      mensaje: 'Token no configurado'
    }
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${token}/getMe`
    )
    const data = await response.json()

    if (data.ok) {
      return {
        conectado: true,
        bot: data.result
      }
    } else {
      return {
        conectado: false,
        mensaje: 'Token inválido'
      }
    }
  } catch (error) {
    return {
      conectado: false,
      mensaje: error.message
    }
  }
}