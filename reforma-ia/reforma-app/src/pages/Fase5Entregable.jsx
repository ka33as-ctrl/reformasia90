import React, { useState, useEffect } from 'react'
import { Download, RefreshCw, Euro, Clock, Package, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react'
import { Btn, Card, PageWrapper, PageTitle, Spinner, Alert, Badge } from '../components/UI.jsx'
import { generarEntregableFinal } from '../utils/gemini.js'

const TIPO_ICONOS = {
  salon: '🛋️', cocina: '🍳', dormitorio: '🛏️', bano: '🚿',
  pasillo: '🚶', terraza: '🌿', garaje: '🚗', trastero: '📦', otro: '🏠',
}

function SeccionColapsable({ titulo, icono, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <Card style={{ marginBottom: 16, padding: 0, overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 12,
          padding: '16px 20px', background: 'none', border: 'none', cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <span style={{ fontSize: 20 }}>{icono}</span>
        <span style={{ fontWeight: 600, fontSize: 16, flex: 1 }}>{titulo}</span>
        {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>
      {open && <div style={{ padding: '0 20px 20px' }}>{children}</div>}
    </Card>
  )
}

export default function Fase5Entregable({ apiKey, vivienda, onUpdate, onRestart }) {
  const [entregable, setEntregable] = useState(vivienda.entregable || null)
  const [generando, setGenerando] = useState(false)
  const [error, setError] = useState('')

  const estancias = vivienda.datosPlano.estancias.filter(
    e => vivienda.estanciasSeleccionadas.includes(e.id)
  )

  useEffect(() => {
    if (!entregable) generarInforme()
  }, [])

  const generarInforme = async () => {
    setGenerando(true)
    setError('')
    try {
      const data = await generarEntregableFinal(apiKey, vivienda, vivienda.propuestas)
      setEntregable(data)
      onUpdate({ entregable: data })
    } catch (e) {
      setError('Error generando el informe: ' + e.message)
    } finally {
      setGenerando(false)
    }
  }

  const exportarPDF = () => {
    window.print()
  }

  const exportarJSON = () => {
    const datos = {
      vivienda: vivienda.datosPlano,
      estilo: vivienda.estiloElegido,
      parametros: vivienda.parametros,
      analisis: vivienda.analisis,
      propuestas: vivienda.propuestas,
      entregable,
    }
    const blob = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'reforma-vivienda.json'
    a.click()
  }

  if (generando) {
    return (
      <PageWrapper>
        <Spinner size={40} label="Generando tu informe completo de reforma…" />
        <p style={{ textAlign: 'center', color: 'var(--col-stone-400)', fontSize: 14, marginTop: 8 }}>
          Esto puede tardar un momento, por favor espera.
        </p>
      </PageWrapper>
    )
  }

  if (error) {
    return (
      <PageWrapper>
        <Alert type="error">{error}</Alert>
        <Btn onClick={generarInforme}>Reintentar</Btn>
      </PageWrapper>
    )
  }

  if (!entregable) return null

  const totalPres = entregable.presupuestoTotal

  return (
    <PageWrapper maxWidth={860}>
      <PageTitle
        title="Informe de reforma"
        subtitle="Tu proyecto completo de reforma con presupuesto, materiales y planificación."
      />

      {/* Botones de acción */}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginBottom: 24 }}>
        <Btn variant="ghost" onClick={exportarJSON} icon={Download} size="sm">
          Exportar JSON
        </Btn>
        <Btn variant="secondary" onClick={exportarPDF} icon={Download} size="sm">
          Imprimir / PDF
        </Btn>
        <Btn variant="ghost" onClick={onRestart} icon={RefreshCw} size="sm">
          Nueva reforma
        </Btn>
      </div>

      {/* Resumen ejecutivo */}
      <Card style={{ marginBottom: 20, background: 'linear-gradient(135deg, var(--col-stone-800), var(--col-stone-700))', color: '#fff' }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 32 }}>{vivienda.estiloElegido?.emoji}</span>
          <div>
            <Badge color="terracota" style={{ marginBottom: 10 }}>
              Estilo {vivienda.estiloElegido?.nombre}
            </Badge>
            <h2 style={{ fontSize: 22, color: '#fff', marginBottom: 10 }}>
              Resumen ejecutivo
            </h2>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', lineHeight: 1.7 }}>
              {entregable.resumenEjecutivo}
            </p>
          </div>
        </div>
      </Card>

      {/* KPIs */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 14,
        marginBottom: 24,
      }}>
        {[
          {
            icon: Euro,
            label: 'Presupuesto total',
            value: `${(totalPres?.totalConContingencia || totalPres?.total || 0).toLocaleString('es-ES')}€`,
            sub: totalPres?.contingencia ? `Incl. ${totalPres.contingencia.toLocaleString('es-ES')}€ de contingencia` : '',
            color: 'var(--col-terracota)',
            bg: 'var(--col-terracota-light)',
          },
          {
            icon: Clock,
            label: 'Duración total',
            value: entregable.planificacionObra?.duracionTotal || '—',
            sub: `${estancias.length} estancia(s)`,
            color: 'var(--col-blue)',
            bg: 'var(--col-blue-light)',
          },
          {
            icon: Package,
            label: 'Líneas de material',
            value: (entregable.listaMateriales?.length || 0) + ' items',
            sub: 'Materiales detallados',
            color: 'var(--col-gold)',
            bg: 'var(--col-gold-light)',
          },
          {
            icon: CheckCircle2,
            label: 'Estancias reformadas',
            value: estancias.length,
            sub: estancias.map(e => e.nombre).join(', '),
            color: 'var(--col-sage)',
            bg: 'var(--col-sage-light)',
          },
        ].map((k, i) => {
          const Icon = k.icon
          return (
            <div key={i} style={{
              background: k.bg,
              borderRadius: 'var(--radius-lg)',
              padding: '20px',
            }}>
              <Icon size={20} style={{ color: k.color, marginBottom: 10 }} />
              <p style={{ fontSize: 22, fontWeight: 700, color: k.color, marginBottom: 3 }}>{k.value}</p>
              <p style={{ fontSize: 12, fontWeight: 600, color: k.color, marginBottom: 3 }}>{k.label}</p>
              <p style={{ fontSize: 11, color: 'var(--col-stone-500)', lineHeight: 1.4 }}>{k.sub}</p>
            </div>
          )
        })}
      </div>

      {/* Presupuesto por estancia */}
      <SeccionColapsable titulo="Presupuesto por estancia" icono="💰" defaultOpen>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--col-stone-200)' }}>
              <th style={{ textAlign: 'left', padding: '8px 0', color: 'var(--col-stone-500)', fontWeight: 500 }}>Estancia</th>
              <th style={{ textAlign: 'right', padding: '8px 0', color: 'var(--col-stone-500)', fontWeight: 500 }}>Importe</th>
            </tr>
          </thead>
          <tbody>
            {(totalPres?.porEstancia || []).map((item, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--col-stone-100)' }}>
                <td style={{ padding: '10px 0' }}>
                  {TIPO_ICONOS[estancias.find(e => e.nombre === item.estancia)?.tipo] || '🏠'} {item.estancia}
                </td>
                <td style={{ padding: '10px 0', textAlign: 'right', fontWeight: 500 }}>
                  {item.importe?.toLocaleString('es-ES')}€
                </td>
              </tr>
            ))}
            {totalPres?.contingencia > 0 && (
              <tr style={{ borderBottom: '1px solid var(--col-stone-100)', color: 'var(--col-stone-400)' }}>
                <td style={{ padding: '10px 0' }}>+ Contingencia (5%)</td>
                <td style={{ padding: '10px 0', textAlign: 'right' }}>{totalPres.contingencia?.toLocaleString('es-ES')}€</td>
              </tr>
            )}
            <tr style={{ fontWeight: 700, borderTop: '2px solid var(--col-stone-200)' }}>
              <td style={{ padding: '12px 0', color: 'var(--col-terracota)' }}>TOTAL</td>
              <td style={{ padding: '12px 0', textAlign: 'right', color: 'var(--col-terracota)', fontSize: 16 }}>
                {(totalPres?.totalConContingencia || totalPres?.total || 0).toLocaleString('es-ES')}€
              </td>
            </tr>
          </tbody>
        </table>
      </SeccionColapsable>

      {/* Desglose por estancia */}
      <SeccionColapsable titulo="Desglose por estancia" icono="🏠">
        {estancias.map(e => {
          const propuesta = vivienda.propuestas[e.id]
          if (!propuesta) return null
          const desglose = propuesta.presupuestoDesglosado
          return (
            <div key={e.id} style={{ marginBottom: 24 }}>
              <h4 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>
                {TIPO_ICONOS[e.tipo]} {e.nombre}
              </h4>
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: 8, marginBottom: 12,
              }}>
                {Object.entries(desglose || {}).filter(([k]) => k !== 'total').map(([k, v]) => (
                  v > 0 && (
                    <div key={k} style={{
                      display: 'flex', justifyContent: 'space-between',
                      padding: '8px 12px',
                      background: 'var(--col-stone-50)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 13,
                    }}>
                      <span style={{ color: 'var(--col-stone-500)', textTransform: 'capitalize' }}>{k}</span>
                      <span style={{ fontWeight: 500 }}>{v.toLocaleString('es-ES')}€</span>
                    </div>
                  )
                ))}
              </div>
              <p style={{ fontSize: 14, color: 'var(--col-stone-600)', lineHeight: 1.6 }}>
                {propuesta.descripcionReforma}
              </p>
            </div>
          )
        })}
      </SeccionColapsable>

      {/* Planificación de obra */}
      <SeccionColapsable titulo="Planificación de obra" icono="📅">
        {(entregable.planificacionObra?.fases || []).map((f, i) => (
          <div key={i} style={{
            display: 'flex', gap: 16,
            padding: '14px 0',
            borderBottom: i < entregable.planificacionObra.fases.length - 1
              ? '1px solid var(--col-stone-100)' : 'none',
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'var(--col-terracota-light)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, color: 'var(--col-terracota)',
              flexShrink: 0, fontSize: 14,
            }}>
              {i + 1}
            </div>
            <div>
              <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 3 }}>{f.fase}</p>
              <p style={{ fontSize: 13, color: 'var(--col-terracota)', marginBottom: 4 }}>
                Semanas {f.semanas}
              </p>
              <p style={{ fontSize: 12, color: 'var(--col-stone-500)' }}>
                Afecta a: {(f.estancias || []).join(', ')}
              </p>
            </div>
          </div>
        ))}
      </SeccionColapsable>

      {/* Lista de materiales */}
      <SeccionColapsable titulo="Lista de materiales" icono="📦">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--col-stone-200)', background: 'var(--col-stone-50)' }}>
                {['Categoría', 'Material', 'Cantidad', 'Precio/u.', 'Total'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 10px', color: 'var(--col-stone-500)', fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(entregable.listaMateriales || []).map((m, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--col-stone-100)' }}>
                  <td style={{ padding: '9px 10px' }}><Badge color="stone">{m.categoria}</Badge></td>
                  <td style={{ padding: '9px 10px', fontWeight: 500 }}>{m.material}</td>
                  <td style={{ padding: '9px 10px', color: 'var(--col-stone-500)' }}>{m.cantidad}</td>
                  <td style={{ padding: '9px 10px', color: 'var(--col-stone-500)' }}>
                    {m.costeUnitario ? `${m.costeUnitario}€` : '—'}
                  </td>
                  <td style={{ padding: '9px 10px', fontWeight: 600, color: 'var(--col-terracota)' }}>
                    {m.costeTotal ? `${m.costeTotal.toLocaleString('es-ES')}€` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SeccionColapsable>

      {/* Recomendaciones */}
      <SeccionColapsable titulo="Recomendaciones profesionales" icono="💡">
        {(entregable.recomendacionesProfesionales || []).map((r, i) => (
          <p key={i} style={{ fontSize: 14, color: 'var(--col-stone-700)', marginBottom: 10, lineHeight: 1.6 }}>
            <span style={{ color: 'var(--col-gold)', fontWeight: 700 }}>★ </span>{r}
          </p>
        ))}
      </SeccionColapsable>

      {/* Siguientes pasos */}
      <Card style={{ background: 'var(--col-sage-light)', border: '1px solid var(--col-sage)' }}>
        <h3 style={{ fontSize: 18, color: 'var(--col-sage)', marginBottom: 14 }}>
          🚀 Siguientes pasos
        </h3>
        {(entregable.siguientesPasos || []).map((p, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
            <span style={{
              width: 22, height: 22, borderRadius: '50%',
              background: 'var(--col-sage)', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700, flexShrink: 0,
            }}>{i + 1}</span>
            <p style={{ fontSize: 14, color: 'var(--col-stone-700)', lineHeight: 1.5 }}>{p}</p>
          </div>
        ))}
      </Card>

      {/* Footer acciones */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 32, flexWrap: 'wrap' }}>
        <Btn onClick={exportarJSON} icon={Download} variant="secondary">
          Descargar datos (JSON)
        </Btn>
        <Btn onClick={exportarPDF} icon={Download}>
          Imprimir informe
        </Btn>
        <Btn onClick={onRestart} icon={RefreshCw} variant="ghost">
          Nueva reforma
        </Btn>
      </div>

      <style>{`
        @media print {
          header, nav, button { display: none !important; }
          .no-print { display: none !important; }
        }
      `}</style>
    </PageWrapper>
  )
}
