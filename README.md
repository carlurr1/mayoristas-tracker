# SF Mayoristas Tracker — ETB

Dashboard Next.js para seguimiento de casos Salesforce del equipo HDP Mayoristas ETB.

## Stack
- **Next.js 14** (App Router)
- **React 18** + **TypeScript**
- **Tailwind CSS**
- **Recharts** para gráficas
- **Salesforce REST API** (sin dependencias de SDK)

---

## Deploy en Vercel (desde GitHub)

### 1. Crear repo en GitHub
1. Ve a [github.com](https://github.com) → **New repository**
2. Nombre: `mayoristas-tracker`
3. Visibility: **Private** (recomendado — tiene credenciales SF)
4. Click **Create repository**

### 2. Subir los archivos
En tu computador, abre la terminal en la carpeta del proyecto y ejecuta:

```bash
git init
git add .
git commit -m "Initial commit — SF Mayoristas Tracker"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/mayoristas-tracker.git
git push -u origin main
```

### 3. Conectar a Vercel
1. Ve a [vercel.com](https://vercel.com) → **Add New Project**
2. Selecciona **Import Git Repository** → elige `mayoristas-tracker`
3. Vercel detecta Next.js automáticamente
4. Antes de hacer deploy, agrega las **Environment Variables**:

| Variable | Valor |
|----------|-------|
| `SF_USERNAME` | tu_usuario@etb.com.co |
| `SF_PASSWORD` | tu_contraseña_SF |
| `SF_TOKEN` | tu_token_de_seguridad_SF |
| `SF_DOMAIN` | `login` |

> ⚠️ El token de seguridad de SF se obtiene en: Salesforce → Configuración → Mis datos personales → Restablecer mi token de seguridad

5. Click **Deploy**

### 4. URL resultante
Tu app quedará en: `https://mayoristas-tracker.vercel.app`

---

## Desarrollo local

```bash
# 1. Instalar dependencias
npm install

# 2. Crear archivo de variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales reales

# 3. Iniciar servidor de desarrollo
npm run dev
# → http://localhost:3000
```

---

## Estructura del proyecto

```
src/
├── app/
│   ├── api/
│   │   ├── escalado/route.ts   ← Lógica principal escalado (port del .gs)
│   │   ├── semaforo/route.ts   ← Semáforo de casos activos
│   │   └── timeline/route.ts  ← Notas de un caso específico
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── Dashboard.tsx           ← Shell principal + tabs
│   ├── ui/                     ← Componentes reutilizables
│   │   ├── Header.tsx
│   │   ├── NavTabs.tsx
│   │   ├── Card.tsx
│   │   └── KpiCard.tsx
│   ├── escalado/               ← Panel escalado completo
│   │   ├── EscaladoPanel.tsx
│   │   ├── GrupoCards.tsx
│   │   ├── GrupoTable.tsx
│   │   ├── IngenieroTable.tsx
│   │   ├── ClienteTable.tsx
│   │   ├── ComparativoCharts.tsx
│   │   └── CasosTable.tsx
│   └── semaforo/
│       └── SemaforoPanel.tsx
└── lib/
    ├── salesforce.ts           ← Conexión SF (login + query)
    ├── nits.ts                 ← 203 NITs mayoristas
    └── stats.ts                ← calcularStats, esHDP, normalizarGrupo
```

---

## Apps Script (respaldo)
El código de Apps Script (`Codigo_Final.gs` + `Index.html`) sigue funcionando en paralelo.
No lo borres hasta validar que Vercel funciona correctamente en producción.
