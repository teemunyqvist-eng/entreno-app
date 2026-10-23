# Entreno – 10k · 16k · 21k

App de entrenamiento (PWA, JS vanilla) en **español** para resistencia (10k → 16k → 21k) y **fuerza en casa**. El plan del entrenador (`coach-plan.json`, badge 🧭 Del entrenador) tiene prioridad; el resto de días usa el plan de reserva automático.

## Vistas

- **Hoy** – tarjeta del día: entreno, calentamiento/enfriamiento, ✓ Hecho, Suavizar / Intensificar, Cambiar entreno y Otra situación.
- **Semana** – 7 días; días del entrenador con 🧭.
- **Ejercicios** – biblioteca: técnica, beneficios, errores, vídeo.
- **Progreso** – feedback del PT, km/semana, seguimiento mensual (peso + fotos).
- **⚙️ Ajustes** – perfil y meta, fuerza en casa (por defecto), sin abono de gym, nivel, dolores, copia de seguridad JSON.

## Abrir en local

```bash
cd /workspace/wife-treeni-app && python3 -m http.server 8766
```

## Plan del entrenador

`coach-plan.json` es el plan PT (Treeni Bot / Yulibot). Mes 1: fuerza en casa + caminar-trotar / intervalos con guía de FC (Z2 110–128).

## Privacidad

Sin servidor: todo en localStorage del navegador. Claves propias (`entreno-esposa-v1`) para no chocar con la app finlandesa. En el repo público: distancias/tiempos/ritmos/comentarios PT — no FC/sueño/nombres en logs públicos.

## Tests

`node smoke-test.js` (adaptado) o smoke manual con el servidor local.
