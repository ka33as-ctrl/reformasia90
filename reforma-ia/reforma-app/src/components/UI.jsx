import React from 'react'
import { Loader2 } from 'lucide-react'

export function Btn({ children, onClick, variant = 'primary', disabled, loading, style, icon: Icon, size = 'md' }) {
  const sizes = {
    sm: { padding: '8px 16px', fontSize: 13 },
    md: { padding: '12px 24px', fontSize: 15 },
    lg: { padding: '16px 32px', fontSize: 17 },
  }
  const variants = {
    primary: {
      background: disabled || loading ? 'var(--col-stone-300)' : 'var(--col-terracota)',
      color: '#fff',
      border: 'none',
    },
    secondary: {
      background: 'transparent',
      color: 'var(--col-terracota)',
      border: '1.5px solid var(--col-terracota)',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--col-stone-600)',
      border: '1.5px solid var(--col-stone-200)',
    },
    danger: {
      background: '#dc2626',
      color: '#fff',
      border: 'none',
    },
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        borderRadius: 'var(--radius-md)',
        fontWeight: 500,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        transition: 'all var(--transition)',
        opacity: disabled && !loading ? 0.5 : 1,
        ...sizes[size],
        ...variants[variant],
        ...style,
      }}
    >
      {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : Icon ? <Icon size={16} /> : null}
      {children}
      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </button>
  )
}

export function Card({ children, style, onClick, hover }) {
  const [hovered, setHovered] = React.useState(false)
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => hover && setHovered(true)}
      onMouseLeave={() => hover && setHovered(false)}
      style={{
        background: '#fff',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--col-stone-200)',
        padding: 24,
        boxShadow: hovered ? 'var(--shadow-md)' : 'var(--shadow-sm)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all var(--transition)',
        transform: hovered ? 'translateY(-2px)' : 'none',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

export function PageWrapper({ children, maxWidth = 800 }) {
  return (
    <div style={{
      maxWidth,
      margin: '0 auto',
      padding: '40px 24px 80px',
      width: '100%',
    }}>
      {children}
    </div>
  )
}

export function PageTitle({ title, subtitle }) {
  return (
    <div style={{ marginBottom: 32, textAlign: 'center' }}>
      <h1 style={{ fontSize: 32, color: 'var(--col-stone-800)', marginBottom: 10 }}>{title}</h1>
      {subtitle && (
        <p style={{ color: 'var(--col-stone-500)', fontSize: 16, maxWidth: 520, margin: '0 auto' }}>
          {subtitle}
        </p>
      )}
    </div>
  )
}

export function Badge({ children, color = 'stone' }) {
  const colors = {
    stone: { bg: 'var(--col-stone-100)', text: 'var(--col-stone-600)' },
    terracota: { bg: 'var(--col-terracota-light)', text: 'var(--col-terracota-dark)' },
    sage: { bg: 'var(--col-sage-light)', text: 'var(--col-sage)' },
    gold: { bg: 'var(--col-gold-light)', text: 'var(--col-gold)' },
    blue: { bg: 'var(--col-blue-light)', text: 'var(--col-blue)' },
  }
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '3px 10px',
      borderRadius: 99,
      fontSize: 12,
      fontWeight: 500,
      background: colors[color]?.bg || colors.stone.bg,
      color: colors[color]?.text || colors.stone.text,
    }}>
      {children}
    </span>
  )
}

export function Alert({ children, type = 'info' }) {
  const types = {
    info: { bg: 'var(--col-blue-light)', border: 'var(--col-blue)', color: 'var(--col-blue)' },
    success: { bg: 'var(--col-sage-light)', border: 'var(--col-sage)', color: 'var(--col-sage)' },
    warning: { bg: 'var(--col-gold-light)', border: 'var(--col-gold)', color: 'var(--col-gold)' },
    error: { bg: '#fee2e2', border: '#ef4444', color: '#dc2626' },
  }
  const t = types[type]
  return (
    <div style={{
      background: t.bg,
      border: `1px solid ${t.border}`,
      borderRadius: 'var(--radius-md)',
      padding: '12px 16px',
      fontSize: 14,
      color: t.color,
      marginBottom: 16,
    }}>
      {children}
    </div>
  )
}

export function Spinner({ size = 24, label = 'Cargando...' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: 32 }}>
      <Loader2 size={size} style={{ animation: 'spin 1s linear infinite', color: 'var(--col-terracota)' }} />
      <p style={{ color: 'var(--col-stone-500)', fontSize: 14 }}>{label}</p>
      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

export function ChatBubble({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div style={{
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      marginBottom: 12,
    }}>
      {!isUser && (
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: 'var(--col-terracota-light)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, marginRight: 8, flexShrink: 0, marginTop: 4,
        }}>🏠</div>
      )}
      <div style={{
        maxWidth: '75%',
        padding: '10px 14px',
        borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
        background: isUser ? 'var(--col-terracota)' : '#fff',
        color: isUser ? '#fff' : 'var(--col-stone-800)',
        fontSize: 14,
        lineHeight: 1.6,
        border: isUser ? 'none' : '1px solid var(--col-stone-200)',
        boxShadow: 'var(--shadow-sm)',
        whiteSpace: 'pre-wrap',
      }}>
        {msg.content}
      </div>
    </div>
  )
}

export function RangeInput({ label, value, min, max, step = 1, onChange, format, helpText }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <label style={{ fontWeight: 500, fontSize: 14, color: 'var(--col-stone-700)' }}>{label}</label>
        <span style={{
          fontWeight: 600, fontSize: 14,
          color: 'var(--col-terracota)',
          background: 'var(--col-terracota-light)',
          padding: '2px 10px', borderRadius: 99,
        }}>
          {format ? format(value) : value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: 'var(--col-terracota)' }}
      />
      {helpText && <p style={{ fontSize: 12, color: 'var(--col-stone-400)', marginTop: 4 }}>{helpText}</p>}
    </div>
  )
}

export function UploadZone({ onFiles, accept, multiple = true, children, compact }) {
  const [drag, setDrag] = React.useState(false)
  const inputRef = React.useRef()

  const handleDrop = (e) => {
    e.preventDefault()
    setDrag(false)
    const files = Array.from(e.dataTransfer.files)
    const filtered = accept
      ? files.filter(f => accept.split(',').some(a => f.type.match(a.trim().replace('*', '.*'))))
      : files
    if (filtered.length) onFiles(filtered)
  }

  return (
    <div
      onClick={() => inputRef.current.click()}
      onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
      onDragLeave={() => setDrag(false)}
      onDrop={handleDrop}
      style={{
        border: `2px dashed ${drag ? 'var(--col-terracota)' : 'var(--col-stone-300)'}`,
        borderRadius: 'var(--radius-lg)',
        padding: compact ? '20px' : '40px 24px',
        textAlign: 'center',
        cursor: 'pointer',
        background: drag ? 'var(--col-terracota-light)' : 'var(--col-stone-50)',
        transition: 'all var(--transition)',
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        style={{ display: 'none' }}
        onChange={e => onFiles(Array.from(e.target.files))}
      />
      {children}
    </div>
  )
}
