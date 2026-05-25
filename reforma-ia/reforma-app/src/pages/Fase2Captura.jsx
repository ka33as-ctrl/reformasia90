import React, { useState } from 'react'
import { Camera, Video, X, ArrowRight, ArrowLeft, CheckCircle2, ImagePlus } from 'lucide-react'
import { Btn, Card, PageWrapper, PageTitle, Alert, UploadZone } from '../components/UI.jsx'

const TIPO_ICONOS = {
  salon: '🛋️', cocina: '🍳', dormitorio: '🛏️', bano: '🚿',
  pasillo: '🚶', terraza: '🌿', garaje: '🚗', trastero: '📦', otro: '🏠',
}

export default function Fase2Captura({ apiKey, vivienda, onUpdate, onNext, onBack }) {
  const estancias = vivienda.datosPlano.estancias.filter(
    e => vivienda.estanciasSeleccionadas.includes(e.id)
  )
  const [capturas, setCapturas] = useState(vivienda.capturas || {})
  const [modo, setModo] = useState({}) // { estanciaId: 'fotos' | 'video' }

  const setModoEstancia = (id, m) => setModo(prev => ({ ...prev, [id]: m }))

  const addFiles = (estanciaId, files) => {
    setCapturas(prev => {
      const existing = prev[estanciaId] || []
      const next = { ...prev, [estanciaId]: [...existing, ...files].slice(0, 10) }
      onUpdate({ capturas: next })
      return next
    })
  }

  const removeFile = (estanciaId, idx) => {
    setCapturas(prev => {
      const next = { ...prev, [estanciaId]: prev[estanciaId].filter((_, i) => i !== idx) }
      onUpdate({ capturas: next })
      return next
    })
  }

  const completadas = estancias.filter(e => (capturas[e.id]?.length || 0) > 0)
  const canNext = completadas.length === estancias.length

  return (
    <PageWrapper maxWidth={800}>
      <PageTitle
        title="Captura el estado actual"
        subtitle={`Sube fotos o vídeo de cada estancia. Cuantas más imágenes, más preciso será el análisis. (${completadas.length}/${estancias.length} completadas)`}
      />

      {estancias.map(estancia => {
        const files = capturas[estancia.id] || []
        const modoActual = modo[estancia.id]
        const completada = files.length > 0

        return (
          <Card
            key={estancia.id}
            style={{
              marginBottom: 20,
              border: `2px solid ${completada ? 'var(--col-sage)' : 'var(--col-stone-200)'}`,
            }}
          >
            {/* Cabecera estancia */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{
                width: 44, height: 44,
                borderRadius: 'var(--radius-md)',
                background: completada ? 'var(--col-sage-light)' : 'var(--col-stone-100)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, flexShrink: 0,
              }}>
                {TIPO_ICONOS[estancia.tipo] || '🏠'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h3 style={{ fontSize: 17, fontFamily: 'var(--font-sans)', fontWeight: 600 }}>
                    {estancia.nombre}
                  </h3>
                  {completada && <CheckCircle2 size={16} style={{ color: 'var(--col-sage)' }} />}
                </div>
                <p style={{ fontSize: 13, color: 'var(--col-stone-400)' }}>
                  {estancia.superficieEstimada} · {files.length > 0 ? `${files.length} archivo(s) subido(s)` : 'Sin archivos aún'}
                </p>
              </div>
            </div>

            {/* Selector de modo */}
            {!modoActual && files.length === 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <button
                  onClick={() => setModoEstancia(estancia.id, 'fotos')}
                  style={{
                    padding: '16px',
                    borderRadius: 'var(--radius-md)',
                    border: '1.5px solid var(--col-stone-200)',
                    background: 'var(--col-stone-50)',
                    cursor: 'pointer',
                    transition: 'all var(--transition)',
                    textAlign: 'center',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'var(--col-terracota)'
                    e.currentTarget.style.background = 'var(--col-terracota-light)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--col-stone-200)'
                    e.currentTarget.style.background = 'var(--col-stone-50)'
                  }}
                >
                  <Camera size={24} style={{ color: 'var(--col-terracota)', margin: '0 auto 8px' }} />
                  <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Subir fotos</p>
                  <p style={{ fontSize: 12, color: 'var(--col-stone-500)' }}>Hasta 10 fotos por estancia</p>
                </button>
                <button
                  onClick={() => setModoEstancia(estancia.id, 'video')}
                  style={{
                    padding: '16px',
                    borderRadius: 'var(--radius-md)',
                    border: '1.5px solid var(--col-stone-200)',
                    background: 'var(--col-stone-50)',
                    cursor: 'pointer',
                    transition: 'all var(--transition)',
                    textAlign: 'center',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'var(--col-blue)'
                    e.currentTarget.style.background = 'var(--col-blue-light)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--col-stone-200)'
                    e.currentTarget.style.background = 'var(--col-stone-50)'
                  }}
                >
                  <Video size={24} style={{ color: 'var(--col-blue)', margin: '0 auto 8px' }} />
                  <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Subir vídeo</p>
                  <p style={{ fontSize: 12, color: 'var(--col-stone-500)' }}>Recorrido por la estancia</p>
                </button>
              </div>
            )}

            {/* Zona de subida de fotos */}
            {(modoActual === 'fotos' || files.some(f => f.type?.startsWith('image'))) && (
              <div>
                {files.length > 0 && (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))',
                    gap: 8,
                    marginBottom: 12,
                  }}>
                    {files.map((f, i) => (
                      <div key={i} style={{ position: 'relative' }}>
                        <img
                          src={URL.createObjectURL(f)}
                          alt=""
                          style={{
                            width: '100%',
                            aspectRatio: '1',
                            objectFit: 'cover',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--col-stone-200)',
                          }}
                        />
                        <button
                          onClick={() => removeFile(estancia.id, i)}
                          style={{
                            position: 'absolute', top: 3, right: 3,
                            background: 'rgba(0,0,0,0.6)',
                            border: 'none', borderRadius: '50%',
                            width: 20, height: 20,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', color: '#fff',
                          }}
                        >
                          <X size={11} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {files.length < 10 && (
                  <UploadZone
                    onFiles={fs => addFiles(estancia.id, fs)}
                    accept="image/*"
                    multiple
                    compact
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                      <ImagePlus size={18} style={{ color: 'var(--col-stone-400)' }} />
                      <span style={{ fontSize: 13, color: 'var(--col-stone-500)' }}>
                        {files.length === 0 ? 'Selecciona fotos de la estancia' : 'Añadir más fotos'}
                      </span>
                    </div>
                  </UploadZone>
                )}
              </div>
            )}

            {/* Zona de subida de vídeo */}
            {modoActual === 'video' && files.length === 0 && (
              <UploadZone
                onFiles={fs => addFiles(estancia.id, [fs[0]])}
                accept="video/*"
                multiple={false}
                compact
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                  <Video size={18} style={{ color: 'var(--col-stone-400)' }} />
                  <span style={{ fontSize: 13, color: 'var(--col-stone-500)' }}>
                    Selecciona el vídeo del recorrido
                  </span>
                </div>
              </UploadZone>
            )}

            {modoActual === 'video' && files.length > 0 && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 16px',
                background: 'var(--col-blue-light)',
                borderRadius: 'var(--radius-md)',
              }}>
                <Video size={18} style={{ color: 'var(--col-blue)' }} />
                <span style={{ fontSize: 14, color: 'var(--col-blue)', flex: 1 }}>
                  {files[0].name}
                </span>
                <button
                  onClick={() => removeFile(estancia.id, 0)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--col-blue)' }}
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {/* Info vídeo */}
            {modoActual === 'video' && (
              <Alert type="info" style={{ marginTop: 12 }}>
                Gemini extraerá fotogramas del vídeo para analizar la estancia. Graba lentamente dando un recorrido completo.
              </Alert>
            )}
          </Card>
        )
      })}

      {!canNext && (
        <Alert type="warning">
          Sube al menos una foto o vídeo de cada estancia seleccionada para continuar.
        </Alert>
      )}

      {/* Nav */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        marginTop: 24, paddingTop: 24,
        borderTop: '1px solid var(--col-stone-200)',
      }}>
        <Btn variant="ghost" onClick={onBack} icon={ArrowLeft}>Volver</Btn>
        <Btn
          onClick={onNext}
          disabled={!canNext}
          icon={ArrowRight}
          size="lg"
        >
          Analizar con IA
        </Btn>
      </div>
    </PageWrapper>
  )
}
