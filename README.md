# EcoScan - Frontend

Aplicación en Angular para clasificar residuos con una foto. La API está en el repositorio [ecoScannBack](https://github.com/luiscajigas/ecoScannBack).

Producción: https://eco-scann-fron.vercel.app

Las decisiones de diseño y sus trade-offs están en [`docs/DECISIONES.md`](docs/DECISIONES.md).

## Ejecutar en local

Necesita el backend corriendo en `http://localhost:3002`.

```powershell
npm ci
npm start
```

La app queda en `http://localhost:4200`.

## Comandos

| Comando | Qué hace |
|---|---|
| `npm start` | Servidor de desarrollo |
| `npm run build` | Compilación de producción en `dist/frontend/browser` |
| `npm test` | Pruebas unitarias; necesitan Chrome, o Edge indicando su ruta en `CHROME_BIN` |
| `npm run test:ci` | Ejecuta las pruebas una sola vez, sin ventana del navegador |
| `npm run contrato:tipos` | Regenera los tipos desde el contrato; necesita `ecoScannBack` en la carpeta vecina |

## Estructura

| Carpeta | Responsabilidad |
|---|---|
| `src/app/api/` | Tipos generados desde el contrato OpenAPI; no se editan a mano |
| `src/app/models/` | Nombres cortos para los tipos del contrato |
| `src/app/pages/` | Páginas y sus componentes |
| `src/app/services/` | Autenticación, escaneos, Worker, idioma y tema |
| `src/app/workers/` | Web Worker que procesa las imágenes |
| `src/app/i18n/` | Textos en español e inglés |
