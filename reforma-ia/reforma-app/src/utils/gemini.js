// Gemini API utility
// Model: gemini-2.0-flash (vision + text)

const GEMINI_MODEL = 'gemini-2.0-flash'
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta'

async function callGemini(apiKey, parts, systemInstruction = '') {
  const url = `${GEMINI_API_BASE}/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`

  const body = {
    contents: [{ role: 'user', parts }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 4096,
    },
  }

  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction }] }
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || `Error ${res.status}`)
  }

  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

async function callGeminiChat(apiKey, messages, systemInstruction = '') {
  const url = `${GEMINI_API_BASE}/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`

  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: m.parts || [{ text: m.content }],
  }))

  const body = {
    contents,
    generationConfig: { temperature: 0.7, maxOutputTokens: 4096 },
  }

  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction }] }
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || `Error ${res.status}`)
  }

  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

// Convert file to base64 inline data
export function fileToBase64Part(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result.split(',')[1]
      resolve({ inlineData: { data: base64, mimeType: file.type } })
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// FASE 1: Analizar plano en planta
export async function analizarPlano(apiKey, imagePart) {
  const system = `Eres un arquitecto experto en análisis de planos residenciales. 
Analiza planos en planta dibujados a mano o en sketch y extrae información estructurada.
Responde SIEMPRE en JSON válido, sin markdown, sin explicaciones fuera del JSON.`

  const prompt = `Analiza este plano en planta de una vivienda. 
Identifica todas las estancias y devuelve un JSON con esta estructura exacta:
{
  "estancias": [
    {
      "id": "salon",
      "nombre": "Salón",
      "tipo": "salon|cocina|dormitorio|bano|pasillo|terraza|garaje|trastero|otro",
      "descripcion": "breve descripción de lo que ves en el plano",
      "superficieEstimada": "20-25 m²"
    }
  ],
  "descripcionGeneral": "descripción breve de la vivienda en conjunto",
  "tipoVivienda": "piso|casa|duplex|estudio|otro",
  "superficieTotal": "80-100 m² aproximadamente"
}`

  const text = await callGemini(apiKey, [{ text: prompt }, imagePart], system)
  
  // Clean JSON response
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  return JSON.parse(cleaned)
}

// FASE 2: Analizar fotos/vídeo de una estancia
export async function analizarEstancia(apiKey, estancia, imageParts) {
  const system = `Eres un experto en análisis de interiores residenciales y reformas.
Analiza el estado actual de estancias y proporciona información detallada y objetiva.
Responde SIEMPRE en JSON válido, sin markdown.`

  const prompt = `Analiza el estado actual de "${estancia.nombre}" (${estancia.tipo}).
Estas imágenes muestran el estado actual real de la estancia.
Devuelve un JSON con esta estructura:
{
  "estadoGeneral": "bueno|regular|malo|muy malo",
  "puntuacion": 7,
  "dimensionesEstimadas": "4x5 metros aproximadamente",
  "materialesActuales": {
    "suelo": "descripción del suelo actual",
    "paredes": "descripción de paredes",
    "techo": "descripción del techo",
    "carpinteria": "descripción de carpintería/puertas/ventanas"
  },
  "instalaciones": {
    "electricidad": "descripción del estado eléctrico visible",
    "iluminacion": "descripción de la iluminación actual",
    "fontaneria": "descripción si aplica"
  },
  "problemasDetectados": ["problema 1", "problema 2"],
  "elementosDestacables": ["elemento positivo 1", "elemento positivo 2"],
  "mobiliarioActual": "descripción del mobiliario visible",
  "resumenEstado": "párrafo descriptivo del estado actual de la estancia"
}`

  const parts = [{ text: prompt }, ...imageParts]
  const text = await callGemini(apiKey, parts, system)
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  return JSON.parse(cleaned)
}

// FASE 3: Chat de definición de estancia
export async function chatDefinicionEstancia(apiKey, estancia, analisis, historial, mensajeUsuario) {
  const system = `Eres un arquitecto de interiores que está ayudando a definir con precisión el estado actual de una estancia para planificar su reforma.
Tu objetivo es completar la información sobre "${estancia.nombre}" haciendo preguntas relevantes y procesando las respuestas del usuario.
Sé conciso, profesional y amigable. Responde en español.
Cuando creas que tienes suficiente información, incluye al final de tu respuesta la etiqueta: [DEFINICION_COMPLETA]`

  const contextMsg = {
    role: 'user',
    content: `Contexto de la estancia analizada por visión IA:
${JSON.stringify(analisis, null, 2)}

El usuario quiere añadir más información o corregir algo sobre "${estancia.nombre}".`,
    parts: [{
      text: `Contexto de la estancia analizada por visión IA:
${JSON.stringify(analisis, null, 2)}

El usuario quiere añadir más información o corregir algo sobre "${estancia.nombre}".`
    }]
  }

  const messages = [contextMsg, ...historial, {
    role: 'user',
    content: mensajeUsuario,
    parts: [{ text: mensajeUsuario }]
  }]

  return await callGeminiChat(apiKey, messages, system)
}

// FASE 4: Sugerir estilos de reforma
export async function sugerirEstilosReforma(apiKey, estancias, analisis) {
  const system = `Eres un experto en diseño de interiores y reformas residenciales.
Basándote en el estado actual de la vivienda, sugiere estilos de reforma apropiados.
Responde SIEMPRE en JSON válido, sin markdown.`

  const resumen = estancias.map(e => ({
    estancia: e.nombre,
    estado: analisis[e.id]?.estadoGeneral,
    materiales: analisis[e.id]?.materialesActuales,
  }))

  const prompt = `Basándote en este análisis de la vivienda:
${JSON.stringify(resumen, null, 2)}

Sugiere 6 estilos de reforma diferentes. Para cada estilo devuelve:
{
  "estilos": [
    {
      "id": "mediterraneo",
      "nombre": "Mediterráneo",
      "descripcion": "descripción atractiva del estilo",
      "caracteristicas": ["característica 1", "característica 2", "característica 3"],
      "paleta": ["#color1", "#color2", "#color3", "#color4"],
      "materialesTopo": ["material 1", "material 2"],
      "presupuestoOrientativo": "bajo|medio|alto|premium",
      "emoji": "🌊"
    }
  ]
}`

  const text = await callGemini(apiKey, [{ text: prompt }], system)
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  return JSON.parse(cleaned)
}

// FASE 4: Generar propuesta de reforma con imagen (usando Gemini imagen nativa)
export async function generarPropostaReforma(apiKey, estancia, analisis, estilo, parametros) {
  const system = `Eres un arquitecto de interiores especializado en reformas residenciales.
Genera propuestas detalladas y realistas de reforma.
Responde SIEMPRE en JSON válido, sin markdown.`

  const prompt = `Genera una propuesta detallada de reforma para "${estancia.nombre}" con estilo "${estilo.nombre}".

Estado actual:
${JSON.stringify(analisis, null, 2)}

Parámetros:
- Presupuesto máximo: ${parametros.presupuesto}€
- Tiempo de reforma: ${parametros.tiempo} semanas
- Calidad de materiales: ${parametros.calidad}/10
- Estilo elegido: ${estilo.nombre} - ${estilo.descripcion}

Devuelve:
{
  "descripcionReforma": "descripción atractiva y detallada de la reforma propuesta",
  "cambiosPrincipales": ["cambio 1", "cambio 2", "cambio 3", "cambio 4"],
  "materialesNuevos": {
    "suelo": {"material": "nombre", "referencia": "ref aproximada", "costePorM2": 45},
    "paredes": {"material": "nombre", "referencia": "ref aproximada", "costePorM2": 15},
    "techo": {"material": "nombre", "referencia": "ref aproximada", "costePorM2": 12},
    "carpinteria": {"descripcion": "descripción", "costeTotal": 2000}
  },
  "mobiliarioPropuesto": ["mueble 1 - ref/marca orientativa", "mueble 2"],
  "iluminacionPropuesta": "descripción del diseño de iluminación",
  "presupuestoDesglosado": {
    "demolicion": 500,
    "albañileria": 1200,
    "suelo": 1500,
    "paredes": 800,
    "techo": 600,
    "carpinteria": 2000,
    "electricidad": 800,
    "fontaneria": 0,
    "pintura": 500,
    "mobiliario": 3000,
    "iluminacion": 800,
    "otros": 300,
    "total": 12000
  },
  "plazoEstimado": "4-6 semanas",
  "promptImagenVisualizacion": "detailed interior design visualization of [estancia], [estilo] style, photorealistic, professional interior photography, 4k quality"
}`

  const text = await callGemini(apiKey, [{ text: prompt }], system)
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  return JSON.parse(cleaned)
}

// FASE 4: Chat de ajuste de reforma
export async function chatAjusteReforma(apiKey, estancia, propuesta, historial, mensajeUsuario) {
  const system = `Eres un arquitecto de interiores ayudando a refinar la propuesta de reforma de "${estancia.nombre}".
Cuando el usuario pide cambios, analízalos y confirma cómo afectarían a la propuesta y al presupuesto.
Sé creativo, propositivo y profesional. Responde en español.
Cuando el usuario confirme que está satisfecho con la propuesta, incluye: [REFORMA_CONFIRMADA]`

  const contextMsg = {
    role: 'user',
    parts: [{ text: `Propuesta de reforma actual:\n${JSON.stringify(propuesta, null, 2)}` }]
  }

  const messages = [contextMsg, ...historial, {
    role: 'user',
    parts: [{ text: mensajeUsuario }]
  }]

  return await callGeminiChat(apiKey, messages, system)
}

// FASE 5: Generar entregable final
export async function generarEntregableFinal(apiKey, vivienda, todasPropuestas) {
  const system = `Eres un arquitecto generando el informe final de reforma de una vivienda.
Crea un resumen ejecutivo completo y profesional.
Responde SIEMPRE en JSON válido, sin markdown.`

  const prompt = `Genera el informe final de reforma para esta vivienda:

Vivienda: ${JSON.stringify(vivienda.datosPlano, null, 2)}

Propuestas por estancia:
${JSON.stringify(todasPropuestas, null, 2)}

Devuelve:
{
  "resumenEjecutivo": "párrafo ejecutivo de toda la reforma",
  "presupuestoTotal": {
    "total": 45000,
    "porEstancia": [{"estancia": "Salón", "importe": 12000}],
    "contingencia": 2250,
    "totalConContingencia": 47250
  },
  "planificacionObra": {
    "duracionTotal": "12-16 semanas",
    "fases": [
      {"fase": "Demolición y preparación", "semanas": "1-2", "estancias": ["Salón", "Cocina"]},
      {"fase": "Albañilería e instalaciones", "semanas": "3-6", "estancias": ["Todas"]},
      {"fase": "Acabados", "semanas": "7-10", "estancias": ["Salón", "Cocina"]},
      {"fase": "Mobiliario y decoración", "semanas": "11-12", "estancias": ["Todas"]}
    ]
  },
  "listaMateriales": [
    {"categoria": "Suelos", "material": "Porcelánico 60x60 Gris Marengo", "cantidad": "85 m²", "costeUnitario": 45, "costeTotal": 3825}
  ],
  "recomendacionesProfesionales": ["recomendación 1", "recomendación 2"],
  "siguientesPasos": ["paso 1", "paso 2", "paso 3"]
}`

  const text = await callGemini(apiKey, [{ text: prompt }], system)
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  return JSON.parse(cleaned)
}

