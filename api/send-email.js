// api/send-email.js

export default async function handler(req, res) {
  // Solo permitir POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { destinatario, asunto, contenido } = req.body

  // Validaciones
  if (!destinatario || !asunto || !contenido) {
    return res.status(400).json({ 
      error: 'Faltan parámetros requeridos',
      required: ['destinatario', 'asunto', 'contenido']
    })
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY
  const EMAIL_FROM = process.env.EMAIL_FROM || 'onboarding@resend.dev'

  if (!RESEND_API_KEY) {
    return res.status(500).json({ error: 'API Key no configurada en servidor' })
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `Heladería Memimo <${EMAIL_FROM}>`,
        to: [destinatario],
        subject: asunto,
        html: contenido
      })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Error al enviar email')
    }

    return res.status(200).json({ 
      success: true, 
      data,
      message: 'Email enviado correctamente' 
    })

  } catch (error) {
    console.error('Error enviando email:', error)
    return res.status(500).json({ 
      error: error.message,
      success: false 
    })
  }
}