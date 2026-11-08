# Decisiones de arquitectura del frontend

Cada decisión indica qué se eligió, qué se gana y qué se paga a cambio. Las decisiones del servidor están en `docs/DECISIONES.md` del repositorio del backend.

## Idioma del código

**Decisión:** todo el código está en inglés: archivos, identificadores, comentarios, logs, API y base de datos. Solo queda en español lo que ve el usuario.

## Patrones de rendering

**Decisión: CSR (Client-Side Rendering) con carga diferida de páginas.**

| Patrón | Cómo funciona | ¿Se aplica? | Motivo |
|---|---|---|---|
| **CSR** | El navegador recibe HTML casi vacío y JavaScript genera la página | **Sí** | Casi toda la app está detrás del login y son datos de cada usuario |
| **SSR** | Un servidor genera el HTML en cada petición | No | La sesión está en `localStorage`, que el servidor no puede leer, así que no podría generar el dashboard. Tampoco hay contenido público que deba posicionarse en buscadores |
| **SSG** | El HTML se genera una vez, al compilar | No | Solo podrían pregenerarse `/login` y `/register`. El idioma y el tema se guardan en el navegador, así que quien usa inglés o modo claro vería un cambio brusco al cargar. La ganancia no compensa |
| **ISR** | Como SSG, pero las páginas se regeneran cada cierto tiempo | No | No hay contenido público que cambie con el tiempo |

**Se gana con CSR:** hosting estático gratis en Vercel, sin servidor de frontend que mantener, y la interacción es rápida después de la primera carga.

**Se paga:** hay que descargar JavaScript antes de ver algo y el posicionamiento en buscadores es limitado. Para reducir la primera desventaja:

- **Carga diferida:** cada página es un archivo aparte, así que el login no descarga el código del dashboard.
- **Logo optimizado:** pasó de 1,36 MB a 52 KB, porque se muestra a menos de 50 píxeles.

**Cuándo cambiaría:** si la app tuviera una página pública para buscadores, SSG sería la primera opción para esa página, sin cambiar el resto.

## Web Workers e hilos

JavaScript ejecuta la interfaz en un solo hilo. Reducir una foto de varios megapíxeles y recorrer sus píxeles en ese hilo congelaría la pantalla, así que ese trabajo se hace en un Web Worker.

- **Mensajes tipados:** `workers/analysis.messages.ts` define el contrato entre los dos hilos. Cada mensaje lleva un `id`, porque `postMessage` no tiene valor de retorno.
- **Promesa en lugar de eventos:** `ImageAnalysisService` oculta el Worker y la página solo hace `await analyze(file)`.
- **Ciclo de vida:** el servicio se provee en el dashboard, de modo que el hilo se crea al primer uso y termina al salir de la página.
- **Fallos:** si el hilo se cae o tarda más de 30 segundos, se rechaza la Promesa y se descarta el hilo. Antes la pantalla se quedaba en "procesando".
- **Memoria:** se liberan el `ImageBitmap` y las URL de vista previa, que el recolector de basura no libera por su cuenta.

**Se paga:** los datos entre hilos se copian y hay más código que con una función normal. Con imágenes grandes vale la pena; para una tarea pequeña no.

La lógica de color vive en `workers/classify-color.ts` como funciones puras, para poder probarla sin Worker.

## Tipado end-to-end y contract-first

El contrato OpenAPI vive en el backend. `npm run contract:types` genera `src/app/api/contract.ts`, y `models/models.ts` expone esos tipos: ninguno se escribe a mano.

Un ejemplo de lo que protege: los `Record` de `language.service.ts` son exhaustivos. Si el contrato agrega una categoría o un código de error, el build falla hasta traducirlo.

**Se paga:** los tipos solo protegen en compilación, y el archivo generado se debe regenerar a mano cuando cambia el contrato. Como el frontend y el backend están en repositorios separados, regenerarlo requiere tener ambos en carpetas vecinas.

## Paradigmas

