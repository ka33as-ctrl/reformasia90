import React, { useState } from 'react'
import { Upload, CheckCircle2, Home, ArrowRight, ArrowLeft, AlertTriangle } from 'lucide-react'
import { Btn, Card, PageWrapper, PageTitle, Alert, Spinner, UploadZone } from '../components/UI.jsx'
import { analizarPlano, fileToBase64Part } from '../utils/gemini.js'

const TIPO_ICONOS = {
  salon: '🛋️', cocina: '🍳', dormitorio: '🛏️', bano: '🚿',
  pasillo: '🚶', terraza: '🌿', garaje: '🚗', trastero: '📦', otro: '🏠',
}

export default function Fase1Plano({ apiKey, vivienda, onUpdate, onNext, onBack }) {
  const [archivo, setArchivo] = useState(null)
  const [preview, setPreview] = useState(vivienda.imagenPlano || null)
  const [analizando, setAnalizando] = useState(false)
  const [error, setError] = useState('')
  const [seleccionadas, setSeleccionadas] = useState(vivienda.estanciasSeleccionadas || [])

  const datosPlano = vivienda.datosPlano

  const handleFile = (files) => {
    const f = files[0]
    if (!f) return
    setArchivo(f)
    setError('')
    const url = URL.createObjectURL(f)
    setPreview(url)
    onUpdate({ datosPlano: null, imagenPlano: url, estanciasSeleccionadas: [] })
    setSeleccionadas([])
  }

  const handleAnalizar = async () => {
    if (!archivo && !vivienda.imagenPlano) return
    setAnalizando(true)
    setError('')
    try {
      let imagePart
      if (archivo) {
        imagePart = await fileToBase64Part(archivo)
      } else {
        // re-fetch from URL if already analyzed
        const res = await fetch(vivienda.imagenPlano)
        const blob = await res.blob()
        imagePart = await fileToBase64Part(blob)
      }
      const datos = await analizarPlano(apiKey, imagePart)
      onUpdate({ datosPlano: datos })
    } catch (e) {
      setError('Error al analizar el plano: ' + e.message + '. Verifica tu API key y que la imagen sea clara.')
    } finally {
      setAnalizando(false)
    }
  }

  const toggleEstancia = (id) => {
    setSeleccionadas(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
      onUpdate({ estanciasSeleccionadas: next })
      return next
    })
  }

  const selectAll = () => {
    const todos = datosPlano.estancias.map(e => e.id)
    setSeleccionadas(todos)
    onUpdate({ estanciasSeleccionadas: todos })
  }

  const canNext = seleccionadas.length > 0

  return (
    <PageWrapper maxWidth={800}>
      <PageTitle
        title="Sube el plano de tu vivienda"
        subtitle="Fotografía o escanea el plano en planta. Puede ser un sketch a mano o impreso."
      />

      {/* Upload zone */}
      <UploadZone
        onFiles={handleFile}
        accept="image/*"
        multiple={false}
      >
        {preview ? (
          <div>
            <img
              src={preview}
              alt="Plano subido"
              style={{
                maxHeight: 300,
                maxWidth: '100%',
                borderRadius: 'var(--radius-md)',
                objectFit: 'contain',
              }}
            />
            <p style={{ marginTop: 10, fontSize: 13, color: 'var(--col-stone-500)' }}>
              Haz clic para cambiar la imagen
            </p>
          </div>
        ) : (
          <div>
            <Upload size={40} style={{ color: 'var(--col-stone-300)', margin: '0 auto 12px' }} />
            <p style={{ fontWeight: 600, color: 'var(--col-stone-700)', marginBottom: 6 }}>
              Arrastra el plano aquí o haz clic
            </p>
            <p style={{ fontSize: 13, color: 'var(--col-stone-400)' }}>
              JPG, PNG, WEBP · máx. 20MB
            </p>
          </div>
        )}
      </UploadZone>

      {error && <Alert type="error" style={{ marginTop: 16 }}>{error}</Alert>}

      {/* Botón analizar */}
      {preview && !datosPlano && (
        <div style={{ marginTop: 20, textAlign: 'center' }}>
          <Btn
            onClick={handleAnalizar}
            loading={analizando}
            icon={Home}
            size="lg"
          >
            {analizando ? 'Analizando el plano con IA...' : 'Analizar plano con IA'}
          </Btn>
          {analizando && (
            <p style={{ marginTop: 12, fontSize: 13, color: 'var(--col-stone-400)' }}>
              Gemini está identificando las estancias de tu vivienda…
            </p>
          )}
        </div>
      )}

      {/* Resultados */}
      {datosPlano && (
        <div style={{ marginTop: 32 }}>
          <Card style={{ marginBottom: 24, background: 'var(--col-stone-50)' }}>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'flex-start' }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--col-stone-400)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                  Vivienda detectada
                </p>
                <h3 style={{ fontSize: 20, marginBottom: 4 }}>{datosPlano.tipoVivienda}</h3>
                <p style={{ fontSize: 14, color: 'var(--col-stone-500)' }}>{datosPlano.superficieTotal}</p>
              </div>
              <div style={{ flex: 2, minWidth: 200 }}>
                <p style={{ fontSize: 13, color: 'var(--col-stone-600)', lineHeight: 1.6 }}>
                  {datosPlano.descripcionGeneral}
                </p>
              </div>
            </div>
          </Card>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 20 }}>
              Estancias detectadas ({datosPlano.estancias.length})
            </h2>
            <button
              onClick={selectAll}
              style={{ fontSize: 13, color: 'var(--col-terracota)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}
            >
              Seleccionar todas
            </button>
          </div>

          <p style={{ fontSize: 14, color: 'var(--col-stone-500)', marginBottom: 16 }}>
            Selecciona las estancias que quieres incluir en la reforma:
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            {datosPlano.estancias.map(e => {
              const sel = seleccionadas.includes(e.id)
              return (
                <div
                  key={e.id}
                  onClick={() => toggleEstancia(e.id)}
                  style={{
                    padding: '16px',
                    borderRadius: 'var(--radius-md)',
                    border: `2px solid ${sel ? 'var(--col-terracota)' : 'var(--col-stone-200)'}`,
                    background: sel ? 'var(--col-terracota-light)' : '#fff',
                    cursor: 'pointer',
                    transition: 'all var(--transition)',
                    position: 'relative',
                  }}
                >
                  {sel && (
                    <CheckCircle2
                      size={16}
                      style={{ position: 'absolute', top: 10, right: 10, color: 'var(--col-terracota)' }}
                    />
                  )}
                  <div style={{ fontSize: 24, marginBottom: 8 }}>
                    {TIPO_ICONOS[e.tipo] || '🏠'}
                  </div>
                  <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{e.nombre}</p>
                  <p style={{ fontSize: 12, color: 'var(--col-stone-500)', marginBottom: 4 }}>{e.superficieEstimada}</p>
                  <p style={{ fontSize: 12, color: 'var(--col-stone-400)', lineHeight: 1.4 }}>{e.descripcion}</p>
                </div>
              )
            })}
          </div>

          {seleccionadas.length === 0 && (
            <Alert type="warning" style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={16} />
                Selecciona al menos una estancia para continuar.
              </div>
            </Alert>
          )}

          {/* Reanalizar */}
          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <button
              onClick={() => onUpdate({ datosPlano: null })}
              style={{ fontSize: 13, color: 'var(--col-stone-400)', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              ¿No es correcto? Volver a analizar
            </button>
          </div>
        </div>
      )}

      {/* Nav */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        marginTop: 40, paddingTop: 24,
        borderTop: '1px solid var(--col-stone-200)',
      }}>
        <Btn variant="ghost" onClick={onBack} icon={ArrowLeft}>Volver</Btn>
        <Btn
          onClick={onNext}
          disabled={!canNext}
          icon={ArrowRight}
          size="lg"
        >
          Continuar ({seleccionadas.length} estancias)
        </Btn>
      </div>
    </PageWrapper>
  )
}
