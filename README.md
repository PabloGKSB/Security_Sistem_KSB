# POC Tablero Eléctrico - Monitoreo de Apertura/Cierre

## Ubicaciones Configuradas

El sistema está preconfigurado para las siguientes ubicaciones de ejemplo:
- **SANTIAGO CASA MATRIZ**
- **ANTOFAGASTA**
- **COQUIMBO**
- **CONCEPCION**
- **PUERTO MONTT**

## Arquitectura (POC sin RFID)

### Hardware
- ESP32-S3 (o similar)
- Sensor magnético reed switch conectado al ESP32

### Backend
- Next.js (App Router)
- API Routes para comunicación con ESP32
- Supabase PostgreSQL con RLS (tablas `locations`, `door_events`, `door_status`)
- Canal de alertas opcional (SMS/Email). Si no hay credenciales, el sistema sigue funcionando.

### Frontend
- Dashboard web protegido con Supabase Auth (email/password)
- Monitor en tiempo real del estado de puertas
- Historial de eventos por ubicación

## Inicio Rápido (POC)

### 1. Crear Usuario

Antes de acceder al sistema, debes crear una cuenta:

1. Ve a `/auth/sign-up`
2. Ingresa tu email y contraseña (mínimo 6 caracteres)
3. Confirma tu email (revisa tu bandeja de entrada)
4. Inicia sesión en `/auth/login`

**Nota**: El primer usuario en registrarse será el administrador principal.

### 2. Configurar Base de Datos (POC)

Ejecutar estos scripts en el SQL Editor de Supabase, en este orden:

1. `scripts/001_create_tables_poc.sql`  
2. `scripts/002_seed_locations_poc.sql`  
3. `scripts/003_setup_rls_poc.sql`

> Nota: los scripts antiguos (`001_create_tables.sql`, `004_add_authorization_management.sql`, etc.) corresponden
> a una versión previa con RFID y no son necesarios para esta POC.

### 3. Variables de Entorno

Ya configuradas vía integración de Supabase:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Para SMS/WhatsApp (futuro / opcional) puedes configurar adicionalmente:
- `TWILIO_ACCOUNT_SID` (opcional)
- `TWILIO_AUTH_TOKEN` (opcional)
- `TWILIO_PHONE_NUMBER` (opcional)

Si estas variables no están definidas, el sistema seguirá registrando eventos normalmente y los endpoints de alerta
responderán sin romper el flujo.

### 4. Desplegar a Vercel

Desde v0:
1. Hacer clic en "Publish"
2. Conectar a Vercel
3. Las variables de entorno se copian automáticamente

### 5. Configurar ESP32 (POC)

1. Abrir `scripts/esp32_firmware.ino`
2. Actualizar credenciales WiFi:
   ```cpp
   const char* WIFI_SSID = "TU_WIFI";
   const char* WIFI_PASSWORD = "TU_PASSWORD";
   ```
3. Actualizar URL de tu deployment:
   ```cpp
   const char* API_URL = "https://tu-proyecto.vercel.app/api/door/event";
   ```
4. **Configurar ubicación para cada ESP32**:
   ```cpp
   const char* BOARD_NAME = "Puerta Principal";
   const char* LOCATION = "SANTIAGO CASA MATRIZ";  // Cambiar según ubicación
   ```
5. Flashear firmware al ESP32-S3

El firmware de ejemplo para la POC (`scripts/esp32_firmware.ino`) solo envía eventos `open` / `close` junto con el
`board_name` y la `location`.

## Estructura del Proyecto (resumida)

