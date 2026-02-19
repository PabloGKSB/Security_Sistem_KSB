# TESTING POC - Tablero Eléctrico (open/close)

Esta guía describe pruebas manuales básicas para validar la POC.

## 1. Build del Proyecto

```bash
npm install
npm run build
```

El comando debe completar sin errores de TypeScript.

## 2. API de Estado de Puertas

### 2.1. Sin datos

Con la base recién creada (sin eventos):

```bash
curl -s http://localhost:3000/api/door/status
```

Resultado esperado:
- Código HTTP 200.
- Cuerpo: `[]` (array vacío).

## 3. Insertar Evento con `curl`

### 3.1. Evento `open`

```bash
curl -s -X POST http://localhost:3000/api/door/event \
  -H "Content-Type: application/json" \
  -d '{
    "door_id": "TABLERO_1",
    "board_name": "Tablero Principal",
    "location": "SANTIAGO CASA MATRIZ",
    "event_type": "open",
    "details": { "note": "Prueba manual curl" }
  }'
```

Resultado esperado:
- Código HTTP 200.
- JSON con `ok: true`, objeto `event` y objeto `status` donde:
  - `status.is_open === true`
  - `status.door_id === "TABLERO_1"`.

### 3.2. Verificar estado

```bash
curl -s http://localhost:3000/api/door/status | jq
```

Resultado esperado:
- Array con al menos un elemento.
- El elemento correspondiente a `TABLERO_1` debe tener `is_open: true`.

### 3.3. Evento `close`

```bash
curl -s -X POST http://localhost:3000/api/door/event \
  -H "Content-Type: application/json" \
  -d '{
    "door_id": "TABLERO_1",
    "board_name": "Tablero Principal",
    "location": "SANTIAGO CASA MATRIZ",
    "event_type": "close",
    "details": { "note": "Cierre manual curl" }
  }'
```

Volver a consultar `/api/door/status`:

```bash
curl -s http://localhost:3000/api/door/status | jq
```

Resultado esperado:
- `is_open: false` para `TABLERO_1`.

## 4. Historial de Eventos

```bash
curl -s "http://localhost:3000/api/door/events?location=SANTIAGO%20CASA%20MATRIZ" | jq
```

Resultado esperado:
- Código HTTP 200.
- Cuerpo: array de eventos (al menos los enviados en el paso anterior).
- No debe devolver `null` ni objetos sueltos (siempre array).

## 5. Endpoint de Alertas (Opcional)

### 5.1. SMS `/api/alerts/send`

Sin variables de entorno de Twilio configuradas:

```bash
curl -s -X POST http://localhost:3000/api/alerts/send \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Alerta de prueba",
    "event_type": "test",
    "location": "TEST",
    "board_name": "TABLERO_TEST"
  }' | jq
```

Resultado esperado:
- Código HTTP 200.
- JSON indicando que Twilio no está configurado, pero sin lanzar error 500.

### 5.2. Email `/api/alerts/email`

```bash
curl -s -X POST http://localhost:3000/api/alerts/email \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Test POC",
    "message": "Prueba de alerta email placeholder",
    "door_id": "TABLERO_1",
    "board_name": "Tablero Principal",
    "location": "SANTIAGO CASA MATRIZ",
    "event_type": "open"
  }' | jq
```

Resultado esperado:
- Código HTTP 200.
- `ok: true` y mensaje indicando que es un placeholder (no se envía correo real).

## 6. Dashboard Web

1. Inicia sesión en la app (`/auth/login`).
2. Ve a `/`:
   - Debes ver las tarjetas de estadísticas.
   - El monitor en tiempo real debe listar las puertas que tengan estado en `door_status`.
   - El historial de eventos debe listar los eventos creados.
3. Usa el formulario de "Crear Evento Manual":
   - Crear un evento `open` / `close`.
   - Verificar que aparezca en la tabla de eventos y que el estado en el monitor se actualice.

