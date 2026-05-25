# 🏠 ReformaIA — Tu vivienda reformada con IA

App React que analiza el estado actual de tu vivienda (plano + fotos) y genera propuestas de reforma completas usando **Google Gemini 1.5 Flash** (plan gratuito).

---

## ✨ Funcionalidades

1. **Fase 1 — Plano en planta**: Sube una foto del sketch y Gemini detecta todas las estancias automáticamente.
2. **Fase 2 — Captura del estado**: Sube fotos (hasta 10 por estancia) o vídeo de recorrido.
3. **Fase 3 — Definición con IA**: Gemini analiza las imágenes y abre un chat para completar/corregir la información.
4. **Fase 4 — Diseño de la reforma**: Elige estilo, presupuesto, tiempo y calidad. Recibe propuestas por estancia con chat de ajuste.
5. **Fase 5 — Entregable final**: Informe completo con presupuesto desglosado, lista de materiales y planificación de obra.

---

## 🚀 Despliegue en Cloudflare Pages

### Opción A — Desde GitHub (recomendado)

1. Sube el proyecto a un repositorio de GitHub.
2. Ve a [Cloudflare Pages](https://pages.cloudflare.com) → **Create a project** → **Connect to Git**.
3. Selecciona el repositorio.
4. Configura el build:
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Node.js version**: `20`
5. Haz clic en **Save and Deploy**.

### Opción B — Deploy directo desde CLI

```bash
# Instala Wrangler si no lo tienes
npm install -g wrangler

# Autentícate con Cloudflare
wrangler login

# Build + deploy
npm install
npm run build
wrangler pages deploy dist --project-name reforma-ia
```

### Variables de entorno (opcional)
La API key de Gemini se guarda en `localStorage` del usuario (no necesitas variables de entorno en Cloudflare). Si prefieres ocultarla via un proxy, añade una Cloudflare Worker.

---

## 💻 Desarrollo local

```bash
# Instalar dependencias
npm install

# Servidor de desarrollo
npm run dev

# Build de producción
npm run build

# Preview del build
npm run preview
```

---

## 🔑 API Key de Gemini (gratuita)

1. Ve a [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Crea una clave API (plan gratuito: 15 req/min, 1M tokens/día).
3. Introduce la clave en la pantalla de inicio de la app.

La clave se guarda **solo en tu navegador** (`localStorage`). Nunca se envía a ningún servidor externo salvo a la API de Google directamente.

---

## 📁 Estructura del proyecto

```
reforma-app/
├── public/
│   └── _redirects          # SPA routing para Cloudflare Pages
├── src/
│   ├── components/
│   │   ├── Header.jsx       # Barra de progreso por fases
│   │   └── UI.jsx           # Componentes reutilizables
│   ├── pages/
│   │   ├── LandingPage.jsx  # Inicio + configuración API key
│   │   ├── Fase1Plano.jsx   # Subida y análisis del plano
│   │   ├── Fase2Captura.jsx # Fotos/vídeo por estancia
│   │   ├── Fase3Definicion.jsx # Análisis IA + chat
│   │   ├── Fase4Reforma.jsx # Estilos + propuestas + chat
│   │   └── Fase5Entregable.jsx # Informe final
│   ├── utils/
│   │   └── gemini.js        # Todas las llamadas a Gemini API
│   ├── styles/
│   │   └── global.css       # Design system
│   ├── App.jsx              # Router y estado global
│   └── main.jsx             # Entry point
├── index.html
├── vite.config.js
├── wrangler.toml            # Config Cloudflare
└── package.json
```

---

## 🛠 Stack técnico

- **React 18** + **Vite 5**
- **Gemini 1.5 Flash** (visión + texto, plan gratuito)
- **Cloudflare Pages** (hosting estático)
- Sin backend — todo corre en el navegador del usuario

---

## 📝 Notas importantes

- **Imágenes**: Gemini analiza hasta 5 imágenes por estancia en el plan gratuito. Usa las más representativas.
- **Vídeo**: El plan gratuito de Gemini no procesa vídeo directamente. Para vídeos, la app recomienda al usuario que extraiga capturas de pantalla manualmente.
- **Límites gratuitos**: 15 req/min. Si analizas muchas estancias seguidas, puede haber un delay breve.
