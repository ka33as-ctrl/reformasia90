import React, { useState } from 'react'
import { Key, ArrowRight, CheckCircle2, Home, Camera, Sparkles, FileText } from 'lucide-react'
import { Btn, Alert } from '../components/UI.jsx'

const PASOS = [
  { icon: Home, label: 'Sube el plano', desc: 'Foto del sketch en planta de tu vivienda' },
  { icon: Camera, label: 'Captura el estado', desc: 'Vídeo o fotos de cada estancia' },
  { icon: Sparkles, label: 'Define la reforma', desc: 'Elige estilo, presupuesto y calidad' },
  { icon: FileText, label: 'Recibe el informe', desc: 'Plano, renders y presupuesto detallado' },
]

export default function LandingPage({ apiKey, onApiKey, onStart }) {
  const [key, setKey] = useState(apiKey)
  const [showKey, setShowKey] = useState(false)
  const [error, setError] = useState('')

  const handleStart = () => {
    if (!key.trim()) {
      setError('Introduce tu API key de Google Gemini para continuar.')
      return
    }
    onApiKey(key.trim())
    onStart()
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--col-stone-50)' }}>
      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, var(--col-stone-800) 0%, var(--col-stone-700) 100%)',
        padding: '80px 24px 100px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(194,98,63,0.2) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(107,143,113,0.15) 0%, transparent 50%)',
        }} />
        <div style={{ position: 'relative', maxWidth: 620, margin: '0 auto' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🏠</div>
          <h1 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(32px, 5vw, 52px)',
            color: '#fff',
            marginBottom: 20,
            lineHeight: 1.15,
          }}>
            Tu vivienda,<br />
            <em style={{ color: 'var(--col-terracota-light)' }}>reformada con IA</em>
          </h1>
          <p style={{
            color: 'rgba(255,255,255,0.7)',
            fontSize: 18,
            maxWidth: 480,
            margin: '0 auto 40px',
            lineHeight: 1.7,
          }}>
            Sube el plano de tu hogar, muéstranos su estado actual y obtén una propuesta de reforma completa con presupuesto y renders.
          </p>

          {/* API Key input */}
          <div style={{
            background: '#fff',
            borderRadius: 'var(--radius-xl)',
            padding: '28px 32px',
            maxWidth: 480,
            margin: '0 auto',
            boxShadow: 'var(--shadow-lg)',
            textAlign: 'left',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <Key size={16} style={{ color: 'var(--col-stone-500)' }} />
              <label style={{ fontWeight: 600, fontSize: 14, color: 'var(--col-stone-700)' }}>
                API Key de Google Gemini
              </label>
            </div>
            <p style={{ fontSize: 12, color: 'var(--col-stone-400)', marginBottom: 12 }}>
              Necesitas una clave gratuita de{' '}
              <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer"
                style={{ color: 'var(--col-terracota)', textDecoration: 'none', fontWeight: 500 }}>
                Google AI Studio →
              </a>
            </p>
            <div style={{ position: 'relative', marginBottom: 16 }}>
              <input
                type={showKey ? 'text' : 'password'}
                value={key}
                onChange={e => { setKey(e.target.value); setError('') }}
                placeholder="AIza..."
                onKeyDown={e => e.key === 'Enter' && handleStart()}
                style={{
                  width: '100%',
                  padding: '10px 44px 10px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: `1.5px solid ${error ? '#ef4444' : 'var(--col-stone-200)'}`,
                  fontSize: 14,
                  outline: 'none',
                  fontFamily: 'monospace',
                  background: 'var(--col-stone-50)',
                }}
              />
              <button
                onClick={() => setShowKey(v => !v)}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--col-stone-400)', fontSize: 12,
                }}
              >
                {showKey ? 'Ocultar' : 'Ver'}
              </button>
            </div>

            {key && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                color: 'var(--col-sage)', fontSize: 13, marginBottom: 12,
              }}>
                <CheckCircle2 size={14} />
                <span>Clave guardada en local</span>
              </div>
            )}

            {error && <Alert type="error">{error}</Alert>}

            <Btn
              onClick={handleStart}
              style={{ width: '100%', justifyContent: 'center' }}
              icon={ArrowRight}
              size="lg"
            >
              Comenzar análisis
            </Btn>

            <p style={{ fontSize: 11, color: 'var(--col-stone-400)', marginTop: 12, textAlign: 'center' }}>
              Tu clave se guarda solo en tu navegador, nunca en nuestros servidores.
            </p>
          </div>
        </div>
      </div>

      {/* Cómo funciona */}
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '64px 24px' }}>
        <h2 style={{
          textAlign: 'center',
          fontSize: 28,
          color: 'var(--col-stone-800)',
          marginBottom: 40,
        }}>
          Cómo funciona
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 20,
        }}>
          {PASOS.map((p, i) => {
            const Icon = p.icon
            return (
              <div key={i} style={{
                background: '#fff',
                borderRadius: 'var(--radius-lg)',
                padding: '24px 20px',
                textAlign: 'center',
                border: '1px solid var(--col-stone-200)',
                boxShadow: 'var(--shadow-sm)',
              }}>
                <div style={{
                  width: 48, height: 48,
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--col-terracota-light)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 14px',
                }}>
                  <Icon size={22} style={{ color: 'var(--col-terracota)' }} />
                </div>
                <div style={{
                  width: 22, height: 22,
                  borderRadius: '50%',
                  background: 'var(--col-stone-100)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700,
                  color: 'var(--col-stone-500)',
                  margin: '0 auto 10px',
                }}>{i + 1}</div>
                <h3 style={{ fontSize: 15, fontFamily: 'var(--font-sans)', fontWeight: 600, marginBottom: 6 }}>
                  {p.label}
                </h3>
                <p style={{ fontSize: 13, color: 'var(--col-stone-500)', lineHeight: 1.5 }}>
                  {p.desc}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