```
├── app/
│   ├── page.tsx                 # Dashboard principal (protegido)
│   ├── auth/
│   │   ├── login/page.tsx      # Página de inicio de sesión
│   │   ├── sign-up/page.tsx    # Página de registro
│   │   └── callback/route.ts   # Callback de confirmación email
│   ├── admin/
│   │   ├── page.tsx            # Panel de administración (protegido)
│   │   ├── contacts/page.tsx   # Gestión de contactos SMS (opcional)
│   │   ├── reports/page.tsx    # Reportes y análisis (protegido)
│   │   └── cleanup/page.tsx    # Limpieza de eventos (protegido)
│   └── api/
│       ├── door/
│       │   ├── event/route.ts         # Registrar eventos ESP32 (open/close)
│       │   ├── events/route.ts        # Obtener historial (siempre array)
│       │   └── status/route.ts        # Estado actual (siempre array)
│       ├── alert-contacts/route.ts    # CRUD contactos (opcional)
│       ├── alerts/send/route.ts       # Enviar SMS (opcional, no bloqueante)
│       ├── alerts/email/route.ts      # Placeholder envío email (opcional)
│       └── stats/route.ts             # Estadísticas open/close
├── components/
│   ├── dashboard-monitor.tsx    # Monitor en tiempo real
│   ├── events-table.tsx         # Tabla de eventos
│   ├── stats-cards.tsx          # Tarjetas estadísticas
│   ├── manual-event-form.tsx    # Formulario eventos manuales
│   └── user-nav.tsx             # Navegación usuario (logout)
├── lib/
│   └── supabase/
│       ├── client.ts            # Cliente navegador
│       └── server.ts            # Cliente servidor
├── proxy.ts                      # Middleware de autenticación
└── scripts/
    ├── 001_setup_rls_policies.sql       # Configurar RLS
    ├── 002_seed_chile_locations.sql     # Datos iniciales
    └── esp32_firmware.ino               # Firmware ESP32
```

## API Endpoints (POC)

### POST `/api/door/event`
Registrar evento desde ESP32 o desde el formulario manual.

Cuerpo JSON:
```json
{
  "door_id": "TABLERO_1 (opcional)",
  "board_name": "Tablero Principal",
  "location": "SANTIAGO CASA MATRIZ",
  "event_type": "open",
  "details": { "note": "Mensaje opcional" }
}
```

Reglas:
- `door_id` es opcional; si no viene, se deriva como `board_name + "_" + location`.
- `event_type` debe ser `"open"` o `"close"`.

Respuesta:
```json
{
  "ok": true,
  "event": { "...evento insertado..." },
  "status": { "...estado actualizado..." }
}
```

### GET `/api/door/status`
Obtiene el estado actual de todas las puertas/tableros.

- Siempre devuelve **un array** (vacío `[]` si no hay datos o si hay error interno).

### GET `/api/door/events?location=...`
Obtiene los eventos recientes (hasta ~200), ordenados descendentemente por `created_at`.

- Siempre devuelve **un array**.

### GET `/api/stats?location=...`
Devuelve estadísticas de:
- Total de eventos (`total_events`)
- Cantidad de eventos de apertura/cierre (`open_events`, `close_events`)
- Puertas actualmente abiertas (`open_doors`)
- Duración promedio abierta (`avg_open_duration_seconds`)

### POST `/api/alerts/send` (opcional)
- Envía SMS a contactos activos si Twilio está configurado.
- Si faltan variables de entorno o hay error, responde igualmente con JSON sin romper el flujo de la POC.

### POST `/api/alerts/email` (placeholder)
- Endpoint de prueba para un canal de email futuro.
- Actualmente solo registra la solicitud y responde `ok: true` sin enviar correos reales.

## Funcionalidades del Dashboard

### Autenticación (`/auth/login` y `/auth/sign-up`)
- Registro con email y contraseña
- Confirmación por correo electrónico
- Inicio de sesión seguro
- Cierre de sesión desde cualquier página
- Redirección automática al login si no está autenticado

### Página Principal (`/`) - 🔐 Requiere Autenticación
- **Estadísticas Generales**: tarjetas con métricas de eventos open/close y puertas abiertas.
- **Monitor en Tiempo Real**: estado actual de cada tablero (`is_open`, ubicación, duración abierta).
- **Historial de Eventos**: tabla con filtro por ubicación.
- **Crear Evento Manual**: formulario para registrar manualmente eventos `open`/`close`.

### Panel de Administración (`/admin`) - 🔐 Requiere Autenticación

