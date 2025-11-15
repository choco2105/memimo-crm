/**
 * INTEGRACIÓN CON RESEND VIA BACKEND - MEMIMO CRM
 * Envío de correos personalizados para campañas
 */

/**
 * Enviar email a un destinatario - VIA BACKEND
 */
export const enviarEmail = async (destinatario, asunto, contenido) => {
  if (!destinatario) {
    throw new Error('Email del destinatario no proporcionado')
  }

  try {
    // Llamar a NUESTRO backend en lugar de Resend directamente
    const apiUrl = import.meta.env.DEV 
      ? 'http://localhost:3000/api/send-email'  // Local
      : '/api/send-email'  // Producción (Vercel)

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        destinatario,
        asunto,
        contenido
      })
    })

    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error || 'Error al enviar email')
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
      margin: 0;
      padding: 0;
      background-color: #f5f5f5;
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
    .header h1 {
      margin: 0;
      font-size: 28px;
    }
    .header p {
      margin: 10px 0 0 0;
      font-size: 16px;
    }
    .content {
      background: #ffffff;
      padding: 30px;
      border-left: 2px solid #f0f0f0;
      border-right: 2px solid #f0f0f0;
      border-bottom: 2px solid #f0f0f0;
      border-radius: 0 0 10px 10px;
    }
    .content h2 {
      color: #333;
      margin-top: 0;
    }
    .button {
      display: inline-block;
      padding: 14px 30px;
      background: #f22121;
      color: white !important;
      text-decoration: none;
      border-radius: 8px;
      margin: 20px 0;
      font-weight: bold;
      font-size: 16px;
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
      ${mensaje.split('\n').map(line => `<p>${line}</p>`).join('')}
      
      <div style="text-align: center; margin-top: 30px;">
        <a href="https://wa.me/51${cliente.celular || '999999999'}" class="button">
          💬 Contáctanos por WhatsApp
        </a>
      </div>
    </div>
    <div class="footer">
      <p><strong>Heladería Memimo</strong> - Huancayo, Perú</p>
      <p>Este correo fue enviado porque eres parte de nuestra familia Memimo 💕</p>
    </div>
  </div>
</body>
</html>
      `

      // Enviar email via nuestro backend
      await enviarEmail(cliente.email, asunto, htmlContent)
      
      resultados.exitosos++
      resultados.detalles.push({
        cliente: `${cliente.nombres} ${cliente.apellidos}`,
        email: cliente.email,
        estado: 'exitoso'
      })

      // Delay para no saturar la API
      await new Promise(resolve => setTimeout(resolve, 1100))
      
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
 * Verificar configuración de Email - SIMPLIFICADO
 */
export const verificarEmailConfig = async () => {
  const apiKey = import.meta.env.VITE_RESEND_API_KEY

  // Ya no necesitamos verificar desde el frontend
  // Solo verificamos que el usuario haya configurado algo
  if (!apiKey || apiKey === 'tu_api_key_aqui') {
    return {
      conectado: false,
      mensaje: 'Configura RESEND_API_KEY en Vercel'
    }
  }

  // Asumimos que si hay una key configurada, el backend funcionará
  return {
    conectado: true,
    mensaje: 'Email configurado (backend)'
  }
}