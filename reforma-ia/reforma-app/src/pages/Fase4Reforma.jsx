import React, { useState, useEffect, useRef } from 'react'
import { Sparkles, Send, CheckCircle2, ArrowRight, ArrowLeft, Euro, Clock, Star } from 'lucide-react'
import { Btn, Card, PageWrapper, PageTitle, Alert, Spinner, ChatBubble, Badge, RangeInput } from '../components/UI.jsx'
import { sugerirEstilosReforma, generarPropostaReforma, chatAjusteReforma } from '../utils/gemini.js'

export default function Fase4Reforma({ apiKey, vivienda, onUpdate, onNext, onBack }) {
  const estancias = vivienda.datosPlano.estancias.filter(
    e => vivienda.estanciasSeleccionadas.includes(e.id)
  )

  const [paso, setPaso] = useState(vivienda.estiloElegido ? 'propuestas' : 'estilos')
  const [estilos, setEstilos] = useState([])
  const [cargandoEstilos, setCargandoEstilos] = useState(false)
  const [estiloElegido, setEstiloElegido] = useState(vivienda.estiloElegido || null)
  const [params, setParams] = useState(vivienda.parametros || { presupuesto: 30000, tiempo: 8, calidad: 7 })
  const [propuestas, setPropuestas] = useState(vivienda.propuestas || {})
  const [historialChat, setHistorialChat] = useState({})
  const [confirmadas, setConfirmadas] = useState({})
  const [generandoPropuesta, setGenerandoPropuesta] = useState({})
  const [inputChat, setInputChat] = useState({})
  const [enviando, setEnviando] = useState({})
  const [error, setError] = useState('')

  useEffect(() => {
    if (paso === 'estilos' && estilos.length === 0) {
      cargarEstilos()
    }
  }, [paso])

  const cargarEstilos = async () => {
    setCargandoEstilos(true)
    try {
      const data = await sugerirEstilosReforma(apiKey, estancias, vivienda.analisis)
      setEstilos(data.estilos || [])
    } catch (e) {
      setError('Error cargando estilos: ' + e.message)
    } finally {
      setCargandoEstilos(false)
    }
  }

  const elegirEstilo = (estilo) => {
    setEstiloElegido(estilo)
    onUpdate({ estiloElegido: estilo })
  }

  const irAPropuestas = () => {
    setPaso('propuestas')
    // Auto-generate for all rooms
    estancias.forEach(e => {
      if (!propuestas[e.id]) generarPropuestaEstancia(e)
    })
  }

  const generarPropuestaEstancia = async (estancia) => {
    setGenerandoPropuesta(prev => ({ ...prev, [estancia.id]: true }))
    try {
      const propuesta = await generarPropostaReforma(
        apiKey, estancia, vivienda.analisis[estancia.id], estiloElegido, params
      )
      const next = { ...propuestas, [estancia.id]: propuesta }
      setPropuestas(next)
      onUpdate({ propuestas: next })
      // Opening message
      setHistorialChat(prev => ({
        ...prev,
        [estancia.id]: [{
          role: 'assistant',
          content: `He generado la propuesta de reforma para "${estancia.nombre}" en estilo ${estiloElegido.nombre}.\n\nPresupuesto estimado: ${propuesta.presupuestoDesglosado?.total?.toLocaleString('es-ES')}€\nPlazo estimado: ${propuesta.plazoEstimado}\n\n${propuesta.descripcionReforma}\n\n¿Quieres cambiar algo? Puedo ajustar materiales, distribución, presupuesto o cualquier elemento.`,
        }]
      }))
    } catch (e) {
      setError('Error generando propuesta para ' + estancia.nombre + ': ' + e.message)
    } finally {
      setGenerandoPropuesta(prev => ({ ...prev, [estancia.id]: false }))
    }
  }

  const sendChat = async (estanciaId) => {
    const msg = (inputChat[estanciaId] || '').trim()
    if (!msg || enviando[estanciaId]) return
    setInputChat(prev => ({ ...prev, [estanciaId]: '' }))
    const hist = historialChat[estanciaId] || []
    const nuevoHist = [...hist, { role: 'user', content: msg }]
    setHistorialChat(prev => ({ ...prev, [estanciaId]: nuevoHist }))
    setEnviando(prev => ({ ...prev, [estanciaId]: true }))
    try {
      const estancia = estancias.find(e => e.id === estanciaId)
      const resp = await chatAjusteReforma(apiKey, estancia, propuestas[estanciaId], hist, msg)
      const confirmado = resp.includes('[REFORMA_CONFIRMADA]')
      const textoLimpio = resp.replace('[REFORMA_CONFIRMADA]', '').trim()
      setHistorialChat(prev => ({
        ...prev,
        [estanciaId]: [...nuevoHist, { role: 'assistant', content: textoLimpio }]
      }))
      if (confirmado) setConfirmadas(prev => ({ ...prev, [estanciaId]: true }))
    } catch (e) {
      setError('Error en chat: ' + e.message)
    } finally {
      setEnviando(prev => ({ ...prev, [estanciaId]: false }))
    }
  }

  const todasConfirmadas = estancias.every(e => confirmadas[e.id] || propuestas[e.id])

  const CALIDAD_LABELS = { 1: 'Básica', 4: 'Estándar', 7: 'Premium', 10: 'Lujo' }
  const calidadLabel = (v) => {
    const keys = Object.keys(CALIDAD_LABELS).map(Number)
    const closest = keys.reduce((a, b) => Math.abs(b - v) < Math.abs(a - v) ? b : a)
    return CALIDAD_LABELS[closest]
  }

  return (
    <PageWrapper maxWidth={860}>
      <PageTitle
        title="Diseña tu reforma"
        subtitle="Elige el estilo, ajusta los parámetros y recibe propuestas personalizadas por estancia."
      />

      {error && <Alert type="error">{error}</Alert>}

      {/* PASO 1: Estilos */}
      {paso === 'estilos' && (
        <>
          {cargandoEstilos && <Spinner label="Gemini está analizando tu vivienda y generando estilos…" />}

          {!cargandoEstilos && estilos.length > 0 && (
            <>
              <h2 style={{ fontSize: 20, marginBottom: 6 }}>Estilos recomendados para tu vivienda</h2>
              <p style={{ color: 'var(--col-stone-500)', fontSize: 14, marginBottom: 24 }}>
                La IA ha analizado el estado actual y sugiere estos estilos de reforma:
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16, marginBottom: 32 }}>
                {estilos.map(e => {
                  const sel = estiloElegido?.id === e.id
                  return (
                    <Card
                      key={e.id}
                      onClick={() => elegirEstilo(e)}
                      hover
                      style={{
                        border: `2px solid ${sel ? 'var(--col-terracota)' : 'var(--col-stone-200)'}`,
                        background: sel ? 'var(--col-terracota-light)' : '#fff',
                        cursor: 'pointer',
                        padding: '20px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <span style={{ fontSize: 30 }}>{e.emoji}</span>
                        {sel && <CheckCircle2 size={20} style={{ color: 'var(--col-terracota)' }} />}
                      </div>
                      <h3 style={{ fontSize: 17, margin: '10px 0 6px', fontFamily: 'var(--font-sans)', fontWeight: 600 }}>
                        {e.nombre}
                      </h3>
                      <p style={{ fontSize: 13, color: 'var(--col-stone-500)', lineHeight: 1.5, marginBottom: 12 }}>
                        {e.descripcion}
                      </p>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 10 }}>
                        {(e.paleta || []).map((col, i) => (
                          <div key={i} style={{
                            width: 20, height: 20, borderRadius: '50%',
                            background: col, border: '1.5px solid rgba(0,0,0,0.1)',
                          }} title={col} />
                        ))}
                      </div>
                      <Badge color={
                        e.presupuestoOrientativo === 'bajo' ? 'sage' :
                        e.presupuestoOrientativo === 'medio' ? 'gold' :
                        e.presupuestoOrientativo === 'alto' ? 'terracota' : 'stone'
                      }>
                        Presupuesto {e.presupuestoOrientativo}
                      </Badge>
                      <div style={{ marginTop: 10 }}>
                        {(e.caracteristicas || []).slice(0, 3).map((c, i) => (
                          <p key={i} style={{ fontSize: 12, color: 'var(--col-stone-600)', marginBottom: 3 }}>
                            · {c}
                          </p>
                        ))}
                      </div>
                    </Card>
                  )
                })}
              </div>

              {/* Parámetros */}
              {estiloElegido && (
                <Card style={{ marginBottom: 24 }}>
                  <h3 style={{ fontSize: 18, marginBottom: 20 }}>⚙️ Parámetros de la reforma</h3>
                  <RangeInput
                    label="Presupuesto máximo"
                    value={params.presupuesto}
                    min={5000} max={150000} step={1000}
                    onChange={v => setParams(p => ({ ...p, presupuesto: v }))}
                    format={v => `${v.toLocaleString('es-ES')}€`}
                    helpText="Presupuesto total para todas las estancias seleccionadas"
                  />
                  <RangeInput
                    label="Tiempo disponible"
                    value={params.tiempo}
                    min={2} max={24} step={1}
                    onChange={v => setParams(p => ({ ...p, tiempo: v }))}
                    format={v => `${v} semanas`}
                    helpText="Duración máxima de la obra"
                  />
                  <RangeInput
                    label="Calidad de materiales"
                    value={params.calidad}
                    min={1} max={10} step={1}
                    onChange={v => setParams(p => ({ ...p, calidad: v }))}
                    format={v => `${calidadLabel(v)} (${v}/10)`}
                    helpText="Nivel de acabados y materiales deseado"
                  />
                </Card>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Btn variant="ghost" onClick={onBack} icon={ArrowLeft}>Volver</Btn>
                <Btn
                  onClick={() => { onUpdate({ parametros: params }); irAPropuestas() }}
                  disabled={!estiloElegido}
                  icon={Sparkles}
                  size="lg"
                >
                  Generar propuestas
                </Btn>
              </div>
            </>
          )}
        </>
      )}

      {/* PASO 2: Propuestas por estancia */}
      {paso === 'propuestas' && (
        <>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24,
            padding: '14px 20px',
            background: 'var(--col-terracota-light)',
            borderRadius: 'var(--radius-md)',
          }}>
            <span style={{ fontSize: 24 }}>{estiloElegido.emoji}</span>
            <div>
              <p style={{ fontWeight: 600, fontSize: 16 }}>Estilo {estiloElegido.nombre}</p>
              <p style={{ fontSize: 13, color: 'var(--col-stone-600)' }}>
                Presupuesto: {params.presupuesto.toLocaleString('es-ES')}€ · {params.tiempo} semanas · Calidad {calidadLabel(params.calidad)}
              </p>
            </div>
            <button
              onClick={() => setPaso('estilos')}
              style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--col-terracota)', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Cambiar
            </button>
          </div>

          {estancias.map(estancia => {
            const propuesta = propuestas[estancia.id]
            const cargando = generandoPropuesta[estancia.id]
            const hist = historialChat[estancia.id] || []
            const confirmada = confirmadas[estancia.id]
            const chatRef = React.createRef()

            return (
              <Card key={estancia.id} style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <h3 style={{ fontSize: 17, fontFamily: 'var(--font-sans)', fontWeight: 600, flex: 1 }}>
                    {estancia.nombre}
                  </h3>
                  {confirmada && <Badge color="sage">✓ Confirmada</Badge>}
                  {propuesta && !confirmada && <Badge color="gold">En revisión</Badge>}
                </div>

                {cargando && <Spinner label={`Generando propuesta para ${estancia.nombre}…`} />}

                {propuesta && !cargando && (
                  <>
                    {/* Resumen económico */}
                    <div style={{
                      display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: 12, marginBottom: 16,
                    }}>
                      {[
                        { icon: Euro, label: 'Coste total', value: `${propuesta.presupuestoDesglosado?.total?.toLocaleString('es-ES')}€` },
                        { icon: Clock, label: 'Plazo', value: propuesta.plazoEstimado },
                        { icon: Star, label: 'Materiales', value: propuesta.materialesNuevos?.suelo?.material || '—' },
                      ].map((item, i) => {
                        const Icon = item.icon
                        return (
                          <div key={i} style={{
                            background: 'var(--col-stone-50)',
                            borderRadius: 'var(--radius-md)',
                            padding: '12px 14px',
                            textAlign: 'center',
                          }}>
                            <Icon size={16} style={{ color: 'var(--col-terracota)', margin: '0 auto 6px' }} />
                            <p style={{ fontSize: 11, color: 'var(--col-stone-400)', marginBottom: 3 }}>{item.label}</p>
                            <p style={{ fontSize: 14, fontWeight: 600 }}>{item.value}</p>
                          </div>
                        )
                      })}
                    </div>

                    {/* Cambios principales */}
                    <div style={{ marginBottom: 14 }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--col-stone-400)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Cambios principales
                      </p>
                      {(propuesta.cambiosPrincipales || []).map((c, i) => (
                        <p key={i} style={{ fontSize: 13, color: 'var(--col-stone-700)', marginBottom: 4 }}>
                          ✦ {c}
                        </p>
                      ))}
                    </div>

                    {/* Chat de ajuste */}
                    <div style={{
                      border: '1px solid var(--col-stone-200)',
                      borderRadius: 'var(--radius-md)',
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        height: 220, overflowY: 'auto', padding: 14,
                        background: 'var(--col-stone-50)',
                      }}>
                        {hist.map((m, i) => <ChatBubble key={i} msg={m} />)}
                        {enviando[estancia.id] && (
                          <p style={{ fontSize: 13, color: 'var(--col-stone-400)', padding: '4px 0' }}>Escribiendo…</p>
                        )}
                      </div>
                      {!confirmada && (
                        <div style={{
                          display: 'flex', gap: 8, padding: '10px 12px',
                          borderTop: '1px solid var(--col-stone-200)',
                          background: '#fff',
                        }}>
                          <input
                            value={inputChat[estancia.id] || ''}
                            onChange={e => setInputChat(prev => ({ ...prev, [estancia.id]: e.target.value }))}
                            onKeyDown={e => e.key === 'Enter' && sendChat(estancia.id)}
                            placeholder="Cambia materiales, distribución, colores…"
                            style={{
                              flex: 1, padding: '8px 12px',
                              border: '1px solid var(--col-stone-200)',
                              borderRadius: 'var(--radius-md)',
                              fontSize: 14, outline: 'none',
                            }}
                          />
                          <Btn onClick={() => sendChat(estancia.id)} loading={enviando[estancia.id]} icon={Send} size="sm">
                            Enviar
                          </Btn>
                        </div>
                      )}
                    </div>

                    {!confirmada && (
                      <div style={{ marginTop: 10, textAlign: 'right' }}>
                        <Btn variant="secondary" size="sm" onClick={() => setConfirmadas(p => ({ ...p, [estancia.id]: true }))} icon={CheckCircle2}>
                          Confirmar propuesta
                        </Btn>
                      </div>
                    )}
                  </>
                )}

                {!propuesta && !cargando && (
                  <Btn onClick={() => generarPropuestaEstancia(estancia)} icon={Sparkles}>
                    Generar propuesta
                  </Btn>
                )}
              </Card>
            )
          })}

          <div style={{
            display: 'flex', justifyContent: 'space-between',
            marginTop: 16, paddingTop: 24,
            borderTop: '1px solid var(--col-stone-200)',
          }}>
            <Btn variant="ghost" onClick={() => setPaso('estilos')} icon={ArrowLeft}>Cambiar estilo</Btn>
            <Btn
              onClick={onNext}
              disabled={!todasConfirmadas}
              icon={ArrowRight}
              size="lg"
            >
              Generar informe final
            </Btn>
          </div>
        </>
      )}
    </PageWrapper>
  )
}
