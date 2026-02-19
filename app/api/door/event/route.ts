import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

type DoorEventType = "open" | "close"

interface DoorEventPayload {
  door_id?: string
  board_name?: string
  location?: string
  event_type?: DoorEventType | string
  details?: Record<string, unknown>
}

export async function POST(request: Request) {
  const now = new Date().toISOString()

  try {
    const supabase = await createClient()
    const body = (await request.json()) as DoorEventPayload

    const { door_id, board_name, location, event_type, details } = body

    // Validación básica de entrada
    const type = event_type as DoorEventType
    if (!board_name || !location || !type || !["open", "close"].includes(type)) {
      return NextResponse.json(
        { ok: false, error: "Parámetros inválidos. Requiere board_name, location y event_type 'open'|'close'." },
        { status: 400 },
      )
    }

    const finalDoorId = door_id && door_id.trim().length > 0 ? door_id : `${board_name}_${location}`

    // Insertar evento
    const { data: eventData, error: eventError } = await supabase
      .from("door_events")
      .insert({
        door_id: finalDoorId,
        board_name,
        location,
        event_type: type,
        created_at: now,
        details: details || {},
      })
      .select()
      .single()

    if (eventError) throw eventError

    // Obtener estado previo para calcular event_start_time
    const { data: previousStatus } = await supabase
      .from("door_status")
      .select("*")
      .eq("door_id", finalDoorId)
      .maybeSingle()

    const wasOpen = previousStatus?.is_open ?? false
    const newIsOpen = type === "open"

    const newEventStartTime =
      type === "open"
        ? wasOpen
          ? previousStatus?.event_start_time ?? now
          : now
        : null

    const { data: statusData, error: statusError } = await supabase
      .from("door_status")
      .upsert(
        {
          door_id: finalDoorId,
          board_name,
          location,
          is_open: newIsOpen,
          last_updated: now,
          event_start_time: newEventStartTime,
          last_event_id: eventData.id,
        },
        {
          onConflict: "door_id",
        },
      )
      .select()
      .single()

    if (statusError) throw statusError

    // Placeholder de alertas (email/SMS opcional, no bloqueante)
    try {
      const baseUrlEnv = process.env.NEXT_PUBLIC_SITE_URL
      const forwardedProto = request.headers.get("x-forwarded-proto") || "https"
      const forwardedHost = request.headers.get("x-forwarded-host")
      const host = request.headers.get("host")

      let baseUrl =
        baseUrlEnv ||
        (forwardedHost ? `${forwardedProto}://${forwardedHost}` : host ? `http://${host}` : "http://localhost:3000")

      baseUrl = baseUrl.replace(/\/$/, "")

      const alertUrl = `${baseUrl}/api/alerts/email`

      // Llamada opcional; si la ruta no existe o no hay credenciales, simplemente registramos el error
      await fetch(alertUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: `Evento de puerta: ${type.toUpperCase()}`,
          message: `Evento ${type} en ${location} - ${board_name}`,
          door_id: finalDoorId,
          board_name,
          location,
          event_type: type,
          details: details || {},
          created_at: now,
        }),
      }).catch((err) => {
        console.error("[poc] Error enviando alerta opcional (no bloqueante):", err)
      })
    } catch (alertError) {
      console.error("[poc] Error en placeholder de alertas (no bloqueante):", alertError)
    }

    return NextResponse.json({ ok: true, event: eventData, status: statusData })
  } catch (error) {
    console.error("[poc] Error creando evento de puerta:", error)
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error al crear evento" },
      { status: 500 },
    )
  }
}