| Parte | Paradigma | Motivo |
|---|---|---|
| Componentes y servicios | Orientado a objetos | Es el modelo de Angular |
| Plantillas | Declarativo | Se describe qué mostrar, no cómo actualizar la página |
| Estado local | Reactivo con signals | Angular sabe exactamente qué vista cambió |
| Peticiones HTTP | Reactivo con RxJS | Facilita componer tiempo límite, cancelación y limpieza |
| `classifyByColor` | Funcional | Función pura: la misma entrada siempre da la misma salida |

**Signals frente a RxJS:** los signals se usan para el estado porque son más simples y siempre tienen un valor. RxJS se mantiene para las peticiones porque es lo que entrega `HttpClient` y modela bien una operación con inicio, error y fin.

## Patrones

| Patrón | Dónde | Para qué |
|---|---|---|
| **Contenedor y presentación** | `DashboardComponent` y sus hijos | La página carga los datos; `ScanStats`, `ScanResult` y `ScanHistory` solo los muestran |
| **Interceptor** | `auth.interceptor.ts` | Token, tiempo límite y sesión expirada en un solo lugar; el token solo viaja a la API propia |
| **Guard** | `guards/` | Protege rutas según haya sesión o no |
| **Fachada** | `ImageAnalysisService` | Oculta el Worker detrás de una Promesa |
| **Observador** | Signals y RxJS | La vista reacciona a los cambios, con `OnPush` para revisar solo lo necesario |
| **Tabla de decisión** | `classify-color.ts` | Las reglas de color son datos: agregar una no agrega ramas de código |
| **Códigos de error** | `language.service.ts` | La traducción depende de un `code` estable, no de comparar textos |

## Estilos

Cada componente tiene su propio CSS, que se descarga junto con él: el login ya no baja los estilos del dashboard. Los del dashboard usan `ViewEncapsulation.None` porque comparten variables de color y las reglas del tema claro. **Se paga:** los nombres de clase deben ser únicos; por eso siguen el formato `bloque__elemento`.

## Estadísticas e historial

- **Gráficas sin librería:** son barras en HTML y CSS. **Se gana:** nada de peso extra y funcionan con el tema claro y oscuro. **Se paga:** para gráficas más complejas convendría una librería.
- **Un solo color en las gráficas:** cada gráfica muestra una sola serie, así que el color no necesita distinguir nada y la longitud de la barra comunica el valor.
- **Una fila extra para saber si hay más páginas:** se piden 11 filas para mostrar 10. Evita otra consulta para contar.
- **Cancelar la petición anterior del historial:** si el usuario cambia de filtro rápido, una respuesta lenta no puede sobrescribir la más reciente.
- **Miniaturas en el Worker:** se generan en el mismo hilo que procesa la foto, sin bloquear la interfaz.

## Logo e íconos

El logo original está en `design/logo-source.jpg` y no se publica. `public/logo.png` es esa imagen sin fondo. El ícono `public/icon.svg` es una versión simplificada, porque el logo completo no se distingue a 16 píxeles; de él salen `favicon.ico` y `apple-touch-icon.png`.

## Seguridad del token

**Decisión:** el token sigue en `localStorage`, protegido por una política de seguridad de contenido (CSP).

**Por qué no una cookie `HttpOnly`:** el frontend (`vercel.app`) y la API (`onrender.com`) están en sitios distintos. Para el navegador, la cookie de la API sería de terceros, y Safari bloquea esas cookies por defecto: en iPhone no se podría iniciar sesión. Evitarlo exigiría que Vercel reenviara las peticiones a Render. Eso trae sus propios problemas: el límite de intentos vería la IP de Vercel en lugar de la del usuario, y habría que proteger contra CSRF.

**Lo que protege la CSP:** el riesgo real de `localStorage` es que un script ajeno lea el token. La política de `vercel.json` solo permite scripts del propio sitio y conexiones a la propia API, así que un script inyectado no se ejecuta ni puede enviar el token a otro servidor. Por eso se desactivó `inlineCritical`: era el único script en línea de la app.

**Se paga:** si se agrega un servicio externo, como analítica o fuentes de Google, hay que permitirlo en la CSP o el navegador lo bloqueará.
