import React, { useState, useEffect, useRef } from 'react'
import { Send, CheckCircle2, ChevronDown, ChevronUp, ArrowRight, ArrowLeft } from 'lucide-react'
import { Btn, Card, PageWrapper, PageTitle, Alert, Spinner, ChatBubble, Badge } from '../components/UI.jsx'
import { analizarEstancia, chatDefinicionEstancia, fileToBase64Part } from '../utils/gemini.js'

const TIPO_ICONOS = {
  salon: '🛋️', cocina: '🍳', dormitorio: '🛏️', bano: '🚿',
  pasillo: '🚶', terraza: '🌿', garaje: '🚗', trastero: '📦', otro: '🏠',
}

function EstanciaPanel({ estancia, vivienda, apiKey, analisis, onAnalisis, historial, onHistorial, definida, onDefinida }) {
  const [abierto, setAbierto] = useState(!definida)
  const [analizando, setAnalizando] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [input, setInput] = useState('')
  const [error, setError] = useState('')
  const chatRef = useRef()

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight
  }, [historial])

  const handleAnalizar = async () => {
    setAnalizando(true)
    setError('')
    try {
      const files = vivienda.capturas[estancia.id] || []
      // Convert files to base64 parts (images only; for video take first frame as image placeholder)
      const imageParts = []
      for (const f of files.slice(0, 5)) { // max 5 images to Gemini free tier
        if (f.type.startsWith('image/')) {
          imageParts.push(await fileToBase64Part(f))
        }
      }
      if (imageParts.length === 0) {
        // If video, send a text description instead
        imageParts.push({}) // will be filtered below
        const result = await analizarEstancia(apiKey, estancia, [])
        onAnalisis(result)
        // Auto-start chat
        onHistorial([{
          role: 'assistant',
          content: `He analizado "${estancia.nombre}" basándome en la descripción del plano. Para obtener un análisis más preciso, necesito que me des más información sobre el estado actual. ¿Puedes describir las paredes, suelo, iluminación y cualquier problema que veas?`,
        }])
        return
      }
      const result = await analizarEstancia(apiKey, estancia, imageParts)
      onAnalisis(result)

      // Generate opening chat message
      const resumen = `He analizado las imágenes de "${estancia.nombre}". 
Estado general: ${result.estadoGeneral} (${result.puntuacion}/10).
${result.resumenEstado}

¿Hay algo más que quieras añadir o corregir? Por ejemplo:
- Problemas que no se ven en las fotos (humedades, ruidos, malos olores…)
- Instalaciones que quieres cambiar
- Elementos que quieres conservar
- Preferencias o restricciones especiales`

      onHistorial([{ role: 'assistant', content: resumen }])
    } catch (e) {
      setError('Error al analizar: ' + e.message)
    } finally {
      setAnalizando(false)
    }
  }

  const handleSend = async () => {
    if (!input.trim() || enviando) return
    const msg = input.trim()
    setInput('')
    const nuevoHistorial = [...historial, { role: 'user', content: msg }]
    onHistorial(nuevoHistorial)
    setEnviando(true)
    try {
      const respuesta = await chatDefinicionEstancia(apiKey, estancia, analisis, historial, msg)
      const completado = respuesta.includes('[DEFINICION_COMPLETA]')
      const textoLimpio = respuesta.replace('[DEFINICION_COMPLETA]', '').trim()
      onHistorial([...nuevoHistorial, { role: 'assistant', content: textoLimpio }])
      if (completado) onDefinida(true)
    } catch (e) {
      setError('Error en el chat: ' + e.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Card style={{
      marginBottom: 16,
      border: `2px solid ${definida ? 'var(--col-sage)' : abierto ? 'var(--col-terracota)' : 'var(--col-stone-200)'}`,
      padding: 0, overflow: 'hidden',
    }}>
      {/* Header */}
      <button
        onClick={() => setAbierto(v => !v)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 12,
          padding: '16px 20px', background: 'none', border: 'none', cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <span style={{ fontSize: 22 }}>{TIPO_ICONOS[estancia.tipo] || '🏠'}</span>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 600, fontSize: 16 }}>{estancia.nombre}</span>
            {definida
              ? <Badge color="sage">✓ Definida</Badge>
              : analisis
                ? <Badge color="gold">En revisión</Badge>
                : <Badge color="stone">Pendiente</Badge>
            }
          </div>
          {analisis && (
            <span style={{ fontSize: 13, color: 'var(--col-stone-500)' }}>
              Estado: {analisis.estadoGeneral} · {analisis.puntuacion}/10
            </span>
          )}
        </div>
        {abierto ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>

      {abierto && (
        <div style={{ padding: '0 20px 20px' }}>
          {error && <Alert type="error">{error}</Alert>}

          {/* Sin análisis: botón analizar */}
          {!analisis && !analizando && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <p style={{ color: 'var(--col-stone-500)', fontSize: 14, marginBottom: 16 }}>
                {(vivienda.capturas[estancia.id]?.length || 0)} archivo(s) listos para analizar
              </p>
              <Btn onClick={handleAnalizar} icon={CheckCircle2}>
                Analizar con Gemini
              </Btn>
            </div>
          )}

          {analizando && <Spinner label={`Analizando ${estancia.nombre} con IA…`} />}

          {/* Resultado del análisis */}
          {analisis && (
            <>
              <div style={{
                background: 'var(--col-stone-50)',
                borderRadius: 'var(--radius-md)',
                padding: '14px 16px',
                marginBottom: 16,
                fontSize: 13,
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px 16px',
              }}>
                <div><span style={{ color: 'var(--col-stone-400)' }}>Suelo: </span>{analisis.materialesActuales?.suelo}</div>
                <div><span style={{ color: 'var(--col-stone-400)' }}>Paredes: </span>{analisis.materialesActuales?.paredes}</div>
                <div><span style={{ color: 'var(--col-stone-400)' }}>Techo: </span>{analisis.materialesActuales?.techo}</div>
                <div><span style={{ color: 'var(--col-stone-400)' }}>Dimensiones: </span>{analisis.dimensionesEstimadas}</div>
                {analisis.problemasDetectados?.length > 0 && (
                  <div style={{ gridColumn: '1/-1' }}>
                    <span style={{ color: 'var(--col-stone-400)' }}>Problemas: </span>
                    {analisis.problemasDetectados.join(', ')}
                  </div>
                )}
              </div>

              {/* Chat */}
              <div style={{
                border: '1px solid var(--col-stone-200)',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
              }}>
                <div
                  ref={chatRef}
                  style={{
                    height: 260,
                    overflowY: 'auto',
                    padding: '16px',
                    background: 'var(--col-stone-50)',
                  }}
                >
                  {historial.map((m, i) => <ChatBubble key={i} msg={m} />)}
                  {enviando && (
                    <div style={{ display: 'flex', gap: 6, padding: '8px 0' }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--col-stone-300)', animation: 'bounce 1s infinite 0s' }} />
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--col-stone-300)', animation: 'bounce 1s infinite 0.2s' }} />
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--col-stone-300)', animation: 'bounce 1s infinite 0.4s' }} />
                    </div>
                  )}
                </div>

                {!definida && (
                  <div style={{
                    display: 'flex', gap: 8, padding: '10px 12px',
                    borderTop: '1px solid var(--col-stone-200)',
                    background: '#fff',
                  }}>
                    <input
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                      placeholder="Añade información sobre la estancia…"
                      style={{
                        flex: 1, padding: '8px 12px',
                        border: '1px solid var(--col-stone-200)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: 14, outline: 'none',
                      }}
                    />
                    <Btn onClick={handleSend} loading={enviando} icon={Send} size="sm">
                      Enviar
                    </Btn>
                  </div>
                )}

                {definida && (
                  <div style={{
                    padding: '10px 16px', background: 'var(--col-sage-light)',
                    borderTop: '1px solid var(--col-sage)',
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    <CheckCircle2 size={16} style={{ color: 'var(--col-sage)' }} />
                    <span style={{ fontSize: 13, color: 'var(--col-sage)', fontWeight: 500 }}>
                      Definición confirmada. Puedes editarla reabriendo el chat.
                    </span>
                    <button
                      onClick={() => onDefinida(false)}
                      style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--col-sage)', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      Editar
                    </button>
                  </div>
                )}
              </div>

              {!definida && (
                <div style={{ marginTop: 12, textAlign: 'right' }}>
                  <Btn variant="secondary" size="sm" onClick={() => onDefinida(true)} icon={CheckCircle2}>
                    Confirmar definición
                  </Btn>
                </div>
              )}
            </>
          )}
        </div>
      )}

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0) }
          50% { transform: translateY(-4px) }
        }
      `}</style>
    </Card>
  )
}

export default function Fase3Definicion({ apiKey, vivienda, onUpdate, onNext, onBack }) {
  const estancias = vivienda.datosPlano.estancias.filter(
    e => vivienda.estanciasSeleccionadas.includes(e.id)
  )

  const [analisis, setAnalisis] = useState(vivienda.analisis || {})
  const [historialChat, setHistorialChat] = useState(vivienda.historialChat || {})
  const [definidas, setDefinidas] = useState(vivienda.definicionFinal || {})

  const setAnalisisEstancia = (id, data) => {
    const next = { ...analisis, [id]: data }
    setAnalisis(next)
    onUpdate({ analisis: next })
  }

  const setHistorial = (id, msgs) => {
    const next = { ...historialChat, [id]: msgs }
    setHistorialChat(next)
    onUpdate({ historialChat: next })
  }

  const setDefinida = (id, val) => {
    const next = { ...definidas, [id]: val }
    setDefinidas(next)
    onUpdate({ definicionFinal: next })
  }

  const todasDefinidas = estancias.every(e => definidas[e.id])

  return (
    <PageWrapper maxWidth={800}>
      <PageTitle
        title="Define el estado actual"
        subtitle="La IA analiza tus imágenes. Usa el chat para completar o corregir la información de cada estancia."
      />

      {estancias.map(e => (
        <EstanciaPanel
          key={e.id}
          estancia={e}
          vivienda={vivienda}
          apiKey={apiKey}
          analisis={analisis[e.id]}
          onAnalisis={data => setAnalisisEstancia(e.id, data)}
          historial={historialChat[e.id] || []}
          onHistorial={msgs => setHistorial(e.id, msgs)}
          definida={!!definidas[e.id]}
          onDefinida={val => setDefinida(e.id, val)}
        />
      ))}

      {!todasDefinidas && (
        <Alert type="warning">
          Analiza y confirma la definición de todas las estancias para continuar.
        </Alert>
      )}

      <div style={{
        display: 'flex', justifyContent: 'space-between',
        marginTop: 24, paddingTop: 24,
        borderTop: '1px solid var(--col-stone-200)',
      }}>
        <Btn variant="ghost" onClick={onBack} icon={ArrowLeft}>Volver</Btn>
        <Btn
          onClick={onNext}
          disabled={!todasDefinidas}
          icon={ArrowRight}
          size="lg"
        >
          Ver propuestas de reforma
        </Btn>
      </div>
    </PageWrapper>
  )
}
