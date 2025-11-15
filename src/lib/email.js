/**
 * INTEGRACIÓN CON RESEND - MEMIMO CRM
 * Envío de correos personalizados para campañas
 */

/**
 * Enviar email a un destinatario
 */
export const enviarEmail = async (destinatario, asunto, contenido) => {
  const apiKey = import.meta.env.VITE_RESEND_API_KEY
  const fromEmail = 'onboarding@resend.dev'

  if (!apiKey) {
    throw new Error('API Key de Resend no configurada en .env')
  }

  if (!destinatario) {
    throw new Error('Email del destinatario no proporcionado')
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `Heladería Memimo <${fromEmail}>`,
        to: [destinatario],
        subject: asunto,
        html: contenido
      })
    })

    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.message || 'Error al enviar email')
    }

    return data
  } catch (error) {
    console.error('Error enviando email:', error)
    throw error
  }
}

/**
 * Enviar campaña a múltiples clientes por Email
 */
export const enviarCampanaEmail = async (clientes, asunto, mensaje, nombreCampana) => {
  const resultados = {
    exitosos: 0,
    fallidos: 0,
    detalles: []
  }

  for (const cliente of clientes) {
    try {
      // Validar que el cliente tenga email
      if (!cliente.email) {
        resultados.fallidos++
        resultados.detalles.push({
          cliente: `${cliente.nombres} ${cliente.apellidos}`,
          estado: 'fallido',
          error: 'Sin email registrado'
        })
        continue
      }

      // Crear HTML personalizado
      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #f22121, #ff4444);
      color: white;
      padding: 30px;
      text-align: center;
      border-radius: 10px 10px 0 0;
    }
    .content {
      background: #ffffff;
      padding: 30px;
      border: 2px solid #f0f0f0;
      border-radius: 0 0 10px 10px;
    }
    .button {
      display: inline-block;
      padding: 12px 30px;
      background: #f22121;
      color: white !important;
      text-decoration: none;
      border-radius: 8px;
      margin: 20px 0;
      font-weight: bold;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding: 20px;
      color: #999;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🍦 Heladería Memimo</h1>
      <p>${nombreCampana}</p>
    </div>
    <div class="content">
      <h2>¡Hola ${cliente.nombres}! 👋</h2>
      ${mensaje.replace(/\n/g, '<br>')}
      
      <div style="text-align: center;">
        <a href="https://wa.me/51${cliente.celular}" class="button">
          💬 Contáctanos por WhatsApp
        </a>
      </div>
    </div>
    <div class="footer">
      <p>Heladería Memimo - Huancayo, Perú</p>
      <p>Este correo fue enviado porque eres parte de nuestra familia Memimo 💕</p>
      <p style="font-size: 10px; color: #ccc;">
        Si no deseas recibir más correos, responde con "BAJA" a este email.
      </p>
    </div>
  </div>
</body>
</html>
      `

      // Enviar email
      await enviarEmail(cliente.email, asunto, htmlContent)
      
      resultados.exitosos++
      resultados.detalles.push({
        cliente: `${cliente.nombres} ${cliente.apellidos}`,
        email: cliente.email,
        estado: 'exitoso'
      })

      // Delay para no saturar la API (respeta rate limits)
      await new Promise(resolve => setTimeout(resolve, 1000))
      
    } catch (error) {
      resultados.fallidos++
      resultados.detalles.push({
        cliente: `${cliente.nombres} ${cliente.apellidos}`,
        email: cliente.email,
        estado: 'fallido',
        error: error.message
      })
    }
  }

  return resultados
}

/**
 * Verificar configuración de Resend
 */
export const verificarEmailConfig = async () => {
  const apiKey = import.meta.env.VITE_RESEND_API_KEY

  if (!apiKey) {
    return {
      conectado: false,
      mensaje: 'API Key no configurada'
    }
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'test@resend.dev',
        to: ['test@resend.dev'],
        subject: 'Test',
        html: 'Test'
      })
    })

    // Si la API key es válida, incluso con datos de prueba responderá
    if (response.status === 403) {
      return {
        conectado: false,
        mensaje: 'API Key inválida'
      }
    }

    return {
      conectado: true,
      mensaje: 'Configuración correcta'
    }
  } catch (error) {
    return {
      conectado: false,
      mensaje: error.message
    }
  }
}