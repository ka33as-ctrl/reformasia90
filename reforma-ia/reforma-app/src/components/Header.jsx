import React from 'react'
import { Home, Camera, MessageCircle, Sparkles, FileText } from 'lucide-react'

const FASES = [
  { num: 1, label: 'Plano', icon: Home },
  { num: 2, label: 'Fotos', icon: Camera },
  { num: 3, label: 'Análisis', icon: MessageCircle },
  { num: 4, label: 'Reforma', icon: Sparkles },
  { num: 5, label: 'Entregable', icon: FileText },
]

export default function Header({ faseActual }) {
  return (
    <header style={{
      background: '#fff',
      borderBottom: '1px solid var(--col-stone-200)',
      padding: '0 24px',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: 'var(--shadow-sm)',
    }}>
      <div style={{
        maxWidth: 900,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 64,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 22 }}>🏠</span>
          <span style={{ fontFamily: 'var(--font-serif)', fontSize: 18, color: 'var(--col-stone-800)' }}>
            ReformaIA
          </span>
        </div>

        <nav style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {FASES.map((f, i) => {
            const Icon = f.icon
            const done = faseActual > f.num
            const active = faseActual === f.num
            return (
              <React.Fragment key={f.num}>
                {i > 0 && (
                  <div style={{
                    width: 20,
                    height: 2,
                    background: done ? 'var(--col-terracota)' : 'var(--col-stone-200)',
                    borderRadius: 1,
                    transition: 'background var(--transition)',
                  }} />
                )}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 3,
                }}>
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: active ? 'var(--col-terracota)' : done ? 'var(--col-terracota-light)' : 'var(--col-stone-100)',
                    color: active ? '#fff' : done ? 'var(--col-terracota-dark)' : 'var(--col-stone-400)',
                    transition: 'all var(--transition)',
                  }}>
                    <Icon size={14} />
                  </div>
                  <span style={{
                    fontSize: 10,
                    fontWeight: active ? 600 : 400,
                    color: active ? 'var(--col-terracota)' : done ? 'var(--col-stone-600)' : 'var(--col-stone-400)',
                  }}>
                    {f.label}
                  </span>
                </div>
              </React.Fragment>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
