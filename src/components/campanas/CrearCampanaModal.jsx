import { useState, useEffect } from 'react'
import { obtenerClientes, crearCampanaCompleta, actualizarCampana, asignarYEnviarCampana } from '../../lib/supabase'
import { enviarCampanaTelegram, verificarBotTelegram } from '../../lib/telegram'
import { enviarCampanaEmail, verificarEmailConfig } from '../../lib/email'
import './CrearCampanaModal.css'

const CrearCampanaModal = ({ isOpen, onClose, campana = null, modoEdicion = false, onSuccess }) => {
  const [step, setStep] = useState(1) // 1: Info, 2: Canal, 3: Clientes, 4: Enviar
  const [loading, setLoading] = useState(false)
  const [clientes, setClientes] = useState([])
  const [botTelegram, setBotTelegram] = useState({ conectado: false })
  const [emailConfig, setEmailConfig] = useState({ conectado: false })

  // Datos del formulario
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    tipo_descuento: '',
    valor_descuento: '',
    fecha_inicio: '',
    fecha_fin: '',
    canal: 'telegram'
  })

  // Selecciones
  const [clientesSeleccionados, setClientesSeleccionados] = useState([])
  const [mensajePersonalizado, setMensajePersonalizado] = useState('')

  // Simulación
  const [simulacionEnvio, setSimulacionEnvio] = useState([])

  useEffect(() => {
    if (isOpen) {
      cargarDatos()
      verificarTelegram()
      verificarEmail()
      
      // Si es modo edición, cargar datos de la campaña
      if (modoEdicion && campana) {
        setFormData({
          nombre: campana.nombre || '',
          descripcion: campana.descripcion || '',
          tipo_descuento: campana.tipo_descuento || '',
          valor_descuento: campana.valor_descuento || '',
          fecha_inicio: campana.fecha_inicio || '',
          fecha_fin: campana.fecha_fin || '',
          canal: campana.canal || 'telegram'
        })
      }
    }
  }, [isOpen, modoEdicion, campana])

  const cargarDatos = async () => {
    try {
      const data = await obtenerClientes()
      setClientes(data)
    } catch (error) {
      console.error('Error al cargar clientes:', error)
    }
  }

  const verificarTelegram = async () => {
    const resultado = await verificarBotTelegram()
    setBotTelegram(resultado)
  }

  const verificarEmail = async () => {
    const resultado = await verificarEmailConfig()
    setEmailConfig(resultado)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const toggleCliente = (clienteId) => {
    setClientesSeleccionados(prev =>
      prev.includes(clienteId)
        ? prev.filter(id => id !== clienteId)
        : [...prev, clienteId]
    )
  }

  const seleccionarTodos = () => {
    if (clientesSeleccionados.length === clientes.length) {
      setClientesSeleccionados([])
    } else {
      setClientesSeleccionados(clientes.map(c => c.id))
    }
  }

  const generarMensajeSugerido = () => {
    const descuento = formData.tipo_descuento === 'porcentaje'
      ? `${formData.valor_descuento}% de descuento`
      : `S/ ${formData.valor_descuento} de descuento`

    return `🍦 ¡PROMOCIÓN ESPECIAL! 🍦

${formData.nombre}

${formData.descripcion}

🎁 ${descuento}

📅 Válido hasta el ${new Date(formData.fecha_fin).toLocaleDateString('es-PE')}

📍 Visítanos en Heladería Memimo - Huancayo

¡No te lo pierdas!`
  }

  const handleEnviarCampana = async () => {
    setLoading(true)

    try {
      let campanaFinal

      if (modoEdicion && campana) {
        // MODO EDICIÓN - Actualizar campaña existente
        campanaFinal = await actualizarCampana(campana.id, formData)
        
        alert('✅ Campaña actualizada correctamente!')
        onSuccess && onSuccess()
        handleCerrar()
        
      } else {
        // MODO CREACIÓN - Crear nueva y enviar
        campanaFinal = await crearCampanaCompleta(formData)

        const clientesAEnviar = clientes.filter(c => 
          clientesSeleccionados.includes(c.id)
        )

        const mensaje = mensajePersonalizado || generarMensajeSugerido()

        // TELEGRAM
        if (formData.canal === 'telegram' && botTelegram.conectado) {
          const resultados = await enviarCampanaTelegram(
            clientesAEnviar,
            mensaje,
            formData.nombre
          )

          alert(`✅ Campaña enviada por Telegram!\n\n` +
                `Exitosos: ${resultados.exitosos}\n` +
                `Fallidos: ${resultados.fallidos}`)

          await asignarYEnviarCampana(campanaFinal.id, clientesSeleccionados)
        }
        // EMAIL
        else if (formData.canal === 'email' && emailConfig.conectado) {
          // Asunto del email
          const asunto = `🍦 ${formData.nombre} - Heladería Memimo`
          
          const resultados = await enviarCampanaEmail(
            clientesAEnviar,
            asunto,
            mensaje,
            formData.nombre
          )

          alert(`✅ Campaña enviada por Email!\n\n` +
                `Exitosos: ${resultados.exitosos}\n` +
                `Fallidos: ${resultados.fallidos}\n\n` +
                `Clientes sin email: ${resultados.detalles.filter(d => d.error === 'Sin email registrado').length}`)

          await asignarYEnviarCampana(campanaFinal.id, clientesSeleccionados)
        }
        // DEMO (WhatsApp, Instagram, etc)
        else {
          const simulacion = clientesAEnviar.map((cliente, index) => ({
            id: index,
            cliente: `${cliente.nombres} ${cliente.apellidos}`,
            estado: 'enviado',
            canal: formData.canal,
            timestamp: new Date().toLocaleTimeString()
          }))

          setSimulacionEnvio(simulacion)
          await new Promise(resolve => setTimeout(resolve, 3000))

          alert(`✅ Campaña simulada enviada por ${formData.canal}!\n\n` +
                `${clientesAEnviar.length} clientes alcanzados\n\n` +
                `(Esto es una demo visual. Para envíos reales, usa Telegram o Email)`)

          await asignarYEnviarCampana(campanaFinal.id, clientesSeleccionados)
        }

        onSuccess && onSuccess()
        handleCerrar()
      }

    } catch (error) {
      console.error('Error al procesar campaña:', error)
      alert('❌ Error: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCerrar = () => {
    setStep(1)
    setFormData({
      nombre: '',
      descripcion: '',
      tipo_descuento: '',
      valor_descuento: '',
      fecha_inicio: '',
      fecha_fin: '',
      canal: 'telegram'
    })
    setClientesSeleccionados([])
    setMensajePersonalizado('')
    setSimulacionEnvio([])
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="campana-modal-overlay" onClick={handleCerrar}>
      <div className="campana-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="campana-modal-header">
          <div className="campana-steps">
            <div className={`step ${step >= 1 ? 'active' : ''}`}>
              <span className="step-number">1</span>
              <span className="step-label">Información</span>
            </div>
            <div className="step-divider"></div>
            <div className={`step ${step >= 2 ? 'active' : ''}`}>
              <span className="step-number">2</span>
              <span className="step-label">Canal</span>
            </div>
            <div className="step-divider"></div>
            <div className={`step ${step >= 3 ? 'active' : ''}`}>
              <span className="step-number">3</span>
              <span className="step-label">Clientes</span>
            </div>
            <div className="step-divider"></div>
            <div className={`step ${step >= 4 ? 'active' : ''}`}>
              <span className="step-number">4</span>
              <span className="step-label">Enviar</span>
            </div>
          </div>
          <button className="campana-modal-close" onClick={handleCerrar}>✕</button>
        </div>

        {/* Body */}
        <div className="campana-modal-body">
          {/* STEP 1: Información */}
          {step === 1 && (
            <div className="campana-step">
              <h3 className="step-title">
                {modoEdicion ? '✏️ Editar Campaña' : '📢 Nueva Campaña'}
              </h3>
              
              <div className="form-grid">
                <div className="form-field full-width">
                  <label className="form-label required">Nombre de la Campaña</label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Ej: Promo 2x1 en Rolls"
                    required
                  />
                </div>

                <div className="form-field full-width">
                  <label className="form-label">Descripción</label>
                  <textarea
                    name="descripcion"
                    value={formData.descripcion}
                    onChange={handleChange}
                    className="form-textarea"
                    placeholder="Describe la promoción..."
                    rows="3"
                  />
                </div>

                <div className="form-field">
                  <label className="form-label">Tipo de Descuento</label>
                  <select
                    name="tipo_descuento"
                    value={formData.tipo_descuento}
                    onChange={handleChange}
                    className="form-input"
                  >
                    <option value="">Sin descuento</option>
                    <option value="porcentaje">Porcentaje (%)</option>
                    <option value="monto">Monto fijo (S/)</option>
                  </select>
                </div>

                {formData.tipo_descuento && (
                  <div className="form-field">
                    <label className="form-label">Valor del Descuento</label>
                    <input
                      type="number"
                      name="valor_descuento"
                      value={formData.valor_descuento}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="0"
                      min="0"
                    />
                  </div>
                )}

                <div className="form-field">
                  <label className="form-label">Fecha de Inicio</label>
                  <input
                    type="date"
                    name="fecha_inicio"
                    value={formData.fecha_inicio}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>

                <div className="form-field">
                  <label className="form-label">Fecha de Fin</label>
                  <input
                    type="date"
                    name="fecha_fin"
                    value={formData.fecha_fin}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Seleccionar Canal */}
          {step === 2 && (
            <div className="campana-step">
              <h3 className="step-title">📱 Seleccionar Canal de Envío</h3>

              <div className="canales-grid">
                {/* Telegram - REAL */}
                <div
                  className={`canal-card ${formData.canal === 'telegram' ? 'selected' : ''} ${botTelegram.conectado ? 'disponible' : 'no-disponible'}`}
                  onClick={() => setFormData(prev => ({ ...prev, canal: 'telegram' }))}
                >
                  <div className="canal-icon">📱</div>
                  <h4>Telegram</h4>
                  <p>Envío real de mensajes</p>
                  {botTelegram.conectado ? (
                    <span className="canal-badge success">✓ Conectado</span>
                  ) : (
                    <span className="canal-badge error">✗ No configurado</span>
                  )}
                </div>

                {/* EMAIL - REAL */}
                <div
                  className={`canal-card ${formData.canal === 'email' ? 'selected' : ''} ${emailConfig.conectado ? 'disponible' : 'no-disponible'}`}
                  onClick={() => setFormData(prev => ({ ...prev, canal: 'email' }))}
                >
                  <div className="canal-icon">�</div>
                  <h4>Email</h4>
                  <p>Correos personalizados</p>
                  {emailConfig.conectado ? (
                    <span className="canal-badge success">✓ Conectado</span>
                  ) : (
                    <span className="canal-badge error">✗ No configurado</span>
                  )}
                </div>

                {/* WhatsApp - DEMO */}
                <div
                  className={`canal-card ${formData.canal === 'whatsapp' ? 'selected' : ''} demo`}
                  onClick={() => setFormData(prev => ({ ...prev, canal: 'whatsapp' }))}
                >
                  <div className="canal-icon">�</div>
                  <h4>WhatsApp</h4>
                  <p>Simulación de envío masivo</p>
                  <span className="canal-badge demo">🎨 Demo</span>
                </div>

                {/* Instagram - DEMO */}
                <div
                  className={`canal-card ${formData.canal === 'instagram' ? 'selected' : ''} demo`}
                  onClick={() => setFormData(prev => ({ ...prev, canal: 'instagram' }))}
                >
                  <div className="canal-icon">�</div>
                  <h4>Instagram</h4>
                  <p>Publicación en Stories/Feed</p>
                  <span className="canal-badge demo">🎨 Demo</span>
                </div>
              </div>

              {/* Alerta Email */}
              {!emailConfig.conectado && formData.canal === 'email' && (
                <div className="alerta-telegram">
                  <h4>⚠️ Configuración de Email requerida</h4>
                  <p>Para enviar correos reales, necesitas:</p>
                  <ol>
                    <li>Crear una cuenta en <a href="https://resend.com" target="_blank">Resend.com</a></li>
                    <li>Obtener tu API Key</li>
                    <li>Agregar en .env: <code>VITE_RESEND_API_KEY</code></li>
                    <li>Agregar en .env: <code>VITE_EMAIL_FROM</code></li>
                  </ol>
                </div>
              )}

              {/* Alerta Telegram */}
              {!botTelegram.conectado && formData.canal === 'telegram' && (
                <div className="alerta-telegram">
                  <h4>⚠️ Configuración de Telegram requerida</h4>
                  <p>Para enviar mensajes reales por Telegram, necesitas:</p>
                  <ol>
                    <li>Crear un bot con @BotFather en Telegram</li>
                    <li>Agregar el token en tu archivo .env: <code>VITE_TELEGRAM_BOT_TOKEN</code></li>
                    <li>Agregar tu Chat ID: <code>VITE_TELEGRAM_CHAT_ID</code></li>
                  </ol>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Seleccionar Clientes */}
          {step === 3 && (
            <div className="campana-step">
              <div className="clientes-header">
                <h3 className="step-title">👥 Seleccionar Clientes</h3>
                <button className="btn-seleccionar-todos" onClick={seleccionarTodos}>
                  {clientesSeleccionados.length === clientes.length 
                    ? '✓ Todos seleccionados' 
                    : 'Seleccionar todos'}
                </button>
              </div>

              <div className="clientes-seleccion-grid">
                {clientes.map(cliente => (
                  <div
                    key={cliente.id}
                    className={`cliente-seleccion-card ${clientesSeleccionados.includes(cliente.id) ? 'selected' : ''}`}
                    onClick={() => toggleCliente(cliente.id)}
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
                    {clientesSeleccionados.includes(cliente.id) && (
                      <div className="cliente-check">✓</div>
                    )}
                  </div>
                ))}
              </div>

              <div className="clientes-resumen">
                <strong>{clientesSeleccionados.length}</strong> clientes seleccionados
              </div>
            </div>
          )}

          {/* STEP 4: Vista Previa y Enviar */}
          {step === 4 && (
            <div className="campana-step">
              <h3 className="step-title">✅ Vista Previa y Envío</h3>

              <div className="preview-grid">
                <div className="preview-card">
                  <h4>📋 Resumen de la Campaña</h4>
                  <div className="resumen-item">
                    <span>Nombre:</span>
                    <strong>{formData.nombre}</strong>
                  </div>
                  <div className="resumen-item">
                    <span>Canal:</span>
                    <strong>{formData.canal}</strong>
                  </div>
                  <div className="resumen-item">
                    <span>Clientes:</span>
                    <strong>{clientesSeleccionados.length}</strong>
                  </div>
                  {formData.tipo_descuento && (
                    <div className="resumen-item">
                      <span>Descuento:</span>
                      <strong>
                        {formData.tipo_descuento === 'porcentaje' 
                          ? `${formData.valor_descuento}%`
                          : `S/ ${formData.valor_descuento}`
                        }
                      </strong>
                    </div>
                  )}
                </div>

                <div className="preview-card">
                  <h4>💬 Mensaje</h4>
                  <textarea
                    className="mensaje-preview"
                    value={mensajePersonalizado || generarMensajeSugerido()}
                    onChange={(e) => setMensajePersonalizado(e.target.value)}
                    placeholder="Personaliza tu mensaje..."
                    rows="10"
                  />
                  <button 
                    className="btn-mensaje-sugerido"
                    onClick={() => setMensajePersonalizado(generarMensajeSugerido())}
                  >
                    🔄 Restaurar mensaje sugerido
                  </button>
                </div>
              </div>

              {/* Simulación de envío */}
              {simulacionEnvio.length > 0 && (
                <div className="simulacion-envio">
                  <h4>📤 Enviando...</h4>
                  <div className="simulacion-lista">
                    {simulacionEnvio.map(item => (
                      <div key={item.id} className="simulacion-item">
                        <span className="simulacion-check">✓</span>
                        <span>{item.cliente}</span>
                        <span className="simulacion-hora">{item.timestamp}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="campana-modal-footer">
          {step > 1 && (
            <button 
              className="btn-campana-secondary"
              onClick={() => setStep(step - 1)}
              disabled={loading}
            >
              ← Atrás
            </button>
          )}
          <div style={{ flex: 1 }}></div>
          {step < 4 ? (
            <button
              className="btn-campana-primary"
              onClick={() => setStep(step + 1)}
              disabled={
                (step === 1 && !formData.nombre) ||
                (step === 3 && clientesSeleccionados.length === 0)
              }
            >
              Siguiente →
            </button>
          ) : (
            <button
              className="btn-campana-primary"
              onClick={handleEnviarCampana}
              disabled={loading || clientesSeleccionados.length === 0}
            >
              {loading ? '📤 Enviando...' : '✓ Enviar Campaña'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default CrearCampanaModal