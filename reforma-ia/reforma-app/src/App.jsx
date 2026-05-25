import React, { useState } from 'react'
import LandingPage from './pages/LandingPage.jsx'
import Fase1Plano from './pages/Fase1Plano.jsx'
import Fase2Captura from './pages/Fase2Captura.jsx'
import Fase3Definicion from './pages/Fase3Definicion.jsx'
import Fase4Reforma from './pages/Fase4Reforma.jsx'
import Fase5Entregable from './pages/Fase5Entregable.jsx'
import Header from './components/Header.jsx'

export default function App() {
  const [fase, setFase] = useState('landing')
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('gemini_api_key') || '')
  
  const [vivienda, setVivienda] = useState({
    datosPlano: null,      // resultado de analizarPlano()
    imagenPlano: null,     // base64 del plano original
    estanciasSeleccionadas: [], // qué estancias se van a reformar
    capturas: {},          // { estanciaId: [File] }
    analisis: {},          // { estanciaId: análisis IA }
    historialChat: {},     // { estanciaId: [mensajes] }
    definicionFinal: {},   // { estanciaId: descripción final confirmada }
    estiloElegido: null,
    parametros: { presupuesto: 30000, tiempo: 8, calidad: 7 },
    propuestas: {},        // { estanciaId: propuesta }
    entregable: null,
  })

  const saveApiKey = (key) => {
    setApiKey(key)
    localStorage.setItem('gemini_api_key', key)
  }

  const updateVivienda = (updates) => {
    setVivienda(prev => ({ ...prev, ...updates }))
  }

  const pages = {
    landing: (
      <LandingPage
        apiKey={apiKey}
        onApiKey={saveApiKey}
        onStart={() => setFase('fase1')}
      />
    ),
    fase1: (
      <Fase1Plano
        apiKey={apiKey}
        vivienda={vivienda}
        onUpdate={updateVivienda}
        onNext={() => setFase('fase2')}
        onBack={() => setFase('landing')}
      />
    ),
    fase2: (
      <Fase2Captura
        apiKey={apiKey}
        vivienda={vivienda}
        onUpdate={updateVivienda}
        onNext={() => setFase('fase3')}
        onBack={() => setFase('fase1')}
      />
    ),
    fase3: (
      <Fase3Definicion
        apiKey={apiKey}
        vivienda={vivienda}
        onUpdate={updateVivienda}
        onNext={() => setFase('fase4')}
        onBack={() => setFase('fase2')}
      />
    ),
    fase4: (
      <Fase4Reforma
        apiKey={apiKey}
        vivienda={vivienda}
        onUpdate={updateVivienda}
        onNext={() => setFase('fase5')}
        onBack={() => setFase('fase3')}
      />
    ),
    fase5: (
      <Fase5Entregable
        apiKey={apiKey}
        vivienda={vivienda}
        onUpdate={updateVivienda}
        onRestart={() => {
          setVivienda({
            datosPlano: null, imagenPlano: null, estanciasSeleccionadas: [],
            capturas: {}, analisis: {}, historialChat: {}, definicionFinal: {},
            estiloElegido: null, parametros: { presupuesto: 30000, tiempo: 8, calidad: 7 },
            propuestas: {}, entregable: null,
          })
          setFase('landing')
        }}
      />
    ),
  }

  const faseNumero = { landing: 0, fase1: 1, fase2: 2, fase3: 3, fase4: 4, fase5: 5 }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {fase !== 'landing' && (
        <Header faseActual={faseNumero[fase]} />
      )}
      <main style={{ flex: 1 }}>
        {pages[fase]}
      </main>
    </div>
  )
}