#### Contactos de Alertas (`/admin/contacts`) (opcional)
- Gestionar números para SMS
- Formato chileno: +56912345678
- Activar/desactivar contactos
- Botón de prueba SMS
- Banner informativo sobre cuenta Twilio Trial

#### Reportes (`/admin/reports`)
- Filtrar por ubicación
- Ver estadísticas detalladas
- Exportar a CSV
- Análisis de uso por ubicación

## Seguridad en Producción

### Autenticación
- ✅ Supabase Auth con email/password
- ✅ Middleware protege todas las rutas automáticamente
- ✅ Sesiones seguras con cookies HTTP-only
- ✅ Confirmación de email obligatoria
- ✅ Redirección automática al login

### Base de Datos
- ✅ Row Level Security (RLS) habilitado
- ✅ Políticas de acceso configuradas para la POC (`003_setup_rls_poc.sql`)
- ✅ Conexión encriptada con Supabase

### API
- ✅ HTTPS obligatorio en producción
- ✅ Variables de entorno seguras
- ⚠️ Considerar: Autenticación API key para ESP32
- ⚠️ Considerar: Rate limiting

### Hardware
- ⚠️ Instalar en ubicación segura
- ⚠️ Detector de manipulación
- ⚠️ Respaldo de batería

## Solución de Problemas

### No puedo acceder al dashboard
- Asegúrate de haber creado una cuenta en `/auth/sign-up`
- Confirma tu email (revisa spam)
- Intenta iniciar sesión en `/auth/login`
- Verifica que el middleware (proxy.ts) esté funcionando

### Error al crear cuenta
- Verifica que la contraseña tenga al menos 6 caracteres
- Asegúrate que el email sea válido
- Confirma que Supabase Auth esté habilitado en tu proyecto

### Redirige constantemente al login
- Confirma tu email desde el link enviado
- Verifica las variables de entorno de Supabase
- Limpia cookies del navegador y vuelve a intentar

### ESP32 no conecta
- Verificar credenciales WiFi
- Confirmar red 2.4GHz disponible
- Revisar URL de API (debe incluir `/api/door/event`)
- Verificar Serial Monitor para errores

### Eventos no aparecen
- Ejecutar scripts SQL en orden
- Verificar variables de entorno en Vars
- Revisar logs de API en Vercel
- Confirmar que board_name y location se envían

### SMS no se envían (si habilitas Twilio)
- ⚠️ Las cuentas Trial solo envían SMS a números verificados
- Verifica números en: `https://www.twilio.com/console/phone-numbers/verified`
- O actualiza a cuenta de pago para enviar a cualquier número
- El banner en `/admin/contacts` muestra esta información

### Error "Multiple GoTrueClient instances"
- ✅ **RESUELTO**: El nuevo código sigue exactamente los patrones oficiales de Supabase
- Cliente del navegador exporta función `createClient()` que devuelve nueva instancia
- Cliente del servidor usa `createServerClient` con manejo de cookies
- Middleware maneja correctamente la sesión del usuario
- Sin problemas de singleton

## Tecnologías Utilizadas

- **Frontend**: Next.js (App Router), React, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase
- **Base de Datos**: PostgreSQL (Supabase)
- **Hardware**: ESP32-S3 + reed switch
- **SMS (opcional)**: Twilio API
- **Deployment**: Vercel

## Futuro: SMS / WhatsApp / RFID

La POC actual está enfocada únicamente en la detección de apertura/cierre por reed switch.  
Extensiones futuras posibles:

- Integrar envío de alertas SMS/WhatsApp usando Twilio u otro proveedor.
- Volver a habilitar control de acceso con RFID (tarjetas, usuarios autorizados).
- Añadir emparejamiento de eventos, reportes avanzados y roles de usuario.

## Licencia

MIT License

## Soporte

Para problemas o consultas:
1. Revisar esta documentación
2. Verificar logs en Vercel
3. Revisar Serial Monitor del ESP32
4. Contactar soporte técnico

---

Desarrollado con ❤️ para sucursales en Chile
